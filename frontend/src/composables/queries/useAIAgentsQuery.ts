import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { aiAgentsApi, type AIAgentCreate, type AIAgentUpdate } from '@/services/resources'
import { qk } from '@/services/queryKeys'

export function useAIAgentsQuery() {
  return useQuery({
    queryKey: qk.aiAgents.list(),
    queryFn: ({ signal }) => aiAgentsApi.list({ signal }),
  })
}

export function useCreateAIAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AIAgentCreate) => aiAgentsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.aiAgents.all }),
  })
}

export function useUpdateAIAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AIAgentUpdate }) =>
      aiAgentsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.aiAgents.all }),
  })
}

export function useDeleteAIAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => aiAgentsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.aiAgents.all }),
  })
}

/**
 * Ask the current AI agent to draft a reply for a conversation.  Invalidates
 * the conversation detail so the drafted message appears in the thread.
 */
export function useDraftAIReply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (conversation_id: string) => aiAgentsApi.reply(conversation_id),
    onSuccess: (_data, conversation_id) => {
      qc.invalidateQueries({ queryKey: qk.conversations.detail(conversation_id) })
    },
  })
}
