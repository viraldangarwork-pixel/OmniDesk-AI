import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Reactive permission/role checks bound to the current user.
 *
 * Prefer this over reading the auth store directly — results stay reactive
 * when the user refreshes their profile (e.g. after an admin changes their
 * role) and the API surface is stable even if the underlying user shape
 * evolves.
 *
 *   const can = useCan()
 *   if (can.permission('contacts.create')) …
 *   if (can.any(['inbox.read', 'inbox.manage'])) …
 *   if (can.role('admin')) …
 *   computed(() => can.permission('leads.delete'))
 */
export function useCan() {
  const auth = useAuthStore()

  const isSuperuser = computed(() => !!auth.user?.is_superuser)

  function permission(code: string) {
    if (!auth.user) return false
    if (auth.user.is_superuser) return true
    return auth.user.permissions.includes(code)
  }

  function role(code: string) {
    if (!auth.user) return false
    if (auth.user.is_superuser) return true
    return auth.user.roles.includes(code)
  }

  function any(codes: readonly string[]) {
    if (!auth.user) return false
    if (auth.user.is_superuser) return true
    return codes.some((c) => auth.user!.permissions.includes(c))
  }

  function all(codes: readonly string[]) {
    if (!auth.user) return false
    if (auth.user.is_superuser) return true
    return codes.every((c) => auth.user!.permissions.includes(c))
  }

  function anyRole(codes: readonly string[]) {
    if (!auth.user) return false
    if (auth.user.is_superuser) return true
    return codes.some((c) => auth.user!.roles.includes(c))
  }

  return { permission, role, any, all, anyRole, isSuperuser }
}
