<script setup lang="ts">
/**
 * Cycles through Light → Dark → System.  System mode follows the OS
 * setting live (see useTheme).  Icon shows the *current* state, not
 * the next click target — matches Linear / Vercel convention.
 */
import { computed } from 'vue'
import { useTheme, type ThemeMode } from '@/composables/useTheme'

const theme = useTheme()

const order: ThemeMode[] = ['light', 'dark', 'system']

function cycle() {
  const idx = order.indexOf(theme.mode.value)
  theme.setMode(order[(idx + 1) % order.length])
}

const label = computed(() => {
  if (theme.mode.value === 'system') return `Theme: System (${theme.resolved.value})`
  return theme.mode.value === 'dark' ? 'Theme: Dark' : 'Theme: Light'
})
</script>

<template>
  <button
    type="button"
    class="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
    :aria-label="label"
    :title="label"
    @click="cycle"
  >
    <!-- Sun -->
    <svg
      v-if="theme.mode.value === 'light'"
      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
      class="h-4 w-4"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
    <!-- Moon -->
    <svg
      v-else-if="theme.mode.value === 'dark'"
      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
      class="h-4 w-4"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
    </svg>
    <!-- Monitor (system) -->
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
      class="h-4 w-4"
    >
      <rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" />
    </svg>
  </button>
</template>
