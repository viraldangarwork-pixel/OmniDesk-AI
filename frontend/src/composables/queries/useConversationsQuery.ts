import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/vue-query'
import { conversationsApi, type ConversationFilters } from '@/services/resources'
import { qk } from '@/services/queryKeys'

export function useConversationsQuery(filters: MaybeRefOrGetter<ConversationFilters>) {
  return useQuery({
    queryKey: computed(() => qk.conversations.list(toValue(filters))),
    queryFn: ({ signal }) => conversationsApi.list(toValue(filters), { signal }),
    placeholderData: keepPreviousData,
  })
}

export function useConversationQuery(id: MaybeRefOrGetter<string | null | undefined>) {
  return useQuery({
    queryKey: computed(() => qk.conversations.detail(toValue(id) ?? '')),
    queryFn: ({ signal }) => conversationsApi.get(toValue(id)!, { signal }),
    enabled: computed(() => !!toValue(id)),
  })
}

export function useAssignConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string | null }) =>
      conversationsApi.assign(id, userId),
    onSuccess: (_conv, { id }) => {
      qc.invalidateQueries({ queryKey: qk.conversations.detail(id) })
      qc.invalidateQueries({ queryKey: qk.conversations.all })
    },
  })
}

export function useCloseConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => conversationsApi.close(id),
    onSuccess: (_conv, id) => {
      qc.invalidateQueries({ queryKey: qk.conversations.detail(id) })
      qc.invalidateQueries({ queryKey: qk.conversations.all })
    },
  })
}
