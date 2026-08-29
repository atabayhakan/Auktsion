<script setup lang="ts">
import { ref, computed } from 'vue'
import { Home, Store, CreditCard, LayoutDashboard, User, Settings, LogOut, Bell, ShieldCheck, BarChart2, Wallet, FileText, Heart, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useRouter, RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'
import { useI18n } from '@/composables/useI18n'
import Badge from '@/components/ui/Badge.vue'
import IlbirsIcon from '@/components/icons/IlbirsIcon.vue'

const router = useRouter()
const userStore = useUserStore()
const uiStore = useUIStore()
const { t } = useI18n()

const isCollapsed = ref(false)

const sidebarWidth = computed(() => isCollapsed.value ? 'w-20' : 'w-64')

// Helper function to check if route matches (handles sub-routes)
function isRouteActive(routePath: string): boolean {
  const currentPath = router.currentRoute.value.path
  if (routePath === '/dashboard') {
    return currentPath === '/dashboard' || currentPath === '/dashboard/overview'
  }
  return currentPath.startsWith(routePath)
}

const navSections = computed(() => [
  {
    label: t('nav.navigation'),
    items: [
      { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, exact: true },
      { path: '/dashboard/listings', label: t('dashboard.myListings'), icon: Store },
      { path: '/dashboard/bids', label: t('dashboard.myBids'), icon: CreditCard, badge: userStore.activeBidsCount },
      { path: '/dashboard/watchlist', label: t('dashboard.watchlist'), icon: Heart, badge: 0 },
    ],
  },
  {
    label: t('dashboard.payments'),
    items: [
      { path: '/dashboard/payments', label: t('dashboard.payments'), icon: CreditCard, badge: 0 },
      { path: '/dashboard/payouts', label: t('dashboard.payouts'), icon: Wallet, badge: 0 },
      { path: '/dashboard/payout-methods', label: t('dashboard.payoutMethods'), icon: CreditCard },
    ],
  },
  {
    label: t('dashboard.profileInfo'),
    items: [
      { path: '/dashboard/kyc', label: t('dashboard.kyc'), icon: ShieldCheck, badge: userStore.kycStatus !== 'verified' ? 'pending' : undefined, badgeVariant: userStore.kycStatus === 'verified' ? 'success' : 'warning' },
      { path: '/dashboard/settings', label: t('dashboard.settings'), icon: Settings },
    ],
  },
])

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function handleLogout() {
  userStore.logout()
  uiStore.toastInfo(t('nav.logout'), t('toasts.loggedOut'))
  router.push('/')
}
</script>

<template>
  <!-- Desktop Sidebar only — mobile dashboard navigation is handled by
       DashboardPage.vue's own pill-tabs header (lg:hidden) instead. -->
  <aside
    :class="[
      'hidden lg:flex lg:static inset-y-0 left-0 z-30 flex-col bg-white/95 backdrop-blur-xl border-r border-black/[0.08] text-gray-900 transition-all duration-300 shadow-sm',
      { 'lg:w-20': isCollapsed, 'lg:w-64': !isCollapsed }
    ]"
    aria-label="Dashboard sidebar"
  >
    <!-- Sidebar Header -->
    <div class="flex items-center justify-between p-4 border-b border-black/[0.06]">
      <div v-if="!isCollapsed" class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-primary p-1 shadow-md flex items-center justify-center">
          <IlbirsIcon class="w-full h-full text-text-primary" />
        </div>
        <span class="text-base font-bold text-gray-900">iTorgo</span>
      </div>
      <button
        @click="toggleCollapse"
        class="p-2 rounded-xl bg-gray-100 border border-black/5 text-gray-600 hover:text-gray-900 hover:border-primary/30 transition-all duration-200"
        :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-expanded="!isCollapsed"
      >
        <ChevronLeft v-if="!isCollapsed" class="w-4 h-4" />
        <ChevronRight v-else class="w-4 h-4" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Dashboard navigation">
      <template v-for="section in navSections" :key="section.label">
        <div v-if="!isCollapsed" class="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          {{ section.label }}
        </div>
        <template v-for="item in section.items" :key="item.path">
          <RouterLink
            :to="item.path"
            :class="[
              'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
              isRouteActive(item.path)
                ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30 font-bold shadow-sm'
                : 'text-gray-700 hover:text-gray-900 hover:bg-black/5',
              isCollapsed && 'justify-center',
            ]"
            :title="isCollapsed ? item.label : undefined"
          >
            <component :is="item.icon" class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span v-if="!isCollapsed" class="flex-1 truncate">{{ item.label }}</span>
            <Badge
              v-if="item.badge !== undefined && typeof item.badge === 'number' && item.badge > 0"
              :variant="item.badgeVariant || 'info'"
              size="sm"
              class="ml-auto text-[10px]"
            >
              {{ item.badge }}
            </Badge>
            <Badge
              v-else-if="item.badge !== undefined && typeof item.badge === 'string'"
              :variant="item.badgeVariant || 'warning'"
              size="sm"
              class="ml-auto text-[10px]"
            >
              {{ item.badge }}
            </Badge>
          </RouterLink>
        </template>
      </template>
    </nav>

    <!-- User Info / Logout -->
    <div class="p-3 border-t border-black/[0.06]">
      <div v-if="!isCollapsed" class="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-xl bg-gray-50 border border-black/5">
        <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-text-primary flex-shrink-0">
          {{ userStore.fullName?.charAt(0) || 'U' }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-gray-900 truncate">{{ userStore.fullName }}</p>
          <p class="text-[10px] text-gray-500 truncate">{{ userStore.user?.email }}</p>
        </div>
      </div>
      <button
        @click="handleLogout"
        :class="[
          'w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-500/10 rounded-xl transition-colors',
          isCollapsed ? 'justify-center' : '',
        ]"
        :title="isCollapsed ? t('nav.logout') : undefined"
      >
        <LogOut class="w-4 h-4 flex-shrink-0" />
        <span v-if="!isCollapsed">{{ t('nav.logout') }}</span>
      </button>
    </div>
  </aside>
</template>