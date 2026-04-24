<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useCan } from '@/composables/useCan'
import { P } from '@/auth/permissions'

interface Props {
  mobile?: boolean
}
const props = defineProps<Props>()

const ui = useUiStore()
const route = useRoute()
const can = useCan()

// On desktop we honor the persisted collapse state.  In the mobile drawer
// variant the sidebar is always shown expanded.
const collapsed = computed(() => !props.mobile && ui.sidebarCollapsed)

interface NavItem {
  to: string
  label: string
  icon: string
  /** When any of the listed permissions is held (super-user always passes). */
  permission: string
}

const navAll: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'grid', permission: P.analytics.read },
  { to: '/inbox', label: 'Inbox', icon: 'chat', permission: P.inbox.read },
  { to: '/contacts', label: 'Contacts', icon: 'users', permission: P.contacts.manage },
  { to: '/leads', label: 'Leads', icon: 'briefcase', permission: P.leads.manage },
  { to: '/ai-agents', label: 'AI Agents', icon: 'sparkle', permission: P.ai.manage },
  { to: '/knowledge-base', label: 'Knowledge', icon: 'book', permission: P.kb.manage },
  { to: '/workflows', label: 'Workflows', icon: 'workflow', permission: P.workflows.manage },
  { to: '/reports', label: 'Reports', icon: 'chart', permission: P.analytics.read },
  { to: '/users', label: 'Users', icon: 'user', permission: P.users.read },
  { to: '/settings', label: 'Settings', icon: 'gear', permission: P.tenants.manage },
  { to: '/billing', label: 'Billing', icon: 'card', permission: P.billing.manage },
]

// Hide nav items the user can't visit — cleaner than rendering then
// 403-ing on click, and keeps the sidebar tight for restricted roles.
const nav = computed(() => navAll.filter((item) => can.permission(item.permission)))

function isActive(item: NavItem) {
  const top = '/' + (route.path.split('/')[1] || '')
  return top === item.to
}
</script>

<template>
  <aside
    :class="[
      'flex flex-col border-r border-slate-200/70 bg-white/95 backdrop-blur-xl',
      'transition-[width] duration-300 ease-out',
      collapsed ? 'w-[76px]' : 'w-64',
      props.mobile ? 'w-64 shadow-xl' : '',
    ]"
  >
    <!-- Brand -->
    <div class="flex items-center gap-3 px-4 py-5">
      <div
        class="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl
               bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white
               shadow-[0_6px_16px_-6px_rgba(36,74,237,0.65)]"
      >
        <span class="text-lg">O</span>
        <span class="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 hover:opacity-100" />
      </div>
      <Transition name="fade">
        <div v-if="!collapsed" class="min-w-0">
          <div class="truncate font-semibold leading-none">OmniDesk</div>
          <div class="truncate text-xs text-slate-500">AI Conversations</div>
        </div>
      </Transition>
    </div>

    <!-- Nav -->
    <nav class="flex-1 space-y-1 px-3 pb-6">
      <RouterLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        custom
        v-slot="{ navigate, href }"
      >
        <a
          :href="href"
          :aria-current="isActive(item) ? 'page' : undefined"
          :title="collapsed ? item.label : undefined"
          class="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                 text-slate-600 transition-colors duration-200
                 hover:text-brand-700"
          :class="isActive(item) ? 'text-brand-700' : ''"
          @click="navigate"
        >
          <!-- Animated active pill background -->
          <Transition name="fade">
            <span
              v-if="isActive(item)"
              class="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-brand-50 via-brand-50 to-white
                     shadow-[inset_0_0_0_1px_rgba(36,74,237,0.12)]"
              aria-hidden="true"
            />
          </Transition>
          <!-- Sliding left indicator bar -->
          <span
            class="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full
                   bg-gradient-to-b from-brand-500 to-brand-700
                   transition-all duration-300 ease-out"
            :class="isActive(item) ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'"
            aria-hidden="true"
          />

          <!-- Icon -->
          <span
            class="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all duration-200 ease-out
                   group-hover:-translate-y-0.5 group-hover:scale-110"
            :class="isActive(item) ? 'bg-brand-100 text-brand-700' : 'text-slate-500 group-hover:text-brand-600'"
          >
            <!-- Icons -->
            <svg
              v-if="item.icon === 'grid'"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <svg v-else-if="item.icon === 'chat'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <path d="M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 0 1-3.43-.61L3 21l1.7-4.2A7.46 7.46 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
            </svg>
            <svg v-else-if="item.icon === 'users'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" /><circle cx="17" cy="8.5" r="2.6" /><path d="M21.5 18.5c-.4-2-1.8-3.4-4-3.9" />
            </svg>
            <svg v-else-if="item.icon === 'briefcase'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" /><path d="M3 12h18" />
            </svg>
            <svg v-else-if="item.icon === 'sparkle'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
            </svg>
            <svg v-else-if="item.icon === 'book'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V4.5Z" /><path d="M4 17.5A1.5 1.5 0 0 1 5.5 16H20" />
            </svg>
            <svg v-else-if="item.icon === 'workflow'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <rect x="3" y="3" width="6" height="6" rx="1.5" /><rect x="15" y="3" width="6" height="6" rx="1.5" />
              <rect x="9" y="15" width="6" height="6" rx="1.5" /><path d="M6 9v3a2 2 0 0 0 2 2h4M18 9v3a2 2 0 0 1-2 2h-4" />
            </svg>
            <svg v-else-if="item.icon === 'chart'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
            </svg>
            <svg v-else-if="item.icon === 'user'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <circle cx="12" cy="8" r="3.5" /><path d="M4 20c1-4 4.5-6 8-6s7 2 8 6" />
            </svg>
            <svg v-else-if="item.icon === 'gear'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
            </svg>
            <svg v-else-if="item.icon === 'card'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" />
            </svg>
          </span>

          <Transition name="fade">
            <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
          </Transition>
        </a>
      </RouterLink>
    </nav>

    <!-- Collapse toggle (desktop only) -->
    <div v-if="!props.mobile" class="border-t border-slate-200/70 p-3">
      <button
        type="button"
        class="group flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-medium
               text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="ui.toggleSidebar()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="h-4 w-4 transition-transform duration-300"
          :class="collapsed ? 'rotate-180' : ''"
        >
          <path d="M15 6l-6 6 6 6" />
        </svg>
        <Transition name="fade">
          <span v-if="!collapsed">Collapse</span>
        </Transition>
      </button>
    </div>
  </aside>
</template>
