<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Conversation, Message } from '@/stores/inbox'

const props = defineProps<{ conversation: Conversation; messages: Message[] }>()
const scroller = ref<HTMLElement | null>(null)

watch(
  () => props.messages.length,
  async () => {
    await nextTick()
    scroller.value?.scrollTo({ top: scroller.value.scrollHeight, behavior: 'smooth' })
  },
)

function bubbleClass(m: Message) {
  return m.direction === 'outbound'
    ? 'ml-auto bg-brand-600 text-white'
    : 'mr-auto bg-slate-100 text-slate-800'
}
</script>

<template>
  <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
    <div>
      <div class="text-sm font-semibold">{{ conversation.subject || 'Conversation' }}</div>
      <div class="text-xs text-slate-500">Status: {{ conversation.status }}</div>
    </div>
  </div>
  <div ref="scroller" class="flex-1 space-y-2 overflow-auto bg-slate-50 p-4">
    <div
      v-for="m in messages"
      :key="m.id"
      class="max-w-[70%] rounded-xl px-3 py-2 text-sm shadow-sm"
      :class="bubbleClass(m)"
    >
      <div>{{ m.content }}</div>
      <div class="mt-1 text-[10px] opacity-70">
        {{ m.sender_type }} · {{ new Date(m.created_at).toLocaleTimeString() }}
      </div>
    </div>
    <div v-if="!messages.length" class="py-10 text-center text-sm text-slate-400">
      No messages yet.
    </div>
  </div>
</template>
