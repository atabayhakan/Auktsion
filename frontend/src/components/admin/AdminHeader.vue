<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  Menu, 
  LogOut, 
  User, 
  ChevronRight, 
  Check, 
  ShieldCheck,
  AlertTriangle,
  Info,
  ExternalLink
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/composables/useI18n'
import { usePublicSiteUrl } from '@/composables/usePublicSiteUrl'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const userStore = useUserStore()
const { t } = useI18n()
const dashboardUrl = usePublicSiteUrl('/dashboard')
const mainSiteUrl = usePublicSiteUrl('/')

const isDark = ref(false)
const showNotifications = ref(false)
const showUserMenu = ref(false)
const searchQuery = ref('')

const breadcrumbs = computed(() => {
  const path = route.path
  const parts = path.split('/').filter(Boolean)
  
  const map: Record<string, string> = {
    admin: t('admin.overview.label'),
    overview: t('admin.overview.label'),
    users: t('admin.nav.users'),
    listings: t('admin.nav.listings'),
    disputes: t('admin.nav.disputes'),
    kyc: t('admin.nav.kyc'),
    financials: t('admin.nav.financials'),
    monitoring: t('admin.nav.monitoring'),
    analytics: t('admin.nav.analytics')
  }

  return parts.map((p, idx) => ({
    label: map[p] || p,
    path: '/' + parts.slice(0, idx + 1).join('/')
  }))
})

function toggleTheme() {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

function handleGlobalSearch() {
  if (!searchQuery.value.trim()) return
  const q = searchQuery.value.trim()
  // Navigate to users or listings depending on query
  if (q.startsWith('#DSP') || q.toLowerCase().includes('disp')) {
    router.push(`/admin/disputes`)
  } else if (q.startsWith('user') || q.includes('@') || /^\+?996/.test(q) || /^\d{14}$/.test(q)) {
    adminStore.userFilters.search = q
    router.push(`/admin/users`)
  } else {
    adminStore.listingFilters.search = q
    router.push(`/admin/listings`)
  }
  searchQuery.value = ''
}

async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('#admin-notification-btn') && !target.closest('#admin-notification-dropdown')) {
    showNotifications.value = false
  }
  if (!target.closest('#admin-user-btn') && !target.closest('#admin-user-dropdown')) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark'
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header class="h-16 bg-white/95 backdrop-blur-xl border-b border-black/[0.08] px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
    <!-- Left: Mobile Toggle & Breadcrumbs -->
    <div class="flex items-center gap-3 md:gap-4 overflow-hidden">
      <button
        @click="adminStore.toggleSidebar"
        type="button"
        class="md:hidden p-2 rounded-lg text-text-secondary hover:bg-accent"
      >
        <Menu class="w-5 h-5" />
      </button>

      <!-- Breadcrumbs -->
      <nav class="hidden sm:flex items-center gap-1.5 text-xs text-text-secondary font-medium truncate">
        <template v-for="(bc, idx) in breadcrumbs" :key="bc.path">
          <ChevronRight v-if="idx > 0" class="w-3.5 h-3.5 text-text-muted shrink-0" />
          <span
            v-if="idx === breadcrumbs.length - 1"
            class="text-text-primary font-semibold truncate"
          >
            {{ bc.label }}
          </span>
          <router-link
            v-else
            :to="bc.path"
            class="hover:text-primary truncate"
          >
            {{ bc.label }}
          </router-link>
        </template>
      </nav>
    </div>

    <!-- Center: Global Quick Search Bar -->
    <div class="flex-1 max-w-md mx-4 hidden lg:block">
      <form @submit.prevent="handleGlobalSearch" class="relative">
        <Search class="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('admin.header.searchPlaceholder')"
          class="w-full pl-9 pr-4 py-1.5 text-base bg-black/5 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-text-primary placeholder-text-muted"
        />
      </form>
    </div>

    <!-- Right: Actions & User Menu -->
    <div class="flex items-center gap-2 md:gap-3">
      <!-- Dark / Light Mode Toggle -->
      <button
        @click="toggleTheme"
        type="button"
        class="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-accent transition-colors"
        :title="isDark ? t('admin.header.lightMode') : t('admin.header.darkMode')"
      >
        <Sun v-if="isDark" class="w-4 h-4 text-amber-400" />
        <Moon v-else class="w-4 h-4 text-text-secondary" />
      </button>

      <!-- Notification Bell -->
      <div class="relative">
        <button
          id="admin-notification-btn"
          @click="showNotifications = !showNotifications"
          type="button"
          class="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-accent transition-colors relative"
          :title="t('admin.header.notifications')"
        >
          <Bell class="w-4 h-4" />
          <span
            v-if="adminStore.unreadNotificationsCount > 0"
            class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"
          />
        </button>

        <!-- Notification Dropdown -->
        <div
          v-if="showNotifications"
          id="admin-notification-dropdown"
          class="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-black/10 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div class="px-4 py-2 border-b border-black/[0.06] flex items-center justify-between">
            <h4 class="text-xs font-bold text-text-primary uppercase tracking-wider">
              {{ t('admin.header.notifications') }} ({{ adminStore.unreadNotificationsCount }})
            </h4>
            <button
              @click="adminStore.markAllNotificationsRead"
              class="text-[11px] text-primary hover:underline font-medium"
            >
              {{ t('admin.header.markAllRead') }}
            </button>
          </div>

          <div class="max-h-72 overflow-y-auto divide-y divide-black/[0.06]">
            <div
              v-for="item in adminStore.notifications"
              :key="item.id"
              @click="adminStore.markNotificationRead(item.id)"
              :class="[
                'p-3 hover:bg-accent transition-colors cursor-pointer flex gap-3',
                !item.read ? 'bg-primary/10' : ''
              ]"
            >
              <div class="shrink-0 mt-0.5">
                <AlertTriangle v-if="item.type === 'alert'" class="w-4 h-4 text-rose-500" />
                <AlertTriangle v-else-if="item.type === 'warning'" class="w-4 h-4 text-amber-500" />
                <Info v-else class="w-4 h-4 text-blue-500" />
              </div>
              <div class="flex-1 text-xs">
                <div class="font-semibold text-text-primary flex items-center justify-between">
                  <span>{{ item.title }}</span>
                  <span class="text-[10px] text-text-muted font-normal">{{ item.time }}</span>
                </div>
                <p class="text-text-secondary text-[11px] mt-0.5">{{ item.message }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- User Profile Dropdown -->
      <div class="relative">
        <button
          id="admin-user-btn"
          @click="showUserMenu = !showUserMenu"
          type="button"
          class="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-accent transition-colors"
        >
          <img
            :src="userStore.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'"
            alt="Admin"
            class="w-8 h-8 rounded-full object-cover ring-1 ring-primary/30"
          />
          <div class="hidden md:flex flex-col text-left">
            <span class="text-xs font-bold text-text-primary leading-none">
              {{ userStore.user?.fullName || 'Улан Асанов' }}
            </span>
            <span class="text-[10px] font-semibold text-primary uppercase mt-0.5">
              {{ t('admin.header.profile') }}
            </span>
          </div>
        </button>

        <!-- User Dropdown Menu -->
        <div
          v-if="showUserMenu"
          id="admin-user-dropdown"
          class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-black/10 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div class="px-3 py-2 border-b border-black/[0.06] md:hidden">
            <div class="text-xs font-bold text-text-primary">{{ userStore.user?.fullName }}</div>
            <div class="text-[10px] text-text-muted">{{ userStore.user?.email }}</div>
          </div>

          <a
            :href="dashboardUrl"
            class="flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-accent transition-colors"
          >
            <User class="w-3.5 h-3.5 text-text-muted" />
            <span>{{ t('admin.header.dashboard') }}</span>
          </a>

          <a
            :href="mainSiteUrl"
            class="flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-accent transition-colors"
          >
            <ExternalLink class="w-3.5 h-3.5 text-text-muted" />
            <span>{{ t('admin.header.mainSite') }}</span>
          </a>

          <div class="my-1 border-t border-black/[0.06]" />

          <button
            @click="handleLogout"
            type="button"
            class="w-full flex items-center gap-2 px-3 py-2 text-xs text-error hover:bg-error/10 transition-colors text-left"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span>{{ t('admin.header.logout') }}</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
