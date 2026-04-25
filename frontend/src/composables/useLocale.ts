import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, setLocale, type Locale } from '@/i18n'

/**
 * Thin wrapper around vue-i18n's composable that plays nicely with our
 * persistence layer.  Use this instead of touching `i18n.global.locale`
 * directly so local-storage + <html lang> stay in sync.
 *
 *   const { t, current, setTo } = useLocale()
 *   setTo('es')
 */
export function useLocale() {
  const { t, locale } = useI18n()
  const current = computed(() => locale.value as Locale)
  return {
    t,
    current,
    available: SUPPORTED_LOCALES,
    setTo: (code: Locale) => setLocale(code),
  }
}
