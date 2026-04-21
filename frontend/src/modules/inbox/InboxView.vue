<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInboxStore } from '@/stores/inbox'
import ConversationList from './components/ConversationList.vue'
import ConversationThread from './components/ConversationThread.vue'
import ConversationSidebar from './components/ConversationSidebar.vue'

const inbox = useInboxStore()
const route = useRoute()
const router = useRouter()
const composer = ref('')
const aiBusy = ref(false)

onMounted(async () => {
  await inbox.fetchConversations()
  const id = route.params.id as string | undefined
  if (id) await inbox.select(id)
})

watch(
  () => route.params.id,
  async (id) => {
    if (id) await inbox.select(id as string)
  },
)

async function onSelect(id: string) {
  await router.push(`/inbox/${id}`)
}

async function send() {
  const text = composer.value.trim()
  if (!text) return
  composer.value = ''
  await inbox.send(text)
}

async function aiDraft() {
  aiBusy.value = true
  try {
    const reply = await inbox.aiReply()
    if (reply) composer.value = reply
  } finally {
    aiBusy.value = false
  }
}
</script>

<template>
  <div class="-m-6 flex h-[calc(100%+0px)] min-h-[calc(100vh-56px)] flex-1 overflow-hidden">
    <ConversationList :conversations="inbox.list" :selected-id="inbox.selectedId" @select="onSelect" />
    <div class="flex min-w-0 flex-1 flex-col border-x border-slate-200 bg-white">
      <div v-if="!inbox.selected" class="grid h-full place-items-center text-sm text-slate-400">
        Select a conversation
      </div>
      <template v-else>
        <ConversationThread
          :conversation="inbox.selected"
          :messages="inbox.selectedMessages"
        />
        <div class="border-t border-slate-200 p-3">
          <textarea
            v-model="composer"
            rows="3"
            class="input resize-none"
            placeholder="Write a reply…"
            @keydown.ctrl.enter.prevent="send"
            @keydown.meta.enter.prevent="send"
          />
          <div class="mt-2 flex items-center justify-between">
            <button class="btn-ghost" :disabled="aiBusy" @click="aiDraft">
              {{ aiBusy ? 'Drafting…' : 'AI Draft' }}
            </button>
            <button class="btn-primary" :disabled="!composer.trim()" @click="send">Send ⌘⏎</button>
          </div>
        </div>
      </template>
    </div>
    <ConversationSidebar v-if="inbox.selected" :conversation="inbox.selected" />
  </div>
</template>
