<script setup lang="ts">
interface Props {
  title: string
  description?: string
  /** Built-in icon shorthand; for custom art use the `icon` slot. */
  icon?: 'search' | 'inbox' | 'sparkle' | 'error' | 'folder' | 'users'
  compact?: boolean
}

withDefaults(defineProps<Props>(), { icon: 'inbox' })
</script>

<template>
  <div
    class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 text-center"
    :class="compact ? 'py-8' : 'py-14'"
  >
    <div
      class="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-400 shadow-inner"
    >
      <slot name="icon">
        <svg v-if="icon === 'search'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <svg v-else-if="icon === 'inbox'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
          <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5h13a2 2 0 0 1 1.8 1.1L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6l1.7-5.9A2 2 0 0 1 5.5 5z" />
        </svg>
        <svg v-else-if="icon === 'sparkle'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
        </svg>
        <svg v-else-if="icon === 'error'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
          <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
        </svg>
        <svg v-else-if="icon === 'folder'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
          <circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" /><circle cx="17" cy="8.5" r="2.6" /><path d="M21.5 18.5c-.4-2-1.8-3.4-4-3.9" />
        </svg>
      </slot>
    </div>

    <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ title }}</h3>
    <p v-if="description" class="mt-1 max-w-sm text-xs leading-5 text-slate-500">
      {{ description }}
    </p>

    <div v-if="$slots.actions" class="mt-5 flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
