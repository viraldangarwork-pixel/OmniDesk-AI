<script setup lang="ts" generic="Row extends Record<string, unknown>">
import { computed } from 'vue'
import type { TableColumn, SortState } from '@/types/ui'
import Skeleton from './Skeleton.vue'
import UiEmptyState from './UiEmptyState.vue'
import UiCheckbox from './UiCheckbox.vue'

interface Props<R> {
  rows: R[]
  columns: TableColumn<R>[]
  rowKey: keyof R | ((row: R) => string | number)
  loading?: boolean
  /** How many skeleton rows to show while loading. */
  skeletonRows?: number
  /** Controls sort state; omit to disable sort. */
  sort?: SortState | null
  /** Show a checkbox column + header select-all. */
  selectable?: boolean
  /** Selected row keys (v-model:selected). */
  selected?: (string | number)[]
  /** Sticky header inside its scroll container. */
  stickyHeader?: boolean
  /** Tight row height for dense lists. */
  dense?: boolean
  /** Empty state copy. */
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: 'inbox' | 'search' | 'folder' | 'sparkle' | 'error' | 'users'
  /** Called when a row is clicked (use for drill-in). */
}

const props = withDefaults(defineProps<Props<Row>>(), {
  skeletonRows: 6,
  emptyTitle: 'Nothing to show yet',
  emptyIcon: 'inbox',
})

const emit = defineEmits<{
  (e: 'update:sort', value: SortState | null): void
  (e: 'update:selected', value: (string | number)[]): void
  (e: 'row-click', row: Row): void
}>()

function keyOf(row: Row): string | number {
  return typeof props.rowKey === 'function'
    ? props.rowKey(row)
    : (row[props.rowKey] as string | number)
}

function valueOf(col: TableColumn<Row>, row: Row) {
  return col.value ? col.value(row) : (row as Record<string, unknown>)[col.key]
}

function alignClass(col: TableColumn<Row>) {
  if (col.align === 'right') return 'text-right'
  if (col.align === 'center') return 'text-center'
  return 'text-left'
}

function hiddenBelow(col: TableColumn<Row>) {
  if (col.hideBelow === 'sm') return 'hidden sm:table-cell'
  if (col.hideBelow === 'md') return 'hidden md:table-cell'
  if (col.hideBelow === 'lg') return 'hidden lg:table-cell'
  return ''
}

/* -------- sort -------- */
function sortField(col: TableColumn<Row>): string | null {
  if (!col.sortable) return null
  return typeof col.sortable === 'string' ? col.sortable : col.key
}

function cycleSort(col: TableColumn<Row>) {
  const field = sortField(col)
  if (!field) return
  const current = props.sort
  if (!current || current.key !== field) {
    emit('update:sort', { key: field, order: 'asc' })
  } else if (current.order === 'asc') {
    emit('update:sort', { key: field, order: 'desc' })
  } else {
    emit('update:sort', null)
  }
}

function sortIcon(col: TableColumn<Row>) {
  const field = sortField(col)
  if (!field) return null
  if (props.sort?.key !== field) return 'idle'
  return props.sort.order
}

/* -------- selection -------- */
const allKeys = computed(() => props.rows.map(keyOf))
const allSelected = computed(
  () =>
    props.selectable &&
    allKeys.value.length > 0 &&
    allKeys.value.every((k) => (props.selected ?? []).includes(k)),
)
const someSelected = computed(
  () =>
    props.selectable &&
    (props.selected?.length ?? 0) > 0 &&
    !allSelected.value,
)

function toggleAll(checked: boolean) {
  emit('update:selected', checked ? allKeys.value : [])
}

function toggleRow(k: string | number, checked: boolean) {
  const set = new Set(props.selected ?? [])
  if (checked) set.add(k)
  else set.delete(k)
  emit('update:selected', Array.from(set))
}

function isSelected(k: string | number) {
  return (props.selected ?? []).includes(k)
}

const cellPad = computed(() => (props.dense ? 'px-3 py-2' : 'px-4 py-3'))
</script>

<template>
  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead
          class="bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500"
          :class="stickyHeader && 'sticky top-0 z-10 shadow-[0_1px_0_rgba(15,23,42,0.06)]'"
        >
          <tr>
            <!-- Selection column -->
            <th
              v-if="selectable"
              scope="col"
              class="w-10 px-4 py-3 text-left"
            >
              <UiCheckbox
                :model-value="allSelected"
                :indeterminate="someSelected"
                @update:model-value="toggleAll"
              />
            </th>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              :style="col.width ? { width: col.width } : undefined"
              :class="[
                cellPad,
                alignClass(col),
                hiddenBelow(col),
                col.sticky && 'sticky left-0 bg-slate-50/80',
                sortField(col) && 'cursor-pointer select-none hover:text-slate-800',
              ]"
              @click="sortField(col) ? cycleSort(col) : null"
            >
              <span class="inline-flex items-center gap-1.5">
                {{ col.label }}
                <span v-if="sortField(col)" class="text-slate-400">
                  <svg v-if="sortIcon(col) === 'idle'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 opacity-60">
                    <path d="M7 10l5-5 5 5M7 14l5 5 5-5" />
                  </svg>
                  <svg v-else-if="sortIcon(col) === 'asc'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 text-brand-600">
                    <path d="M7 14l5-5 5 5" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 text-brand-600">
                    <path d="M7 10l5 5 5-5" />
                  </svg>
                </span>
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- Loading skeleton -->
          <template v-if="loading && rows.length === 0">
            <tr v-for="n in skeletonRows" :key="`skel-${n}`" class="border-t border-slate-100">
              <td v-if="selectable" :class="cellPad">
                <Skeleton width="1rem" height="1rem" />
              </td>
              <td v-for="col in columns" :key="col.key" :class="[cellPad, hiddenBelow(col)]">
                <Skeleton :width="col.width ?? '70%'" height="0.85rem" />
              </td>
            </tr>
          </template>

          <!-- Empty state (spans full width) -->
          <tr v-else-if="rows.length === 0">
            <td :colspan="columns.length + (selectable ? 1 : 0)" class="p-6">
              <slot name="empty">
                <UiEmptyState
                  :icon="emptyIcon"
                  :title="emptyTitle"
                  :description="emptyDescription"
                  compact
                />
              </slot>
            </td>
          </tr>

          <!-- Rows -->
          <template v-else>
            <tr
              v-for="row in rows"
              :key="keyOf(row)"
              class="border-t border-slate-100 transition-colors duration-150 hover:bg-brand-50/40"
              :class="isSelected(keyOf(row)) && 'bg-brand-50/60'"
              @click="$emit('row-click', row)"
            >
              <td v-if="selectable" :class="cellPad" @click.stop>
                <UiCheckbox
                  :model-value="isSelected(keyOf(row))"
                  @update:model-value="(v: boolean) => toggleRow(keyOf(row), v)"
                />
              </td>
              <td
                v-for="col in columns"
                :key="col.key"
                :class="[
                  cellPad,
                  alignClass(col),
                  hiddenBelow(col),
                  col.numeric && 'tabular-nums',
                  col.sticky && 'sticky left-0 bg-white',
                ]"
              >
                <slot :name="`cell-${col.key}`" :row="row" :value="valueOf(col, row)">
                  {{ valueOf(col, row) }}
                </slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Footer slot (pagination, etc.) -->
    <div
      v-if="$slots.footer"
      class="flex items-center justify-between gap-2 border-t border-slate-200/70 bg-slate-50/50 px-4 py-3"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
