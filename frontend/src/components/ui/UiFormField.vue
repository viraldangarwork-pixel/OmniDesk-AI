<script setup lang="ts">
import { computed, provide, useId } from 'vue'

interface Props {
  label?: string
  hint?: string
  error?: string
  /** Marks the field as required in the label. */
  required?: boolean
  /** Optional id — otherwise auto-generated and provided to children. */
  id?: string
  /** Rendered after the label (e.g. tooltip, badge). */
}

const props = defineProps<Props>()

const autoId = useId()
const inputId = computed(() => props.id ?? `f-${autoId}`)
const errorId = computed(() => `${inputId.value}-err`)
const hintId = computed(() => `${inputId.value}-hint`)

const describedBy = computed(() => {
  const ids: string[] = []
  if (props.error) ids.push(errorId.value)
  else if (props.hint) ids.push(hintId.value)
  return ids.join(' ') || undefined
})

// Children (UiInput, UiTextarea, UiSelect) read these via inject().
provide('formField', {
  id: inputId,
  describedBy,
  invalid: computed(() => !!props.error),
})
</script>

<template>
  <div class="space-y-1.5">
    <label
      v-if="label"
      :for="inputId"
      class="flex items-center gap-1 text-xs font-medium text-slate-700"
    >
      {{ label }}
      <span v-if="required" class="text-rose-500" aria-hidden="true">*</span>
      <slot name="labelAccessory" />
    </label>

    <slot />

    <Transition name="fade">
      <p
        v-if="error"
        :id="errorId"
        class="flex items-start gap-1 text-xs font-medium text-rose-600"
        role="alert"
        aria-live="polite"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 h-3 w-3 shrink-0">
          <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
        </svg>
        <span>{{ error }}</span>
      </p>
    </Transition>
    <p v-if="!error && hint" :id="hintId" class="text-xs text-slate-500">{{ hint }}</p>
  </div>
</template>
