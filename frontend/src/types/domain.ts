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

export interface Lead extends Timestamped {
  id: UUID
  tenant_id: UUID
  contact_id: UUID
  title: string
  value: number | string | null
  currency: string
  probability: number
  source: string | null
  description: string | null
  stage_id: UUID | null
  owner_id: UUID | null
  custom: Record<string, unknown>
}

export interface LeadStage extends Timestamped {
  id: UUID
  name: string
  code: string
  position: number
  color: string | null
}

/* ----------------------------- Inbox ----------------------------- */

export type ConversationStatus = 'open' | 'pending' | 'closed' | 'escalated'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageSender = 'customer' | 'agent' | 'ai' | 'system'

export interface Conversation extends Timestamped {
  id: UUID
  tenant_id: UUID
  channel_id: UUID
  contact_id: UUID
  assignee_id: UUID | null
  status: ConversationStatus
  subject: string | null
  unread_count: number
  last_message_at: ISODate | null
  tags: string[]
}

export interface MessageAttachment {
  id: UUID
  url: string
  filename: string | null
  mime_type: string | null
  size_bytes: number | null
}

export interface Message extends Timestamped {
  id: UUID
  conversation_id: UUID
  sender_type: MessageSender
  sender_id: UUID | null
  direction: MessageDirection
  content: string | null
  content_type: string
  delivered_at: ISODate | null
  read_at: ISODate | null
  attachments: MessageAttachment[]
  meta: Record<string, unknown>
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
  title: string
  source_type: string
  source_url: string | null
  status: 'pending' | 'ready' | 'failed' | 'indexed' | string
  meta: Record<string, unknown>
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
