import { defineStore } from 'pinia'
import { api } from '@/services/api'
import { onWsEvent } from '@/services/ws'

export interface Conversation {
  id: string
  channel_id: string
  contact_id: string
  assignee_id: string | null
  status: 'open' | 'pending' | 'closed' | 'escalated'
  subject: string | null
  unread_count: number
  last_message_at: string | null
  tags: string[]
}

export interface Message {
  id: string
  conversation_id: string
  sender_type: 'customer' | 'agent' | 'ai' | 'system'
  direction: 'inbound' | 'outbound'
  content: string | null
  content_type: string
  created_at: string
}

interface State {
  list: Conversation[]
  total: number
  loading: boolean
  selectedId: string | null
  messages: Record<string, Message[]>
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
    filters: {},
    wsInited: false,
  }),
  getters: {
    selected: (s) => s.list.find((c) => c.id === s.selectedId) ?? null,
    selectedMessages: (s) => (s.selectedId ? s.messages[s.selectedId] ?? [] : []),
  },
  actions: {
    initWs() {
      if (this.wsInited) return
      this.wsInited = true
      onWsEvent((event, data) => {
        if (event === 'message:new') {
          const msg = data as Message
          const bucket = this.messages[msg.conversation_id] ?? []
          this.messages[msg.conversation_id] = [...bucket, msg]
          const conv = this.list.find((c) => c.id === msg.conversation_id)
          if (conv) conv.last_message_at = msg.created_at
        } else if (event === 'conversation:update' || event === 'conversation:assigned') {
          const payload = data as { conversation_id: string; status?: string; assignee_id?: string }
          const conv = this.list.find((c) => c.id === payload.conversation_id)
          if (conv) {
            if (payload.status) conv.status = payload.status as Conversation['status']
            if (payload.assignee_id !== undefined) conv.assignee_id = payload.assignee_id
          }
        }
      })
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
      const { data } = await api.get(`/conversations/${id}`)
      this.messages[id] = data.messages ?? []
    },
    async send(content: string) {
      if (!this.selectedId) return
      const { data } = await api.post('/messages/send', {
        conversation_id: this.selectedId,
        content,
      })
      const bucket = this.messages[this.selectedId] ?? []
      this.messages[this.selectedId] = [...bucket, data]
    },
    async assign(conversationId: string, userId: string) {
      await api.post(`/conversations/${conversationId}/assign`, { user_id: userId })
    },
    async close(conversationId: string) {
      await api.post(`/conversations/${conversationId}/close`, {})
    },
    async aiReply() {
      if (!this.selectedId) return null
      const { data } = await api.post('/ai/reply', { conversation_id: this.selectedId })
      return data.reply as string
    },
    async aiSummarize() {
      if (!this.selectedId) return null
      const { data } = await api.post('/ai/summarize', { conversation_id: this.selectedId })
      return data.summary as string
    },
  },
})
