<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Home, Store, CreditCard, LayoutDashboard, User, Settings,
  LogOut, Bell, ShieldCheck, BarChart2, Wallet, FileText, Heart,
  Gauge, Gavel, Landmark, CheckCircle2, Clock
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
  ...(userStore.isAdmin ? [
    {
      label: '👑 Admin',
      items: [
        { path: '/admin', label: t('nav.adminPanel') || 'Yönetim Paneli', icon: Gauge, badge: 'ADMIN', badgeVariant: 'primary' },
      ],
    }
  ] : []),
  {
    label: t('nav.navigation') || 'Navigasyon',
    items: [
      { path: '/dashboard/overview', label: t('nav.dashboard') || 'Kullanıcı Paneli', icon: LayoutDashboard },
      { path: '/dashboard/listings', label: t('dashboard.myListings') || 'İlanlarım', icon: Store },
      { path: '/dashboard/bids', label: t('dashboard.myBids') || 'Tekliflerim', icon: Gavel, badge: userStore.activeBidsCount },
      { path: '/dashboard/watchlist', label: t('dashboard.watchlist') || 'Takip Listem', icon: Heart },
    ],
  },
  {
    label: t('dashboard.payments') || 'Ödemeler',
    items: [
      { path: '/dashboard/payments', label: t('dashboard.payments') || 'Ödeme Geçmişi', icon: CreditCard },
      { path: '/dashboard/payouts', label: t('dashboard.payouts') || 'Para Çekme', icon: Wallet },
      { path: '/dashboard/payout-methods', label: t('dashboard.payoutMethods') || 'Ödeme Yöntemleri', icon: Landmark },
    ],
  },
  {
    label: t('dashboard.profileInfo') || 'Hesap & Güvenlik',
    items: [
      { 
        path: '/dashboard/kyc', 
        label: t('dashboard.kyc') || 'KYC Doğrulama', 
        icon: ShieldCheck, 
        badge: userStore.kycStatus === 'verified' ? '✓' : 'pending', 
        badgeVariant: userStore.kycStatus === 'verified' ? 'success' : 'warning' 
      },
      { path: '/dashboard/settings', label: t('dashboard.settings') || 'Ayarlar', icon: Settings },
    ],
  },
])

function handleLogout() {
  userStore.logout()
  uiStore.toastInfo(t('nav.logout') || 'Çıkış Yapıldı', t('toasts.loggedOut') || 'Başarıyla oturum kapatıldı.')
  router.push('/')
}
</script>

<template>
  <aside
    class="bg-white rounded-3xl border border-black/[0.08] p-4 shadow-2xs space-y-4 font-sans"
    aria-label="Dashboard sidebar"
  >
    <!-- User Profile Header Snippet -->
    <div class="p-3 rounded-2xl bg-slate-50 border border-black/[0.04] flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-gray-950 font-black text-sm flex items-center justify-center shadow-xs shrink-0">
        {{ (userStore.fullName || 'HA').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() }}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-black text-gray-950 truncate">{{ userStore.fullName || 'Kullanıcı' }}</p>
        <div class="flex items-center gap-1 mt-0.5">
          <span 
            class="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-md"
            :class="userStore.kycStatus === 'verified' ? 'text-emerald-700 bg-emerald-100/70' : 'text-amber-800 bg-amber-100/70'"
          >
            <CheckCircle2 v-if="userStore.kycStatus === 'verified'" class="w-2.5 h-2.5" />
            <Clock v-else class="w-2.5 h-2.5" />
            <span>{{ userStore.kycStatus === 'verified' ? 'Doğrulandı' : 'KYC Bekliyor' }}</span>
          </span>
        </div>
      </div>
    </div>

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
              'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all',
              isRouteActive(item.path)
                ? 'bg-amber-500/15 text-amber-950 font-black shadow-2xs border border-amber-500/30'
                : 'text-gray-600 hover:text-gray-950 hover:bg-slate-50',
            ]"
          >
            <component 
              :is="item.icon" 
              class="w-4 h-4 shrink-0" 
              :class="isRouteActive(item.path) ? 'text-amber-800' : 'text-gray-400'" 
            />
            <span class="flex-1 truncate">{{ item.label }}</span>
            
            <Badge
              v-if="item.badge !== undefined && typeof item.badge === 'number' && item.badge > 0"
              :variant="item.badgeVariant || 'info'"
              size="sm"
              class="text-[10px]"
            >
              {{ item.badge }}
            </Badge>
            <Badge
              v-else-if="item.badge !== undefined && typeof item.badge === 'string'"
              :variant="item.badgeVariant || 'warning'"
              size="sm"
              class="text-[10px]"
            >
              {{ item.badge }}
            </Badge>
          </RouterLink>
        </div>
      </div>
    </nav>

    <!-- Logout Button -->
    <div class="pt-2 border-t border-black/[0.06]">
      <button
        type="button"
        class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
        @click="handleLogout"
      >
        <LogOut class="w-4 h-4 shrink-0" />
        <span>{{ t('nav.logout') || 'Çıkış Yap' }}</span>
      </button>
    </div>
  </aside>
</template>
