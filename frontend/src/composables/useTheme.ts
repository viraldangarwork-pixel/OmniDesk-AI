import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * Theme handling — light / dark / system.
 *
 *   const theme = useTheme()
 *   theme.mode.value  // 'light' | 'dark' | 'system'
 *   theme.resolved.value  // 'light' | 'dark' — the one currently applied
 *   theme.setMode('dark')
 *
 * The mode is persisted to localStorage under `omnidesk.theme`.
 * `system` follows `prefers-color-scheme` and re-applies live when the
 * OS setting flips.
 */

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'omnidesk.theme'
const DARK_CLASS = 'dark'

const mode = ref<ThemeMode>(load())
const systemDark = ref(prefersDark())

function load(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {
    /* no-op */
  }
  return 'system'
}

function prefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function apply(dark: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle(DARK_CLASS, dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

const resolved = computed<'light' | 'dark'>(() => {
  if (mode.value === 'system') return systemDark.value ? 'dark' : 'light'
  return mode.value
})

// Centralised effect — runs in the module scope so the class is applied
// before the first paint even if no component has imported this yet.
watch(
  resolved,
  (v) => apply(v === 'dark'),
  { immediate: true },
)

function setMode(next: ThemeMode) {
  mode.value = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* no-op */
  }
}

export function useTheme() {
  // Wire up the OS-level prefers-color-scheme listener exactly once per
  // consumer; the ref is shared across all callers.
  let mq: MediaQueryList | null = null
  const onChange = (e: MediaQueryListEvent) => (systemDark.value = e.matches)

  onMounted(() => {
    if (typeof window === 'undefined') return
    mq = window.matchMedia?.('(prefers-color-scheme: dark)') ?? null
    mq?.addEventListener?.('change', onChange)
  })
  onBeforeUnmount(() => mq?.removeEventListener?.('change', onChange))

  return {
    mode,
    resolved,
    setMode,
    isDark: computed(() => resolved.value === 'dark'),
  }
}
