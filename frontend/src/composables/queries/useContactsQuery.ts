import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/vue-query'
import { contactsApi, type ContactCreate, type ContactUpdate } from '@/services/resources'
import { qk } from '@/services/queryKeys'
import type { PageParams } from '@/types/api'

/**
 * Paginated contacts list.  Pass a ref/computed for `params` and the query
 * will refetch whenever paging, search or sort changes — keeping the
 * previous page rendered during the fetch so the user never sees skeletons
 * after the very first load.
 */
export function useContactsQuery(params: MaybeRefOrGetter<PageParams>) {
  return useQuery({
    queryKey: computed(() => qk.contacts.list(toValue(params))),
    queryFn: ({ signal }) => contactsApi.list(toValue(params), { signal }),
    placeholderData: keepPreviousData,
  })
}

export function useContactQuery(id: MaybeRefOrGetter<string | null | undefined>) {
  return useQuery({
    queryKey: computed(() => qk.contacts.detail(toValue(id) ?? '')),
    queryFn: ({ signal }) => contactsApi.get(toValue(id)!, { signal }),
    enabled: computed(() => !!toValue(id)),
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ContactCreate) => contactsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.contacts.all })
    },
  })
}

export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ContactUpdate }) =>
      contactsApi.update(id, payload),
    onSuccess: (updated, { id }) => {
      qc.setQueryData(qk.contacts.detail(id), updated)
      qc.invalidateQueries({ queryKey: qk.contacts.all })
    },
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => contactsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.contacts.all })
    },
  })
}
