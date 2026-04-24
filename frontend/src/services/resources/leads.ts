import { GET, POST, PUT, DELETE, type ReadOptions } from './_http'
import type { Lead, LeadStage } from '@/types/domain'
import type { Page, PageParams } from '@/types/api'

export interface LeadStageRow {
  id: string
  code: string
  name: string
  position: number
}

export interface LeadCreate {
  title: string
  contact_id?: string | null
  value?: number | null
  stage?: LeadStage
}

export interface LeadUpdate {
  title?: string
  stage_code?: string
  value?: number | null
  owner_id?: string | null
}

export const leadsApi = {
  list: (params: PageParams, opts?: ReadOptions) =>
    GET<Page<Lead>>('/leads', { ...opts, params }),
  get: (id: string, opts?: ReadOptions) => GET<Lead>(`/leads/${id}`, opts),
  create: (payload: LeadCreate) => POST<Lead, LeadCreate>('/leads', payload),
  update: (id: string, payload: LeadUpdate) => PUT<Lead, LeadUpdate>(`/leads/${id}`, payload),
  remove: (id: string) => DELETE<void>(`/leads/${id}`),

  stages: (opts?: ReadOptions) => GET<LeadStageRow[]>('/leads/stages', opts),
  createStage: (payload: Omit<LeadStageRow, 'id'>) =>
    POST<LeadStageRow, Omit<LeadStageRow, 'id'>>('/leads/stages', payload),
}
