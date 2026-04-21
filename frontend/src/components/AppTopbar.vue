<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { wsStatus } from '@/services/ws'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const ui = useUiStore()

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

const TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  inbox: 'Inbox',
  contacts: 'Contacts',
  leads: 'Leads',
  'ai-agents': 'AI Agents',
  'knowledge-base': 'Knowledge',
  workflows: 'Workflows',
  reports: 'Reports',
  users: 'Users',
  settings: 'Settings',
  billing: 'Billing',
}

function humanize(seg: string) {
  return TITLES[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1)
}

const crumbs = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  let acc = ''
  return parts.map((p) => {
    acc += '/' + p
    return { label: humanize(p), to: acc }
  })
})

const crumbKey = computed(() => route.path)

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-14 items-center justify-between
           border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-xl md:px-6"
  >
    <div class="flex min-w-0 items-center gap-3">
      <!-- Mobile hamburger -->
      <button
        type="button"
        class="grid h-9 w-9 place-items-center rounded-lg text-slate-600
               transition hover:bg-slate-100 hover:text-slate-900 md:hidden"
        aria-label="Open navigation"
        @click="ui.toggleMobileNav()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Breadcrumbs -->
      <nav aria-label="Breadcrumb" class="min-w-0">
        <Transition name="fade-up" mode="out-in">
          <ol :key="crumbKey" class="flex min-w-0 items-center gap-1.5 text-sm">
            <li
              v-for="(c, i) in crumbs"
              :key="c.to"
              class="flex min-w-0 items-center gap-1.5"
            >
              <span
                v-if="i > 0"
                class="text-slate-300"
                aria-hidden="true"
              >/</span>
              <RouterLink
                :to="c.to"
                class="truncate rounded px-1 transition-colors"
                :class="i === crumbs.length - 1
                  ? 'font-medium text-slate-800'
                  : 'text-slate-500 hover:text-slate-800'"
              >
                {{ c.label }}
              </RouterLink>
            </li>
          </ol>
        </Transition>
      </nav>
    </div>

    <div class="flex items-center gap-3 md:gap-4">
      <!-- Realtime status with pulse-ring when online -->
      <div class="hidden items-center gap-2 text-xs text-slate-500 sm:inline-flex">
        <span class="relative inline-flex h-2.5 w-2.5">
          <span
            v-if="wsStatus === 'open'"
            class="absolute inset-0 rounded-full bg-emerald-400 animate-pulse-ring"
            aria-hidden="true"
          />
          <span
            class="relative inline-block h-2.5 w-2.5 rounded-full transition-colors"
            :class="wsStatus === 'open' ? 'bg-emerald-500' : 'bg-slate-300'"
          />
        </span>
        <span class="font-medium text-slate-600">
          {{ wsStatus === 'open' ? 'Online' : 'Offline' }}
        </span>
      </div>

      <!-- User -->
      <div class="hidden text-right text-sm md:block">
        <div class="truncate font-medium text-slate-800">
          {{ auth.user?.full_name || auth.user?.email }}
        </div>
        <div class="truncate text-xs text-slate-500">
          {{ (auth.user?.roles ?? []).join(', ') || 'Member' }}
        </div>
      </div>
      <div
        class="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200
               text-sm font-semibold text-brand-700 ring-1 ring-brand-500/15
               transition-transform duration-200 hover:scale-105"
      >
        {{ initials || '·' }}
      </div>
      <button class="btn-ghost" @click="logout">Logout</button>
    </div>
  </header>
</template>
