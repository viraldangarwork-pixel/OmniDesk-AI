<script setup lang="ts">
import { ref } from 'vue'
import UiModal from './UiModal.vue'
import UiButton from './UiButton.vue'

type Tone = 'neutral' | 'danger'

interface Props {
  modelValue: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: Tone
  /** Async callback; the confirm button shows a spinner until it resolves. */
  onConfirm?: () => void | Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  tone: 'neutral',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const busy = ref(false)

async function confirm() {
  if (busy.value) return
  try {
    busy.value = true
    await props.onConfirm?.()
    emit('confirm')
    emit('update:modelValue', false)
  } finally {
    busy.value = false
  }
}

function cancel() {
  if (busy.value) return
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    :title="title"
    :description="description"
    size="sm"
    :persistent="busy"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <template #footer>
      <UiButton variant="ghost" :disabled="busy" @click="cancel">{{ cancelLabel }}</UiButton>
      <UiButton
        :variant="tone === 'danger' ? 'danger' : 'primary'"
        :loading="busy"
        @click="confirm"
      >
        {{ confirmLabel }}
      </UiButton>
    </template>
  </UiModal>
</template>
