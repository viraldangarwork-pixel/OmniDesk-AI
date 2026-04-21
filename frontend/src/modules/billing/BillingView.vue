<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/services/api'

const plans = ref<any[]>([])
const subscription = ref<any>(null)
const invoices = ref<any[]>([])

onMounted(async () => {
  const [p, i] = await Promise.all([
    api.get('/billing/plans'),
    api.get('/billing/invoices'),
  ])
  plans.value = p.data
  invoices.value = i.data
  try {
    const { data } = await api.get('/billing/subscription')
    subscription.value = data
  } catch {
    subscription.value = null
  }
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold">Billing</h1>

    <div class="card p-4">
      <h2 class="font-semibold">Current plan</h2>
      <div v-if="subscription" class="mt-2 text-sm text-slate-700">
        {{ subscription.plan.name }} — {{ subscription.plan.price_cents / 100 }} {{ subscription.plan.currency }}/mo
      </div>
      <div v-else class="mt-2 text-sm text-slate-400">No active subscription.</div>
    </div>

    <div class="card p-4">
      <h2 class="font-semibold">Available plans</h2>
      <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div v-for="p in plans" :key="p.id" class="rounded-xl border border-slate-200 p-4">
          <div class="text-sm text-slate-500">{{ p.code }}</div>
          <div class="text-xl font-semibold">{{ p.name }}</div>
          <div class="mt-1 text-sm">
            {{ (p.price_cents / 100).toFixed(2) }} {{ p.currency }} / {{ p.interval }}
          </div>
        </div>
        <div v-if="!plans.length" class="md:col-span-3 text-center text-sm text-slate-400">
          No plans configured yet.
        </div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="border-b border-slate-200 px-4 py-3 font-semibold">Invoices</div>
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Number</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Issued</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!invoices.length"><td colspan="4" class="p-6 text-center text-slate-400">No invoices yet.</td></tr>
          <tr v-for="inv in invoices" :key="inv.id" class="border-t border-slate-100">
            <td class="px-4 py-3">{{ inv.number }}</td>
            <td>{{ (inv.amount_cents / 100).toFixed(2) }} {{ inv.currency }}</td>
            <td>{{ inv.status }}</td>
            <td>{{ new Date(inv.issued_at).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
