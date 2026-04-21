<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '@/services/api'
import GlassCard from '@/components/ui/GlassCard.vue'
import CountUp from '@/components/ui/CountUp.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import AnimatedBlob from '@/components/ui/AnimatedBlob.vue'

interface Summary {
  open_conversations: number
  total_messages: number
  total_leads: number
  since: string
}
interface DailyRow {
  day: string
  conversations_opened: number
  conversations_closed: number
  messages_in: number
  messages_out: number
  ai_handled: number
}

const summary = ref<Summary | null>(null)
const daily = ref<DailyRow[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [s, d] = await Promise.all([
      api.get<Summary>('/analytics/summary'),
      api.get<DailyRow[]>('/analytics/daily', { params: { days: 14 } }),
    ])
    summary.value = s.data
    daily.value = d.data
  } finally {
    loading.value = false
  }
})

interface CardDef {
  key: keyof Summary
  label: string
  tone: 'brand' | 'emerald' | 'amber'
  valueClass: string
  icon: 'chat' | 'mail' | 'spark'
  accent: string
  hint: string
}

const cards: CardDef[] = [
  {
    key: 'open_conversations',
    label: 'Open conversations',
    tone: 'brand',
    valueClass: 'text-brand-700',
    icon: 'chat',
    accent: 'from-brand-500 to-brand-700',
    hint: 'Active now across all channels',
  },
  {
    key: 'total_messages',
    label: 'Total messages',
    tone: 'emerald',
    valueClass: 'text-emerald-700',
    icon: 'mail',
    accent: 'from-emerald-500 to-emerald-700',
    hint: 'Inbound + outbound delivered',
  },
  {
    key: 'total_leads',
    label: 'Total leads',
    tone: 'amber',
    valueClass: 'text-amber-700',
    icon: 'spark',
    accent: 'from-amber-500 to-amber-600',
    hint: 'New opportunities captured',
  },
]

// Derived metrics for the "today" glance card.
const todayStats = computed(() => {
  const last = daily.value[daily.value.length - 1]
  if (!last) return null
  const inMsgs = last.messages_in
  const outMsgs = last.messages_out
  const total = inMsgs + outMsgs || 1
  const aiRate = Math.round((last.ai_handled / total) * 100)
  const closeRate = last.conversations_opened
    ? Math.round((last.conversations_closed / last.conversations_opened) * 100)
    : 0
  return {
    inRate: Math.round((inMsgs / total) * 100),
    outRate: Math.round((outMsgs / total) * 100),
    aiRate,
    closeRate,
  }
})

const sinceLabel = computed(() => {
  if (!summary.value?.since) return ''
  try {
    return new Date(summary.value.since).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
})
</script>

<template>
  <div class="relative space-y-8">
    <AnimatedBlob intensity="soft" />

    <!-- Header -->
    <header v-motion="{ preset: 'fade-up', delay: 40 }">
      <h1 class="text-3xl font-semibold tracking-tight text-slate-900">
        Good to see you
        <span class="gradient-text">again</span>
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        Overview of your omnichannel inbox<span v-if="sinceLabel"> since {{ sinceLabel }}</span>.
      </p>
    </header>

    <!-- KPI cards -->
    <section class="grid grid-cols-1 gap-5 md:grid-cols-3">
      <GlassCard
        v-for="(c, i) in cards"
        :key="c.key"
        :tone="c.tone"
        v-motion="{ preset: 'fade-up', delay: 80 + i * 90 }"
        class="overflow-hidden"
      >
        <div class="relative p-5">
          <!-- Accent bar -->
          <span
            class="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r"
            :class="c.accent"
            aria-hidden="true"
          />
          <div class="flex items-start justify-between">
            <div>
              <div class="text-xs font-medium uppercase tracking-wide text-slate-500">
                {{ c.label }}
              </div>
              <div class="mt-3 text-4xl font-bold" :class="c.valueClass">
                <Skeleton v-if="loading" width="7rem" height="2.25rem" />
                <CountUp v-else :value="summary?.[c.key] ?? 0" :duration="1400" />
              </div>
              <div class="mt-2 text-xs text-slate-500">{{ c.hint }}</div>
            </div>
            <!-- Icon chip -->
            <div
              class="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white
                     shadow-[0_6px_18px_-8px_rgba(15,23,42,0.35)] transition-transform duration-300
                     group-hover:-translate-y-0.5 group-hover:scale-110"
              :class="c.accent"
              aria-hidden="true"
            >
              <svg v-if="c.icon === 'chat'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                <path d="M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 0 1-3.43-.61L3 21l1.7-4.2A7.46 7.46 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
              </svg>
              <svg v-else-if="c.icon === 'mail'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                <rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 6.5 8.5 6 8.5-6" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
              </svg>
            </div>
          </div>
        </div>
      </GlassCard>
    </section>

    <!-- Today at a glance -->
    <section
      v-motion="{ preset: 'fade-up', delay: 200 }"
      class="card p-6"
    >
      <div class="mb-5 flex items-center justify-between">
        <div>
          <h2 class="font-semibold text-slate-900">Today at a glance</h2>
          <p class="text-xs text-slate-500">Relative mix of traffic and AI handling</p>
        </div>
      </div>

      <div v-if="loading" class="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Skeleton v-for="n in 4" :key="n" width="100%" height="2.25rem" />
      </div>
      <div v-else-if="!todayStats" class="py-8 text-center text-sm text-slate-400">
        No data yet — metrics will appear once conversations start flowing.
      </div>
      <div v-else class="grid grid-cols-1 gap-5 md:grid-cols-2">
        <ProgressBar label="Inbound share" :value="todayStats.inRate" color="brand" :delay="60" />
        <ProgressBar label="Outbound share" :value="todayStats.outRate" color="emerald" :delay="120" />
        <ProgressBar label="AI handled" :value="todayStats.aiRate" color="amber" :delay="180" />
        <ProgressBar label="Close rate" :value="todayStats.closeRate" color="slate" :delay="240" />
      </div>
    </section>

    <!-- Daily table -->
    <section
      v-motion="{ preset: 'fade-up', delay: 280 }"
      class="card overflow-hidden"
    >
      <div class="flex items-center justify-between border-b border-slate-200/70 px-6 py-4">
        <div>
          <h2 class="font-semibold text-slate-900">Last 14 days</h2>
          <p class="text-xs text-slate-500">Daily activity breakdown</p>
        </div>
        <span class="badge bg-slate-100 text-slate-600">Live</span>
      </div>

      <div v-if="loading" class="space-y-2 p-6">
        <Skeleton v-for="n in 5" :key="n" width="100%" height="1.75rem" />
      </div>
      <div v-else-if="!daily.length" class="py-12 text-center text-sm text-slate-400">
        Metrics will appear once conversations start flowing.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50/70 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-6 py-3 font-medium">Day</th>
              <th class="px-3 py-3 font-medium">Opened</th>
              <th class="px-3 py-3 font-medium">Closed</th>
              <th class="px-3 py-3 font-medium">Msgs in</th>
              <th class="px-3 py-3 font-medium">Msgs out</th>
              <th class="px-6 py-3 font-medium">AI handled</th>
            </tr>
          </thead>
          <TransitionGroup tag="tbody" name="list">
            <tr
              v-for="row in daily"
              :key="row.day"
              class="border-t border-slate-100 transition-colors duration-150 hover:bg-brand-50/40"
            >
              <td class="px-6 py-3 font-medium text-slate-700">{{ row.day }}</td>
              <td class="px-3 py-3 tabular-nums">{{ row.conversations_opened }}</td>
              <td class="px-3 py-3 tabular-nums">{{ row.conversations_closed }}</td>
              <td class="px-3 py-3 tabular-nums">{{ row.messages_in }}</td>
              <td class="px-3 py-3 tabular-nums">{{ row.messages_out }}</td>
              <td class="px-6 py-3 tabular-nums">{{ row.ai_handled }}</td>
            </tr>
          </TransitionGroup>
        </table>
      </div>
    </section>
  </div>
</template>
