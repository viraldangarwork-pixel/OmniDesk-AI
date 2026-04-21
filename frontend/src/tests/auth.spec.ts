import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts unauthenticated', () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBeNull()
  })

  it('logout clears tokens and user', () => {
    const auth = useAuthStore()
    auth.accessToken = 'abc'
    auth.refreshToken = 'def'
    auth.user = {
      id: '1',
      email: 'x@y.z',
      full_name: null,
      tenant_id: null,
      is_superuser: false,
      roles: [],
      permissions: [],
    }
    auth.logout()
    expect(auth.accessToken).toBeNull()
    expect(auth.user).toBeNull()
  })
})
