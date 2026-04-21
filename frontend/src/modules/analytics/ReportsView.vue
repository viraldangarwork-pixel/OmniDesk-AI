<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/services/api'

const daily = ref<Array<Record<string, any>>>([])

onMounted(async () => {
  const { data } = await api.get('/analytics/daily', { params: { days: 30 } })
  daily.value = data
})
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-semibold">Reports</h1>
    <div class="card overflow-auto p-4">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Day</th>
            <th>Opened</th>
            <th>Closed</th>
            <th>Msgs in</th>
            <th>Msgs out</th>
            <th>AI handled</th>
            <th>Leads created</th>
            <th>Leads won</th>
            <th>Avg response (s)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!daily.length"><td colspan="9" class="p-8 text-center text-slate-400">No data yet.</td></tr>
          <tr v-for="row in daily" :key="row.day" class="border-t border-slate-100">
            <td class="px-4 py-3">{{ row.day }}</td>
            <td>{{ row.conversations_opened }}</td>
            <td>{{ row.conversations_closed }}</td>
            <td>{{ row.messages_in }}</td>
            <td>{{ row.messages_out }}</td>
            <td>{{ row.ai_handled }}</td>
            <td>{{ row.leads_created }}</td>
            <td>{{ row.leads_won }}</td>
            <td>{{ row.avg_first_response_seconds }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
