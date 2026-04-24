import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { analyticsApi } from '@/services/resources'
import { qk } from '@/services/queryKeys'

export function useAnalyticsSummaryQuery() {
  return useQuery({
    queryKey: qk.analytics.summary(),
    queryFn: ({ signal }) => analyticsApi.summary({ signal }),
    staleTime: 60_000,
  })
}

export function useAnalyticsDailyQuery(days: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: computed(() => qk.analytics.daily(toValue(days))),
    queryFn: ({ signal }) => analyticsApi.daily(toValue(days), { signal }),
    staleTime: 60_000,
  })
}
