<script setup lang="ts">
import { computed } from 'vue'
import UiButton from './UiButton.vue'
import UiSelect from './UiSelect.vue'

interface Props {
  page: number
  pageSize: number
  total: number
  /** Page-size options offered in the UI. */
  pageSizes?: number[]
  /** Hide the size selector. */
  hideSize?: boolean
}

const props = withDefaults(defineProps<Props>(), { pageSizes: () => [10, 25, 50, 100] })

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:pageSize', value: number): void
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const to = computed(() => Math.min(props.total, props.page * props.pageSize))

const sizeOptions = computed(() =>
  props.pageSizes.map((n) => ({ value: String(n), label: `${n} / page` })),
)

function go(n: number) {
  const clamped = Math.min(totalPages.value, Math.max(1, n))
  if (clamped !== props.page) emit('update:page', clamped)
}
</script>

<template>
  <div class="flex w-full items-center justify-between gap-3 text-xs text-slate-600">
    <div class="tabular-nums">
      <span v-if="total === 0">No results</span>
      <span v-else>
        <span class="font-medium text-slate-800">{{ from }}–{{ to }}</span>
        of <span class="font-medium text-slate-800">{{ total.toLocaleString() }}</span>
      </span>
    </div>

    <div class="flex items-center gap-2">
      <UiSelect
        v-if="!hideSize"
        :model-value="String(pageSize)"
        :options="sizeOptions"
        size="sm"
        class="w-32"
        @update:model-value="(v: string) => emit('update:pageSize', Number(v))"
      />

      <UiButton
        variant="secondary"
        size="sm"
        icon-only
        :disabled="page <= 1"
        label="Previous page"
        @click="go(page - 1)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </UiButton>

      <span class="min-w-[5rem] text-center tabular-nums">
        <span class="font-medium text-slate-800">{{ page }}</span>
        <span class="text-slate-400"> / {{ totalPages }}</span>
      </span>

      <UiButton
        variant="secondary"
        size="sm"
        icon-only
        :disabled="page >= totalPages"
        label="Next page"
        @click="go(page + 1)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </UiButton>
    </div>
  </div>
</template>
