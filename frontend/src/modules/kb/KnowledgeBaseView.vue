<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/services/api'

interface Doc {
  id: string
  title: string
  source_type: string
  source_url: string | null
  status: string
  created_at: string
}

const docs = ref<Doc[]>([])
const urlForm = ref({ url: '', title: '' })
const file = ref<File | null>(null)
const uploading = ref(false)
const query = ref('')
const results = ref<{ id: string; content: string; score: number }[]>([])

async function load() {
  const { data } = await api.get<Doc[]>('/kb')
  docs.value = data
}

async function ingestUrl() {
  if (!urlForm.value.url) return
  await api.post('/kb/url', urlForm.value)
  urlForm.value = { url: '', title: '' }
  await load()
}

async function uploadFile() {
  if (!file.value) return
  uploading.value = true
  try {
    const body = new FormData()
    body.append('file', file.value)
    await api.post('/kb/upload', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    file.value = null
    await load()
  } finally {
    uploading.value = false
  }
}

async function search() {
  if (!query.value) return
  const { data } = await api.get('/kb/search', { params: { q: query.value } })
  results.value = data.results
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-semibold">Knowledge Base</h1>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div class="card p-4">
        <h2 class="font-semibold">Upload document</h2>
        <input type="file" class="mt-2" @change="file = ($event.target as HTMLInputElement).files?.[0] ?? null" />
        <button class="btn-primary mt-3" :disabled="!file || uploading" @click="uploadFile">
          {{ uploading ? 'Uploading…' : 'Upload' }}
        </button>
      </div>
      <div class="card p-4">
        <h2 class="font-semibold">Ingest URL</h2>
        <input v-model="urlForm.url" class="input mt-2" placeholder="https://…" />
        <input v-model="urlForm.title" class="input mt-2" placeholder="Optional title" />
        <button class="btn-primary mt-3" @click="ingestUrl">Ingest</button>
      </div>
    </div>

    <div class="card p-4">
      <h2 class="font-semibold">Search</h2>
      <div class="mt-2 flex gap-2">
        <input v-model="query" class="input" placeholder="Ask a question…" @keydown.enter="search" />
        <button class="btn-primary" @click="search">Search</button>
      </div>
      <div class="mt-3 space-y-2 text-sm">
        <div v-for="r in results" :key="r.id" class="rounded-lg bg-slate-50 p-3">
          <div class="text-xs text-slate-500">score {{ r.score.toFixed(2) }}</div>
          <div>{{ r.content }}</div>
        </div>
        <div v-if="!results.length" class="text-xs text-slate-400">No results yet.</div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Added</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!docs.length"><td colspan="4" class="p-6 text-center text-slate-400">No documents yet.</td></tr>
          <tr v-for="d in docs" :key="d.id" class="border-t border-slate-100">
            <td class="px-4 py-3 font-medium">{{ d.title }}</td>
            <td>{{ d.source_type }}</td>
            <td>
              <span class="badge" :class="{
                'bg-amber-100 text-amber-700': d.status === 'pending',
                'bg-emerald-100 text-emerald-700': d.status === 'ready',
                'bg-red-100 text-red-700': d.status === 'failed',
              }">{{ d.status }}</span>
            </td>
            <td>{{ new Date(d.created_at).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
