<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { wsStatus } from '@/services/ws'

const auth = useAuthStore()
const router = useRouter()
const initials = computed(() => {
  const name = auth.user?.full_name || auth.user?.email || ''
  return name
    .split(/\s|@/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
    <div class="text-sm text-slate-500">
      <span class="inline-flex items-center gap-2">
        <span
          class="h-2 w-2 rounded-full"
          :class="wsStatus === 'open' ? 'bg-emerald-500' : 'bg-slate-300'"
        />
        Realtime {{ wsStatus === 'open' ? 'online' : 'offline' }}
      </span>
    </div>
    <div class="flex items-center gap-3">
      <div class="text-right text-sm">
        <div class="font-medium text-slate-800">{{ auth.user?.full_name || auth.user?.email }}</div>
        <div class="text-xs text-slate-500">{{ (auth.user?.roles ?? []).join(', ') || 'Member' }}</div>
      </div>
      <div class="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
        {{ initials }}
      </div>
      <button class="btn-ghost" @click="logout">Logout</button>
    </div>
  </header>
</template>
