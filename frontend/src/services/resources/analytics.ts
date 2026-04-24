import { GET, type ReadOptions } from './_http'

export interface AnalyticsSummary {
  open_conversations: number
  total_messages: number
  total_leads: number
  since: string
}

export interface AnalyticsDailyRow {
  day: string
  conversations_opened: number
  conversations_closed: number
  messages_in: number
  messages_out: number
  ai_handled: number
}

export const analyticsApi = {
  summary: (opts?: ReadOptions) => GET<AnalyticsSummary>('/analytics/summary', opts),
  daily: (days: number, opts?: ReadOptions) =>
    GET<AnalyticsDailyRow[]>('/analytics/daily', { ...opts, params: { days } }),
}
