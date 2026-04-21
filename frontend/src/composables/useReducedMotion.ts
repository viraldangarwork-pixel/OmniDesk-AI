import { onBeforeUnmount, ref } from 'vue'

/**
 * Reactive flag that mirrors the user's `prefers-reduced-motion` setting.
 * Animations should be skipped or shortened when this is true.
 */
export function useReducedMotion() {
  const prefersReduced = ref(false)

  if (typeof window !== 'undefined' && 'matchMedia' in window) {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReduced.value = media.matches
    const handler = (e: MediaQueryListEvent) => {
      prefersReduced.value = e.matches
    }
    media.addEventListener?.('change', handler)
    onBeforeUnmount(() => media.removeEventListener?.('change', handler))
  }

  return prefersReduced
}
