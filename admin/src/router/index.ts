import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const LoginPage = () => import('@/pages/LoginPage.vue')
const NotFoundPage = () => import('@/pages/NotFoundPage.vue')

// Admin Suite
const AdminLayout = () => import('@/components/admin/AdminLayout.vue')
const AdminOverviewPage = () => import('@/pages/admin/AdminOverviewPage.vue')
const AdminUsersPage = () => import('@/pages/admin/AdminUsersPage.vue')
const AdminListingsPage = () => import('@/pages/admin/AdminListingsPage.vue')
const AdminDisputesPage = () => import('@/pages/admin/AdminDisputesPage.vue')
const AdminKycPage = () => import('@/pages/admin/AdminKycPage.vue')
const AdminFinancialsPage = () => import('@/pages/admin/AdminFinancialsPage.vue')
const AdminMonitoringPage = () => import('@/pages/admin/AdminMonitoringPage.vue')
const AdminAnalyticsPage = () => import('@/pages/admin/AdminAnalyticsPage.vue')
const AdminMediaPage = () => import('@/pages/admin/AdminMediaPage.vue')
const AdminSettingsPage = () => import('@/pages/admin/AdminSettingsPage.vue')
const AdminDesignPage = () => import('@/pages/admin/AdminDesignPage.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { title: 'iTorgo Admin - Вход в систему', requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/admin/overview'
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { title: 'iTorgo - Админ Панель', requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/overview'
      },
      {
        path: 'overview',
        name: 'AdminOverview',
        component: AdminOverviewPage,
        meta: { title: 'iTorgo Admin - Обзор (Overview)', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: AdminUsersPage,
        meta: { title: 'iTorgo Admin - Пользователи (Users)', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'listings',
        name: 'AdminListings',
        component: AdminListingsPage,
        meta: { title: 'iTorgo Admin - Модерация лотов (Listings)', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'disputes',
        name: 'AdminDisputes',
        component: AdminDisputesPage,
        meta: { title: 'iTorgo Admin - Споры и претензии (Disputes)', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'kyc',
        name: 'AdminKyc',
        component: AdminKycPage,
        meta: { title: 'iTorgo Admin - Проверка KYC (Approvals)', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'financials',
        name: 'AdminFinancials',
        component: AdminFinancialsPage,
        meta: { title: 'iTorgo Admin - Финансы и платежи (Financials)', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'monitoring',
        name: 'AdminMonitoring',
        component: AdminMonitoringPage,
        meta: { title: 'iTorgo Admin - Живой мониторинг (War Room)', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'analytics',
        name: 'AdminAnalytics',
        component: AdminAnalyticsPage,
        meta: { title: 'iTorgo Admin - Аналитика (Analytics)', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'media',
        name: 'AdminMedia',
        component: AdminMediaPage,
        meta: { title: 'iTorgo Admin - Медиатека (Media Library)', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: AdminSettingsPage,
        meta: { title: 'iTorgo Admin - Общие настройки (Settings)', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'design',
        name: 'AdminDesign',
        component: AdminDesignPage,
        meta: { title: 'iTorgo Admin - Дизайн и тема (Theme Studio)', requiresAuth: true, requiresAdmin: true }
      }
    ]
  },
  { path: '/overview', redirect: '/admin/overview' },
  { path: '/users', redirect: '/admin/users' },
  { path: '/listings', redirect: '/admin/listings' },
  { path: '/disputes', redirect: '/admin/disputes' },
  { path: '/kyc', redirect: '/admin/kyc' },
  { path: '/financials', redirect: '/admin/financials' },
  { path: '/monitoring', redirect: '/admin/monitoring' },
  { path: '/analytics', redirect: '/admin/analytics' },
  { path: '/media', redirect: '/admin/media' },
  { path: '/settings', redirect: '/admin/settings' },
  { path: '/design', redirect: '/admin/design' },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundPage,
    meta: { title: 'iTorgo Admin - Страница не найдена', requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory((import.meta as any).env?.BASE_URL || '/'),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, behavior: 'smooth' }
  }
})

// Route protection for Admin Panel
router.beforeEach((to, _from, next) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  let user: any = null
  if (userJson) {
    try { user = JSON.parse(userJson) } catch {}
  }

  // Admin route check
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (!token || !user) {
      return next({ path: '/login', query: { redirect: to.fullPath } })
    }
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return next({ path: '/login', query: { unauthorized: '1' } })
    }
  }

  // General auth check
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token || !user) {
      return next({ path: '/login', query: { redirect: to.fullPath } })
    }
  }

  next()
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title as string
  } else {
    document.title = 'iTorgo - Админ Панель'
  }
})

export { router }
export default router