/**
 * Per-tenant brand colour overrides.
 *
 * The Tailwind theme references `--brand-{50..900}` CSS variables so we
 * can re-skin the entire app by writing to `document.documentElement`
 * at runtime — no rebuild, no cache bust.
 *
 *   applyBranding({ accent: '#7c3aed' })
 *
 * For a single hex we derive the ramp procedurally by shifting
 * lightness in HSL space.  Tenants with a full palette can pass the
 * whole object; unspecified steps fall back to the defaults in
 * assets/main.css.
 */

export interface BrandPalette {
  accent: string
  ramp?: Partial<Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>>
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return null
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h *= 60
  }
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ]
}

const STEPS: Array<[keyof NonNullable<BrandPalette['ramp']>, number]> = [
  [50, 0.95],
  [100, 0.88],
  [200, 0.78],
  [300, 0.67],
  [400, 0.58],
  [500, 0.5],
  [600, 0.43],
  [700, 0.36],
  [800, 0.3],
  [900, 0.25],
]

export function applyBranding({ accent, ramp }: BrandPalette): void {
  const rgb = hexToRgb(accent)
  if (!rgb) return
  const [h, s] = rgbToHsl(...rgb)
  const root = document.documentElement

  for (const [step, l] of STEPS) {
    const override = ramp?.[step]
    if (override) {
      const rgbOverride = hexToRgb(override)
      if (rgbOverride) {
        root.style.setProperty(`--brand-${step}`, rgbOverride.join(' '))
        continue
      }
    }
    const derived = hslToRgb(h, Math.min(1, s), l)
    root.style.setProperty(`--brand-${step}`, derived.join(' '))
  }
}

/** Restore the default palette (drops all runtime overrides). */
export function resetBranding(): void {
  const root = document.documentElement
  for (const [step] of STEPS) root.style.removeProperty(`--brand-${step}`)
}
