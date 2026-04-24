<script setup lang="ts">
import { ref } from 'vue'
import type { Conversation } from '@/types/domain'
import { useInboxStore } from '@/stores/inbox'
import { useToast } from '@/composables/useToast'
import { P } from '@/auth/permissions'

import UiButton from '@/components/ui/UiButton.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import UiConfirm from '@/components/ui/UiConfirm.vue'

const props = defineProps<{ conversation: Conversation }>()
const inbox = useInboxStore()
const toast = useToast()

const summary = ref<string | null>(null)
const summarizing = ref(false)
const confirmClose = ref(false)

async function summarize() {
  summarizing.value = true
  try {
    summary.value = await inbox.aiSummarize()
  } finally {
    summarizing.value = false
  }
}

async function runClose() {
  await inbox.close(props.conversation.id)
  toast.success('Conversation closed')
}

function copyId() {
  navigator.clipboard?.writeText(props.conversation.id)
  toast.info('Conversation ID copied')
}
</script>

<template>
  <aside class="hidden w-80 shrink-0 flex-col border-l border-slate-200/70 bg-white p-4 lg:flex">
    <!-- Customer -->
    <section>
      <header class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-900">Customer</h3>
        <UiButton variant="ghost" size="xs" icon-only label="Copy conversation ID" @click="copyId">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5 text-slate-500">
            <rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
        </UiButton>
      </header>
      <dl class="mt-2 rounded-xl border border-slate-200/70 bg-slate-50/60 p-3 text-xs">
        <div class="flex items-center justify-between py-1">
          <dt class="text-slate-500">Contact</dt>
          <dd class="font-mono text-slate-700">{{ conversation.contact_id.slice(0, 8) }}…</dd>
        </div>
        <div class="flex items-center justify-between py-1">
          <dt class="text-slate-500">Channel</dt>
          <dd class="font-mono text-slate-700">{{ conversation.channel_id.slice(0, 8) }}…</dd>
        </div>
        <div class="flex items-center justify-between py-1">
          <dt class="text-slate-500">Assignee</dt>
          <dd class="text-slate-700">
            <template v-if="conversation.assignee_id">{{ conversation.assignee_id.slice(0, 8) }}…</template>
            <span v-else class="italic text-amber-700">Unassigned</span>
          </dd>
        </div>
        <div class="flex items-center justify-between py-1">
          <dt class="text-slate-500">Status</dt>
          <dd>
            <UiBadge
              :tone="conversation.status === 'open' ? 'emerald' : conversation.status === 'pending' ? 'amber' : conversation.status === 'escalated' ? 'rose' : 'slate'"
              variant="soft"
              dot
              :pulse="conversation.status === 'open'"
            >
              {{ conversation.status }}
            </UiBadge>
          </dd>
        </div>
      </dl>
    </section>

    <!-- Tags -->
    <section class="mt-5">
      <h3 class="text-sm font-semibold text-slate-900">Tags</h3>
      <div class="mt-2 flex flex-wrap gap-1.5">
        <UiBadge
          v-for="t in conversation.tags"
          :key="t"
          tone="brand"
          variant="soft"
        >
          {{ t }}
        </UiBadge>
        <span v-if="!conversation.tags.length" class="text-xs text-slate-400">No tags</span>
      </div>
    </section>

    <!-- AI summary -->
    <section class="mt-5">
      <header class="flex items-center justify-between">
        <h3 class="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-violet-500">
            <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
          </svg>
          AI summary
        </h3>
        <UiButton
          v-can="P.ai.manage"
          variant="ghost"
          size="xs"
          :loading="summarizing"
          @click="summarize"
        >
          {{ summary ? 'Refresh' : 'Generate' }}
        </UiButton>
      </header>
      <div
        class="mt-2 min-h-[72px] rounded-xl border border-slate-200/70 bg-gradient-to-br from-violet-50/50 to-white p-3 text-xs leading-relaxed text-slate-700"
      >
        <div v-if="summarizing && !summary" class="flex items-center gap-2 text-slate-400">
          <UiSpinner size="xs" /> Generating…
        </div>
        <div v-else-if="summary" class="whitespace-pre-line">{{ summary }}</div>
        <div v-else class="text-slate-400">
          Click generate for an AI summary of the conversation so far.
        </div>
      </div>
    </section>

    <!-- Actions -->
    <section class="mt-auto pt-5">
      <UiButton
        v-if="conversation.status !== 'closed'"
        v-can="P.inbox.write"
        variant="secondary"
        block
        @click="confirmClose = true"
      >
        Close conversation
      </UiButton>
    </section>

    <UiConfirm
      v-model="confirmClose"
      title="Close this conversation?"
      description="Closed conversations stay in Inbox > Closed and can be reopened later."
      confirm-label="Close"
      tone="neutral"
      :on-confirm="runClose"
    />
  </aside>
</template>
