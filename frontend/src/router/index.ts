import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
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
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/modules/dashboard/DashboardView.vue'),
      },
      {
        path: 'inbox',
        name: 'inbox',
        component: () => import('@/modules/inbox/InboxView.vue'),
        children: [
          {
            path: ':id',
            name: 'inbox-conversation',
            component: () => import('@/modules/inbox/InboxView.vue'),
          },
        ],
      },
      {
        path: 'contacts',
        name: 'contacts',
        component: () => import('@/modules/crm/ContactsView.vue'),
      },
      {
        path: 'leads',
        name: 'leads',
        component: () => import('@/modules/crm/LeadsBoardView.vue'),
      },
      {
        path: 'ai-agents',
        name: 'ai-agents',
        component: () => import('@/modules/ai-agents/AIAgentsView.vue'),
      },
      {
        path: 'knowledge-base',
        name: 'knowledge-base',
        component: () => import('@/modules/kb/KnowledgeBaseView.vue'),
      },
      {
        path: 'workflows',
        name: 'workflows',
        component: () => import('@/modules/workflows/WorkflowsView.vue'),
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('@/modules/analytics/ReportsView.vue'),
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/modules/settings/UsersView.vue'),
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/modules/settings/SettingsView.vue'),
      },
      {
        path: 'billing',
        name: 'billing',
        component: () => import('@/modules/billing/BillingView.vue'),
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

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.accessToken) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.public && auth.accessToken && (to.name === 'login' || to.name === 'register')) {
    return { name: 'dashboard' }
  }
  return true
})

export default router
