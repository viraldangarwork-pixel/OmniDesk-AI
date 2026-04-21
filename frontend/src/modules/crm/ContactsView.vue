<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/services/api'

interface Contact {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  tags: string[]
  created_at: string
}

const contacts = ref<Contact[]>([])
const loading = ref(true)
const showForm = ref(false)
const form = ref({ full_name: '', email: '', phone: '' })

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/contacts', { params: { size: 100 } })
    contacts.value = data.items
  } finally {
    loading.value = false
  }
}

async function create() {
  await api.post('/contacts', form.value)
  form.value = { full_name: '', email: '', phone: '' }
  showForm.value = false
  await load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Contacts</h1>
      <button class="btn-primary" @click="showForm = !showForm">
        {{ showForm ? 'Cancel' : '+ New contact' }}
      </button>
    </div>

    <div v-if="showForm" class="card p-4">
      <form class="grid grid-cols-1 gap-3 md:grid-cols-3" @submit.prevent="create">
        <input v-model="form.full_name" class="input" placeholder="Full name" />
        <input v-model="form.email" type="email" class="input" placeholder="Email" />
        <input v-model="form.phone" class="input" placeholder="Phone" />
        <button class="btn-primary md:col-span-3">Create</button>
      </form>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="4" class="p-6 text-center text-slate-400">Loading…</td></tr>
          <tr v-else-if="!contacts.length"><td colspan="4" class="p-6 text-center text-slate-400">No contacts yet.</td></tr>
          <tr v-for="c in contacts" :key="c.id" class="border-t border-slate-100">
            <td class="px-4 py-3 font-medium">{{ c.full_name || '—' }}</td>
            <td>{{ c.email || '—' }}</td>
            <td>{{ c.phone || '—' }}</td>
            <td>{{ new Date(c.created_at).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
