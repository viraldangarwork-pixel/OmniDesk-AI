import { GET, POST, PATCH, DELETE, type ReadOptions } from './_http'
import type { Timestamped } from '@/types/domain'

export type ChannelType =
  | 'whatsapp'
  | 'messenger'
  | 'instagram'
  | 'telegram'
  | 'livechat'
  | 'email'

export interface Channel extends Timestamped {
  id: string
  tenant_id: string
  type: ChannelType
  name: string
  config: Record<string, unknown>
  is_active: boolean
}

export interface ChannelCreate {
  type: ChannelType
  name: string
  config: Record<string, unknown>
  /** Raw credentials are write-only; the backend stores them encrypted and
   * never echoes them back in list/detail responses. */
  credentials: Record<string, unknown>
}

export type ChannelUpdate = Partial<Omit<ChannelCreate, 'type'>>

export const channelsApi = {
  list: (opts?: ReadOptions) => GET<Channel[]>('/channels', opts),
  get: (id: string, opts?: ReadOptions) => GET<Channel>(`/channels/${id}`, opts),
  create: (payload: ChannelCreate) => POST<Channel, ChannelCreate>('/channels', payload),
  update: (id: string, payload: ChannelUpdate) =>
    PATCH<Channel, ChannelUpdate>(`/channels/${id}`, payload),
  remove: (id: string) => DELETE<void>(`/channels/${id}`),
}
