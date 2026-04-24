<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { Conversation, Message } from '@/types/domain'
import TypingDots from '@/components/ui/TypingDots.vue'
import UiBadge from '@/components/ui/UiBadge.vue'

interface Props {
  conversation: Conversation
  messages: Message[]
  typing: boolean
}
const props = defineProps<Props>()

const scroller = ref<HTMLElement | null>(null)
// We only auto-scroll when the user is already near the bottom — avoids
// stealing the reader's place when they scroll up to review history.
const pinned = ref(true)

function updatePinned() {
  const el = scroller.value
  if (!el) return
  const remaining = el.scrollHeight - el.scrollTop - el.clientHeight
  pinned.value = remaining < 80
}

function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
  nextTick(() => {
    const el = scroller.value
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  })
}

onMounted(() => scrollToBottom('auto'))

watch(
  () => props.messages.length,
  () => {
    if (pinned.value) scrollToBottom()
  },
)
watch(
  () => props.conversation.id,
  () => {
    pinned.value = true
    scrollToBottom('auto')
  },
)

/* ----------------------------- grouping ----------------------------- */

interface Group {
  key: string
  dayLabel: string
  clusters: Cluster[]
}
interface Cluster {
  key: string
  side: 'in' | 'out'
  sender_type: Message['sender_type']
  items: Message[]
}

const DAY_MS = 86_400_000
const CLUSTER_GAP_MS = 5 * 60_000

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function dayLabel(d: Date) {
  const today = new Date()
  const y = new Date(today.getTime() - DAY_MS)
  if (isSameDay(d, today)) return 'Today'
  if (isSameDay(d, y)) return 'Yesterday'
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  })
}

const groups = computed<Group[]>(() => {
  const out: Group[] = []
  let currentGroup: Group | null = null
  let currentCluster: Cluster | null = null
  for (const m of props.messages) {
    const d = new Date(m.created_at)
    if (!currentGroup || !isSameDay(new Date(currentGroup.key), d)) {
      currentGroup = { key: d.toISOString(), dayLabel: dayLabel(d), clusters: [] }
      currentCluster = null
      out.push(currentGroup)
    }
    const side: 'in' | 'out' = m.direction === 'outbound' ? 'out' : 'in'
    const last = currentCluster?.items[currentCluster.items.length - 1]
    const gap = last ? d.getTime() - new Date(last.created_at).getTime() : Infinity
    if (
      !currentCluster ||
      currentCluster.side !== side ||
      currentCluster.sender_type !== m.sender_type ||
      gap > CLUSTER_GAP_MS
    ) {
      currentCluster = { key: m.id, side, sender_type: m.sender_type, items: [] }
      currentGroup.clusters.push(currentCluster)
    }
    currentCluster.items.push(m)
  }
  return out
})

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function senderInitial(sender_type: Message['sender_type']) {
  if (sender_type === 'customer') return 'C'
  if (sender_type === 'ai') return 'AI'
  if (sender_type === 'system') return 'S'
  return 'A'
}

function pending(m: Message) {
  return (m.meta as { pending?: boolean } | null)?.pending === true
}
</script>

<template>
  <div
    ref="scroller"
    class="relative flex-1 space-y-4 overflow-auto bg-gradient-to-b from-slate-50/60 to-white px-4 py-5"
    @scroll.passive="updatePinned"
  >
    <!-- Empty state -->
    <div
      v-if="!messages.length && !typing"
      class="grid h-full place-items-center py-16 text-center"
    >
      <div>
        <div class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
            <path d="M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 0 1-3.43-.61L3 21l1.7-4.2A7.46 7.46 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
          </svg>
        </div>
        <p class="mt-3 text-sm text-slate-500">Say hello to get the conversation started.</p>
      </div>
    </div>

    <template v-for="g in groups" :key="g.key">
      <!-- Day separator -->
      <div class="relative py-1">
        <div class="absolute inset-x-0 top-1/2 border-t border-slate-200/70" aria-hidden="true" />
        <div
          class="relative mx-auto w-max rounded-full border border-slate-200/70 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-500 shadow-sm"
        >
          {{ g.dayLabel }}
        </div>
      </div>

      <!-- Clusters -->
      <div
        v-for="cl in g.clusters"
        :key="cl.key"
        class="flex gap-2"
        :class="cl.side === 'out' ? 'flex-row-reverse' : 'flex-row'"
      >
        <!-- Avatar -->
        <div
          class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold"
          :class="[
            cl.sender_type === 'customer' && 'bg-slate-100 text-slate-600',
            cl.sender_type === 'agent' && 'bg-gradient-to-br from-brand-500 to-brand-700 text-white',
            cl.sender_type === 'ai' && 'bg-gradient-to-br from-violet-500 to-sky-500 text-white',
            cl.sender_type === 'system' && 'bg-slate-200 text-slate-500',
          ]"
          aria-hidden="true"
        >
          {{ senderInitial(cl.sender_type) }}
        </div>

        <!-- Bubbles -->
        <div
          class="flex max-w-[75%] flex-col gap-1"
          :class="cl.side === 'out' ? 'items-end' : 'items-start'"
        >
          <div
            v-for="(m, idx) in cl.items"
            :key="m.id"
            class="group relative rounded-2xl px-3.5 py-2 text-sm shadow-sm transition-colors"
            :class="[
              cl.side === 'out'
                ? (cl.sender_type === 'ai'
                    ? 'bg-gradient-to-br from-violet-500 to-sky-500 text-white'
                    : 'bg-gradient-to-br from-brand-500 to-brand-600 text-white')
                : 'bg-white text-slate-800 ring-1 ring-slate-200',
              pending(m) && 'opacity-70',
            ]"
          >
            <div class="whitespace-pre-wrap break-words">{{ m.content }}</div>

            <!-- Meta row under the last bubble of the cluster -->
            <div
              v-if="idx === cl.items.length - 1"
              class="mt-0.5 flex items-center gap-1.5 text-[10px]"
              :class="cl.side === 'out' ? 'text-white/80' : 'text-slate-400'"
            >
              <UiBadge
                v-if="cl.sender_type === 'ai'"
                tone="violet"
                variant="soft"
                class="!px-1.5 !py-0 !text-[10px]"
              >
                AI
              </UiBadge>
              <span>{{ fmtTime(m.created_at) }}</span>
              <span v-if="pending(m)" class="inline-flex items-center gap-1">· sending</span>
              <span v-else-if="cl.side === 'out' && m.read_at" aria-label="Read">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3">
                  <path d="M3 12l4 4 9-9M12 14l4 4 5-5" />
                </svg>
              </span>
              <span v-else-if="cl.side === 'out' && m.delivered_at" aria-label="Delivered">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3">
                  <path d="M4 12l5 5 11-11" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Typing indicator bubble -->
    <Transition name="fade-up">
      <div v-if="typing" class="flex items-end gap-2">
        <div class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
          C
        </div>
        <div class="rounded-2xl bg-white px-3.5 py-2.5 shadow-sm ring-1 ring-slate-200">
          <TypingDots tone="slate" />
        </div>
      </div>
    </Transition>

    <!-- Jump-to-latest pill -->
    <Transition name="fade-up">
      <button
        v-if="!pinned"
        type="button"
        class="sticky bottom-2 mx-auto flex h-8 items-center gap-1.5 rounded-full bg-brand-600 px-3 text-xs font-medium text-white shadow-lg ring-1 ring-brand-500/30 transition-transform hover:-translate-y-0.5"
        @click="scrollToBottom()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
        Jump to latest
      </button>
    </Transition>
  </div>
</template>
