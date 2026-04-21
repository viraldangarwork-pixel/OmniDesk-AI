<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/services/api'

interface User {
  id: string
  email: string
  full_name: string | null
  status: string
  roles: string[]
  created_at: string
}

const users = ref<User[]>([])
const showForm = ref(false)
const form = ref({ email: '', password: '', full_name: '', role_codes: ['owner'] })

async function load() {
  const { data } = await api.get('/users', { params: { size: 100 } })
  users.value = data.items
}

async function create() {
  await api.post('/users', form.value)
  showForm.value = false
  form.value = { email: '', password: '', full_name: '', role_codes: ['owner'] }
  await load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Users</h1>
      <button class="btn-primary" @click="showForm = !showForm">
        {{ showForm ? 'Cancel' : '+ Invite user' }}
      </button>
    </div>

    <form v-if="showForm" class="card grid grid-cols-1 gap-3 p-4 md:grid-cols-4" @submit.prevent="create">
      <input v-model="form.full_name" class="input" placeholder="Full name" />
      <input v-model="form.email" type="email" class="input" placeholder="Email" required />
      <input v-model="form.password" type="password" class="input" placeholder="Temp password" minlength="8" required />
      <button class="btn-primary">Create</button>
    </form>

    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Name</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Status</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!users.length"><td colspan="5" class="p-6 text-center text-slate-400">No users yet.</td></tr>
          <tr v-for="u in users" :key="u.id" class="border-t border-slate-100">
            <td class="px-4 py-3 font-medium">{{ u.full_name || '—' }}</td>
            <td>{{ u.email }}</td>
            <td><span class="badge bg-brand-50 text-brand-700">{{ u.roles.join(', ') || 'member' }}</span></td>
            <td>{{ u.status }}</td>
            <td>{{ new Date(u.created_at).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
