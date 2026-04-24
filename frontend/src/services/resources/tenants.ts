import { GET, PUT, type ReadOptions } from './_http'
import type { Tenant } from '@/types/domain'

export interface TenantUpdate {
  name?: string
  domain?: string | null
  /** Tenant branding — colours, logo — used by the theme provider. */
  branding?: {
    accent?: string | null
    logo_url?: string | null
  }
}

export const tenantsApi = {
  me: (opts?: ReadOptions) => GET<Tenant>('/tenants/me', opts),
  update: (payload: TenantUpdate) => PUT<Tenant, TenantUpdate>('/tenants/me', payload),
}
