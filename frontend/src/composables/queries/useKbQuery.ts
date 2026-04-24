import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/vue-query'
import { kbApi, type KBIngestUrl } from '@/services/resources'
import { qk } from '@/services/queryKeys'
import type { PageParams } from '@/types/api'

export function useKbListQuery(params: MaybeRefOrGetter<PageParams>) {
  return useQuery({
    queryKey: computed(() => qk.kb.list(toValue(params))),
    queryFn: ({ signal }) => kbApi.list(toValue(params), { signal }),
    placeholderData: keepPreviousData,
  })
}

/**
 * KB semantic search — hits the vector-retrieval endpoint.
 *
 * Typical call site pairs this with `useDebouncedRef` for the query string
 * so we don't fire an embedding lookup on every keystroke:
 *
 *   const q = useDebouncedRef('', 300)
 *   const { data } = useKbSearchQuery(q)
 */
export function useKbSearchQuery(q: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => qk.kb.search(toValue(q))),
    queryFn: ({ signal }) => kbApi.search(toValue(q), { signal }),
    enabled: computed(() => toValue(q).trim().length >= 2),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}

export function useIngestKbUrl() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: KBIngestUrl) => kbApi.ingestUrl(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.kb.all }),
  })
}

export function useUploadKbFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) => kbApi.upload(file, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.kb.all }),
  })
}

export function useDeleteKbDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => kbApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.kb.all }),
  })
}
