<script setup lang="ts">
import { computed, inject, ref, useId, type ComputedRef, type Ref } from 'vue'

interface Props {
  modelValue?: string | null
  rows?: number
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  autofocus?: boolean
  id?: string
  invalid?: boolean
  describedBy?: string
  /** Grow with content up to `maxRows`. */
  autosize?: boolean
  maxRows?: number
}

const props = withDefaults(defineProps<Props>(), {
  rows: 3,
  autosize: false,
  maxRows: 12,
})

defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'focus', ev: FocusEvent): void
  (e: 'blur', ev: FocusEvent): void
}>()

interface FieldCtx {
  id: Ref<string>
  describedBy: ComputedRef<string | undefined>
  invalid: ComputedRef<boolean>
}
const field = inject<FieldCtx | null>('formField', null)

const fallbackId = `t-${useId()}`
const resolvedId = computed(() => props.id ?? field?.id.value ?? fallbackId)
const resolvedInvalid = computed(() => props.invalid || field?.invalid.value || false)
const resolvedDescribedBy = computed(() => props.describedBy ?? field?.describedBy.value)

const textarea = ref<HTMLTextAreaElement | null>(null)

function onInput(e: Event) {
  const el = e.target as HTMLTextAreaElement
  if (props.autosize) {
    el.style.height = 'auto'
    const lineHeight = 20
    const max = props.maxRows * lineHeight + 16
    el.style.height = `${Math.min(el.scrollHeight, max)}px`
  }
}

defineExpose({ focus: () => textarea.value?.focus() })
</script>

<template>
  <textarea
    ref="textarea"
    :id="resolvedId"
    :value="modelValue ?? ''"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :autofocus="autofocus"
    :aria-invalid="resolvedInvalid || undefined"
    :aria-describedby="resolvedDescribedBy"
    class="block w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm shadow-sm
           placeholder:text-slate-400 transition-[box-shadow,border-color] duration-150
           focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
    :class="resolvedInvalid
      ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15'
      : 'border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15'"
    @input="(ev) => { onInput(ev); $emit('update:modelValue', (ev.target as HTMLTextAreaElement).value) }"
    @focus="$emit('focus', $event)"
    @blur="$emit('blur', $event)"
  />
</template>
