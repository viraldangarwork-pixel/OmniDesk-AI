import { GET, POST, PATCH, DELETE, type ReadOptions } from './_http'
import type { User } from '@/types/domain'
import type { Page, PageParams } from '@/types/api'

export interface UserCreate {
  email: string
  password: string
  full_name?: string | null
  role_codes?: string[]
}

export interface UserUpdate {
  full_name?: string | null
  role_codes?: string[]
  is_active?: boolean
}

export const usersApi = {
  list: (params: PageParams, opts?: ReadOptions) =>
    GET<Page<User>>('/users', { ...opts, params }),
  get: (id: string, opts?: ReadOptions) => GET<User>(`/users/${id}`, opts),
  create: (payload: UserCreate) => POST<User, UserCreate>('/users', payload),
  update: (id: string, payload: UserUpdate) => PATCH<User, UserUpdate>(`/users/${id}`, payload),
  remove: (id: string) => DELETE<void>(`/users/${id}`),
}
