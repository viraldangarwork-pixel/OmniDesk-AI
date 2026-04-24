/**
 * Canonical permission codes — kept in sync with the backend's
 * DEFAULT_PERMISSIONS list (services/auth_service.py).
 *
 * Prefer importing from this module over hard-coding strings so that a
 * rename on the server is a single-file change here.
 */

export const P = {
  tenants: {
    manage: 'tenants.manage',
  },
  users: {
    read: 'users.read',
    write: 'users.write',
  },
  roles: {
    manage: 'roles.manage',
  },
  channels: {
    manage: 'channels.manage',
  },
  inbox: {
    read: 'inbox.read',
    write: 'inbox.write',
  },
  contacts: {
    manage: 'contacts.manage',
  },
  leads: {
    manage: 'leads.manage',
  },
  ai: {
    manage: 'ai.manage',
  },
  kb: {
    manage: 'kb.manage',
  },
  workflows: {
    manage: 'workflows.manage',
  },
  analytics: {
    read: 'analytics.read',
  },
  billing: {
    manage: 'billing.manage',
  },
} as const

/** All permission codes as a flat tuple (useful for testing / type inference). */
export const ALL_PERMISSIONS = [
  P.tenants.manage,
  P.users.read,
  P.users.write,
  P.roles.manage,
  P.channels.manage,
  P.inbox.read,
  P.inbox.write,
  P.contacts.manage,
  P.leads.manage,
  P.ai.manage,
  P.kb.manage,
  P.workflows.manage,
  P.analytics.read,
  P.billing.manage,
] as const

export type Permission = (typeof ALL_PERMISSIONS)[number]

export const R = {
  owner: 'owner',
  admin: 'admin',
  agent: 'agent',
  viewer: 'viewer',
} as const

export type Role = (typeof R)[keyof typeof R]
