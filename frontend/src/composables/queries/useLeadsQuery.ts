import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/vue-query'
import {
  leadsApi,
  type LeadCreate,
  type LeadUpdate,
  type LeadStageCreate,
} from '@/services/resources'
import { qk } from '@/services/queryKeys'
import type { PageParams } from '@/types/api'

export function useLeadsQuery(params: MaybeRefOrGetter<PageParams>) {
  return useQuery({
    queryKey: computed(() => qk.leads.list(toValue(params))),
    queryFn: ({ signal }) => leadsApi.list(toValue(params), { signal }),
    placeholderData: keepPreviousData,
  })
}

export function useLeadStagesQuery() {
  return useQuery({
    queryKey: qk.leads.stages(),
    queryFn: ({ signal }) => leadsApi.stages({ signal }),
    staleTime: 5 * 60_000, // stages barely change
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: LeadCreate) => leadsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.leads.all }),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LeadUpdate }) =>
      leadsApi.update(id, payload),
    onSuccess: (updated, { id }) => {
      qc.setQueryData(qk.leads.detail(id), updated)
      qc.invalidateQueries({ queryKey: qk.leads.all })
    },
  })
}

export function useCreateLeadStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: LeadStageCreate) => leadsApi.createStage(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.leads.stages() }),
  })
}
