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
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronDown,
  Check
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/composables/useI18n'
import { usePublicSiteUrl } from '@/composables/usePublicSiteUrl'
import FlagIcon from '@/components/icons/FlagIcon.vue'
import Dropdown from '@/components/ui/Dropdown.vue'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const userStore = useUserStore()
const { t, currentLocale, supportedLocales, setLocale } = useI18n()
const dashboardUrl = usePublicSiteUrl('/dashboard')
const mainSiteUrl = usePublicSiteUrl('/')

const isDark = ref(false)
const showNotifications = ref(false)
const showUserMenu = ref(false)
const langMenuOpen = ref(false)
const searchQuery = ref('')

function handleLanguageChange(code: string) {
  setLocale(code as any)
  langMenuOpen.value = false
}

const breadcrumbs = computed(() => {
  const path = route.path
  const parts = path.split('/').filter(Boolean)
  
  const map: Record<string, string> = {
    overview: t('admin.nav.overview') || 'Обзор',
    users: t('admin.nav.users') || 'Пользователи',
    listings: t('admin.nav.listings') || 'Модерация лотов',
    disputes: t('admin.nav.disputes') || 'Споры и претензии',
    kyc: t('admin.nav.kyc') || 'Верификация KYC',
    financials: t('admin.nav.financials') || 'Финансы и платежи',
    monitoring: t('admin.nav.monitoring') || 'Живой мониторинг',
    analytics: t('admin.nav.analytics') || 'Аналитика',
    media: t('admin.nav.media') || 'Медиатека',
    design: t('admin.nav.design') || 'Дизайн и темы',
    settings: t('admin.nav.settings') || 'Настройки'
  }

  const result = [{ label: 'iTorgo Admin', path: '/admin/overview' }]
  const subParts = parts.filter(p => p !== 'admin')
  if (subParts.length === 0 || (subParts.length === 1 && subParts[0] === 'overview')) {
    result.push({ label: map.overview, path: '/admin/overview' })
  } else {
    subParts.forEach((p, idx) => {
      result.push({
        label: map[p] || p,
        path: '/admin/' + subParts.slice(0, idx + 1).join('/')
      })
    })
  }
  return result
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

function handleNotificationClick(item: any) {
  adminStore.markNotificationRead(item.id)
  showNotifications.value = false
  if (item.link) {
    router.push(item.link)
  } else if (item.title?.toLowerCase().includes('kyc') || item.message?.toLowerCase().includes('паспорт')) {
    router.push('/admin/kyc')
  } else if (item.title?.toLowerCase().includes('чыгаруу') || item.message?.toLowerCase().includes('mbank')) {
    router.push('/admin/financials')
  } else if (item.title?.toLowerCase().includes('арыз') || item.title?.toLowerCase().includes('кооптуулук') || item.message?.toLowerCase().includes('талаш')) {
    router.push('/admin/disputes')
  } else if (item.title?.toLowerCase().includes('илан') || item.title?.toLowerCase().includes('аукцион')) {
    router.push('/admin/listings')
  }
}

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark'
  window.addEventListener('click', handleClickOutside)
  adminStore.fetchNotifications()
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
        type="button"
        class="md:hidden p-2 rounded-lg text-text-secondary hover:bg-accent"
        @click="adminStore.toggleSidebar"
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
      <form class="relative" @submit.prevent="handleGlobalSearch">
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
      <!-- Language Selector Dropdown -->
      <div class="relative">
        <Dropdown
          v-model="langMenuOpen"
          trigger="click"
          placement="bottom"
          align="end"
        >
          <template #trigger>
            <button
              type="button"
              class="px-2.5 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-text-primary transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 border border-black/10"
              :title="t('nav.language') || 'Language / Dil / Тил'"
            >
              <FlagIcon :code="currentLocale.code" custom-class="w-3.5 h-2.5 rounded-[2px]" />
              <span class="uppercase text-[11px] font-extrabold text-text-primary">{{ currentLocale.code }}</span>
              <ChevronDown class="w-3 h-3 text-text-muted transition-transform duration-200" :class="{ 'rotate-180': langMenuOpen }" />
            </button>
          </template>

          <div class="w-44 p-1.5 bg-white rounded-xl shadow-xl border border-black/10 space-y-1">
            <button
              v-for="loc in supportedLocales"
              :key="loc.code"
              class="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left cursor-pointer"
              :class="loc.code === currentLocale.code
                ? 'bg-primary/15 text-text-primary font-black border border-primary/30'
                : 'text-text-secondary hover:bg-black/5 hover:text-text-primary'"
              @click="handleLanguageChange(loc.code)"
            >
              <div class="flex items-center gap-2">
                <FlagIcon :code="loc.code" custom-class="w-4 h-3 rounded-[2px]" />
                <span>{{ loc.nativeName }}</span>
              </div>
              <Check v-if="loc.code === currentLocale.code" class="w-3.5 h-3.5 text-primary stroke-[2.5]" />
            </button>
          </div>
        </Dropdown>
      </div>

      <!-- Dark / Light Mode Toggle -->
      <button
        type="button"
        class="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-accent transition-colors"
        :title="isDark ? t('admin.header.lightMode') : t('admin.header.darkMode')"
        @click="toggleTheme"
      >
        <Sun v-if="isDark" class="w-4 h-4 text-amber-400" />
        <Moon v-else class="w-4 h-4 text-text-secondary" />
      </button>

      <!-- Notification Bell -->
      <div class="relative">
        <button
          id="admin-notification-btn"
          type="button"
          class="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-accent transition-colors relative"
          :title="t('admin.header.notifications')"
          @click="showNotifications = !showNotifications"
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
              class="text-[11px] text-primary hover:underline font-medium"
              @click="adminStore.markAllNotificationsRead"
            >
              {{ t('admin.header.markAllRead') }}
            </button>
          </div>

          <div v-if="adminStore.notifications.length === 0" class="py-8 text-center text-xs text-text-muted">
            <Bell class="w-7 h-7 mx-auto mb-2 opacity-30 stroke-1" />
            <p class="font-semibold text-text-secondary">Азырынча жаңы билдирме жок</p>
            <p class="text-[11px] text-text-muted mt-0.5">Бардык өтүнмөлөр жана арыздар каралган</p>
          </div>

          <div v-else class="max-h-72 overflow-y-auto divide-y divide-black/[0.06]">
            <div
              v-for="item in adminStore.notifications"
              :key="item.id"
              :class="[
                'p-3 hover:bg-accent transition-colors cursor-pointer flex gap-3',
                !item.read ? 'bg-primary/10' : ''
              ]"
              @click="handleNotificationClick(item)"
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
          type="button"
          class="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-accent transition-colors"
          @click="showUserMenu = !showUserMenu"
        >
          <img
            :src="userStore.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'"
            alt="Admin"
            class="w-8 h-8 rounded-full object-cover ring-1 ring-primary/30"
          />
          <div class="hidden md:flex flex-col text-left">
            <span class="text-xs font-bold text-text-primary leading-none">
              {{ userStore.user?.fullName || userStore.user?.name || userStore.user?.email || 'Sistem Yöneticisi' }}
            </span>
            <span class="text-[10px] font-bold text-amber-600 uppercase mt-0.5 tracking-wide">
              {{ userStore.user?.role === 'admin' ? 'ADMIN' : (t('admin.header.profile') || 'YÖNETİCİ') }}
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
            type="button"
            class="w-full flex items-center gap-2 px-3 py-2 text-xs text-error hover:bg-error/10 transition-colors text-left"
            @click="handleLogout"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span>{{ t('admin.header.logout') }}</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
