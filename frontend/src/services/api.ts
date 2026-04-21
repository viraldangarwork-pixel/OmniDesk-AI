import axios, { AxiosError, type AxiosInstance } from 'axios'
import { useAuthStore } from '@/stores/auth'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const auth = useAuthStore()
    if (error.response?.status === 401 && auth.refreshToken && !error.config?.url?.includes('/auth/')) {
      const refreshed = await auth.tryRefresh()
      if (refreshed && error.config) {
        error.config.headers.Authorization = `Bearer ${auth.accessToken}`
        return api.request(error.config)
      }
      auth.logout()
    }
    return Promise.reject(error)
  },
)
