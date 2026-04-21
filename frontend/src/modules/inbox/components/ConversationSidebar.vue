<script setup lang="ts">
import { ref } from 'vue'
import type { Conversation } from '@/stores/inbox'
import { useInboxStore } from '@/stores/inbox'

const props = defineProps<{ conversation: Conversation }>()
const inbox = useInboxStore()
const summary = ref<string | null>(null)
const busy = ref(false)

async function summarize() {
  busy.value = true
  try {
    summary.value = await inbox.aiSummarize()
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <aside class="hidden w-80 shrink-0 flex-col bg-white p-4 lg:flex">
    <h3 class="font-semibold">Customer</h3>
    <div class="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
      <div>ID: {{ conversation.contact_id.slice(0, 8) }}…</div>
      <div>Channel: {{ conversation.channel_id.slice(0, 8) }}…</div>
      <div>Assignee: {{ conversation.assignee_id ?? 'Unassigned' }}</div>
    </div>

    <h3 class="mt-6 font-semibold">Tags</h3>
    <div class="mt-2 flex flex-wrap gap-1">
      <span
        v-for="t in conversation.tags"
        :key="t"
        class="badge bg-brand-100 text-brand-700"
      >{{ t }}</span>
      <span v-if="!conversation.tags.length" class="text-xs text-slate-400">None</span>
    </div>

    <div class="mt-6">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">AI Summary</h3>
        <button class="btn-ghost text-xs" :disabled="busy" @click="summarize">
          {{ busy ? '…' : 'Generate' }}
        </button>
      </div>
      <div class="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
        {{ summary || 'Click generate for an AI summary.' }}
      </div>
    </div>

    <div class="mt-6 space-y-2">
      <button class="btn-ghost w-full" @click="inbox.close(conversation.id)">Close conversation</button>
    </div>
  </aside>
</template>
