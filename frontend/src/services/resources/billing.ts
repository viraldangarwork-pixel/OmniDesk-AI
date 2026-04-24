import { GET, POST, type ReadOptions } from './_http'
import type { Plan, Invoice } from '@/types/domain'

export interface Subscription {
  plan_code: string
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | string
  current_period_end: string | null
  seats: number
}

export const billingApi = {
  plans: (opts?: ReadOptions) => GET<Plan[]>('/billing/plans', opts),
  invoices: (opts?: ReadOptions) => GET<Invoice[]>('/billing/invoices', opts),
  subscription: (opts?: ReadOptions) => GET<Subscription>('/billing/subscription', opts),
  selectPlan: (plan_code: string) =>
    POST<Subscription, { plan_code: string }>('/billing/subscribe', { plan_code }),
  checkoutSession: () =>
    POST<{ url: string }, object>('/billing/checkout', {}),
  portalSession: () =>
    POST<{ url: string }, object>('/billing/portal', {}),
}
