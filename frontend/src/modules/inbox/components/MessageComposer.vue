<script setup lang="ts">
import { ref, watch } from 'vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiTextarea from '@/components/ui/UiTextarea.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import TypingDots from '@/components/ui/TypingDots.vue'
import { P } from '@/auth/permissions'

interface Props {
  disabled?: boolean
  aiBusy?: boolean
  sending?: boolean
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'send', content: string): void
  (e: 'draft'): void
  (e: 'typing'): void
}>()

const text = ref('')
const lastTypingSent = ref(0)

/**
 * Consumers call this after a successful send to drop the optimistic
 * content.  It's a ref-exposed method rather than two-way binding to
 * keep the composer's state owned by this component.
 */
function fillFromAI(draft: string) {
  text.value = draft
}
defineExpose({ fillFromAI, clear: () => (text.value = '') })

// Light-rate-limited typing broadcast: at most once per 1.2s.
watch(text, (v) => {
  if (!v.trim()) return
  const now = Date.now()
  if (now - lastTypingSent.value > 1200) {
    lastTypingSent.value = now
    emit('typing')
  }
})

function submit() {
  const body = text.value.trim()
  if (!body || props.disabled || props.sending) return
  emit('send', body)
  text.value = ''
}

function onKeydown(ev: KeyboardEvent) {
  if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
    ev.preventDefault()
    submit()
  }
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const sendKbd = isMac ? '⌘⏎' : 'Ctrl+⏎'
</script>

<template>
  <div class="border-t border-slate-200/70 bg-white p-3">
    <div class="relative rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15">
      <UiTextarea
        :model-value="text"
        rows="3"
        autosize
        :max-rows="10"
        placeholder="Write a reply… (drag files, or Ctrl/⌘ + Enter to send)"
        class="!border-0 !shadow-none focus:!ring-0"
        @update:model-value="(v: string) => (text = v)"
        @keydown="onKeydown"
      />

      <div class="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2">
        <div class="flex items-center gap-2">
          <UiButton
            v-can="P.ai.manage"
            variant="ghost"
            size="sm"
            :loading="aiBusy"
            @click="emit('draft')"
          >
            <template #leading>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-violet-500">
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
              </svg>
            </template>
            <span v-if="aiBusy" class="inline-flex items-center gap-1.5">
              Drafting <TypingDots tone="brand" />
            </span>
            <span v-else>AI draft</span>
          </UiButton>
        </div>

        <div class="flex items-center gap-2">
          <UiBadge tone="slate" variant="soft" class="hidden md:inline-flex">
            {{ sendKbd }}
          </UiBadge>
          <UiButton
            v-can="P.inbox.write"
            variant="primary"
            size="sm"
            :disabled="!text.trim() || disabled"
            :loading="sending"
            @click="submit"
          >
            Send
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>
