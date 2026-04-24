/**
 * Shared helpers for resource modules.  Keeping these in one place ensures
 * every module speaks the same HTTP dialect (signal threading, error
 * normalisation via the global interceptor, etc.).
 */
import type { AxiosRequestConfig } from 'axios'
import { api, withOptions, type RequestOptions } from '@/services/api'

export interface ReadOptions extends RequestOptions {
  /** Abort signal threaded in from TanStack Query's queryFn. */
  signal?: AbortSignal
  /** Query-string params. */
  params?: Record<string, unknown>
}

export function buildConfig(opts?: ReadOptions): AxiosRequestConfig {
  if (!opts) return {}
  const { params, signal, silent, skipAuthRefresh } = opts
  const extended = withOptions({ signal, silent, skipAuthRefresh })
  return { ...extended, params }
}

export async function GET<T>(path: string, opts?: ReadOptions): Promise<T> {
  const { data } = await api.get<T>(path, buildConfig(opts))
  return data
}

export async function POST<T, B = unknown>(
  path: string,
  body?: B,
  opts?: RequestOptions,
): Promise<T> {
  const { data } = await api.post<T>(path, body, withOptions(opts ?? {}))
  return data
}

export async function PUT<T, B = unknown>(
  path: string,
  body?: B,
  opts?: RequestOptions,
): Promise<T> {
  const { data } = await api.put<T>(path, body, withOptions(opts ?? {}))
  return data
}

export async function PATCH<T, B = unknown>(
  path: string,
  body?: B,
  opts?: RequestOptions,
): Promise<T> {
  const { data } = await api.patch<T>(path, body, withOptions(opts ?? {}))
  return data
}

export async function DELETE<T = void>(path: string, opts?: RequestOptions): Promise<T> {
  const { data } = await api.delete<T>(path, withOptions(opts ?? {}))
  return data
}
