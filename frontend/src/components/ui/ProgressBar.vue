<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useInView } from '@/composables/useInView'
import { useReducedMotion } from '@/composables/useReducedMotion'

interface Props {
  value: number           // 0..100
  label?: string
  showValue?: boolean
  color?: 'brand' | 'emerald' | 'amber' | 'rose' | 'slate'
  delay?: number
}
const props = withDefaults(defineProps<Props>(), {
  showValue: true,
  color: 'brand',
  delay: 0,
})

const track = ref<HTMLElement | null>(null)
const inView = useInView(track)
const reduced = useReducedMotion()

const displayed = ref(0)
watch(
  [inView, () => props.value],
  ([visible]) => {
    if (visible) displayed.value = Math.max(0, Math.min(100, props.value))
  },
  { immediate: true },
)

const barStyle = computed(() => ({
  width: `${displayed.value}%`,
  transitionDelay: reduced.value ? '0ms' : `${props.delay}ms`,
}))

const colorClass = computed(() => ({
  brand: 'from-brand-500 to-brand-600',
  emerald: 'from-emerald-500 to-emerald-600',
  amber: 'from-amber-500 to-amber-600',
  rose: 'from-rose-500 to-rose-600',
  slate: 'from-slate-500 to-slate-600',
}[props.color]))
</script>

<template>
  <div class="space-y-1.5">
    <div v-if="label || showValue" class="flex items-center justify-between text-xs">
      <span class="font-medium text-slate-600">{{ label }}</span>
      <span v-if="showValue" class="tabular-nums text-slate-500">{{ Math.round(displayed) }}%</span>
    </div>
    <div
      ref="track"
      class="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70"
    >
      <div
        class="h-full rounded-full bg-gradient-to-r transition-[width] duration-1000 ease-[cubic-bezier(.22,1,.36,1)]"
        :class="colorClass"
        :style="barStyle"
      />
    </div>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .transition-\[width\] {
    transition-duration: 0ms;
  }
}
</style>
