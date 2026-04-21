<script setup lang="ts">
import { computed, useId } from 'vue'

interface Props {
  modelValue?: boolean
  disabled?: boolean
  indeterminate?: boolean
  id?: string
  /** Inline label; use a slot for complex content. */
  label?: string
  hint?: string
}

const props = defineProps<Props>()
defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const fallbackId = `c-${useId()}`
const resolvedId = computed(() => props.id ?? fallbackId)
</script>

<template>
  <label
    class="group flex cursor-pointer items-start gap-2.5 text-sm"
    :class="disabled && 'cursor-not-allowed opacity-60'"
    :for="resolvedId"
  >
    <span class="relative mt-0.5 grid h-4 w-4 shrink-0 place-items-center">
      <input
        :id="resolvedId"
        type="checkbox"
        class="peer h-4 w-4 cursor-pointer appearance-none rounded
               border border-slate-300 bg-white shadow-sm transition-colors
               checked:border-brand-600 checked:bg-brand-600
               indeterminate:border-brand-600 indeterminate:bg-brand-600
               focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20
               disabled:cursor-not-allowed"
        :checked="modelValue"
        :disabled="disabled"
        :indeterminate.prop="indeterminate"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <svg
        v-if="!indeterminate"
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"
        class="pointer-events-none absolute h-2.5 w-2.5 text-white opacity-0 transition-opacity peer-checked:opacity-100"
        aria-hidden="true"
      >
        <path d="M4 12l5 5 11-11" />
      </svg>
      <span
        v-else
        class="pointer-events-none absolute h-0.5 w-2 rounded bg-white"
        aria-hidden="true"
      />
    </span>
    <span class="min-w-0 flex-1">
      <span v-if="label || $slots.default" class="block select-none text-slate-800">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="hint" class="block text-xs text-slate-500">{{ hint }}</span>
    </span>
  </label>
</template>
