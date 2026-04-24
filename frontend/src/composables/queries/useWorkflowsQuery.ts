import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  workflowsApi,
  type WorkflowCreate,
  type WorkflowUpdate,
  type WorkflowRunInput,
} from '@/services/resources'
import { qk } from '@/services/queryKeys'

export function useWorkflowsQuery() {
  return useQuery({
    queryKey: qk.workflows.list(),
    queryFn: ({ signal }) => workflowsApi.list({ signal }),
  })
}

export function useCreateWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: WorkflowCreate) => workflowsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.workflows.all }),
  })
}

export function useUpdateWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WorkflowUpdate }) =>
      workflowsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.workflows.all }),
  })
}

export function useRunWorkflow() {
  return useMutation({
    mutationFn: (payload: WorkflowRunInput) => workflowsApi.run(payload),
  })
}
