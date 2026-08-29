import { watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useI18n } from '@/composables/useI18n'

// Code splitting: only the landing page ships in the entry chunk — every other
// route (and the entire admin suite) is split into its own lazy chunk so
// storefront visitors never download the admin panel bundle.
import LandingPage from '@/pages/LandingPage.vue'

const LiveAuctionsPage = () => import('@/pages/LiveAuctionsPage.vue')
const AuctionDetailPage = () => import('@/pages/AuctionDetailPage.vue')
const CategoriesPage = () => import('@/pages/CategoriesPage.vue')
const SellPage = () => import('@/pages/SellPage.vue')
const DashboardPage = () => import('@/pages/DashboardPage.vue')
const LoginPage = () => import('@/pages/LoginPage.vue')
const RegisterPage = () => import('@/pages/RegisterPage.vue')
const HowItWorksPage = () => import('@/pages/HowItWorksPage.vue')
const AboutPage = () => import('@/pages/AboutPage.vue')
const ContactPage = () => import('@/pages/ContactPage.vue')
const PrivacyPage = () => import('@/pages/PrivacyPage.vue')
const TermsPage = () => import('@/pages/TermsPage.vue')
const NotFoundPage = () => import('@/pages/NotFoundPage.vue')
const PaymentFlow = () => import('@/pages/PaymentFlow.vue')

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

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'LandingPage',
    component: LandingPage,
    meta: { titleKey: 'pageTitle.home', requiresAuth: false }
  },
  {
    path: '/auctions',
    name: 'LiveAuctions',
    component: LiveAuctionsPage,
    alias: ['/canli-acik-artirmalar', '/canlı-açık-artırmalar', '/аукциондор', '/аукционы'],
    meta: { titleKey: 'nav.auctions', requiresAuth: false }
  },
  {
    path: '/auctions/:id',
    name: 'AuctionDetail',
    component: AuctionDetailPage,
    alias: ['/ilan-detail/:id', '/ilan/:id', '/auction/:id'],
    props: true,
    meta: { titleKey: 'pageTitle.auctionDetail', requiresAuth: false }
  },
  {
    path: '/categories',
    name: 'Categories',
    component: CategoriesPage,
    alias: ['/kategoriler', '/категориялар', '/категории'],
    meta: { titleKey: 'categoriesPage.title', requiresAuth: false }
  },
  {
    path: '/sell',
    name: 'Sell',
    component: SellPage,
    alias: ['/sat', '/ilan-ver', '/сатуу', '/продать'],
    meta: { titleKey: 'sell.title', requiresAuth: true }
  },
  {
    path: '/dashboard/:tab?',
    name: 'Dashboard',
    component: DashboardPage,
    alias: ['/dashboard', '/profil', '/profile', '/hesabim'],
    props: true,
    meta: { titleKey: 'dashboard.title', requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    alias: ['/giris', '/auth/login'],
    meta: { titleKey: 'nav.login', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
    alias: ['/kayit', '/kaydol', '/auth/register'],
    meta: { titleKey: 'nav.register', requiresAuth: false }
  },
  {
    path: '/how-it-works',
    name: 'HowItWorks',
    component: HowItWorksPage,
    alias: ['/nasil-calisir', '/nasıl-çalışır'],
    meta: { titleKey: 'howItWorks.title', requiresAuth: false }
  },
  {
    path: '/about',
    name: 'About',
    component: AboutPage,
    alias: ['/hakkimizda', '/hakkımızda'],
    meta: { titleKey: 'about.title', requiresAuth: false }
  },
  {
    path: '/contact',
    name: 'Contact',
    component: ContactPage,
    alias: ['/iletisim', '/iletişim'],
    meta: { titleKey: 'contact.title', requiresAuth: false }
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: PrivacyPage,
    alias: ['/gizlilik', '/gizlilik-politikasi'],
    meta: { titleKey: 'privacy.title', requiresAuth: false }
  },
  {
    path: '/terms',
    name: 'Terms',
    component: TermsPage,
    alias: ['/kullanim-kosullari', '/terms-of-service'],
    meta: { titleKey: 'terms.title', requiresAuth: false }
  },
  {
    path: '/payment',
    name: 'PaymentFlow',
    component: PaymentFlow,
    alias: ['/odeme-flow'],
    meta: { titleKey: 'paymentModal.title', requiresAuth: true }
  },

  // Admin Panel Suite
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
        alias: ['dashboard'],
        meta: { title: 'iTorgo Admin - Общий обзор (Overview)', requiresAuth: true, requiresAdmin: true }
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
        meta: { title: 'iTorgo Admin - Расширенная аналитика (Analytics)', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'media',
        name: 'AdminMedia',
        component: AdminMediaPage,
        meta: { title: 'iTorgo Admin - Медиатека (Media Library)', requiresAuth: true, requiresAdmin: true }
      }
    ]
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundPage,
    meta: { titleKey: 'notFound.title', requiresAuth: false }
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

// Admin panel must be entered via the admin. subdomain (e.g. admin.itorgo.kg),
// never via /admin on the main domain — this SPA ships one bundle for both hosts,
// so the split is enforced here at the router level (server-side JWT role checks
// in server/src/routes/adminRoutes.ts remain the real authorization boundary).
router.beforeEach((to, _from, next) => {
  const isAdminHost = typeof window !== 'undefined' && window.location.hostname.startsWith('admin.')
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  let user: any = null
  if (userJson) {
    try { user = JSON.parse(userJson) } catch {}
  }

  const isAdminRoute = to.matched.some(record => record.meta.requiresAdmin)
  const isLoginRoute = to.name === 'Login'

  // Host/route split: admin subdomain only ever serves /admin* (+ /login, so staff
  // can actually authenticate); main domain never serves /admin*.
  if (isAdminHost) {
    // Login's own post-submit redirect defaults to /dashboard when no ?redirect=
    // is set; on the admin host that must be /admin instead, or the subsequent
    // client-side bounce races the lazy-loaded admin chunk (URL/title update but
    // the view stays on Login). Inject it before Login ever renders.
    if (isLoginRoute && !to.query.redirect) {
      return next({ path: '/login', query: { ...to.query, redirect: '/admin' } })
    }
    if (!isAdminRoute && !isLoginRoute) {
      return next({ path: '/admin' })
    }
  } else if (isAdminRoute) {
    return next({ path: '/', query: { unauthorized: '1' } })
  }

  // Admin route check
  if (isAdminRoute) {
    // If not logged in and no token in localStorage, redirect to login
    if (!token || !user) {
      return next({ path: '/login', query: { redirect: to.fullPath } })
    }
    // If user exists and has a non-staff role (e.g. standard buyer/seller)
    if (user && user.role && !['admin', 'moderator'].includes(user.role)) {
      return next(isAdminHost
        ? { path: '/login', query: { unauthorized: '1' } }
        : { path: '/dashboard', query: { unauthorized: '1' } })
    }
  }

  // General auth route check
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token || !user) {
      return next({ path: '/login', query: { redirect: to.fullPath } })
    }
  }

  next()
})

const { t, locale } = useI18n()

function applyDocumentTitle() {
  const meta = router.currentRoute.value.meta
  if (typeof meta?.titleKey === 'string') {
    document.title = `iTorgo - ${t(meta.titleKey)}`
  } else if (typeof meta?.title === 'string') {
    document.title = meta.title
  }
}

router.afterEach(() => {
  applyDocumentTitle()
})

// Route meta only re-evaluates on navigation; switching the language while
// staying on the same page needs its own trigger so the tab title doesn't
// stay stale until the next navigation.
watch(locale, applyDocumentTitle)

export { router }