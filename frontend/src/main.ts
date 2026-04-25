import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { vMotion } from './directives/motion'
import { vCan } from './directives/can'
import { initMonitoring } from './services/monitoring'
import './assets/main.css'

/**
 * TanStack Vue Query defaults tuned for a CRM/Inbox workload:
 *
 * - staleTime: 30s  — lists feel "live" without thundering the API on every
 *   remount.  Realtime pushes via WebSocket invalidate the relevant keys,
 *   which overrides staleness on demand.
 * - gcTime: 5min   — keeps recently-unmounted views warm (back-nav is snappy)
 *   without hoarding memory.
 * - retry: 1       — axios already has no retry; we give one cheap retry
 *   so a transient network blip doesn't flash an error state.
 * - refetchOnWindowFocus: false — too aggressive for data-dense dashboards;
 *   we rely on the explicit invalidation path instead.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(VueQueryPlugin, { queryClient })
app.directive('motion', vMotion)
app.directive('can', vCan)

// Lazy: only loads @sentry/vue when VITE_SENTRY_DSN is configured.
void initMonitoring(app, router)

app.mount('#app')
