<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import UiSpinner from './UiSpinner.vue'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass' | 'link'
type Size = 'xs' | 'sm' | 'md' | 'lg'

interface Props {
  variant?: Variant
  size?: Size
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  block?: boolean
  /** Renders an <a> when provided. */
  href?: string
  /** Renders a <RouterLink> when provided. */
  to?: RouteLocationRaw
  /** Tooltip / aria-label for icon-only buttons. */
  label?: string
  /** Icon-only (uses square padding + aria-label). */
  iconOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
})

defineEmits<{ (e: 'click', ev: MouseEvent): void }>()

const tag = computed(() => (props.to ? 'router-link' : props.href ? 'a' : 'button'))

const base =
  'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg font-medium ' +
  'transition-[transform,box-shadow,background-color,color] duration-200 ease-out ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] select-none'

const sizeClass: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs',
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
}
const iconOnlySize: Record<Size, string> = {
  xs: 'h-7 w-7 p-0',
  sm: 'h-8 w-8 p-0',
  md: 'h-9 w-9 p-0',
  lg: 'h-11 w-11 p-0',
}

const variantClass: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-brand-500 to-brand-600 text-white ' +
    'shadow-[0_1px_2px_rgba(36,74,237,0.25),0_8px_20px_-8px_rgba(36,74,237,0.45)] ' +
    'hover:from-brand-500 hover:to-brand-700 hover:-translate-y-px ' +
    'hover:shadow-[0_2px_4px_rgba(36,74,237,0.3),0_14px_28px_-10px_rgba(36,74,237,0.55)]',
  secondary:
    'bg-white text-slate-800 border border-slate-200 shadow-sm ' +
    'hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-px hover:shadow',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100/80 hover:text-slate-900',
  danger:
    'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-sm ' +
    'hover:from-rose-500 hover:to-rose-700 hover:-translate-y-px',
  glass:
    'border border-white/60 bg-white/70 text-slate-700 backdrop-blur-md shadow-sm ' +
    'hover:bg-white/90 hover:shadow-md',
  link: 'bg-transparent text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline px-0 h-auto',
}

const classes = computed(() => [
  base,
  props.iconOnly ? iconOnlySize[props.size] : sizeClass[props.size],
  variantClass[props.variant],
  props.block && 'w-full',
])
</script>

<template>
  <component
    :is="tag"
    v-bind="to ? { to } : href ? { href } : {}"
    :type="tag === 'button' ? type : undefined"
    :class="classes"
    :disabled="tag === 'button' ? (disabled || loading) : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :aria-label="label"
    @click="$emit('click', $event)"
  >
    <!-- Leading icon / spinner -->
    <UiSpinner v-if="loading" :size="size === 'lg' ? 'md' : 'sm'" class="shrink-0" />
    <slot v-else name="leading" />

    <!-- Label -->
    <span v-if="!iconOnly" class="truncate">
      <slot />
    </span>

    <!-- Trailing icon -->
    <slot v-if="!iconOnly" name="trailing" />

    <!-- Icon-only content -->
    <slot v-if="iconOnly && !loading" />
  </component>
</template>
