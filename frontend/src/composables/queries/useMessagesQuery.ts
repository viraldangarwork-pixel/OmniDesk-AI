import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { messagesApi, type SendMessageInput } from '@/services/resources'
import { qk } from '@/services/queryKeys'
import type { ConversationDetail } from '@/services/resources/conversations'
import type { Message } from '@/types/domain'

/**
 * Send a message with an optimistic update so the UI jumps immediately.
 *
 * We insert a synthetic `Message` with a `pending` id into the conversation
 * detail cache.  On success the server message replaces it (via
 * invalidation).  On error, the rollback restores the previous list and the
 * global toast surfaces the failure.
 */
export function useSendMessage() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: SendMessageInput) => messagesApi.send(payload),

    onMutate: async (payload) => {
      const key = qk.conversations.detail(payload.conversation_id)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<ConversationDetail>(key)

      const optimistic: Message = {
        id: `pending-${Date.now()}`,
        conversation_id: payload.conversation_id,
        direction: 'outbound',
        role: 'agent',
        body: payload.content,
        attachments: payload.attachments ?? [],
        created_at: new Date().toISOString(),
      }

      if (prev) {
        qc.setQueryData<ConversationDetail>(key, {
          ...prev,
          messages: [...prev.messages, optimistic],
        })
      }
      return { prev, key }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev && ctx?.key) qc.setQueryData(ctx.key, ctx.prev)
    },

    onSettled: (_data, _err, payload) => {
      qc.invalidateQueries({ queryKey: qk.conversations.detail(payload.conversation_id) })
      qc.invalidateQueries({ queryKey: qk.conversations.all })
    },
  })
}
