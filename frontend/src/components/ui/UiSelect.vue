<script setup lang="ts">
import { computed, inject, useId, type ComputedRef, type Ref } from 'vue'
import type { Option } from '@/types/ui'

interface Props<V = string> {
  modelValue?: V | null
  options: Option<V>[]
  /** Placeholder option (disabled + empty value). */
  placeholder?: string
  disabled?: boolean
  id?: string
  invalid?: boolean
  describedBy?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), { size: 'md' })

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

interface FieldCtx {
  id: Ref<string>
  describedBy: ComputedRef<string | undefined>
  invalid: ComputedRef<boolean>
}
const field = inject<FieldCtx | null>('formField', null)

const fallbackId = `s-${useId()}`
const resolvedId = computed(() => props.id ?? field?.id.value ?? fallbackId)
const resolvedInvalid = computed(() => props.invalid || field?.invalid.value || false)
const resolvedDescribedBy = computed(() => props.describedBy ?? field?.describedBy.value)

const sizeClass = {
  sm: 'h-8 text-xs pl-2.5 pr-8',
  md: 'h-9 text-sm pl-3 pr-9',
  lg: 'h-11 text-sm pl-3.5 pr-10',
} as const
</script>

<template>
  <div class="relative">
    <select
      :id="resolvedId"
      :value="modelValue ?? ''"
      :disabled="disabled"
      :aria-invalid="resolvedInvalid || undefined"
      :aria-describedby="resolvedDescribedBy"
      class="block w-full appearance-none rounded-lg border bg-white text-slate-900 shadow-sm
             transition-[box-shadow,border-color] duration-150 focus:outline-none
             disabled:cursor-not-allowed disabled:opacity-60"
      :class="[
        sizeClass[size],
        resolvedInvalid
          ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15'
          : 'border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15',
      ]"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option
        v-for="o in options"
        :key="String(o.value)"
        :value="o.value"
        :disabled="o.disabled"
      >
        {{ o.label }}
      </option>
    </select>
    <svg
      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      class="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  </div>
</template>
