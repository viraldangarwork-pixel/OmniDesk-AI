<script setup lang="ts">
import { useToastStore } from '@/stores/toast'
import type { ToastKind } from '@/types/ui'

const store = useToastStore()

const toneClasses: Record<ToastKind, string> = {
  success: 'text-emerald-800 ring-emerald-500/20 bg-emerald-50/95',
  error: 'text-rose-800 ring-rose-500/25 bg-rose-50/95',
  warning: 'text-amber-900 ring-amber-500/25 bg-amber-50/95',
  info: 'text-slate-800 ring-slate-500/20 bg-white/95',
}

const iconBg: Record<ToastKind, string> = {
  success: 'bg-emerald-500 text-white',
  error: 'bg-rose-500 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-slate-600 text-white',
}
</script>

<template>
  <!-- Live region for a11y.  Status = polite for success/info, assertive for error. -->
  <div
    class="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6"
    role="region"
    aria-label="Notifications"
  >
    <TransitionGroup name="toast" tag="div" class="flex w-full max-w-sm flex-col gap-2">
      <div
        v-for="t in store.items"
        :key="t.id"
        class="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-white/60 px-4 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_16px_40px_-16px_rgba(15,23,42,0.22)] ring-1 backdrop-blur-md"
        :class="toneClasses[t.kind]"
        :role="t.kind === 'error' ? 'alert' : 'status'"
      >
        <span
          class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full"
          :class="iconBg[t.kind]"
          aria-hidden="true"
        >
          <svg v-if="t.kind === 'success'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
            <path d="M4 12l5 5 11-11" />
          </svg>
          <svg v-else-if="t.kind === 'error'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
          <svg v-else-if="t.kind === 'warning'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
            <path d="M12 9v4M12 17h.01M4.5 19h15a1.5 1.5 0 0 0 1.3-2.25l-7.5-13a1.5 1.5 0 0 0-2.6 0l-7.5 13A1.5 1.5 0 0 0 4.5 19z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
            <path d="M12 8.5h.01M11 12h1v4h1" />
          </svg>
        </span>

        <div class="min-w-0 flex-1">
          <div class="text-sm font-semibold leading-5">{{ t.title }}</div>
          <div v-if="t.description" class="mt-0.5 text-xs leading-5 opacity-85">
            {{ t.description }}
          </div>
          <button
            v-if="t.action"
            type="button"
            class="mt-1.5 text-xs font-semibold underline-offset-2 hover:underline"
            @click="t.action.handler(); store.dismiss(t.id)"
          >
            {{ t.action.label }}
          </button>
        </div>

        <button
          type="button"
          class="grid h-6 w-6 shrink-0 place-items-center rounded-md text-current/70 transition hover:bg-black/5"
          aria-label="Dismiss notification"
          @click="store.dismiss(t.id)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
