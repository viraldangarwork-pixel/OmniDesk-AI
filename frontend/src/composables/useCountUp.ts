import { ref, watch, type Ref } from 'vue'
import { useReducedMotion } from './useReducedMotion'

interface Options {
  duration?: number
  decimals?: number
  trigger?: Ref<boolean>
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * Animated counter from 0 → target using rAF and an ease-out curve.
 * When `trigger` is provided, the animation only starts once it flips to true
 * (ideal for scroll-into-view reveals).
 */
export function useCountUp(target: Ref<number>, { duration = 1200, decimals = 0, trigger }: Options = {}) {
  const display = ref(0)
  const reduced = useReducedMotion()
  let frame = 0

  const run = () => {
    cancelAnimationFrame(frame)
    const from = 0
    const to = Number(target.value) || 0

    if (reduced.value) {
      display.value = to
      return
    }

    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = easeOutCubic(p)
      const value = from + (to - from) * eased
      display.value = Number(value.toFixed(decimals))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  }

  if (trigger) {
    watch(trigger, (v) => v && run(), { immediate: true })
    watch(target, () => trigger.value && run())
  } else {
    watch(target, run, { immediate: true })
  }

  return display
}
