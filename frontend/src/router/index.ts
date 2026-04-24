import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { P } from '@/auth/permissions'

/**
 * Route meta contract
 * -------------------
 *   requiresAuth        boolean   — gated behind login
 *   public              boolean   — excluded from auth redirects
 *   permission          string    — must hold this single permission
 *   permissionsAny      string[]  — must hold ANY of these
 *   permissionsAll      string[]  — must hold ALL of these
 *   role                string    — must hold this role
 *
 * Super-users bypass every permission / role check.  The guard checks
 * auth BEFORE permissions, so an expired session falls back to /login
 * with the original path preserved in ?redirect=.
 */
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    public?: boolean
    layout?: 'app' | 'auth'
    permission?: string
    permissionsAny?: readonly string[]
    permissionsAll?: readonly string[]
    role?: string
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },

  /* -------------------- Public auth screens -------------------- */
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/LoginView.vue'),
    meta: { public: true, layout: 'auth' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/modules/auth/RegisterView.vue'),
    meta: { public: true, layout: 'auth' },
  },
  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('@/modules/common/ForbiddenView.vue'),
    meta: { public: true, layout: 'auth' },
  },

  /* -------------------- Authenticated shell -------------------- */
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/modules/dashboard/DashboardView.vue'),
        meta: { permission: P.analytics.read },
      },
      {
        path: 'inbox',
        name: 'inbox',
        component: () => import('@/modules/inbox/InboxView.vue'),
        meta: { permission: P.inbox.read },
        children: [
          {
            path: ':id',
            name: 'inbox-conversation',
            component: () => import('@/modules/inbox/InboxView.vue'),
            meta: { permission: P.inbox.read },
          },
        ],
      },
      {
        path: 'contacts',
        name: 'contacts',
        component: () => import('@/modules/crm/ContactsView.vue'),
        meta: { permission: P.contacts.manage },
      },
      {
        path: 'leads',
        name: 'leads',
        component: () => import('@/modules/crm/LeadsBoardView.vue'),
        meta: { permission: P.leads.manage },
      },
      {
        path: 'ai-agents',
        name: 'ai-agents',
        component: () => import('@/modules/ai-agents/AIAgentsView.vue'),
        meta: { permission: P.ai.manage },
      },
      {
        path: 'knowledge-base',
        name: 'knowledge-base',
        component: () => import('@/modules/kb/KnowledgeBaseView.vue'),
        meta: { permission: P.kb.manage },
      },
      {
        path: 'workflows',
        name: 'workflows',
        component: () => import('@/modules/workflows/WorkflowsView.vue'),
        meta: { permission: P.workflows.manage },
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('@/modules/analytics/ReportsView.vue'),
        meta: { permission: P.analytics.read },
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/modules/settings/UsersView.vue'),
        meta: { permission: P.users.read },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/modules/settings/SettingsView.vue'),
        meta: { permission: P.tenants.manage },
      },
      {
        path: 'billing',
        name: 'billing',
        component: () => import('@/modules/billing/BillingView.vue'),
        meta: { permission: P.billing.manage },
      },
    ],
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/modules/common/NotFoundView.vue'),
    meta: { public: true, layout: 'auth' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * Collect every required permission / role across the matched route chain
 * so nested routes inherit their parents' guards automatically.
 */
function collectGuards(to: Parameters<typeof router.beforeEach>[0] extends (to: infer T) => unknown ? T : never) {
  const permAll = new Set<string>()
  const permAny: string[][] = []
  const roles: string[] = []

  for (const record of to.matched) {
    const m = record.meta
    if (m.permission) permAll.add(m.permission)
    if (m.permissionsAll) for (const p of m.permissionsAll) permAll.add(p)
    if (m.permissionsAny) permAny.push(Array.from(m.permissionsAny))
    if (m.role) roles.push(m.role)
  }
  return { permAll: Array.from(permAll), permAny, roles }
}

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Authenticated users landing on login/register should go to the app.
  if (to.meta.public && auth.accessToken && (to.name === 'login' || to.name === 'register')) {
    return { name: 'dashboard' }
  }

  // Public routes (login, register, forbidden, 404) always render.
  if (to.meta.public) return true

  // Anything else implicitly requires auth when the matched chain says so.
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth)
  if (requiresAuth && !auth.accessToken) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Load the user profile eagerly before evaluating permissions.  Doing
  // this here (rather than in App.vue) means permission guards always
  // have data to work with, even on a cold reload directly into a
  // restricted URL.
  if (auth.accessToken && !auth.user) {
    try {
      await auth.fetchMe()
    } catch {
      auth.logout()
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }
  if (!auth.user) return { name: 'login', query: { redirect: to.fullPath } }

  const { permAll, permAny, roles } = collectGuards(to)

  if (auth.user.is_superuser) return true

  for (const code of permAll) {
    if (!auth.user.permissions.includes(code)) return { name: 'forbidden' }
  }
  for (const group of permAny) {
    if (!group.some((c) => auth.user!.permissions.includes(c))) {
      return { name: 'forbidden' }
    }
  }
  for (const code of roles) {
    if (!auth.user.roles.includes(code)) return { name: 'forbidden' }
  }

  return true
})

export default router
