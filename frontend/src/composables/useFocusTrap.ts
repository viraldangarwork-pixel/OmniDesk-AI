import { nextTick, watch, type Ref } from 'vue'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

interface Options {
  /** When true, the trap is active and Tab/Shift+Tab wrap inside the container. */
  active: Ref<boolean>
  /** Ref to the container that holds the focusable descendants. */
  container: Ref<HTMLElement | null>
  /** Optional: where to send focus initially (defaults to first focusable). */
  initialFocus?: Ref<HTMLElement | null>
  /** Called when Escape is pressed while the trap is active. */
  onEscape?: () => void
}

/**
 * Minimal, dependency-free focus trap suitable for modal dialogs & drawers.
 *
 * Why roll our own?  `focus-trap` is ~6KB and brings a global MutationObserver;
 * we only need Tab wrapping + Escape + restore-on-deactivate, which fits in ~40
 * lines and has no per-tick cost.
 */
export function useFocusTrap({ active, container, initialFocus, onEscape }: Options) {
  let previouslyFocused: HTMLElement | null = null

  function list(): HTMLElement[] {
    const root = container.value
    if (!root) return []
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
    )
  }

  function onKeydown(e: KeyboardEvent) {
    if (!active.value) return
    if (e.key === 'Escape' && onEscape) {
      e.stopPropagation()
      onEscape()
      return
    }
    if (e.key !== 'Tab') return
    const focusables = list()
    if (focusables.length === 0) {
      e.preventDefault()
      return
    }
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active_ = document.activeElement as HTMLElement | null
    if (e.shiftKey && active_ === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active_ === last) {
      e.preventDefault()
      first.focus()
    }
  }

  watch(
    active,
    async (on) => {
      if (on) {
        previouslyFocused = document.activeElement as HTMLElement | null
        document.addEventListener('keydown', onKeydown, true)
        await nextTick()
        const focusables = list()
        const target = initialFocus?.value ?? focusables[0] ?? container.value
        target?.focus({ preventScroll: true })
      } else {
        document.removeEventListener('keydown', onKeydown, true)
        previouslyFocused?.focus({ preventScroll: true })
        previouslyFocused = null
      }
    },
    { immediate: true },
  )
}
