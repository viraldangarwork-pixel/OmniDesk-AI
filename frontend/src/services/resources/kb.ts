import { api, withOptions } from '@/services/api'
import { GET, type ReadOptions } from './_http'
import type { KBDocument } from '@/types/domain'
import type { Page, PageParams } from '@/types/api'

export interface KBSearchHit {
  id: string
  content: string
  score: number
}

export interface KBSearchResponse {
  query: string
  results: KBSearchHit[]
}

export interface KBIngestUrl {
  url: string
  title?: string
}

export const kbApi = {
  list: (params: PageParams, opts?: ReadOptions) =>
    GET<Page<KBDocument>>('/kb', { ...opts, params }),
  get: (id: string, opts?: ReadOptions) => GET<KBDocument>(`/kb/${id}`, opts),
  remove: async (id: string) => {
    await api.delete(`/kb/${id}`)
  },
  ingestUrl: async (payload: KBIngestUrl) => {
    const { data } = await api.post<KBDocument>('/kb/url', payload)
    return data
  },
  /**
   * Upload accepts a File (or FormData blob) and posts multipart — we set
   * the Content-Type via FormData so the browser picks the correct boundary.
   */
  upload: async (file: File, title?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (title) form.append('title', title)
    const { data } = await api.post<KBDocument>('/kb/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
  search: async (q: string, opts?: ReadOptions) => {
    const { data } = await api.get<KBSearchResponse>('/kb/search', {
      ...withOptions({ signal: opts?.signal, silent: opts?.silent }),
      params: { q },
    })
    return data
  },
}
