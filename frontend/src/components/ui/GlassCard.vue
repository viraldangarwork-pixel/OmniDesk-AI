<script setup lang="ts">
interface Props {
  hoverLift?: boolean
  tone?: 'default' | 'brand' | 'emerald' | 'amber'
}
withDefaults(defineProps<Props>(), {
  hoverLift: true,
  tone: 'default',
})

const toneGradient: Record<string, string> = {
  default: 'from-white/80 to-white/60',
  brand: 'from-brand-50/80 to-white/70',
  emerald: 'from-emerald-50/80 to-white/70',
  amber: 'from-amber-50/80 to-white/70',
}
</script>

<template>
  <div
    class="group relative rounded-2xl border border-white/60 bg-gradient-to-br shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-300 ease-out"
    :class="[
      toneGradient[tone],
      hoverLift && 'hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(15,23,42,0.04),0_20px_40px_-16px_rgba(15,23,42,0.18)]',
    ]"
  >
    <div
      class="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
    />
    <slot />
  </div>
</template>
