/**
 * Barrel export for the typed resource modules.
 *
 *   import { contactsApi, leadsApi, conversationsApi } from '@/services/resources'
 */

export { contactsApi } from './contacts'
export type { ContactCreate, ContactUpdate } from './contacts'

export { leadsApi } from './leads'
export type { LeadCreate, LeadUpdate, LeadStageCreate } from './leads'

export { conversationsApi } from './conversations'
export type { ConversationFilters, ConversationDetail } from './conversations'

export { messagesApi } from './messages'
export type { SendMessageInput } from './messages'

export { aiAgentsApi } from './aiAgents'
export type { AIAgentCreate, AIAgentUpdate, AIReplyResponse } from './aiAgents'

export { kbApi } from './kb'
export type { KBSearchHit, KBSearchResponse, KBIngestUrl } from './kb'

export { workflowsApi } from './workflows'
export type {
  WorkflowCreate,
  WorkflowUpdate,
  WorkflowRunInput,
  WorkflowRunResponse,
} from './workflows'

export { analyticsApi } from './analytics'
export type { AnalyticsSummary, AnalyticsDailyRow } from './analytics'

export { usersApi } from './users'
export type { UserCreate, UserUpdate } from './users'

export { billingApi } from './billing'
export type { Subscription } from './billing'

export { tenantsApi } from './tenants'
export type { TenantUpdate } from './tenants'

export { channelsApi } from './channels'
export type { Channel, ChannelCreate, ChannelUpdate, ChannelType } from './channels'
