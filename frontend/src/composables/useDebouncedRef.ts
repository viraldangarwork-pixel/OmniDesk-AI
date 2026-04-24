import { customRef, type Ref } from 'vue'

/**
 * A ref that delays propagation of updates until `delay` ms have elapsed
 * since the last write.  Ideal for search inputs that drive a query:
 *
 *   const q = useDebouncedRef('', 250)
 *   const { data } = useQuery({ queryKey: computed(() => ['search', q.value]), … })
 *
 * Intentionally simpler than `@vueuse/core`'s refDebounced — we don't need
 * the "eager read" variant and we want a single-purpose, dependency-free
 * implementation that tree-shakes cleanly.
 */
export function useDebouncedRef<T>(initial: T, delay = 250): Ref<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let value = initial

  return customRef<T>((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(next) {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        value = next
        trigger()
        timeout = null
      }, delay)
    },
  }))
}
