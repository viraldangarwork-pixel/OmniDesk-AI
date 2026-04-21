<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/services/api'

interface Agent {
  id: string
  name: string
  role: string
  model: string
  system_prompt: string
  temperature: number
  max_tokens: number
  active: boolean
}

const agents = ref<Agent[]>([])
const showForm = ref(false)
const form = ref({
  name: '',
  role: 'assistant',
  model: 'claude-opus-4-7',
  system_prompt: '',
  temperature: 70,
  max_tokens: 1024,
})
const saving = ref(false)

async function load() {
  const { data } = await api.get<Agent[]>('/ai/agents')
  agents.value = data
}

async function save() {
  saving.value = true
  try {
    await api.post('/ai/agents', form.value)
    showForm.value = false
    form.value = {
      name: '',
      role: 'assistant',
      model: 'claude-opus-4-7',
      system_prompt: '',
      temperature: 70,
      max_tokens: 1024,
    }
    await load()
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">AI Agents</h1>
      <button class="btn-primary" @click="showForm = !showForm">
        {{ showForm ? 'Cancel' : '+ New agent' }}
      </button>
    </div>

    <form v-if="showForm" class="card space-y-3 p-4" @submit.prevent="save">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label class="label">Name</label>
          <input v-model="form.name" class="input" required />
        </div>
        <div>
          <label class="label">Role</label>
          <input v-model="form.role" class="input" />
        </div>
        <div>
          <label class="label">Model</label>
          <input v-model="form.model" class="input" />
        </div>
        <div>
          <label class="label">Temperature (0-100)</label>
          <input v-model.number="form.temperature" type="number" min="0" max="100" class="input" />
        </div>
      </div>
      <div>
        <label class="label">System prompt</label>
        <textarea v-model="form.system_prompt" rows="5" class="input resize-y"></textarea>
      </div>
      <button class="btn-primary" :disabled="saving">{{ saving ? 'Saving…' : 'Save agent' }}</button>
    </form>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="a in agents" :key="a.id" class="card p-4">
        <div class="flex items-center justify-between">
          <div class="font-semibold">{{ a.name }}</div>
          <span class="badge" :class="a.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
            {{ a.active ? 'active' : 'disabled' }}
          </span>
        </div>
        <div class="mt-2 text-xs text-slate-500">{{ a.role }} · {{ a.model }}</div>
        <p class="mt-3 line-clamp-4 text-sm text-slate-600">{{ a.system_prompt || 'No prompt.' }}</p>
      </div>
      <div v-if="!agents.length" class="card p-8 text-center text-sm text-slate-400">
        No agents yet. Create your first assistant.
      </div>
    </div>
  </div>
</template>
