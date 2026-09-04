<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import {
  Home, LayoutGrid, Plus, Heart, User
} from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/composables/useI18n'

const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()

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
    <div class="grid grid-cols-5 h-16 items-center px-1">
      
      <!-- 1. Главная (Home) -->
      <RouterLink
        to="/"
        class="flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold transition-all select-none"
        :class="route.path === '/' ? 'text-gray-950 scale-105' : 'text-gray-400 hover:text-gray-700'"
      >
        <Home class="w-5 h-5" :class="route.path === '/' ? 'text-gray-950 stroke-[2.5]' : 'stroke-[1.75]'" />
        <span class="truncate">{{ t('nav.home') || 'Главная' }}</span>
      </RouterLink>

      <!-- 2. Каталог (Catalog) -->
      <RouterLink
        to="/categories"
        class="flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold transition-all select-none"
        :class="isTabActive('/categories') ? 'text-gray-950 scale-105' : 'text-gray-400 hover:text-gray-700'"
      >
        <LayoutGrid class="w-5 h-5" :class="isTabActive('/categories') ? 'text-gray-950 stroke-[2.5]' : 'stroke-[1.75]'" />
        <span class="truncate">{{ t('nav.allCategories') || 'Каталог' }}</span>
      </RouterLink>

      <!-- 3. Elevated Sell Center Button (Продать) -->
      <RouterLink
        to="/sell"
        class="relative flex flex-col items-center justify-center group select-none"
      >
        <div class="absolute -top-4 w-11 h-11 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 text-gray-950 shadow-md border-2 border-white flex items-center justify-center group-active:scale-90 transition-transform">
          <Plus class="w-5 h-5 stroke-[3]" />
        </div>
        <span class="text-[10px] font-black text-amber-700 mt-4 pt-1 truncate">
          {{ t('nav.sell') || 'Продать' }}
        </span>
      </RouterLink>

      <!-- 4. Избранное (Favorites) -->
      <RouterLink
        :to="userStore.isAuthenticated ? '/dashboard/watchlist' : '/login'"
        class="flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold transition-all select-none"
        :class="route.path.includes('watchlist') ? 'text-gray-950 scale-105' : 'text-gray-400 hover:text-gray-700'"
      >
        <Heart class="w-5 h-5" :class="route.path.includes('watchlist') ? 'text-gray-950 fill-gray-950' : 'stroke-[1.75]'" />
        <span class="truncate">{{ t('dashboard.watchlist') || 'Избранное' }}</span>
      </RouterLink>

      <!-- 5. Профиль / Войти -->
      <RouterLink
        :to="userStore.isAuthenticated ? '/dashboard/overview' : '/login'"
        class="flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold transition-all select-none"
        :class="route.path.startsWith('/dashboard') && !route.path.includes('watchlist') ? 'text-gray-950 scale-105' : 'text-gray-400 hover:text-gray-700'"
      >
        <User class="w-5 h-5" :class="route.path.startsWith('/dashboard') && !route.path.includes('watchlist') ? 'text-gray-950 stroke-[2.5]' : 'stroke-[1.75]'" />
        <span class="truncate">{{ userStore.isAuthenticated ? (t('nav.myProfile') || 'Кабинет') : (t('nav.login') || 'Войти') }}</span>
      </RouterLink>

    </div>
  </nav>
</template>
