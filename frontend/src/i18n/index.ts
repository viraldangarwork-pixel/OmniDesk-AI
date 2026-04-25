import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'

/**
 * i18n is initialised with English eagerly so the first paint never has
 * missing keys.  Additional locales lazy-load via `loadLocale(code)` and
 * are cached — subsequent switches are synchronous.
 */
export const SUPPORTED_LOCALES = ['en', 'es'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

const STORAGE_KEY = 'omnidesk.locale'

function detect(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (saved && SUPPORTED_LOCALES.includes(saved)) return saved
  } catch {
    /* no-op */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2) : ''
  return (SUPPORTED_LOCALES as readonly string[]).includes(nav) ? (nav as Locale) : DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false,
  locale: detect(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: { en },
  missingWarn: false,
  fallbackWarn: false,
})

const loaded = new Set<Locale>(['en'])

export async function loadLocale(code: Locale): Promise<void> {
  if (loaded.has(code)) return
  const dict = await import(`@/locales/${code}.json`)
  i18n.global.setLocaleMessage(code, dict.default ?? dict)
  loaded.add(code)
}

export async function setLocale(code: Locale): Promise<void> {
  await loadLocale(code)
  i18n.global.locale.value = code
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    /* no-op */
  }
  if (typeof document !== 'undefined') document.documentElement.lang = code
}
