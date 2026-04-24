/**
 * Central query-key factory.
 *
 * Two rules to keep cache invalidation sane across the app:
 *
 *   1. Every key is a tuple that begins with the resource scope.  So
 *      `invalidateQueries({ queryKey: qk.contacts.all })` invalidates every
 *      list, detail and nested read under contacts — no matter the params.
 *
 *   2. Parameterised keys always place params as the trailing element, so
 *      the prefix "starts-with" match works for partial invalidation.
 *
 * Always invalidate via the factory — never hand-build `['contacts', ...]`
 * strings at the call-site.
 */

import type { PageParams } from '@/types/api'

type ScopeKey<T extends string> = readonly [T]

export const qk = {
  contacts: {
    all: ['contacts'] as const satisfies ScopeKey<'contacts'>,
    list: (params: PageParams) => ['contacts', 'list', params] as const,
    detail: (id: string) => ['contacts', 'detail', id] as const,
  },
  leads: {
    all: ['leads'] as const,
    list: (params: PageParams) => ['leads', 'list', params] as const,
    detail: (id: string) => ['leads', 'detail', id] as const,
    stages: () => ['leads', 'stages'] as const,
  },
  conversations: {
    all: ['conversations'] as const,
    list: (params: Record<string, unknown>) => ['conversations', 'list', params] as const,
    detail: (id: string) => ['conversations', 'detail', id] as const,
    messages: (conversationId: string) => ['conversations', 'messages', conversationId] as const,
  },
  kb: {
    all: ['kb'] as const,
    list: (params: PageParams) => ['kb', 'list', params] as const,
    detail: (id: string) => ['kb', 'detail', id] as const,
    search: (q: string) => ['kb', 'search', q] as const,
  },
  users: {
    all: ['users'] as const,
    list: (params: PageParams) => ['users', 'list', params] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  aiAgents: {
    all: ['ai-agents'] as const,
    list: () => ['ai-agents', 'list'] as const,
    detail: (id: string) => ['ai-agents', 'detail', id] as const,
  },
  workflows: {
    all: ['workflows'] as const,
    list: () => ['workflows', 'list'] as const,
    detail: (id: string) => ['workflows', 'detail', id] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    summary: () => ['analytics', 'summary'] as const,
    daily: (days: number) => ['analytics', 'daily', days] as const,
  },
  billing: {
    all: ['billing'] as const,
    plans: () => ['billing', 'plans'] as const,
    invoices: () => ['billing', 'invoices'] as const,
    subscription: () => ['billing', 'subscription'] as const,
  },
  tenant: {
    all: ['tenant'] as const,
    me: () => ['tenant', 'me'] as const,
  },
  channels: {
    all: ['channels'] as const,
    list: () => ['channels', 'list'] as const,
  },
  auth: {
    me: () => ['auth', 'me'] as const,
  },
} as const
