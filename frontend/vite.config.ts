import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

/**
 * Build chunking strategy — keeps route-level chunks tiny by pushing
 * heavyweight deps into long-lived vendor bundles that ship once and
 * cache across deploys.  Group names match the cache-bust unit we
 * actually want to evict (vendor-query vs app code, not both
 * together).
 */
function chunkFor(id: string): string | undefined {
  if (!id.includes('node_modules')) return
  if (/\/(vue|@vue|vue-router|pinia)\//.test(id)) return 'vendor-core'
  if (/@tanstack\//.test(id)) return 'vendor-query'
  if (/chart\.js|vue-chartjs/.test(id)) return 'vendor-charts'
  if (/date-fns/.test(id)) return 'vendor-dates'
  if (/@vueuse\//.test(id)) return 'vendor-vueuse'
  if (/socket\.io-client/.test(id)) return 'vendor-ws'
  if (/@sentry\//.test(id)) return 'vendor-sentry'
  if (/vue-i18n|@intlify/.test(id)) return 'vendor-i18n'
  return 'vendor'
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    // Warn (don't fail) if a single chunk grows past ~300kB gzipped —
    // our design-system + view chunks should all fit well under.
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks: chunkFor,
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: { usePolling: true },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
