import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

interface Options {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

/**
 * Observes a DOM ref and flips `isInView` to true when the element intersects
 * the viewport. Designed for lazy animation triggers.
 */
export function useInView<T extends HTMLElement = HTMLElement>(
  target: Ref<T | null>,
  { threshold = 0.15, rootMargin = '0px', once = true }: Options = {},
) {
  const isInView = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (typeof IntersectionObserver === 'undefined' || !target.value) {
      isInView.value = true
      return
    }
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            isInView.value = true
            if (once) observer?.disconnect()
          } else if (!once) {
            isInView.value = false
          }
        }
      },
      { threshold, rootMargin },
    )
    observer.observe(target.value)
  })

  onBeforeUnmount(() => observer?.disconnect())

  return isInView
}
