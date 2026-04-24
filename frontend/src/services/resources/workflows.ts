import { GET, POST, PATCH, DELETE, type ReadOptions } from './_http'
import type { Workflow } from '@/types/domain'

export interface WorkflowCreate {
  name: string
  description?: string | null
  trigger: Record<string, unknown>
  steps: Array<Record<string, unknown>>
  is_active?: boolean
}

export type WorkflowUpdate = Partial<WorkflowCreate>

export interface WorkflowRunInput {
  workflow_id: string
  context?: Record<string, unknown>
}

export interface WorkflowRunResponse {
  run_id: string
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  output?: Record<string, unknown>
}

export const workflowsApi = {
  list: (opts?: ReadOptions) => GET<Workflow[]>('/workflows', opts),
  get: (id: string, opts?: ReadOptions) => GET<Workflow>(`/workflows/${id}`, opts),
  create: (payload: WorkflowCreate) => POST<Workflow, WorkflowCreate>('/workflows', payload),
  update: (id: string, payload: WorkflowUpdate) =>
    PATCH<Workflow, WorkflowUpdate>(`/workflows/${id}`, payload),
  remove: (id: string) => DELETE<void>(`/workflows/${id}`),
  run: (payload: WorkflowRunInput) =>
    POST<WorkflowRunResponse, WorkflowRunInput>('/workflows/run', payload),
}
