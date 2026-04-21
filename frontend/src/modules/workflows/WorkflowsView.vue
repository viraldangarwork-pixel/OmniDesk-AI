<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/services/api'

interface Workflow {
  id: string
  name: string
  description: string | null
  trigger: Record<string, any>
  steps: any[]
  active: boolean
}

const list = ref<Workflow[]>([])
const showForm = ref(false)
const form = ref({
  name: '',
  description: '',
  trigger: { type: 'new_message' },
  steps: [{ type: 'assign_agent', params: {} }],
})

async function load() {
  const { data } = await api.get<Workflow[]>('/workflows')
  list.value = data
}

async function create() {
  await api.post('/workflows', form.value)
  showForm.value = false
  form.value = {
    name: '',
    description: '',
    trigger: { type: 'new_message' },
    steps: [{ type: 'assign_agent', params: {} }],
  }
  await load()
}

async function run(id: string) {
  await api.post('/workflows/run', { workflow_id: id, context: {} })
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Workflows</h1>
      <button class="btn-primary" @click="showForm = !showForm">
        {{ showForm ? 'Cancel' : '+ New workflow' }}
      </button>
    </div>

    <form v-if="showForm" class="card space-y-3 p-4" @submit.prevent="create">
      <div>
        <label class="label">Name</label>
        <input v-model="form.name" class="input" required />
      </div>
      <div>
        <label class="label">Description</label>
        <input v-model="form.description" class="input" />
      </div>
      <div>
        <label class="label">Trigger (JSON)</label>
        <textarea v-model="form.trigger" rows="3" class="input font-mono text-xs"></textarea>
      </div>
      <div>
        <label class="label">Steps (JSON)</label>
        <textarea v-model="form.steps" rows="4" class="input font-mono text-xs"></textarea>
      </div>
      <button class="btn-primary">Save workflow</button>
    </form>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div v-for="w in list" :key="w.id" class="card p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold">{{ w.name }}</div>
            <div class="text-xs text-slate-500">{{ w.description || 'No description' }}</div>
          </div>
          <span class="badge" :class="w.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
            {{ w.active ? 'active' : 'off' }}
          </span>
        </div>
        <div class="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <div>Trigger: {{ JSON.stringify(w.trigger) }}</div>
          <div class="mt-1">Steps: {{ (w.steps || []).length }}</div>
        </div>
        <div class="mt-3 flex justify-end">
          <button class="btn-ghost" @click="run(w.id)">Run</button>
        </div>
      </div>
      <div v-if="!list.length" class="card p-8 text-center text-sm text-slate-400 md:col-span-2">
        No workflows yet.
      </div>
    </div>
  </div>
</template>
