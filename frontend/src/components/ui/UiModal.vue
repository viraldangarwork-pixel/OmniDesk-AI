<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { useScrollLock } from '@/composables/useScrollLock'

type Size = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface Props {
  modelValue: boolean
  title?: string
  description?: string
  size?: Size
  /** Disables closing via Escape key. */
  persistent?: boolean
  /** Hide the top-right close button. */
  hideClose?: boolean
}

const props = withDefaults(defineProps<Props>(), { size: 'md' })

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const dialog = ref<HTMLElement | null>(null)
const active = toRef(props, 'modelValue')

useScrollLock(active)
useFocusTrap({
  active,
  container: dialog,
  onEscape: () => !props.persistent && close(),
})

function close() {
  emit('update:modelValue', false)
  emit('close')
}

const sizeClass: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[min(1200px,96vw)]',
}

const titleId = computed(() => `modal-title-${Math.random().toString(36).slice(2, 8)}`)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm"
        aria-hidden="true"
        @click="!persistent && close()"
      />
    </Transition>
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[91] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
      >
        <div
          ref="dialog"
          class="relative w-full rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)] outline-none"
          :class="sizeClass[size]"
          tabindex="-1"
          @click.stop
        >
          <!-- Header -->
          <div v-if="title || description || $slots.header || !hideClose" class="flex items-start justify-between gap-4 px-6 pt-5">
            <div class="min-w-0 flex-1">
              <slot name="header">
                <h2 v-if="title" :id="titleId" class="text-lg font-semibold text-slate-900">
                  {{ title }}
                </h2>
                <p v-if="description" class="mt-0.5 text-sm text-slate-500">{{ description }}</p>
              </slot>
            </div>
            <button
              v-if="!hideClose"
              type="button"
              class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close dialog"
              @click="close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-5">
            <slot />
          </div>

          <!-- Footer -->
          <div
            v-if="$slots.footer"
            class="flex items-center justify-end gap-2 border-t border-slate-200/70 bg-slate-50/50 px-6 py-3 rounded-b-2xl"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
