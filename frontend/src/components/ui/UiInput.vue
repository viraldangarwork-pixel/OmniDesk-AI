<script setup lang="ts">
import { computed, inject, ref, useId, useSlots, type ComputedRef, type Ref } from 'vue'

type InputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  modelValue?: string | number | null
  type?: InputType
  size?: Size
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  autocomplete?: string
  autofocus?: boolean
  id?: string
  invalid?: boolean
  /** Explicit aria-describedby (overrides field context). */
  describedBy?: string
  /** Render with tabular-nums for numeric-heavy inputs. */
  numeric?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
})

defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'focus', ev: FocusEvent): void
  (e: 'blur', ev: FocusEvent): void
  (e: 'enter', ev: KeyboardEvent): void
}>()

interface FieldCtx {
  id: Ref<string>
  describedBy: ComputedRef<string | undefined>
  invalid: ComputedRef<boolean>
}
// Inherit id, aria-describedby and invalid from a parent UiFormField.
const field = inject<FieldCtx | null>('formField', null)

const slots = useSlots()
const hasLeading = computed(() => !!slots.leading)
const hasTrailing = computed(() => !!slots.trailing)

const fallbackId = `i-${useId()}`
const resolvedId = computed(() => props.id ?? field?.id.value ?? fallbackId)
const resolvedInvalid = computed(() => props.invalid || field?.invalid.value || false)
const resolvedDescribedBy = computed(() => props.describedBy ?? field?.describedBy.value)

const sizeClass: Record<Size, string> = {
  sm: 'h-8 text-xs px-2.5',
  md: 'h-9 text-sm px-3',
  lg: 'h-11 text-sm px-3.5',
}

const input = ref<HTMLInputElement | null>(null)
defineExpose({ focus: () => input.value?.focus(), el: input })
</script>

<template>
  <div
    class="group relative flex items-center rounded-lg border bg-white shadow-sm transition-[box-shadow,border-color] duration-150"
    :class="[
      resolvedInvalid
        ? 'border-rose-400 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/15'
        : 'border-slate-300 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15',
      disabled && 'opacity-60 cursor-not-allowed',
    ]"
  >
    <span v-if="hasLeading" class="pl-3 pr-1 text-slate-400" aria-hidden="true">
      <slot name="leading" />
    </span>

    <input
      ref="input"
      :id="resolvedId"
      :type="type"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :autocomplete="autocomplete"
      :autofocus="autofocus"
      :aria-invalid="resolvedInvalid || undefined"
      :aria-describedby="resolvedDescribedBy"
      class="peer w-full flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
      :class="[
        sizeClass[size],
        numeric && 'tabular-nums font-medium',
        hasLeading && 'pl-1',
        hasTrailing && 'pr-1',
      ]"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
      @keydown.enter="$emit('enter', $event)"
    />

    <span v-if="hasTrailing" class="pr-2.5 pl-1 text-slate-400" aria-hidden="true">
      <slot name="trailing" />
    </span>
  </div>
</template>
