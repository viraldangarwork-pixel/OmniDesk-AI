import { watch, type Ref } from 'vue'

let refCount = 0
let prevOverflow: string | null = null
let prevPaddingRight: string | null = null

/**
 * Locks body scroll while at least one caller is active.
 *
 * Safe to nest (e.g. a modal opened above a drawer): callers share a ref-counter
 * so scroll only unlocks when the last consumer releases.
 */
export function useScrollLock(active: Ref<boolean>) {
  let owns = false

  function lock() {
    if (owns) return
    owns = true
    refCount++
    if (refCount === 1) {
      prevOverflow = document.body.style.overflow
      prevPaddingRight = document.body.style.paddingRight
      // Compensate for disappearing scrollbar to avoid horizontal jump.
      const scrollbar = window.innerWidth - document.documentElement.clientWidth
      if (scrollbar > 0) {
        document.body.style.paddingRight = `${scrollbar}px`
      }
      document.body.style.overflow = 'hidden'
    }
  }

  function unlock() {
    if (!owns) return
    owns = false
    refCount = Math.max(0, refCount - 1)
    if (refCount === 0) {
      document.body.style.overflow = prevOverflow ?? ''
      document.body.style.paddingRight = prevPaddingRight ?? ''
      prevOverflow = null
      prevPaddingRight = null
    }
  }

  watch(
    active,
    (on) => {
      if (on) lock()
      else unlock()
    },
    { immediate: true },
  )
}
