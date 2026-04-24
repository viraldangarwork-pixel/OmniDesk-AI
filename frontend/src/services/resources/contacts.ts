import { GET, POST, PATCH, DELETE, type ReadOptions } from './_http'
import type { Contact } from '@/types/domain'
import type { Page, PageParams } from '@/types/api'

export interface ContactCreate {
  full_name?: string | null
  email?: string | null
  phone?: string | null
  tags?: string[]
  notes?: string | null
}

export type ContactUpdate = Partial<ContactCreate>

export const contactsApi = {
  list: (params: PageParams, opts?: ReadOptions) =>
    GET<Page<Contact>>('/contacts', { ...opts, params }),
  get: (id: string, opts?: ReadOptions) => GET<Contact>(`/contacts/${id}`, opts),
  create: (payload: ContactCreate) => POST<Contact, ContactCreate>('/contacts', payload),
  update: (id: string, payload: ContactUpdate) =>
    PATCH<Contact, ContactUpdate>(`/contacts/${id}`, payload),
  remove: (id: string) => DELETE<void>(`/contacts/${id}`),
}
