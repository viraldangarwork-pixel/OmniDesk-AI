<script setup lang="ts">
import type { Size } from '@/types/ui'

interface Props {
  size?: Size
  /** Optional visually-hidden label for screen readers. */
  label?: string
}
withDefaults(defineProps<Props>(), { size: 'md' })

const sizeClass: Record<Size, string> = {
  xs: 'h-3 w-3 border',
  sm: 'h-3.5 w-3.5 border',
  md: 'h-4 w-4 border-2',
  lg: 'h-5 w-5 border-2',
  xl: 'h-7 w-7 border-[3px]',
}
</script>

<template>
  <span
    class="inline-block animate-[spin-slow_0.8s_linear_infinite] rounded-full border-current border-r-transparent align-[-2px]"
    :class="sizeClass[size]"
    role="status"
    aria-live="polite"
  >
    <span class="sr-only">{{ label ?? 'Loading' }}</span>
  </span>
</template>
