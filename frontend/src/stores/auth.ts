import { defineStore } from 'pinia'
import { api } from '@/services/api'
import { connectWebSocket, disconnectWebSocket } from '@/services/ws'

export interface AuthUser {
  id: string
  email: string
  full_name: string | null
  tenant_id: string | null
  is_superuser: boolean
  roles: string[]
  permissions: string[]
}

interface State {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
}

const TOKEN_KEY = 'omnidesk.tokens'

function loadTokens(): { access: string | null; refresh: string | null } {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return { access: null, refresh: null }
    const parsed = JSON.parse(raw)
    return { access: parsed.access ?? null, refresh: parsed.refresh ?? null }
  } catch {
    return { access: null, refresh: null }
  }
}

function saveTokens(access: string | null, refresh: string | null) {
  if (!access) localStorage.removeItem(TOKEN_KEY)
  else localStorage.setItem(TOKEN_KEY, JSON.stringify({ access, refresh }))
}

export const useAuthStore = defineStore('auth', {
  state: (): State => {
    const { access, refresh } = loadTokens()
    return { user: null, accessToken: access, refreshToken: refresh }
  },
  getters: {
    isAuthenticated: (s) => !!s.accessToken,
    hasPermission: (s) => (code: string) =>
      !!s.user && (s.user.is_superuser || s.user.permissions.includes(code)),
  },
  actions: {
    setTokens(access: string, refresh: string) {
      this.accessToken = access
      this.refreshToken = refresh
      saveTokens(access, refresh)
      connectWebSocket(access)
    },
    async login(email: string, password: string) {
      const { data } = await api.post('/auth/login', { email, password })
      this.setTokens(data.tokens.access_token, data.tokens.refresh_token)
      this.user = data.user
    },
    async register(payload: {
      tenant_name: string
      tenant_slug: string
      email: string
      password: string
      full_name?: string
    }) {
      const { data } = await api.post('/auth/register', payload)
      this.setTokens(data.tokens.access_token, data.tokens.refresh_token)
      this.user = data.user
    },
    async fetchMe() {
      const { data } = await api.get<AuthUser>('/auth/me')
      this.user = data
      if (this.accessToken) connectWebSocket(this.accessToken)
    },
    async tryRefresh(): Promise<boolean> {
      if (!this.refreshToken) return false
      try {
        const { data } = await api.post('/auth/refresh', { refresh_token: this.refreshToken })
        this.setTokens(data.access_token, data.refresh_token)
        return true
      } catch {
        return false
      }
    },
    logout() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      saveTokens(null, null)
      disconnectWebSocket()
    },
  },
})
