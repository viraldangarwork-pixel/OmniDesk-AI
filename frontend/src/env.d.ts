/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_WS_URL?: string
  /** Sentry DSN — when unset, monitoring stays disabled and the
   *  `@sentry/vue` chunk is never loaded. */
  readonly VITE_SENTRY_DSN?: string
  /** Build identifier surfaced to Sentry as `release`. */
  readonly VITE_RELEASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.json' {
  const value: Record<string, unknown>
  export default value
}
