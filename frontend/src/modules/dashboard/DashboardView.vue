<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/services/api'

interface Summary {
  open_conversations: number
  total_messages: number
  total_leads: number
  since: string
}

const summary = ref<Summary | null>(null)
const daily = ref<Array<Record<string, any>>>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [s, d] = await Promise.all([
      api.get<Summary>('/analytics/summary'),
      api.get('/analytics/daily', { params: { days: 14 } }),
    ])
    summary.value = s.data
    daily.value = d.data
  } finally {
    loading.value = false
  }
})

const cards = [
  { key: 'open_conversations', label: 'Open conversations', tone: 'bg-brand-50 text-brand-700' },
  { key: 'total_messages', label: 'Total messages', tone: 'bg-emerald-50 text-emerald-700' },
  { key: 'total_leads', label: 'Total leads', tone: 'bg-amber-50 text-amber-700' },
]
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">Dashboard</h1>
      <p class="text-sm text-slate-500">Overview of your omnichannel inbox.</p>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div v-for="c in cards" :key="c.key" class="card p-5">
        <div class="text-xs font-medium uppercase tracking-wide text-slate-500">{{ c.label }}</div>
        <div class="mt-2 text-3xl font-bold" :class="c.tone.split(' ').slice(-1)">
          <template v-if="loading">…</template>
          <template v-else>{{ summary?.[c.key as keyof Summary] ?? 0 }}</template>
        </div>
      </div>
    </div>

    <div class="card p-5">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="font-semibold">Last 14 days</h2>
        <span class="text-xs text-slate-500">Daily metrics</span>
      </div>
      <div v-if="!daily.length" class="py-10 text-center text-sm text-slate-400">
        Metrics will appear once conversations start flowing.
      </div>
      <table v-else class="w-full text-sm">
        <thead class="text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="py-2">Day</th>
            <th>Opened</th>
            <th>Closed</th>
            <th>Msgs in</th>
            <th>Msgs out</th>
            <th>AI handled</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in daily" :key="row.day" class="border-t border-slate-100">
            <td class="py-2">{{ row.day }}</td>
            <td>{{ row.conversations_opened }}</td>
            <td>{{ row.conversations_closed }}</td>
            <td>{{ row.messages_in }}</td>
            <td>{{ row.messages_out }}</td>
            <td>{{ row.ai_handled }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
