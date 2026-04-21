<script setup lang="ts">
import { RouterLink } from 'vue-router'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/inbox', label: 'Inbox', icon: '💬' },
  { to: '/contacts', label: 'Contacts', icon: '👥' },
  { to: '/leads', label: 'Leads', icon: '💼' },
  { to: '/ai-agents', label: 'AI Agents', icon: '🤖' },
  { to: '/knowledge-base', label: 'Knowledge', icon: '📚' },
  { to: '/workflows', label: 'Workflows', icon: '⚙️' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/users', label: 'Users', icon: '👤' },
  { to: '/settings', label: 'Settings', icon: '🛠️' },
  { to: '/billing', label: 'Billing', icon: '💳' },
]
</script>

<template>
  <aside class="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
    <div class="flex items-center gap-2 px-5 py-5">
      <div class="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white font-bold">O</div>
      <div>
        <div class="font-semibold leading-none">OmniDesk</div>
        <div class="text-xs text-slate-500">AI Conversations</div>
      </div>
    </div>
    <nav class="flex-1 space-y-1 px-3 pb-6">
      <RouterLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
        active-class="bg-brand-50 font-semibold text-brand-700"
      >
        <span>{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>
