import type { Directive, DirectiveBinding } from 'vue'
import { useAuthStore } from '@/stores/auth'

type Input = string | readonly string[]

interface Modifiers {
  /** Hide via `visibility: hidden` — preserves layout. */
  hide?: boolean
  /** Keep the element mounted but disable it (adds `disabled` + `aria-disabled`). */
  disable?: boolean
  /** When used with multiple codes, require ALL instead of ANY. */
  all?: boolean
  /** When used with multiple codes, require ANY (default). */
  any?: boolean
}

/**
 * Scopes the check against roles instead of permissions.  Activated via
 * `v-can:role="'admin'"` or `v-can:role="['admin','manager']"`.
 */
type Arg = 'role' | 'permission' | undefined

interface State {
  original: {
    parent: Node | null
    next: Node | null
    visibility: string
    disabled: string | null
    ariaDisabled: string | null
  }
  removed: boolean
}

function normalize(input: Input): string[] {
  return typeof input === 'string' ? [input] : Array.from(input)
}

function allowed(input: Input, modifiers: Modifiers, arg: Arg): boolean {
  const auth = useAuthStore()
  if (!auth.user) return false
  if (auth.user.is_superuser) return true

  const codes = normalize(input)
  const source = arg === 'role' ? auth.user.roles : auth.user.permissions

  // Default is ANY; explicit `.all` modifier flips to AND.
  if (modifiers.all && !modifiers.any) {
    return codes.every((c) => source.includes(c))
  }
  return codes.some((c) => source.includes(c))
}

function saveOriginal(el: HTMLElement): State {
  return {
    original: {
      parent: el.parentNode,
      next: el.nextSibling,
      visibility: el.style.visibility,
      disabled: el.getAttribute('disabled'),
      ariaDisabled: el.getAttribute('aria-disabled'),
    },
    removed: false,
  }
}

function apply(el: HTMLElement, binding: DirectiveBinding<Input>) {
  if (!binding.value) return
  const mods = binding.modifiers as Modifiers
  const arg = binding.arg as Arg
  const state = ((el as unknown) as { __can?: State }).__can ?? saveOriginal(el)
  ;((el as unknown) as { __can?: State }).__can = state

  const ok = allowed(binding.value, mods, arg)

  if (ok) {
    // Restore visibility / enabled state and re-insert if we removed it.
    if (state.removed && state.original.parent) {
      state.original.parent.insertBefore(el, state.original.next)
      state.removed = false
    }
    el.style.visibility = state.original.visibility
    if (state.original.disabled === null) el.removeAttribute('disabled')
    else el.setAttribute('disabled', state.original.disabled)
    if (state.original.ariaDisabled === null) el.removeAttribute('aria-disabled')
    else el.setAttribute('aria-disabled', state.original.ariaDisabled)
    return
  }

  if (mods.disable) {
    el.setAttribute('disabled', '')
    el.setAttribute('aria-disabled', 'true')
    return
  }
  if (mods.hide) {
    el.style.visibility = 'hidden'
    return
  }
  // Default: remove from DOM entirely.
  if (!state.removed && el.parentNode) {
    el.parentNode.removeChild(el)
    state.removed = true
  }
}

/**
 * v-can directive
 *
 *   <UiButton v-can="'contacts.create'">New</UiButton>
 *   <UiButton v-can="['contacts.create', 'contacts.update']">…       <!-- ANY -->
 *   <UiButton v-can.all="['contacts.read', 'inbox.read']">…          <!-- ALL -->
 *   <UiButton v-can:role="'admin'">…                                 <!-- role check -->
 *   <UiButton v-can.disable="'contacts.delete'">…                    <!-- keep, but disabled -->
 *   <UiButton v-can.hide="'contacts.delete'">…                       <!-- keep layout slot -->
 *
 * Server-side enforcement is still required — this directive improves UX,
 * not security.  Backend endpoints continue to reject unauthorised calls.
 */
export const vCan: Directive<HTMLElement, Input> = {
  mounted: apply,
  updated: apply,
  unmounted(el) {
    delete ((el as unknown) as { __can?: State }).__can
  },
}
