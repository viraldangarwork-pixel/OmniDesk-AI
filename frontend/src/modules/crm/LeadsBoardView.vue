<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { api } from '@/services/api'

interface Stage { id: string; code: string; name: string; position: number; color: string | null }
interface Lead {
  id: string
  title: string
  value: string | number | null
  currency: string
  probability: number
  stage_id: string | null
  owner_id: string | null
  contact_id: string
}

const stages = ref<Stage[]>([])
const leads = ref<Lead[]>([])
const loading = ref(true)
const draggingId = ref<string | null>(null)

async function loadAll() {
  loading.value = true
  try {
    const [s, l] = await Promise.all([
      api.get<Stage[]>('/leads/stages'),
      api.get('/leads', { params: { size: 200 } }),
    ])
    stages.value = s.data.sort((a, b) => a.position - b.position)
    leads.value = l.data.items
    if (!stages.value.length) await seedDefaultStages()
  } finally {
    loading.value = false
  }
}

async function seedDefaultStages() {
  const defaults = ['New', 'Qualified', 'Demo', 'Proposal', 'Won', 'Lost']
  for (let i = 0; i < defaults.length; i++) {
    await api.post('/leads/stages', {
      name: defaults[i],
      code: defaults[i].toLowerCase(),
      position: i,
    })
  }
  const s = await api.get<Stage[]>('/leads/stages')
  stages.value = s.data.sort((a, b) => a.position - b.position)
}

const grouped = computed(() => {
  const map: Record<string, Lead[]> = {}
  for (const s of stages.value) map[s.id] = []
  map['_none'] = []
  for (const l of leads.value) {
    const key = l.stage_id ?? '_none'
    if (!map[key]) map[key] = []
    map[key].push(l)
  }
  return map
})

function onDragStart(leadId: string) {
  draggingId.value = leadId
}

async function onDrop(stage: Stage) {
  if (!draggingId.value) return
  const lead = leads.value.find((l) => l.id === draggingId.value)
  if (!lead) return
  lead.stage_id = stage.id
  await api.put(`/leads/${lead.id}`, { stage_code: stage.code })
  draggingId.value = null
}

onMounted(loadAll)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Leads</h1>
      <span class="text-sm text-slate-500">{{ leads.length }} total</span>
    </div>

    <div v-if="loading" class="card p-8 text-center text-slate-400">Loading board…</div>
    <div v-else class="grid auto-cols-[minmax(260px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
      <div
        v-for="stage in stages"
        :key="stage.id"
        class="card flex h-[70vh] flex-col p-3"
        @dragover.prevent
        @drop="onDrop(stage)"
      >
        <div class="mb-2 flex items-center justify-between">
          <h2 class="text-sm font-semibold">{{ stage.name }}</h2>
          <span class="badge bg-slate-100 text-slate-600">{{ (grouped[stage.id] || []).length }}</span>
        </div>
        <div class="flex-1 space-y-2 overflow-auto">
          <div
            v-for="lead in grouped[stage.id]"
            :key="lead.id"
            class="cursor-grab rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm hover:border-brand-400"
            draggable="true"
            @dragstart="onDragStart(lead.id)"
          >
            <div class="font-medium">{{ lead.title }}</div>
            <div class="mt-1 text-xs text-slate-500">
              {{ lead.value ? `${lead.currency} ${lead.value}` : 'No value' }} · {{ lead.probability }}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
