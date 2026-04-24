<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInboxStore } from '@/stores/inbox'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import type { ApiError } from '@/types/api'

import ConversationList from './components/ConversationList.vue'
import ConversationThread from './components/ConversationThread.vue'
import ConversationSidebar from './components/ConversationSidebar.vue'
import MessageComposer from './components/MessageComposer.vue'

import UiButton from '@/components/ui/UiButton.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiEmptyState from '@/components/ui/UiEmptyState.vue'

const inbox = useInboxStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const composerRef = ref<InstanceType<typeof MessageComposer> | null>(null)
const sending = ref(false)
const aiBusy = ref(false)

const query = ref('')
const filter = ref<'all' | 'mine' | 'unassigned' | 'closed'>('all')

onMounted(async () => {
  await inbox.fetchConversations()
  const id = route.params.id as string | undefined
  if (id) await inbox.select(id)
})

watch(
  () => route.params.id,
  async (id) => {
    if (id) await inbox.select(id as string)
    else inbox.selectedId = null
  },
)

async function onSelect(id: string) {
  await router.push(`/inbox/${id}`)
}

async function send(content: string) {
  sending.value = true
  try {
    await inbox.send(content)
  } catch (err) {
    toast.error({ title: 'Failed to send', description: (err as ApiError)?.message })
  } finally {
    sending.value = false
  }
}

async function draft() {
  aiBusy.value = true
  try {
    const reply = await inbox.aiReply()
    if (reply) composerRef.value?.fillFromAI(reply)
    else toast.info('No AI draft available yet')
  } finally {
    aiBusy.value = false
  }
}

const typingActive = computed(() => inbox.selectedTyping.length > 0)
const hasSelection = computed(() => !!inbox.selected)
</script>

<template>
  <!-- Full-bleed: cancel the parent main's p-6 and occupy the viewport below the topbar. -->
  <div class="-m-6 flex h-[calc(100vh-3.5rem)] overflow-hidden">
    <!-- Conversation list: hidden on mobile when a conversation is selected -->
    <ConversationList
      v-model:query="query"
      v-model:filter="filter"
      :conversations="inbox.list"
      :selected-id="inbox.selectedId"
      :loading="inbox.loading"
      :current-user-id="auth.user?.id ?? null"
      class="md:flex"
      :class="hasSelection ? 'hidden md:flex' : 'flex'"
      @select="onSelect"
    />

    <!-- Thread column -->
    <div
      class="flex min-w-0 flex-1 flex-col bg-white"
      :class="hasSelection ? 'flex' : 'hidden md:flex'"
    >
      <!-- Empty / unselected state -->
      <div
        v-if="!inbox.selected"
        class="grid h-full place-items-center"
      >
        <UiEmptyState
          icon="inbox"
          title="Select a conversation"
          description="Choose a conversation from the list to start replying."
        />
      </div>

      <template v-else>
        <!-- Header -->
        <header class="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200/70 px-4">
          <div class="flex min-w-0 items-center gap-3">
            <UiButton
              variant="ghost"
              size="sm"
              icon-only
              label="Back to list"
              class="md:hidden"
              @click="router.push('/inbox')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </UiButton>
            <div class="min-w-0">
              <div class="truncate text-sm font-semibold text-slate-900">
                {{ inbox.selected.subject || 'Conversation' }}
              </div>
              <div class="flex items-center gap-1.5 text-[11px] text-slate-500">
                <UiBadge
                  :tone="inbox.selected.status === 'open' ? 'emerald' : inbox.selected.status === 'pending' ? 'amber' : inbox.selected.status === 'escalated' ? 'rose' : 'slate'"
                  variant="soft"
                  dot
                  :pulse="inbox.selected.status === 'open'"
                >
                  {{ inbox.selected.status }}
                </UiBadge>
                <span v-if="typingActive" class="inline-flex items-center gap-1 text-slate-400">
                  · customer is typing
                </span>
              </div>
            </div>
          </div>
        </header>

        <ConversationThread
          :conversation="inbox.selected"
          :messages="inbox.selectedMessages"
          :typing="typingActive"
        />

        <MessageComposer
          ref="composerRef"
          :disabled="inbox.selected.status === 'closed'"
          :ai-busy="aiBusy"
          :sending="sending"
          @send="send"
          @draft="draft"
          @typing="inbox.broadcastTyping"
        />
      </template>
    </div>

    <!-- Context rail -->
    <ConversationSidebar v-if="inbox.selected" :conversation="inbox.selected" />
  </div>
</template>
