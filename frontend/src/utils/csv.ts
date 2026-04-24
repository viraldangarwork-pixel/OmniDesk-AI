/**
 * Client-side CSV export.
 *
 * Keeps the export on the browser (no round-trip) for small/medium
 * lists.  For exports that exceed the rendered page — e.g. "all 50k
 * contacts" — call into a server-side streaming endpoint instead.
 *
 * Escaping follows RFC 4180: every value is double-quoted and internal
 * quotes are doubled.  This is safe against Excel formula injection
 * because we prefix any value starting with `=`, `+`, `-` or `@` with a
 * zero-width-space — Excel then treats it as text rather than formula.
 */

interface Column<Row> {
  key: string
  label: string
  /** Custom accessor; defaults to row[key]. */
  value?: (row: Row) => unknown
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return v.toISOString()
  if (Array.isArray(v)) return v.join(', ')
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

const FORMULA_PREFIX_RE = /^[=+\-@]/

function escape(cell: string): string {
  // Prepend a zero-width space to defang Excel formula injection.
  const safe = FORMULA_PREFIX_RE.test(cell) ? `​${cell}` : cell
  return `"${safe.replace(/"/g, '""')}"`
}

export function rowsToCsv<Row>(rows: readonly Row[], columns: readonly Column<Row>[]): string {
  const head = columns.map((c) => escape(c.label)).join(',')
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const raw = c.value ? c.value(row) : (row as Record<string, unknown>)[c.key]
        return escape(stringify(raw))
      })
      .join(','),
  )
  return [head, ...lines].join('\r\n')
}

/**
 * Triggers a browser download.  Uses a Blob + object URL; no anchor is
 * left mounted after the click.
 */
export function downloadCsv<Row>(
  filename: string,
  rows: readonly Row[],
  columns: readonly Column<Row>[],
) {
  const csv = rowsToCsv(rows, columns)
  // BOM lets Excel auto-detect UTF-8.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Free the object URL on the next frame so the download actually starts.
  requestAnimationFrame(() => URL.revokeObjectURL(url))
}
