<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  Home, LayoutGrid, Radio, Plus, Heart, User
} from 'lucide-vue-next'
import { useAuctionStore } from '@/stores/auction'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/composables/useI18n'

const route = useRoute()
const auctionStore = useAuctionStore()
const userStore = useUserStore()
const { t } = useI18n()

onMounted(() => {
  if (auctionStore.auctions.length === 0) {
    auctionStore.fetchAuctions()
  }
})

const liveCount = computed(() =>
  auctionStore.auctions.filter(a => a.status === 'active' && a.bidCount > 0).length
)

function isTabActive(path: string, exact = false) {
  if (exact) return route.path === path
  return route.path.startsWith(path)
}
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl border-t border-black/[0.08] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
    aria-label="Mobile navigation"
  >
    <div class="grid grid-cols-6 h-16 items-center px-1">
      
      <!-- 1. Home -->
      <RouterLink
        to="/"
        class="flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold transition-all"
        :class="route.path === '/' ? 'text-gray-950 scale-105' : 'text-gray-400 hover:text-gray-700'"
      >
        <Home class="w-5 h-5" :class="route.path === '/' ? 'text-gray-950 stroke-[2.5]' : 'stroke-[1.75]'" />
        <span>{{ t('nav.home') || 'Главная' }}</span>
      </RouterLink>

      <!-- 2. Catalog / Categories -->
      <RouterLink
        to="/categories"
        class="flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold transition-all"
        :class="isTabActive('/categories') ? 'text-gray-950 scale-105' : 'text-gray-400 hover:text-gray-700'"
      >
        <LayoutGrid class="w-5 h-5" :class="isTabActive('/categories') ? 'text-gray-950 stroke-[2.5]' : 'stroke-[1.75]'" />
        <span>{{ t('nav.allCategories') || 'Каталог' }}</span>
      </RouterLink>

      <!-- 3. Live Auctions -->
      <RouterLink
        to="/auctions?status=live"
        class="flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold transition-all"
        :class="route.query.status === 'live' ? 'text-rose-600 scale-105' : 'text-gray-400 hover:text-gray-700'"
      >
        <div class="relative">
          <Radio class="w-5 h-5" :class="route.query.status === 'live' ? 'text-rose-600 stroke-[2.5]' : 'stroke-[1.75]'" />
          <span
            v-if="liveCount > 0"
            class="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-1 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center leading-none"
          >
            {{ liveCount > 9 ? '9+' : liveCount }}
          </span>
        </div>
        <span>{{ t('nav.liveAuctions') || 'Торги' }}</span>
      </RouterLink>

      <!-- 4. Elevated Sell Center Button -->
      <RouterLink
        to="/sell"
        class="relative flex flex-col items-center justify-center group"
      >
        <div class="absolute -top-5 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 text-gray-950 shadow-lg border-2 border-white flex items-center justify-center group-active:scale-90 transition-transform">
          <Plus class="w-6 h-6 stroke-[3]" />
        </div>
        <span class="text-[10px] font-black text-amber-700 mt-5 pt-0.5">
          {{ t('nav.sell') || 'Продать' }}
        </span>
      </RouterLink>

      <!-- 5. Favorites / Watchlist -->
      <RouterLink
        :to="userStore.isAuthenticated ? '/dashboard/watchlist' : '/login'"
        class="flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold transition-all"
        :class="route.path.includes('watchlist') ? 'text-gray-950 scale-105' : 'text-gray-400 hover:text-gray-700'"
      >
        <Heart class="w-5 h-5" :class="route.path.includes('watchlist') ? 'text-gray-950 fill-gray-950' : 'stroke-[1.75]'" />
        <span>{{ t('dashboard.watchlist') || 'Избранное' }}</span>
      </RouterLink>

      <!-- 6. Profile / Login -->
      <RouterLink
        :to="userStore.isAuthenticated ? '/dashboard/overview' : '/login'"
        class="flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold transition-all"
        :class="route.path.startsWith('/dashboard') && !route.path.includes('watchlist') ? 'text-gray-950 scale-105' : 'text-gray-400 hover:text-gray-700'"
      >
        <User class="w-5 h-5" :class="route.path.startsWith('/dashboard') && !route.path.includes('watchlist') ? 'text-gray-950 stroke-[2.5]' : 'stroke-[1.75]'" />
        <span>{{ userStore.isAuthenticated ? (t('nav.myProfile') || 'Профиль') : (t('nav.login') || 'Войти') }}</span>
      </RouterLink>

    </div>
  </nav>
</template>
