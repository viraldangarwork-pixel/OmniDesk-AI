import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/vue-query'
import { usersApi, type UserCreate, type UserUpdate } from '@/services/resources'
import { qk } from '@/services/queryKeys'
import type { PageParams } from '@/types/api'

export function useUsersQuery(params: MaybeRefOrGetter<PageParams>) {
  return useQuery({
    queryKey: computed(() => qk.users.list(toValue(params))),
    queryFn: ({ signal }) => usersApi.list(toValue(params), { signal }),
    placeholderData: keepPreviousData,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UserCreate) => usersApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users.all }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UserUpdate }) =>
      usersApi.update(id, payload),
    onSuccess: (updated, { id }) => {
      qc.setQueryData(qk.users.detail(id), updated)
      qc.invalidateQueries({ queryKey: qk.users.all })
    },
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users.all }),
  })
}
