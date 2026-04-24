import { GET, POST, PUT, DELETE, type ReadOptions } from './_http'
import type { Lead, LeadStage } from '@/types/domain'
import type { Page, PageParams } from '@/types/api'

export interface LeadCreate {
  contact_id: string
  title: string
  value?: number | string | null
  currency?: string
  probability?: number
  source?: string | null
  description?: string | null
  stage_code?: string | null
  owner_id?: string | null
  custom?: Record<string, unknown>
}

export interface LeadUpdate {
  title?: string
  value?: number | string | null
  currency?: string
  probability?: number
  source?: string | null
  description?: string | null
  stage_code?: string
  owner_id?: string | null
  custom?: Record<string, unknown>
}

export interface LeadStageCreate {
  name: string
  code: string
  position?: number
  color?: string | null
}

export const leadsApi = {
  list: (params: PageParams, opts?: ReadOptions) =>
    GET<Page<Lead>>('/leads', { ...opts, params }),
  get: (id: string, opts?: ReadOptions) => GET<Lead>(`/leads/${id}`, opts),
  create: (payload: LeadCreate) => POST<Lead, LeadCreate>('/leads', payload),
  update: (id: string, payload: LeadUpdate) => PUT<Lead, LeadUpdate>(`/leads/${id}`, payload),
  remove: (id: string) => DELETE<void>(`/leads/${id}`),

  stages: (opts?: ReadOptions) => GET<LeadStage[]>('/leads/stages', opts),
  createStage: (payload: LeadStageCreate) =>
    POST<LeadStage, LeadStageCreate>('/leads/stages', payload),
}
