<script setup lang="ts">
import type { Conversation } from '@/stores/inbox'

defineProps<{ conversations: Conversation[]; selectedId: string | null }>()
defineEmits<{ (e: 'select', id: string): void }>()
</script>

<template>
  <aside class="hidden w-80 shrink-0 flex-col bg-white md:flex">
    <div class="border-b border-slate-200 p-3">
      <input class="input" placeholder="Search conversations…" />
    </div>
    <div class="flex-1 overflow-auto">
      <button
        v-for="c in conversations"
        :key="c.id"
        class="flex w-full flex-col items-start gap-1 border-b border-slate-100 p-3 text-left transition hover:bg-slate-50"
        :class="{ 'bg-brand-50': c.id === selectedId }"
        @click="$emit('select', c.id)"
      >
        <div class="flex w-full items-center justify-between">
          <div class="truncate text-sm font-medium text-slate-800">{{ c.subject || 'Conversation' }}</div>
          <span class="badge" :class="{
            'bg-emerald-100 text-emerald-700': c.status === 'open',
            'bg-amber-100 text-amber-700': c.status === 'pending',
            'bg-slate-100 text-slate-600': c.status === 'closed',
            'bg-red-100 text-red-700': c.status === 'escalated',
          }">{{ c.status }}</span>
        </div>
        <div class="text-xs text-slate-500">
          {{ c.last_message_at ? new Date(c.last_message_at).toLocaleString() : 'No messages yet' }}
        </div>
      </button>
      <div v-if="!conversations.length" class="p-8 text-center text-sm text-slate-400">
        No conversations yet.
      </div>
    </div>
  </aside>
</template>
