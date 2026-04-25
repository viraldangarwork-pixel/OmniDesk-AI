import type { App } from 'vue'
import type { Router } from 'vue-router'

/**
 * Frontend error monitoring.
 *
 * Sentry is loaded lazily and only when `VITE_SENTRY_DSN` is configured —
 * dev builds and self-hosted deployments without monitoring keys ship
 * zero observability code.  The dynamic import lets the bundler split
 * @sentry/vue into its own `vendor-sentry` chunk (see vite.config).
 *
 *   import { initMonitoring, captureError } from '@/services/monitoring'
 *   initMonitoring(app, router)
 *
 *   try { … } catch (err) { captureError(err, { scope: 'inbox.send' }) }
 */

let initialised = false
type SentryNs = typeof import('@sentry/vue')
let sentry: SentryNs | null = null

interface MonitoringOptions {
  dsn?: string
  environment?: string
  release?: string
  /** 0..1 — fraction of transactions to record. Defaults to 10 % in prod. */
  tracesSampleRate?: number
}

export async function initMonitoring(
  app: App,
  router: Router,
  options: MonitoringOptions = {},
): Promise<void> {
  if (initialised) return
  const dsn = options.dsn ?? import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return // monitoring disabled — no-op

  try {
    sentry = await import('@sentry/vue')
    sentry.init({
      app,
      dsn,
      environment: options.environment ?? import.meta.env.MODE,
      release: options.release ?? import.meta.env.VITE_RELEASE,
      integrations: [sentry.browserTracingIntegration({ router })],
      tracesSampleRate:
        options.tracesSampleRate ??
        (import.meta.env.PROD ? 0.1 : 0),
      // Strip everything that looks like a JWT or session cookie before
      // events leave the browser.
      beforeSend(event) {
        const headers = event.request?.headers
        if (headers) delete headers.Authorization
        return event
      },
    })
    initialised = true
  } catch (err) {
    // Don't let a monitoring failure break the app.
    console.warn('[monitoring] failed to initialise', err)
  }
}

export function captureError(
  err: unknown,
  context?: { scope?: string; extra?: Record<string, unknown> },
): void {
  if (!sentry) {
    if (import.meta.env.DEV) console.error('[capture]', context?.scope, err)
    return
  }
  sentry.captureException(err, { tags: context?.scope ? { scope: context.scope } : undefined, extra: context?.extra })
}
