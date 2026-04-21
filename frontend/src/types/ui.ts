/**
 * Shared UI types for the design system.
 */

export type Tone =
  | 'default'
  | 'brand'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'slate'
  | 'sky'
  | 'violet'

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type ToastKind = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  kind: ToastKind
  title: string
  description?: string
  /** Milliseconds.  Pass 0 for sticky. */
  duration?: number
  action?: { label: string; handler: () => void }
}

/** Generic option for selects, filters, etc. */
export interface Option<V = string> {
  value: V
  label: string
  disabled?: boolean
  icon?: string
  description?: string
}

/** DataTable column definition. */
export interface TableColumn<Row = Record<string, unknown>> {
  key: string
  label: string
  /** Value getter; defaults to row[key]. */
  value?: (row: Row) => unknown
  /** Server-side sort field; omit to disable sort. */
  sortable?: boolean | string
  align?: 'left' | 'center' | 'right'
  width?: string
  /** Render this column as monospaced numerics. */
  numeric?: boolean
  /** Hide at breakpoints below. */
  hideBelow?: 'sm' | 'md' | 'lg'
  /** Sticky left (for id / primary column). */
  sticky?: boolean
}

export interface SortState {
  key: string
  order: 'asc' | 'desc'
}
