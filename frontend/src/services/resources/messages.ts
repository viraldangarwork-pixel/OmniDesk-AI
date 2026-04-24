import { POST } from './_http'
import type { Message } from '@/types/domain'

export interface SendMessageInput {
  conversation_id: string
  content: string
  attachments?: Array<{ url: string; mime: string; name?: string }>
}

export const messagesApi = {
  send: (payload: SendMessageInput) => POST<Message, SendMessageInput>('/messages/send', payload),
}
