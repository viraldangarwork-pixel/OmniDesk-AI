import { useToastStore } from '@/stores/toast'
import type { Toast, ToastKind } from '@/types/ui'

type ToastInput = string | Omit<Toast, 'id' | 'kind'>

function asToast(kind: ToastKind, input: ToastInput): Omit<Toast, 'id'> {
  if (typeof input === 'string') return { kind, title: input }
  return { kind, ...input }
}

/**
 * Ergonomic wrapper around the toast store.  Prefer this over touching
 * the store directly — it keeps call-sites terse and type-safe.
 *
 * Examples:
 *   const toast = useToast()
 *   toast.success('Saved')
 *   toast.error({ title: 'Upload failed', description: err.message })
 *   toast.info({ title: 'Syncing…', duration: 0 })   // sticky
 */
export function useToast() {
  const store = useToastStore()
  return {
    success: (input: ToastInput) => store.push(asToast('success', input)),
    error: (input: ToastInput) => store.push(asToast('error', input)),
    warning: (input: ToastInput) => store.push(asToast('warning', input)),
    info: (input: ToastInput) => store.push(asToast('info', input)),
    dismiss: (id: string) => store.dismiss(id),
    clear: () => store.clear(),
  }
}
