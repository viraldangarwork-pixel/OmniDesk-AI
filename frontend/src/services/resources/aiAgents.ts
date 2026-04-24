import { GET, POST, PATCH, DELETE, type ReadOptions } from './_http'
import type { AIAgent, Message } from '@/types/domain'

export interface AIAgentCreate {
  name: string
  description?: string | null
  model: string
  system_prompt: string
  tools?: string[]
  is_active?: boolean
  temperature?: number
  max_tokens?: number
}

export type AIAgentUpdate = Partial<AIAgentCreate>

export interface AIReplyResponse {
  message: Message
  latency_ms: number
  tokens?: { input: number; output: number }
}

export const aiAgentsApi = {
  list: (opts?: ReadOptions) => GET<AIAgent[]>('/ai/agents', opts),
  get: (id: string, opts?: ReadOptions) => GET<AIAgent>(`/ai/agents/${id}`, opts),
  create: (payload: AIAgentCreate) => POST<AIAgent, AIAgentCreate>('/ai/agents', payload),
  update: (id: string, payload: AIAgentUpdate) =>
    PATCH<AIAgent, AIAgentUpdate>(`/ai/agents/${id}`, payload),
  remove: (id: string) => DELETE<void>(`/ai/agents/${id}`),

  /** Ask an agent to draft a reply for a conversation. */
  reply: (conversation_id: string) =>
    POST<AIReplyResponse, { conversation_id: string }>('/ai/reply', { conversation_id }),
  summarize: (conversation_id: string) =>
    POST<{ summary: string }, { conversation_id: string }>('/ai/summarize', {
      conversation_id,
    }),
}
