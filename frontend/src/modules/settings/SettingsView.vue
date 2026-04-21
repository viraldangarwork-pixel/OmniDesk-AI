<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/services/api'

interface Tenant {
  id: string
  name: string
  slug: string
  domain: string | null
  status: string
  settings: Record<string, any>
}

interface Channel {
  id: string
  type: string
  name: string
  active: boolean
}

const tenant = ref<Tenant | null>(null)
const channels = ref<Channel[]>([])
const channelForm = ref({ type: 'webchat', name: '', config: {}, credentials: {} })
const saving = ref(false)

async function load() {
  const [t, c] = await Promise.all([
    api.get<Tenant>('/tenants/me'),
    api.get<Channel[]>('/channels'),
  ])
  tenant.value = t.data
  channels.value = c.data
}

async function saveTenant() {
  if (!tenant.value) return
  saving.value = true
  try {
    const { data } = await api.put('/tenants/me', {
      name: tenant.value.name,
      domain: tenant.value.domain,
    })
    tenant.value = data
  } finally {
    saving.value = false
  }
}

async function addChannel() {
  if (!channelForm.value.name) return
  await api.post('/channels', channelForm.value)
  channelForm.value = { type: 'webchat', name: '', config: {}, credentials: {} }
  await load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold">Settings</h1>

    <div class="card p-4">
      <h2 class="font-semibold">Workspace</h2>
      <div v-if="tenant" class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label class="label">Name</label>
          <input v-model="tenant.name" class="input" />
        </div>
        <div>
          <label class="label">Slug</label>
          <input v-model="tenant.slug" class="input" disabled />
        </div>
        <div>
          <label class="label">Custom domain</label>
          <input v-model="tenant.domain" class="input" placeholder="support.acme.com" />
        </div>
      </div>
      <button class="btn-primary mt-3" :disabled="saving" @click="saveTenant">
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </div>

    <div class="card p-4">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">Channels</h2>
        <span class="text-xs text-slate-500">{{ channels.length }} connected</span>
      </div>
      <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
        <select v-model="channelForm.type" class="input">
          <option value="webchat">Web chat</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="messenger">Messenger</option>
          <option value="instagram">Instagram</option>
          <option value="telegram">Telegram</option>
          <option value="email">Email</option>
        </select>
        <input v-model="channelForm.name" class="input md:col-span-2" placeholder="Display name" />
        <button class="btn-primary" @click="addChannel">+ Connect</button>
      </div>

      <ul class="mt-4 divide-y divide-slate-100 text-sm">
        <li v-for="ch in channels" :key="ch.id" class="flex items-center justify-between py-2">
          <div>
            <span class="font-medium">{{ ch.name }}</span>
            <span class="ml-2 badge bg-slate-100 text-slate-600">{{ ch.type }}</span>
          </div>
          <span class="badge" :class="ch.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
            {{ ch.active ? 'active' : 'disabled' }}
          </span>
        </li>
        <li v-if="!channels.length" class="py-4 text-center text-slate-400">No channels yet.</li>
      </ul>
    </div>
  </div>
</template>
