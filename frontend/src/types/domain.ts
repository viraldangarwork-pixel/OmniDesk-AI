/**
 * Domain entities shared across modules.
 *
 * These are the canonical shapes that views, stores, and composables
 * should consume — views should NOT redeclare these ad-hoc.
 */

export type UUID = string
export type ISODate = string

export interface Timestamped {
  created_at: ISODate
  updated_at: ISODate
}

/* ----------------------------- Auth ----------------------------- */

export interface User extends Timestamped {
  id: UUID
  email: string
  full_name: string | null
  tenant_id: UUID | null
  is_superuser: boolean
  roles: string[]
  permissions: string[]
}

export interface Tenant extends Timestamped {
  id: UUID
  name: string
  slug: string
}

/* ----------------------------- CRM ----------------------------- */

export interface Contact extends Timestamped {
  id: UUID
  tenant_id: UUID
  full_name: string | null
  email: string | null
  phone: string | null
  channel_ids: Record<string, string> | null
  tags: string[]
  notes: string | null
}

export type LeadStage = 'new' | 'qualified' | 'proposal' | 'won' | 'lost' | string

export interface Lead extends Timestamped {
  id: UUID
  tenant_id: UUID
  contact_id: UUID | null
  title: string
  stage: LeadStage
  value: number | null
  owner_id: UUID | null
}

/* ----------------------------- Inbox ----------------------------- */

export type Channel = 'whatsapp' | 'messenger' | 'instagram' | 'telegram' | 'livechat' | 'email'
export type ConversationStatus = 'open' | 'pending' | 'closed' | 'snoozed'

export interface Conversation extends Timestamped {
  id: UUID
  tenant_id: UUID
  contact_id: UUID | null
  channel: Channel
  status: ConversationStatus
  assignee_id: UUID | null
  last_message_at: ISODate | null
  unread_count: number
  subject: string | null
}

export type MessageDirection = 'inbound' | 'outbound'
export type MessageRole = 'customer' | 'agent' | 'ai' | 'system'

export interface Message {
  id: UUID
  conversation_id: UUID
  direction: MessageDirection
  role: MessageRole
  body: string
  attachments: Array<{ url: string; mime: string; name?: string }>
  created_at: ISODate
}

/* ----------------------------- AI ----------------------------- */

export interface AIAgent extends Timestamped {
  id: UUID
  tenant_id: UUID
  name: string
  description: string | null
  model: string
  system_prompt: string
  tools: string[]
  is_active: boolean
}

/* ----------------------------- KB ----------------------------- */

export interface KBDocument extends Timestamped {
  id: UUID
  tenant_id: UUID
  title: string
  source_url: string | null
  status: 'pending' | 'indexed' | 'failed'
  chunk_count: number
}

/* ----------------------------- Workflows ----------------------------- */

export interface Workflow extends Timestamped {
  id: UUID
  tenant_id: UUID
  name: string
  description: string | null
  trigger: Record<string, unknown>
  steps: Array<Record<string, unknown>>
  is_active: boolean
}

/* ----------------------------- Billing ----------------------------- */

export interface Plan {
  id: UUID
  code: string
  name: string
  price_cents: number
  currency: string
  features: string[]
}

export interface Invoice {
  id: UUID
  number: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  total_cents: number
  currency: string
  issued_at: ISODate
  due_at: ISODate | null
  pdf_url: string | null
}
