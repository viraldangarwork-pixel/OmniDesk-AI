import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useCan } from '@/composables/useCan'

function asUser(overrides: Partial<{ permissions: string[]; roles: string[]; is_superuser: boolean }>) {
  return {
    id: '1',
    email: 'u@example.com',
    full_name: null,
    tenant_id: 't1',
    is_superuser: false,
    roles: [],
    permissions: [],
    ...overrides,
  }
}

describe('useCan', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('returns false for everything when no user is loaded', () => {
    const can = useCan()
    expect(can.permission('contacts.manage')).toBe(false)
    expect(can.role('admin')).toBe(false)
    expect(can.any(['a', 'b'])).toBe(false)
    expect(can.all(['a'])).toBe(false)
  })

  it('checks explicit permission codes', () => {
    const auth = useAuthStore()
    auth.user = asUser({ permissions: ['contacts.manage'] })
    const can = useCan()
    expect(can.permission('contacts.manage')).toBe(true)
    expect(can.permission('billing.manage')).toBe(false)
  })

  it('short-circuits for superuser', () => {
    const auth = useAuthStore()
    auth.user = asUser({ is_superuser: true })
    const can = useCan()
    expect(can.permission('anything.whatever')).toBe(true)
    expect(can.role('anything')).toBe(true)
    expect(can.all(['a', 'b', 'c'])).toBe(true)
  })

  it('any() matches on at least one code', () => {
    const auth = useAuthStore()
    auth.user = asUser({ permissions: ['inbox.read'] })
    const can = useCan()
    expect(can.any(['inbox.read', 'inbox.write'])).toBe(true)
    expect(can.any(['inbox.write', 'billing.manage'])).toBe(false)
  })

  it('all() requires every code', () => {
    const auth = useAuthStore()
    auth.user = asUser({ permissions: ['inbox.read'] })
    const can = useCan()
    expect(can.all(['inbox.read'])).toBe(true)
    expect(can.all(['inbox.read', 'inbox.write'])).toBe(false)
  })

  it('role() checks role membership', () => {
    const auth = useAuthStore()
    auth.user = asUser({ roles: ['admin'] })
    const can = useCan()
    expect(can.role('admin')).toBe(true)
    expect(can.role('owner')).toBe(false)
  })
})
