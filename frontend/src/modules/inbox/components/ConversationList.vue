<script setup lang="ts">
import { computed } from 'vue'
import type { Conversation } from '@/types/domain'
import UiInput from '@/components/ui/UiInput.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiEmptyState from '@/components/ui/UiEmptyState.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'

type Filter = 'all' | 'mine' | 'unassigned' | 'closed'

interface Props {
  conversations: Conversation[]
  selectedId: string | null
  loading?: boolean
  currentUserId: string | null
  query: string
  filter: Filter
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'update:query', value: string): void
  (e: 'update:filter', value: Filter): void
}>()

const filters: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'mine', label: 'Mine' },
  { key: 'unassigned', label: 'Unassigned' },
  { key: 'closed', label: 'Closed' },
]

const filtered = computed(() => {
  const q = props.query.trim().toLowerCase()
  return props.conversations.filter((c) => {
    if (props.filter === 'mine' && c.assignee_id !== props.currentUserId) return false
    if (props.filter === 'unassigned' && c.assignee_id) return false
    if (props.filter === 'closed' && c.status !== 'closed') return false
    if (props.filter === 'all' && c.status === 'closed') return false
    if (!q) return true
    return (c.subject ?? '').toLowerCase().includes(q)
  })
})

const statusTone = {
  open: 'emerald',
  pending: 'amber',
  closed: 'slate',
  escalated: 'rose',
} as const

function fmtRelative(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function subjectOf(c: Conversation) {
  return c.subject && c.subject.trim() ? c.subject : 'Conversation'
}
</script>

<template>
  <aside class="flex w-full shrink-0 flex-col border-r border-slate-200 bg-white md:w-80">
    <!-- Search -->
    <div class="border-b border-slate-200/70 p-3">
      <UiInput
        :model-value="query"
        placeholder="Search conversations…"
        size="md"
        @update:model-value="(v: string) => emit('update:query', v)"
      >
        <template #leading>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
        </template>
      </UiInput>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-1 border-b border-slate-200/70 px-3 py-2 text-xs">
      <button
        v-for="f in filters"
        :key="f.key"
        type="button"
        class="relative rounded-lg px-2.5 py-1 font-medium transition-colors"
        :class="filter === f.key ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-700'"
        @click="emit('update:filter', f.key)"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- List -->
    <div class="flex-1 overflow-auto">
      <div v-if="loading" class="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
        <UiSpinner size="sm" /> Loading…
      </div>
      <div v-else-if="!filtered.length" class="p-6">
        <UiEmptyState
          :icon="filter === 'closed' ? 'folder' : 'inbox'"
          :title="filter === 'closed' ? 'No closed conversations' : 'Nothing here yet'"
          :description="query ? 'Try a different search term.' : 'New conversations will show up here in real time.'"
          compact
        />
      </div>
      <template v-else>
        <button
          v-for="c in filtered"
          :key="c.id"
          type="button"
          class="relative flex w-full flex-col gap-1 border-b border-slate-100 px-3 py-3 text-left transition-colors hover:bg-slate-50"
          :class="c.id === selectedId && 'bg-brand-50/60'"
          @click="emit('select', c.id)"
        >
          <!-- Left accent when selected -->
          <span
            v-if="c.id === selectedId"
            class="absolute inset-y-1 left-0 w-1 rounded-r-full bg-gradient-to-b from-brand-500 to-brand-700"
            aria-hidden="true"
          />

          <div class="flex min-w-0 items-center justify-between gap-2">
            <span class="truncate text-sm font-medium text-slate-800">
              {{ subjectOf(c) }}
            </span>
            <span class="shrink-0 text-[11px] tabular-nums text-slate-400">
              {{ fmtRelative(c.last_message_at) }}
            </span>
          </div>

          <div class="flex min-w-0 items-center justify-between gap-2">
            <div class="flex items-center gap-1.5">
              <UiBadge :tone="statusTone[c.status] ?? 'slate'" variant="soft" dot :pulse="c.status === 'open'">
                {{ c.status }}
              </UiBadge>
              <span
                v-if="!c.assignee_id && c.status !== 'closed'"
                class="text-[11px] font-medium text-amber-700"
              >
                Unassigned
              </span>
            </div>
            <span
              v-if="c.unread_count > 0"
              class="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white"
            >
              {{ c.unread_count > 99 ? '99+' : c.unread_count }}
            </span>
          </div>
        </button>
      </template>
    </div>
  </aside>
</template>
