<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Home, Store, CreditCard, LayoutDashboard, User, Settings,
  LogOut, Bell, ShieldCheck, BarChart2, Wallet, FileText, Heart,
  Gauge, Gavel, Landmark, CheckCircle2, Clock, ShieldAlert, Sparkles
} from 'lucide-vue-next'
import { useRouter, RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'
import { useI18n } from '@/composables/useI18n'
import Badge from '@/components/ui/Badge.vue'

const router = useRouter()
const userStore = useUserStore()
const uiStore = useUIStore()
const { t } = useI18n()

// Helper function to check if route matches (handles sub-routes)
function isRouteActive(routePath: string): boolean {
  const currentPath = router.currentRoute.value.path
  if (routePath === '/dashboard') {
    return currentPath === '/dashboard' || currentPath === '/dashboard/overview'
  }
  return currentPath === routePath || currentPath.startsWith(routePath + '/')
}

const navSections = computed(() => [
  {
    label: t('nav.navigation') || 'Основное',
    items: [
      { path: '/dashboard/overview', label: t('dashboard.overview') || 'Обзор', icon: LayoutDashboard },
      { path: '/dashboard/listings', label: t('dashboard.myListings') || 'Мои аукционы', icon: Store },
      { path: '/dashboard/bids', label: t('dashboard.myBids') || 'Мои ставки', icon: Gavel, badge: userStore.activeBidsCount },
      { path: '/dashboard/watchlist', label: t('dashboard.watchlist') || 'Избранное', icon: Heart },
    ],
  },
  {
    label: t('dashboard.payments') || 'Финансы',
    items: [
      { path: '/dashboard/payments', label: t('dashboard.paymentsHistory') || 'История платежей', icon: CreditCard },
      { path: '/dashboard/payouts', label: t('dashboard.payouts') || 'Выплаты', icon: Wallet },
      { path: '/dashboard/payout-methods', label: t('dashboard.payoutMethods') || 'Способы вывода', icon: Landmark },
    ],
  },
  {
    label: t('dashboard.accountAndSecurity') || 'Безопасность',
    items: [
      { 
        path: '/dashboard/kyc', 
        label: t('dashboard.kyc') || 'Верификация KYC', 
        icon: ShieldCheck, 
        badge: userStore.kycStatus === 'verified' ? '✓' : '!', 
        badgeVariant: userStore.kycStatus === 'verified' ? 'success' : 'warning' 
      },
      { path: '/dashboard/settings', label: t('dashboard.settings') || 'Настройки аккаунта', icon: Settings },
    ],
  },
])

function handleLogout() {
  userStore.logout()
  uiStore.toastInfo(t('nav.logout') || 'Выход', t('toasts.loggedOut') || 'Вы успешно вышли из системы.')
  router.push('/')
}
</script>

<template>
  <aside
    class="bg-white rounded-3xl border border-black/[0.08] p-4 sm:p-5 shadow-2xs space-y-4 font-sans"
    aria-label="Dashboard sidebar"
  >
    <!-- User Profile Header Snippet -->
    <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-black/[0.04] flex items-center gap-3">
      <div class="relative shrink-0">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-gray-950 font-black text-sm flex items-center justify-center shadow-xs border border-white">
          {{ (userStore.fullName || 'HA').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() }}
        </div>
        <span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/20" title="В сети"></span>
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-xs font-black text-gray-950 truncate">{{ userStore.fullName || t('common.user') || 'Пользователь' }}</p>
        <div class="flex items-center gap-1.5 mt-0.5">
          <RouterLink
            to="/dashboard/kyc"
            class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors"
            :class="userStore.kycStatus === 'verified' ? 'text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/70' : 'text-amber-900 bg-amber-100/70 hover:bg-amber-200/70'"
          >
            <CheckCircle2 v-if="userStore.kycStatus === 'verified'" class="w-3 h-3 text-emerald-600 shrink-0" />
            <Clock v-else class="w-3 h-3 text-amber-600 shrink-0" />
            <span class="truncate">{{ userStore.kycStatus === 'verified' ? (t('status.kyc.verified') || 'Верифицирован') : (t('status.kyc.pending') || 'Требуется KYC') }}</span>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Executive Admin Entry (Full card, no text truncation!) -->
    <RouterLink
      v-if="userStore.isAdmin"
      to="/admin"
      class="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-gray-950 via-slate-900 to-gray-950 text-white border border-amber-500/30 shadow-xs hover:border-amber-500/60 hover:shadow-md transition-all group"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
          <Gauge class="w-4 h-4" />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-black text-white group-hover:text-amber-300 transition-colors truncate">
            {{ t('nav.adminPanel') || 'Панель управления' }}
          </p>
          <p class="text-[10px] text-gray-400 font-mono">itorgo.kg/admin</p>
        </div>
      </div>
      <span class="px-2 py-0.5 rounded-md bg-amber-500 text-gray-950 font-mono font-black text-[9px] uppercase tracking-wider shrink-0 shadow-2xs">
        ADMIN
      </span>
    </RouterLink>

    <!-- Navigation Links -->
    <nav class="space-y-4" aria-label="Dashboard navigation">
      <div v-for="section in navSections" :key="section.label" class="space-y-1">
        <div class="px-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">
          {{ section.label }}
        </div>
        <div class="space-y-0.5">
          <RouterLink
            v-for="item in section.items"
            :key="item.path"
            :to="item.path"
            :class="[
              'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
              isRouteActive(item.path)
                ? 'bg-gray-950 text-white font-black shadow-xs'
                : 'text-gray-600 hover:text-gray-950 hover:bg-slate-50',
            ]"
          >
            <component 
              :is="item.icon" 
              class="w-4 h-4 shrink-0" 
              :class="isRouteActive(item.path) ? 'text-amber-400' : 'text-gray-400'" 
            />
            <span class="flex-1 truncate">{{ item.label }}</span>
            
            <span
              v-if="item.badge !== undefined && typeof item.badge === 'number' && item.badge > 0"
              class="px-2 py-0.5 rounded-full text-[10px] font-mono font-black"
              :class="isRouteActive(item.path) ? 'bg-amber-500 text-gray-950' : 'bg-amber-100 text-amber-900 border border-amber-200'"
            >
              {{ item.badge }}
            </span>
            <span
              v-else-if="item.badge !== undefined && typeof item.badge === 'string'"
              class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-black"
              :class="item.badgeVariant === 'success' 
                ? (isRouteActive(item.path) ? 'bg-emerald-400 text-gray-950' : 'bg-emerald-100 text-emerald-800') 
                : (isRouteActive(item.path) ? 'bg-amber-400 text-gray-950' : 'bg-amber-100 text-amber-800')"
            >
              {{ item.badge }}
            </span>
          </RouterLink>
        </div>
      </div>
    </nav>

    <!-- Escrow Trust Footer in Sidebar -->
    <div class="p-3 rounded-2xl bg-slate-50/80 border border-black/[0.04] flex items-center gap-2.5 text-[11px] text-gray-500">
      <ShieldCheck class="w-4 h-4 text-amber-600 shrink-0" />
      <span class="font-medium leading-tight">DemirBank Escrow & AML/CFT</span>
    </div>

    <!-- Logout Button -->
    <div class="pt-2 border-t border-black/[0.06]">
      <button
        type="button"
        class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
        @click="handleLogout"
      >
        <LogOut class="w-4 h-4 shrink-0" />
        <span>{{ t('nav.logout') || 'Выйти из аккаунта' }}</span>
      </button>
    </div>
  </aside>
</template>
