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
    meta: { titleKey: 'sell.title', requiresAuth: false }
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

  // Standalone Admin Panel Redirect
  {
    path: '/admin/:pathMatch(.*)*',
    redirect: () => {
      if (typeof window !== 'undefined') {
        const host = window.location.hostname
        const proto = window.location.protocol
        const adminUrl = (host === 'localhost' || host === '127.0.0.1')
          ? `${proto}//admin.localhost:5174`
          : `${proto}//admin.itorgo.kg`
        window.location.href = adminUrl
      }
      return '/dashboard'
    }
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

// Route protection
router.beforeEach((to, _from, next) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  let user: any = null
  if (userJson) {
    try { user = JSON.parse(userJson) } catch {}
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
  const current = router.currentRoute.value
  const meta = current.meta
  if (typeof meta?.titleKey === 'string') {
    document.title = `iTorgo — ${t(meta.titleKey)}`
  } else if (typeof meta?.title === 'string') {
    document.title = `iTorgo — ${meta.title}`
  } else {
    document.title = 'iTorgo — Кыргызстандагы Реалдуу Убакыттагы Онлайн Аукцион'
  }

  // Dynamic Robots Meta (Noindex for admin & dashboard, index for public)
  let robotsMeta = document.querySelector('meta[name="robots"]')
  if (!robotsMeta) {
    robotsMeta = document.createElement('meta')
    robotsMeta.setAttribute('name', 'robots')
    document.head.appendChild(robotsMeta)
  }

  const isPrivate = current.path.startsWith('/admin') || current.path.startsWith('/dashboard')
  if (isPrivate) {
    robotsMeta.setAttribute('content', 'noindex, nofollow')
  } else {
    robotsMeta.setAttribute('content', 'index, follow, max-image-preview:large')
  }

  // Dynamic Canonical Link
  let canonicalLink = document.querySelector('link[rel="canonical"]')
  if (!canonicalLink) {
    canonicalLink = document.createElement('link')
    canonicalLink.setAttribute('rel', 'canonical')
    document.head.appendChild(canonicalLink)
  }
  canonicalLink.setAttribute('href', `https://www.itorgo.kg${current.path}`)
}

router.afterEach(() => {
  applyDocumentTitle()
})

// Route meta only re-evaluates on navigation; switching the language while
// staying on the same page needs its own trigger so the tab title doesn't
// stay stale until the next navigation.
watch(locale, applyDocumentTitle)

export { router }