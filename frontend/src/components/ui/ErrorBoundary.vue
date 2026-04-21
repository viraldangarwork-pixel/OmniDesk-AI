<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

interface Props {
  /** Optional label shown in dev mode only. */
  scope?: string
  /** Reset the boundary automatically when route changes (consumer passes a key). */
}

defineProps<Props>()
const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err as Error
  // Surface in dev; in prod this hook is where Sentry.captureException would live.
  if (import.meta.env.DEV) console.error('[ErrorBoundary]', err)
  return false // stop propagation
})

function retry() {
  error.value = null
}
</script>

<template>
  <template v-if="!error">
    <slot />
  </template>
  <div
    v-else
    class="card mx-auto my-8 max-w-lg p-8 text-center"
    role="alert"
    aria-live="assertive"
  >
    <div class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
        <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
      </svg>
    </div>
    <h2 class="mt-4 text-lg font-semibold text-slate-900">Something went wrong</h2>
    <p class="mt-1 text-sm text-slate-600">
      An unexpected error occurred while rendering this section.
    </p>
    <p
      v-if="error?.message"
      class="mt-3 truncate rounded-lg bg-slate-100 px-3 py-2 text-left font-mono text-xs text-slate-600"
      :title="error.message"
    >
      {{ error.message }}
    </p>
    <div class="mt-5 flex items-center justify-center gap-2">
      <button class="btn-ghost" type="button" @click="retry">Retry</button>
      <button class="btn-primary" type="button" @click="$router.push('/')">Go home</button>
    </div>
  </div>
</template>
