/**
 * Shared API response envelopes.
 *
 * These shapes describe what the backend returns on the wire — they deliberately
 * mirror FastAPI / Pydantic conventions (snake_case, ISO timestamps).
 */

/** Standard paginated list envelope. */
export interface Page<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

/** Cursor-based list envelope (used by feeds like messages). */
export interface Cursor<T> {
  items: T[]
  next_cursor: string | null
}

/** Common paginated query params. */
export interface PageParams {
  page?: number
  size?: number
  q?: string
  sort?: string
  order?: 'asc' | 'desc'
}

/** FastAPI HTTPException body. */
export interface ApiErrorBody {
  detail?: string | Array<{ loc: (string | number)[]; msg: string; type: string }>
}

/** A normalized client-side error surfaced to views and toasts. */
export interface ApiError {
  status: number
  code?: string
  message: string
  fieldErrors?: Record<string, string>
  cause?: unknown
}
