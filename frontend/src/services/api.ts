import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import type { ApiError, ApiErrorBody } from '@/types/api'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 20000,
})

/**
 * Extended per-request options we honor on top of Axios's own config.
 */
export interface RequestOptions {
  /**
   * Abort signal.  Prefer `makeAbortable()` helper over constructing this
   * manually — it ties cancellation to component unmount.
   */
  signal?: AbortSignal
  /**
   * If provided, the interceptor will NOT emit a toast on failure —
   * the caller has opted-in to handle the error itself.  Same effect as
   * catching the rejection directly, but clearer at the call site.
   */
  silent?: boolean
  /** Opt out of the 401-retry flow (e.g. for /auth/login itself). */
  skipAuthRefresh?: boolean
}

type Config = InternalAxiosRequestConfig & {
  _retry?: boolean
  silent?: boolean
  skipAuthRefresh?: boolean
}

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const config = error.config as Config | undefined
    const auth = useAuthStore()
    const status = error.response?.status ?? 0

    // 401 → attempt silent refresh + replay original request exactly once.
    const isAuthRoute = !!config?.url?.includes('/auth/')
    if (
      status === 401 &&
      auth.refreshToken &&
      !isAuthRoute &&
      !config?._retry &&
      !config?.skipAuthRefresh
    ) {
      const refreshed = await auth.tryRefresh()
      if (refreshed && config) {
        config._retry = true
        config.headers.Authorization = `Bearer ${auth.accessToken}`
        return api.request(config)
      }
      auth.logout()
    }

    const normalized = normalizeError(error)

    // Broadcast via toast unless caller opted out or user-agent cancelled.
    const cancelled = axios.isCancel(error) || error.code === 'ERR_CANCELED'
    if (!cancelled && !config?.silent) {
      emitToast(normalized)
    }

    return Promise.reject(normalized)
  },
)

function normalizeError(error: AxiosError<ApiErrorBody>): ApiError {
  const status = error.response?.status ?? 0
  const body = error.response?.data
  let message = error.message || 'Request failed'
  const fieldErrors: Record<string, string> = {}

  if (body?.detail) {
    if (typeof body.detail === 'string') {
      message = body.detail
    } else if (Array.isArray(body.detail)) {
      for (const v of body.detail) {
        const field = v.loc?.filter((x) => x !== 'body').join('.') || '_'
        fieldErrors[field] = v.msg
      }
      message = body.detail[0]?.msg ?? message
    }
  } else if (status === 0) {
    message = 'Network error — please check your connection.'
  } else if (status === 403) {
    message = 'You don’t have permission to do that.'
  } else if (status === 404) {
    message = 'Not found.'
  } else if (status >= 500) {
    message = 'Server error — please try again shortly.'
  }

  return { status, message, fieldErrors, cause: error }
}

function emitToast(err: ApiError) {
  // 401 is already handled by the auth flow; avoid double-notifying.
  if (err.status === 401) return
  try {
    useToastStore().push({ kind: 'error', title: 'Request failed', description: err.message })
  } catch {
    /* Pinia may not be initialised in some test contexts */
  }
}

/**
 * Convenience wrapper that returns an AbortController tied to a disposable
 * cleanup function — useful inside `onBeforeUnmount` to cancel in-flight
 * requests when the view unmounts.
 */
export function makeAbortable() {
  const controller = new AbortController()
  return {
    signal: controller.signal,
    cancel: (reason?: string) => controller.abort(reason),
  }
}

/** Type-narrowing alias for passing our extended options into axios. */
export function withOptions(opts: RequestOptions): AxiosRequestConfig {
  return opts as AxiosRequestConfig
}
