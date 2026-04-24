import { GET, POST, type ReadOptions } from './_http'
import type { Conversation, Message, ConversationStatus } from '@/types/domain'
import type { Page } from '@/types/api'

export interface ConversationFilters {
  page?: number
  size?: number
  status?: ConversationStatus
  unassigned?: boolean
  q?: string
  channel?: string
  assignee_id?: string
}

/** The detail endpoint returns the conversation with its recent messages. */
export interface ConversationDetail extends Conversation {
  messages: Message[]
}

export const conversationsApi = {
  list: (params: ConversationFilters, opts?: ReadOptions) =>
    GET<Page<Conversation>>('/conversations', { ...opts, params }),
  get: (id: string, opts?: ReadOptions) =>
    GET<ConversationDetail>(`/conversations/${id}`, opts),
  assign: (id: string, user_id: string | null) =>
    POST<Conversation, { user_id: string | null }>(`/conversations/${id}/assign`, { user_id }),
  close: (id: string) => POST<Conversation, object>(`/conversations/${id}/close`, {}),
  reopen: (id: string) => POST<Conversation, object>(`/conversations/${id}/reopen`, {}),
}
