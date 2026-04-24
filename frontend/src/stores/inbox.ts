import { defineStore } from 'pinia'
import { api } from '@/services/api'
import { onWsEvent, sendWsMessage } from '@/services/ws'
import type { Conversation, Message } from '@/types/domain'

/**
 * Inbox store — holds the conversation list, per-conversation message
 * buckets and the realtime WS pipeline.
 *
 * Scope: this store stays authoritative for realtime inbox state.  Individual
 * views use TanStack Query for discrete lookups (assign menus, KB search, AI
 * actions) but the "live" list + open thread live here so WS pushes can
 * mutate them in one place.
 *
 * Message windowing: we keep at most MAX_MESSAGES_PER_CONV per bucket.  A
 * dedicated "load older" action will be added when the backend exposes a
 * cursor endpoint — for now we trim on arrival to bound memory.
 */

const MAX_MESSAGES_PER_CONV = 500
const TYPING_IDLE_MS = 2_500

interface TypingEntry {
  user_id: string
  /** Monotonic client-side timestamp used to auto-expire stale indicators. */
  expiresAt: number
}

interface State {
  list: Conversation[]
  total: number
  loading: boolean
  selectedId: string | null
  /** conversation_id → messages (newest last). */
  messages: Record<string, Message[]>
  /** conversation_id → active typing users. */
  typing: Record<string, TypingEntry[]>
  filters: { status?: string; unassigned?: boolean; q?: string }
  wsInited: boolean
}

export const useInboxStore = defineStore('inbox', {
  state: (): State => ({
    list: [],
    total: 0,
    loading: false,
    selectedId: null,
    messages: {},
    typing: {},
    filters: {},
    wsInited: false,
  }),

  getters: {
    selected: (s): Conversation | null =>
      s.list.find((c) => c.id === s.selectedId) ?? null,
    selectedMessages: (s): Message[] =>
      s.selectedId ? (s.messages[s.selectedId] ?? []) : [],
    selectedTyping: (s): TypingEntry[] => {
      if (!s.selectedId) return []
      const now = Date.now()
      return (s.typing[s.selectedId] ?? []).filter((t) => t.expiresAt > now)
    },
  },

  actions: {
    initWs() {
      if (this.wsInited) return
      this.wsInited = true
      onWsEvent((event, data) => {
        if (event === 'message:new') {
          const msg = data as Message
          const bucket = this.messages[msg.conversation_id] ?? []
          const merged = [...bucket, msg]
          // Trim the head so memory stays bounded for long-running threads.
          this.messages[msg.conversation_id] =
            merged.length > MAX_MESSAGES_PER_CONV
              ? merged.slice(merged.length - MAX_MESSAGES_PER_CONV)
              : merged
          const conv = this.list.find((c) => c.id === msg.conversation_id)
          if (conv) {
            conv.last_message_at = msg.created_at
            if (this.selectedId !== msg.conversation_id && msg.direction === 'inbound') {
              conv.unread_count = (conv.unread_count ?? 0) + 1
            }
          }
          // Clear the typing indicator from the sender — they clearly stopped.
          if (msg.sender_id) this.clearTypingFor(msg.conversation_id, msg.sender_id)
        } else if (event === 'conversation:update' || event === 'conversation:assigned') {
          const payload = data as {
            conversation_id: string
            status?: Conversation['status']
            assignee_id?: string | null
          }
          const conv = this.list.find((c) => c.id === payload.conversation_id)
          if (conv) {
            if (payload.status) conv.status = payload.status
            if (payload.assignee_id !== undefined) conv.assignee_id = payload.assignee_id
          }
        } else if (event === 'typing') {
          const p = data as { conversation_id: string; user_id: string }
          const existing = this.typing[p.conversation_id] ?? []
          const without = existing.filter((t) => t.user_id !== p.user_id)
          this.typing[p.conversation_id] = [
            ...without,
            { user_id: p.user_id, expiresAt: Date.now() + TYPING_IDLE_MS },
          ]
        }
      })
    },

    clearTypingFor(conversationId: string, userId: string) {
      const existing = this.typing[conversationId]
      if (!existing) return
      this.typing[conversationId] = existing.filter((t) => t.user_id !== userId)
    },

    async fetchConversations() {
      this.loading = true
      try {
        const { data } = await api.get('/conversations', { params: this.filters })
        this.list = data.items
        this.total = data.total
      } finally {
        this.loading = false
      }
    },

    async select(id: string) {
      this.selectedId = id
      // Mark unread → 0 optimistically (server reconciles on read receipt).
      const conv = this.list.find((c) => c.id === id)
      if (conv) conv.unread_count = 0
      const { data } = await api.get(`/conversations/${id}`)
      this.messages[id] = data.messages ?? []
    },

    async send(content: string) {
      if (!this.selectedId) return
      // Optimistic bubble appended synchronously — replaced by the server
      // copy on success, stripped on error.
      const clientTempId = `pending-${Date.now()}`
      const optimistic: Message = {
        id: clientTempId,
        conversation_id: this.selectedId,
        sender_type: 'agent',
        sender_id: null,
        direction: 'outbound',
        content,
        content_type: 'text',
        delivered_at: null,
        read_at: null,
        attachments: [],
        meta: { pending: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const bucket = this.messages[this.selectedId] ?? []
      this.messages[this.selectedId] = [...bucket, optimistic]

      try {
        const { data } = await api.post('/messages/send', {
          conversation_id: this.selectedId,
          content,
        })
        const after = this.messages[this.selectedId] ?? []
        this.messages[this.selectedId] = after.map((m) =>
          m.id === clientTempId ? (data as Message) : m,
        )
      } catch (err) {
        const after = this.messages[this.selectedId] ?? []
        this.messages[this.selectedId] = after.filter((m) => m.id !== clientTempId)
        throw err
      }
    },

    broadcastTyping() {
      if (!this.selectedId) return
      sendWsMessage('typing', { conversation_id: this.selectedId })
    },

    async assign(conversationId: string, userId: string | null) {
      await api.post(`/conversations/${conversationId}/assign`, { user_id: userId })
      const conv = this.list.find((c) => c.id === conversationId)
      if (conv) conv.assignee_id = userId
    },

    async close(conversationId: string) {
      await api.post(`/conversations/${conversationId}/close`, {})
      const conv = this.list.find((c) => c.id === conversationId)
      if (conv) conv.status = 'closed'
    },

    async aiReply(): Promise<string | null> {
      if (!this.selectedId) return null
      const { data } = await api.post('/ai/reply', { conversation_id: this.selectedId })
      return (data.reply as string) ?? null
    },

    async aiSummarize(): Promise<string | null> {
      if (!this.selectedId) return null
      const { data } = await api.post('/ai/summarize', { conversation_id: this.selectedId })
      return (data.summary as string) ?? null
    },
  },
})

// Re-export the domain types from the single source of truth.
export type { Conversation, Message } from '@/types/domain'
