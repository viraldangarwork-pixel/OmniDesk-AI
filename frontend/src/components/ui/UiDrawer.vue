<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { useScrollLock } from '@/composables/useScrollLock'

type Side = 'right' | 'left'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  modelValue: boolean
  side?: Side
  size?: Size
  title?: string
  description?: string
  persistent?: boolean
  hideClose?: boolean
}

const props = withDefaults(defineProps<Props>(), { side: 'right', size: 'md' })

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const panel = ref<HTMLElement | null>(null)
const active = toRef(props, 'modelValue')

useScrollLock(active)
useFocusTrap({
  active,
  container: panel,
  onEscape: () => !props.persistent && close(),
})

function close() {
  emit('update:modelValue', false)
  emit('close')
}

const sizeClass: Record<Size, string> = {
  sm: 'w-[340px]',
  md: 'w-[420px]',
  lg: 'w-[560px]',
  xl: 'w-[720px]',
}

const transitionName = computed(() => (props.side === 'right' ? 'slide-right' : 'slide-left'))

const panelSideClass = computed(() =>
  props.side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
)

const titleId = computed(() => `drawer-title-${Math.random().toString(36).slice(2, 8)}`)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-sm"
        aria-hidden="true"
        @click="!persistent && close()"
      />
    </Transition>

    <Transition :name="transitionName">
      <aside
        v-if="modelValue"
        ref="panel"
        class="fixed inset-y-0 z-[91] flex max-w-[100vw] flex-col border-slate-200/70 bg-white shadow-[0_0_40px_-10px_rgba(15,23,42,0.35)] outline-none"
        :class="[panelSideClass, sizeClass[size]]"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
        tabindex="-1"
      >
        <!-- Header -->
        <div
          v-if="title || description || $slots.header || !hideClose"
          class="flex items-start justify-between gap-4 border-b border-slate-200/70 px-5 py-4"
        >
          <div class="min-w-0 flex-1">
            <slot name="header">
              <h2 v-if="title" :id="titleId" class="text-base font-semibold text-slate-900">
                {{ title }}
              </h2>
              <p v-if="description" class="mt-0.5 text-xs text-slate-500">{{ description }}</p>
            </slot>
          </div>
          <button
            v-if="!hideClose"
            type="button"
            class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close drawer"
            @click="close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-5 py-4">
          <slot />
        </div>

        <!-- Footer -->
        <div
          v-if="$slots.footer"
          class="flex items-center justify-end gap-2 border-t border-slate-200/70 bg-slate-50/50 px-5 py-3"
        >
          <slot name="footer" />
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
