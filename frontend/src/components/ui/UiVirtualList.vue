<script setup lang="ts" generic="Row extends Record<string, unknown>">
/**
 * Virtualised, accessible, sortable, selectable list-of-records.
 *
 * Why a new component instead of extending UiDataTable?  Native
 * <table>/<tr>/<td> don't play well with position:absolute row offsets
 * that virtualisation requires.  Instead we render a scroll container
 * of divs with WAI-ARIA table roles so screen readers still see it as
 * a table, but the DOM is flat and re-positionable.
 *
 * Use this for any list that might hit ~500+ rows in the wild:
 * contacts, users, KB docs, audit logs.  For small admin views
 * (AI agents, workflows) UiDataTable is plenty.
 */
import { computed, ref, watch } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import type { TableColumn, SortState } from '@/types/ui'
import Skeleton from './Skeleton.vue'
import UiCheckbox from './UiCheckbox.vue'
import UiEmptyState from './UiEmptyState.vue'

interface Props<R> {
  rows: R[]
  columns: TableColumn<R>[]
  rowKey: keyof R | ((row: R) => string | number)
  loading?: boolean
  skeletonRows?: number

  /** Sort state controlled by the parent (null = unsorted). */
  sort?: SortState | null

  /** Render a checkbox column + select-all header cell. */
  selectable?: boolean
  selected?: (string | number)[]

  /** Fixed pixel height of each row.  Needed for the virtualiser math. */
  rowHeight?: number
  /** Number of rows rendered above/below the viewport. */
  overscan?: number
  /**
   * Explicit scroll-container height.  When omitted we fall back to
   * `maxHeight` (for inline lists that should shrink to fit their data).
   */
  height?: string
  maxHeight?: string

  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: 'inbox' | 'search' | 'folder' | 'sparkle' | 'error' | 'users'
}

const props = withDefaults(defineProps<Props<Row>>(), {
  rowHeight: 56,
  overscan: 8,
  skeletonRows: 8,
  maxHeight: '60vh',
  emptyTitle: 'Nothing to show yet',
  emptyIcon: 'inbox',
})

const emit = defineEmits<{
  (e: 'update:sort', value: SortState | null): void
  (e: 'update:selected', value: (string | number)[]): void
  (e: 'row-click', row: Row): void
}>()

/* ----------------------------- helpers ----------------------------- */

function keyOf(row: Row): string | number {
  return typeof props.rowKey === 'function'
    ? props.rowKey(row)
    : (row[props.rowKey] as string | number)
}

function valueOf(col: TableColumn<Row>, row: Row): unknown {
  return col.value ? col.value(row) : (row as Record<string, unknown>)[col.key]
}

function alignClass(col: TableColumn<Row>): string {
  if (col.align === 'right') return 'justify-end text-right'
  if (col.align === 'center') return 'justify-center text-center'
  return 'justify-start text-left'
}

function hiddenBelow(col: TableColumn<Row>): string {
  if (col.hideBelow === 'sm') return 'hidden sm:flex'
  if (col.hideBelow === 'md') return 'hidden md:flex'
  if (col.hideBelow === 'lg') return 'hidden lg:flex'
  return ''
}

/* ----------------------------- sort ----------------------------- */

function sortField(col: TableColumn<Row>): string | null {
  if (!col.sortable) return null
  return typeof col.sortable === 'string' ? col.sortable : col.key
}

function sortIcon(col: TableColumn<Row>): 'idle' | 'asc' | 'desc' | null {
  const field = sortField(col)
  if (!field) return null
  if (props.sort?.key !== field) return 'idle'
  return props.sort.order
}

function cycleSort(col: TableColumn<Row>) {
  const field = sortField(col)
  if (!field) return
  const cur = props.sort
  if (!cur || cur.key !== field) emit('update:sort', { key: field, order: 'asc' })
  else if (cur.order === 'asc') emit('update:sort', { key: field, order: 'desc' })
  else emit('update:sort', null)
}

/* ----------------------------- selection ----------------------------- */

const allKeys = computed(() => props.rows.map(keyOf))
const selectedSet = computed(() => new Set(props.selected ?? []))

const allSelected = computed(
  () =>
    props.selectable &&
    allKeys.value.length > 0 &&
    allKeys.value.every((k) => selectedSet.value.has(k)),
)
const someSelected = computed(
  () => props.selectable && (props.selected?.length ?? 0) > 0 && !allSelected.value,
)

function toggleAll(checked: boolean) {
  emit('update:selected', checked ? allKeys.value : [])
}

function toggleRow(k: string | number, checked: boolean) {
  const next = new Set(selectedSet.value)
  if (checked) next.add(k)
  else next.delete(k)
  emit('update:selected', Array.from(next))
}

function isSelected(k: string | number): boolean {
  return selectedSet.value.has(k)
}

/* ----------------------------- virtualiser ----------------------------- */

const scrollEl = ref<HTMLElement | null>(null)

const virtualizerOptions = computed(() => ({
  count: props.rows.length,
  getScrollElement: () => scrollEl.value,
  estimateSize: () => props.rowHeight,
  overscan: props.overscan,
}))

const virtualizer = useVirtualizer(virtualizerOptions)

const virtualItems = computed(() => virtualizer.value.getVirtualItems())
const totalSize = computed(() => virtualizer.value.getTotalSize())

// Reset scroll position when the dataset fundamentally changes
// (e.g. paging to a new page).  Detected by the first row's key.
watch(
  () => allKeys.value[0],
  () => virtualizer.value.scrollToIndex(0, { align: 'start' }),
)

const headerStyle = computed(() => ({
  gridTemplateColumns: gridTemplate.value,
}))

const gridTemplate = computed(() => {
  const sel = props.selectable ? '40px ' : ''
  const cols = props.columns
    .map((c) => c.width ?? 'minmax(120px, 1fr)')
    .join(' ')
  return `${sel}${cols}`.trim()
})

const containerStyle = computed(() => ({
  height: props.height,
  maxHeight: props.height ? undefined : props.maxHeight,
}))
</script>

<template>
  <div class="card overflow-hidden" role="table" :aria-rowcount="rows.length">
    <!-- Header -->
    <div
      class="sticky top-0 z-10 grid items-center gap-0 border-b border-slate-200/70 bg-slate-50/80 px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500"
      :style="headerStyle"
      role="row"
    >
      <div v-if="selectable" class="pr-2" role="columnheader">
        <UiCheckbox
          :model-value="allSelected"
          :indeterminate="someSelected"
          @update:model-value="toggleAll"
        />
      </div>
      <button
        v-for="col in columns"
        :key="col.key"
        type="button"
        role="columnheader"
        :aria-sort="
          sortIcon(col) === 'asc'
            ? 'ascending'
            : sortIcon(col) === 'desc'
            ? 'descending'
            : sortIcon(col) === 'idle'
            ? 'none'
            : undefined
        "
        class="flex items-center gap-1.5 truncate text-left transition-colors"
        :class="[
          alignClass(col),
          hiddenBelow(col),
          sortField(col) ? 'cursor-pointer hover:text-slate-800' : 'cursor-default',
        ]"
        :disabled="!sortField(col)"
        @click="cycleSort(col)"
      >
        <span class="truncate">{{ col.label }}</span>
        <span v-if="sortField(col)" class="text-slate-400">
          <svg v-if="sortIcon(col) === 'idle'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 opacity-60">
            <path d="M7 10l5-5 5 5M7 14l5 5 5-5" />
          </svg>
          <svg v-else-if="sortIcon(col) === 'asc'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 text-brand-600">
            <path d="M7 14l5-5 5 5" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 text-brand-600">
            <path d="M7 10l5 5 5-5" />
          </svg>
        </span>
      </button>
    </div>

    <!-- Body / scroll container -->
    <div ref="scrollEl" class="relative overflow-auto" :style="containerStyle">
      <!-- Loading skeleton -->
      <template v-if="loading && rows.length === 0">
        <div
          v-for="n in skeletonRows"
          :key="`skel-${n}`"
          class="grid items-center gap-0 border-b border-slate-100 px-4"
          :style="{ ...headerStyle, height: `${rowHeight}px` }"
          aria-hidden="true"
        >
          <div v-if="selectable" class="pr-2">
            <Skeleton width="1rem" height="1rem" />
          </div>
          <div v-for="col in columns" :key="col.key" :class="hiddenBelow(col)">
            <Skeleton :width="col.width ?? '70%'" height="0.85rem" />
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else-if="rows.length === 0" class="p-6">
        <slot name="empty">
          <UiEmptyState
            :icon="emptyIcon"
            :title="emptyTitle"
            :description="emptyDescription"
            compact
          />
        </slot>
      </div>

      <!-- Virtualised rows -->
      <div
        v-else
        :style="{ height: `${totalSize}px`, position: 'relative', width: '100%' }"
      >
        <div
          v-for="item in virtualItems"
          :key="rows[item.index] ? keyOf(rows[item.index]) : item.key"
          class="absolute inset-x-0 grid cursor-default items-center gap-0 border-b border-slate-100 px-4 text-sm transition-colors duration-150 hover:bg-brand-50/40"
          :class="[
            isSelected(keyOf(rows[item.index])) && 'bg-brand-50/60',
          ]"
          role="row"
          :style="{
            ...headerStyle,
            height: `${rowHeight}px`,
            transform: `translate3d(0, ${item.start}px, 0)`,
          }"
          @click="emit('row-click', rows[item.index])"
        >
          <div v-if="selectable" class="pr-2" @click.stop>
            <UiCheckbox
              :model-value="isSelected(keyOf(rows[item.index]))"
              @update:model-value="(v: boolean) => toggleRow(keyOf(rows[item.index]), v)"
            />
          </div>

          <div
            v-for="col in columns"
            :key="col.key"
            class="flex min-w-0 items-center truncate"
            :class="[
              alignClass(col),
              hiddenBelow(col),
              col.numeric && 'tabular-nums',
            ]"
            role="cell"
          >
            <slot
              :name="`cell-${col.key}`"
              :row="rows[item.index]"
              :value="valueOf(col, rows[item.index])"
            >
              <span class="truncate">{{ valueOf(col, rows[item.index]) }}</span>
            </slot>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer slot (pagination etc.) -->
    <div
      v-if="$slots.footer"
      class="flex items-center justify-between gap-2 border-t border-slate-200/70 bg-slate-50/50 px-4 py-3"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
