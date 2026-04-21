<script setup lang="ts">
import type { Tone } from '@/types/ui'

interface Props {
  tone?: Tone
  /** Subtle (tinted bg) vs solid (filled) vs outline. */
  variant?: 'soft' | 'solid' | 'outline'
  /** Show a coloured dot before the label. */
  dot?: boolean
  /** Pulsing dot for "live" states. */
  pulse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tone: 'slate',
  variant: 'soft',
})

const softTone: Record<Tone, string> = {
  default: 'bg-slate-100 text-slate-700 ring-slate-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200/70',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200/70',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200/70',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200/70',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200/70',
}
const solidTone: Record<Tone, string> = {
  default: 'bg-slate-700 text-white ring-slate-700',
  brand: 'bg-brand-600 text-white ring-brand-600',
  emerald: 'bg-emerald-600 text-white ring-emerald-600',
  amber: 'bg-amber-500 text-white ring-amber-500',
  rose: 'bg-rose-600 text-white ring-rose-600',
  slate: 'bg-slate-700 text-white ring-slate-700',
  sky: 'bg-sky-600 text-white ring-sky-600',
  violet: 'bg-violet-600 text-white ring-violet-600',
}
const outlineTone: Record<Tone, string> = {
  default: 'bg-transparent text-slate-700 ring-slate-300',
  brand: 'bg-transparent text-brand-700 ring-brand-300',
  emerald: 'bg-transparent text-emerald-700 ring-emerald-300',
  amber: 'bg-transparent text-amber-700 ring-amber-300',
  rose: 'bg-transparent text-rose-700 ring-rose-300',
  slate: 'bg-transparent text-slate-700 ring-slate-300',
  sky: 'bg-transparent text-sky-700 ring-sky-300',
  violet: 'bg-transparent text-violet-700 ring-violet-300',
}
const dotTone: Record<Tone, string> = {
  default: 'bg-slate-500',
  brand: 'bg-brand-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
}

const toneMap: Record<'soft' | 'solid' | 'outline', Record<Tone, string>> = {
  soft: softTone,
  solid: solidTone,
  outline: outlineTone,
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
    :class="toneMap[props.variant][props.tone]"
  >
    <span
      v-if="dot"
      class="relative inline-flex h-1.5 w-1.5"
      aria-hidden="true"
    >
      <span
        v-if="pulse"
        class="absolute inset-0 rounded-full opacity-75 animate-pulse-ring"
        :class="dotTone[props.tone]"
      />
      <span class="relative inline-block h-1.5 w-1.5 rounded-full" :class="dotTone[props.tone]" />
    </span>
    <slot />
  </span>
</template>
