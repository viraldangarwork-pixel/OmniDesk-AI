import type { Directive } from 'vue'

type Preset = 'fade' | 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom' | 'pop'

interface MotionValue {
  preset?: Preset
  delay?: number
  duration?: number
  distance?: number
  once?: boolean
  threshold?: number
}

interface InternalState {
  observer?: IntersectionObserver
  played?: boolean
}

const presets: Record<Preset, { from: string; to: string }> = {
  fade: { from: 'opacity:0;', to: 'opacity:1;' },
  'fade-up': { from: 'opacity:0;transform:translate3d(0,D,0);', to: 'opacity:1;transform:translate3d(0,0,0);' },
  'fade-down': { from: 'opacity:0;transform:translate3d(0,-D,0);', to: 'opacity:1;transform:translate3d(0,0,0);' },
  'fade-left': { from: 'opacity:0;transform:translate3d(-D,0,0);', to: 'opacity:1;transform:translate3d(0,0,0);' },
  'fade-right': { from: 'opacity:0;transform:translate3d(D,0,0);', to: 'opacity:1;transform:translate3d(0,0,0);' },
  zoom: { from: 'opacity:0;transform:scale(.92);', to: 'opacity:1;transform:scale(1);' },
  pop: { from: 'opacity:0;transform:scale(.85);', to: 'opacity:1;transform:scale(1);' },
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function apply(el: HTMLElement, css: string) {
  el.style.cssText += css
}

function play(el: HTMLElement, opts: Required<MotionValue>) {
  const preset = presets[opts.preset]
  const d = `${opts.distance}px`
  el.style.transition = `opacity ${opts.duration}ms cubic-bezier(.22,1,.36,1) ${opts.delay}ms, transform ${opts.duration}ms cubic-bezier(.22,1,.36,1) ${opts.delay}ms`
  apply(el, preset.to.replaceAll('D', d))
}

function resolve(binding: MotionValue | Preset | undefined): Required<MotionValue> {
  const base: Required<MotionValue> = {
    preset: 'fade-up',
    delay: 0,
    duration: 550,
    distance: 16,
    once: true,
    threshold: 0.12,
  }
  if (!binding) return base
  if (typeof binding === 'string') return { ...base, preset: binding }
  return { ...base, ...binding }
}

/**
 * v-motion directive
 *
 * Usage:
 *   <div v-motion></div>                         // fade-up on mount/scroll
 *   <div v-motion="'zoom'"></div>                // preset only
 *   <div v-motion="{ preset: 'fade-left', delay: 120 }"></div>
 */
export const vMotion: Directive<HTMLElement, MotionValue | Preset | undefined> = {
  mounted(el, binding) {
    const opts = resolve(binding.value)
    const state: InternalState = {}
    ;(el as any).__motion = state

    if (prefersReducedMotion()) {
      el.style.opacity = '1'
      return
    }

    const preset = presets[opts.preset]
    const d = `${opts.distance}px`
    apply(el, preset.from.replaceAll('D', d))
    el.style.willChange = 'opacity, transform'

    const run = () => {
      if (state.played) return
      state.played = true
      requestAnimationFrame(() => play(el, opts))
      window.setTimeout(() => {
        el.style.willChange = ''
      }, opts.delay + opts.duration + 80)
    }

    if (typeof IntersectionObserver === 'undefined') {
      run()
      return
    }

    state.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run()
            if (opts.once) state.observer?.disconnect()
          }
        }
      },
      { threshold: opts.threshold },
    )
    state.observer.observe(el)
  },
  beforeUnmount(el) {
    const state: InternalState | undefined = (el as any).__motion
    state?.observer?.disconnect()
  },
}
