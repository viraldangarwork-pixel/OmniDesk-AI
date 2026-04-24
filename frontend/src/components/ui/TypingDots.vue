<script setup lang="ts">
/**
 * Three-dot typing indicator.  Respects prefers-reduced-motion via the
 * global override in main.css — no component-level branch needed.
 */
interface Props {
  /** Accessible label read by screen readers. */
  label?: string
  tone?: 'slate' | 'brand' | 'white'
}
withDefaults(defineProps<Props>(), {
  label: 'Typing',
  tone: 'slate',
})

const dotColor: Record<'slate' | 'brand' | 'white', string> = {
  slate: 'bg-slate-400',
  brand: 'bg-brand-500',
  white: 'bg-white/80',
}
</script>

<template>
  <span
    class="inline-flex items-end gap-[3px] align-middle"
    role="status"
    :aria-label="label"
  >
    <span
      v-for="i in 3"
      :key="i"
      class="block h-1.5 w-1.5 rounded-full will-change-transform"
      :class="dotColor[tone]"
      :style="{
        animation: `typing-dot 1.3s ${(i - 1) * 0.18}s ease-in-out infinite`,
      }"
    />
  </span>
</template>
