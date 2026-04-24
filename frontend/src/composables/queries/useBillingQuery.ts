import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { billingApi } from '@/services/resources'
import { qk } from '@/services/queryKeys'

export function useBillingPlansQuery() {
  return useQuery({
    queryKey: qk.billing.plans(),
    queryFn: ({ signal }) => billingApi.plans({ signal }),
    staleTime: 10 * 60_000, // plans change rarely
  })
}

export function useBillingInvoicesQuery() {
  return useQuery({
    queryKey: qk.billing.invoices(),
    queryFn: ({ signal }) => billingApi.invoices({ signal }),
  })
}

export function useSubscriptionQuery() {
  return useQuery({
    queryKey: qk.billing.subscription(),
    queryFn: ({ signal }) => billingApi.subscription({ signal }),
  })
}

export function useSelectPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (plan_code: string) => billingApi.selectPlan(plan_code),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.billing.all }),
  })
}
