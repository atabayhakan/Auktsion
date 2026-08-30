<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Menu, X, ChevronDown, Search, User, LogOut,
  Store, CreditCard, ShieldCheck, Settings,
  PlusCircle, ArrowRight, Check, Radio, Gauge
} from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/composables/useI18n'
import { useRouter, RouterLink } from 'vue-router'
import Dropdown from '@/components/ui/Dropdown.vue'
import Badge from '@/components/ui/Badge.vue'
import MegaMenu from '@/components/layout/MegaMenu.vue'
import IlbirsIcon from '@/components/icons/IlbirsIcon.vue'

const userStore = useUserStore()
const router = useRouter()
const { t, currentLocale, supportedLocales, setLocale } = useI18n()

const isScrolled = ref(false)
const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)
const langMenuOpen = ref(false)
const categoryMenuOpen = ref(false)
const searchQuery = ref('')
const isSearchOpen = ref(false)

const navLinks = computed(() => [
  { path: '/auctions', label: t('nav.auctions'), icon: Store },
  { path: '/auctions?status=live', label: t('nav.liveAuctions'), icon: Radio, badge: t('common.live') },
  { path: '/how-it-works', label: t('nav.howItWorks'), icon: ShieldCheck },
])

const userMenuItems = computed(() => [
  ...(userStore.isAdmin ? [{
    label: '👑 Admin Paneli (eBay Suite)',
    path: '/admin',
    icon: Gauge,
    badge: 'ADMIN',
    isVerified: true
  }] : []),
  { label: t('nav.myProfile'), path: '/dashboard', icon: User },
  { label: t('nav.myListings'), path: '/dashboard/listings', icon: Store },
  { label: t('nav.myBids'), path: '/dashboard/bids', icon: CreditCard },
  { label: t('nav.payments'), path: '/dashboard/payments', icon: CreditCard },
  { label: t('nav.payouts'), path: '/dashboard/payouts', icon: CreditCard },
  {
    label: t('nav.kycStatus'),
    path: '/dashboard/kyc',
    icon: ShieldCheck,
    badge: userStore.kycStatus !== 'verified' ? t('status.kyc.pending') : t('status.kyc.verified'),
    isVerified: userStore.kycStatus === 'verified'
  },
  { label: t('nav.settings'), path: '/dashboard/settings', icon: Settings, divider: true },
  {
    label: userStore.isAuthenticated ? t('nav.logout') : `${t('nav.login')} / ${t('nav.register')}`,
    action: userStore.isAuthenticated ? 'logout' : 'login',
    icon: LogOut,
    variant: userStore.isAuthenticated ? 'danger' : 'primary'
  },
])

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
  document.body.style.overflow = mobileMenuOpen.value ? 'hidden' : ''
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
  document.body.style.overflow = ''
}

function closeUserMenu() {
  userMenuOpen.value = false
}

function toggleSearch() {
  isSearchOpen.value = !isSearchOpen.value
  if (isSearchOpen.value) {
    setTimeout(() => document.getElementById('header-search-mobile')?.focus(), 100)
  }
}

function closeSearch() {
  isSearchOpen.value = false
  searchQuery.value = ''
}

function handleSearch(event: Event) {
  event.preventDefault()
  if (searchQuery.value.trim()) {
    router.push({ path: '/auctions', query: { search: searchQuery.value.trim() } })
    closeSearch()
  }
}

async function handleLogout() {
  await userStore.logout()
  router.push('/')
  closeUserMenu()
}

function handleScroll() {
  isScrolled.value = window.scrollY > 15
}

function handleLanguageChange(locale: string) {
  setLocale(locale)
  langMenuOpen.value = false
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

watch(() => userStore.isAuthenticated, (val) => {
  if (!val) closeUserMenu()
})
</script>

<template>
  <header
    :class="[
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isScrolled
        ? 'bg-white/85 backdrop-blur-2xl border-b border-black/[0.08] shadow-md'
        : 'bg-white/60 backdrop-blur-md border-b border-black/[0.05]'
    ]"
  >
    <!-- Top Navigation Bar -->
    <div class="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 md:h-18 gap-3 lg:gap-4">
        <!-- Brand & Logo -->
        <div class="flex items-center gap-4 flex-shrink-0">
          <RouterLink to="/" class="flex items-center gap-2 group" aria-label="iTorgo">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded bg-primary p-1.5 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center">
              <IlbirsIcon class="w-full h-full text-text-primary" />
            </div>
            <div class="flex flex-col">
              <span class="font-sans font-bold text-base sm:text-lg text-text-primary tracking-tight flex items-center gap-1">
                iTorgo
              </span>
              <span class="text-[9px] text-text-muted tracking-wider uppercase font-medium hidden sm:block leading-none">Real-Time Platform</span>
            </div>
          </RouterLink>
        </div>

        <!-- Categories Mega-Menu (Desktop) -->
        <div class="hidden lg:block relative flex-shrink-0">
          <Dropdown
            v-model="categoryMenuOpen"
            trigger="hover"
            placement="bottom"
            align="start"
          >
            <template #trigger>
              <button
                type="button"
                class="px-3 py-1.5 rounded text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-black/5 transition-all flex items-center gap-1.5"
              >
                <Menu class="w-3.5 h-3.5" />
                <span>{{ t('nav.allCategories') }}</span>
                <ChevronDown class="w-3 h-3 text-text-muted transition-transform" :class="{ 'rotate-180': categoryMenuOpen }" />
              </button>
            </template>

            <div class="bg-white rounded-2xl shadow-xl border border-black/10 overflow-hidden">
              <MegaMenu @navigate="categoryMenuOpen = false" />
            </div>
          </Dropdown>
        </div>

        <!-- Search Bar (Desktop) -->
        <div class="hidden lg:flex flex-1 min-w-[180px] max-w-sm xl:max-w-md mx-2">
          <form class="w-full relative group" @submit="handleSearch">
            <div class="glass rounded-full flex items-center pl-3.5 pr-1.5 py-1.5 focus-within:border-secondary transition-all duration-300">
              <Search class="w-4 h-4 text-text-muted group-focus-within:text-secondary transition-colors flex-shrink-0" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('nav.searchPlaceholder')"
                class="bg-transparent border-none focus:ring-0 w-full text-base text-text-primary placeholder-text-muted outline-none ml-2 font-sans min-w-0"
              />
              <button
                type="submit"
                class="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center hover:bg-secondary-hover transition-all hover:scale-105 ml-1 flex-shrink-0"
                aria-label="Search"
              >
                <ArrowRight class="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>

        <!-- Navigation Links (Desktop) -->
        <nav class="hidden xl:flex items-center gap-1.5 flex-shrink-0">
          <RouterLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="relative px-2.5 py-1.5 rounded text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-black/5 transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap"
            active-class="!text-secondary !bg-secondary/10 border border-secondary/20 font-semibold"
          >
            <component :is="link.icon" class="w-3.5 h-3.5 flex-shrink-0" />
            <span>{{ link.label }}</span>
            <span v-if="link.badge" class="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-error/15 text-error animate-pulse">
              {{ link.badge }}
            </span>
          </RouterLink>
        </nav>

        <!-- Right Side Actions -->
        <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

          <!-- Mobile Search Toggle -->
          <button
            class="lg:hidden p-2 rounded glass hover:bg-black/5 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Search"
            @click="toggleSearch"
          >
            <Search class="w-4 h-4" />
          </button>

          <!-- Sell / Сатуу Button -->
          <RouterLink to="/sell" class="hidden sm:inline-flex">
            <button class="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded bg-primary text-text-primary font-bold text-xs hover:bg-primary-hover shadow-md transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap">
              <PlusCircle class="w-3.5 h-3.5" />
              <span>{{ t('nav.sell') }}</span>
            </button>
          </RouterLink>

          <!-- Language Selector Dropdown -->
          <div class="relative flex-shrink-0">
            <Dropdown
              v-model="langMenuOpen"
              trigger="click"
              placement="bottom"
              align="end"
            >
              <template #trigger>
                <button
                  type="button"
                  class="px-2 py-1.5 sm:px-2.5 rounded glass hover:bg-black/5 text-text-primary transition-all text-xs font-bold flex items-center gap-1"
                  :title="t('nav.language')"
                >
                  <span class="text-sm">{{ currentLocale.flag }}</span>
                  <span class="hidden sm:inline uppercase text-[11px] font-bold">{{ currentLocale.code }}</span>
                  <ChevronDown class="w-3 h-3 text-text-muted transition-transform" :class="{ 'rotate-180': langMenuOpen }" />
                </button>
              </template>

              <div class="w-44 p-1.5 bg-white rounded-2xl shadow-xl border border-black/10 space-y-1">
                <button
                  v-for="loc in supportedLocales"
                  :key="loc.code"
                  class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-colors text-left"
                  :class="loc.code === currentLocale.code
                    ? 'bg-primary/10 text-primary font-bold border border-primary/20'
                    : 'text-text-secondary hover:bg-black/5'"
                  @click="handleLanguageChange(loc.code)"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-base">{{ loc.flag }}</span>
                    <span>{{ loc.nativeName }}</span>
                  </div>
                  <Check v-if="loc.code === currentLocale.code" class="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            </Dropdown>
          </div>

          <!-- User Menu / Login -->
          <div class="relative flex-shrink-0">
            <Dropdown
              v-if="userStore.isAuthenticated"
              v-model="userMenuOpen"
              trigger="click"
              placement="bottom"
              align="end"
            >
              <template #trigger>
                <div class="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded glass hover:bg-black/5 transition-colors">
                  <div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-text-primary flex-shrink-0">
                    {{ userStore.fullName?.charAt(0) || 'U' }}
                  </div>
                  <span class="hidden sm:inline-block text-xs font-medium text-text-primary max-w-[85px] md:max-w-[105px] truncate">
                    {{ userStore.fullName }}
                  </span>
                  <ChevronDown class="hidden sm:block w-3.5 h-3.5 text-text-muted transition-transform flex-shrink-0" :class="{ 'rotate-180': userMenuOpen }" />
                </div>
              </template>

              <div class="w-60 p-1 bg-white rounded-2xl shadow-xl border border-black/10">
                <div class="px-3.5 py-2.5 border-b border-black/[0.06] mb-1">
                  <p class="text-sm font-semibold text-text-primary">{{ userStore.fullName }}</p>
                  <p class="text-xs text-text-muted truncate">{{ userStore.user?.email }}</p>
                  <div class="mt-2 flex items-center justify-between text-xs">
                    <span class="text-text-muted">{{ t('nav.balance') }}</span>
                    <span class="font-bold text-primary">{{ (userStore.user?.balance || 25000).toLocaleString() }} KGS</span>
                  </div>
                </div>

                <RouterLink
                  v-for="item in userMenuItems.slice(0, -1)"
                  :key="item.label"
                  :to="item.path"
                  class="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-black/5 rounded-lg transition-colors"
                  @click="closeUserMenu"
                >
                  <component :is="item.icon" class="w-4 h-4 text-text-muted" />
                  <span>{{ item.label }}</span>
                  <Badge v-if="item.badge" :variant="(item as any).isVerified ? 'success' : 'warning'" size="sm" class="ml-auto">
                    {{ item.badge }}
                  </Badge>
                </RouterLink>

                <div class="border-t border-black/[0.06] my-1" />

                <button
                  class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-error hover:bg-error/10 rounded-lg transition-colors"
                  @click="handleLogout"
                >
                  <LogOut class="w-4 h-4" />
                  <span>{{ t('nav.logout') }}</span>
                </button>
              </div>
            </Dropdown>

            <div v-else class="flex items-center gap-2">
              <RouterLink
                to="/login"
                class="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-black/5 rounded transition-colors"
              >
                {{ t('nav.login') }}
              </RouterLink>
              <RouterLink
                to="/register"
                class="px-3.5 py-1.5 text-xs font-semibold rounded bg-primary text-text-primary hover:bg-primary-hover shadow-md transition-all"
              >
                {{ t('nav.register') }}
              </RouterLink>
            </div>
          </div>

          <!-- Mobile Hamburger Menu Button (stays visible through tablet widths —
               the desktop mega-menu/nav links don't appear until lg/xl) -->
          <button
            class="lg:hidden p-2 rounded glass hover:bg-black/5 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Toggle menu"
            @click="toggleMobileMenu"
          >
            <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Search Dropdown (Inside fixed Header) -->
    <div v-if="isSearchOpen" class="lg:hidden px-4 pb-3 pt-1 border-t border-black/10 bg-white/95 backdrop-blur-xl">
      <form class="relative" @submit="handleSearch">
        <input
          id="header-search-mobile"
          v-model="searchQuery"
          type="text"
          :placeholder="t('nav.searchPlaceholder')"
          class="w-full pl-10 pr-10 py-2.5 rounded bg-black/5 border border-black/10 text-base text-text-primary placeholder-text-muted focus:outline-none focus:border-secondary"
        />
        <Search class="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <button
          v-if="searchQuery"
          type="button"
          class="p-1 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          @click="searchQuery = ''"
        >
          <X class="w-4 h-4" />
        </button>
      </form>
    </div>
  </header>

  <!-- Mobile Drawer Menu -->
  <Transition name="sidebar">
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 top-16 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
      @click="closeMobileMenu"
    >
      <div class="h-full w-4/5 max-w-sm bg-white border-r border-black/10 p-6 flex flex-col justify-between shadow-2xl" @click.stop>
        <div class="space-y-4">
          <RouterLink to="/sell" class="block" @click="closeMobileMenu">
            <button class="w-full py-3 rounded bg-primary text-text-primary font-bold text-sm shadow-md flex items-center justify-center gap-2">
              <PlusCircle class="w-4 h-4" />
              <span>{{ t('nav.sell') }}</span>
            </button>
          </RouterLink>

          <div v-if="!userStore.isAuthenticated" class="grid grid-cols-2 gap-2 pt-1">
            <RouterLink
              to="/login"
              class="py-2.5 text-center text-xs font-medium text-text-secondary hover:text-text-primary bg-black/[0.03] rounded border border-black/10"
              @click="closeMobileMenu"
            >
              {{ t('nav.login') }}
            </RouterLink>
            <RouterLink
              to="/register"
              class="py-2.5 text-center text-xs font-semibold rounded bg-primary text-text-primary shadow-md"
              @click="closeMobileMenu"
            >
              {{ t('nav.register') }}
            </RouterLink>
          </div>
          <div v-else class="pt-1">
            <RouterLink
              to="/dashboard"
              class="flex items-center gap-2 px-4 py-2.5 rounded bg-black/[0.03] border border-black/10 text-xs font-medium text-text-primary"
              @click="closeMobileMenu"
            >
              <User class="w-4 h-4 text-primary" />
              <span>{{ userStore.fullName }} ({{ t('nav.myProfile') }})</span>
            </RouterLink>
          </div>

          <nav class="space-y-1 pt-2">
            <RouterLink
              v-for="link in navLinks"
              :key="link.path"
              :to="link.path"
              class="flex items-center justify-between px-4 py-3 rounded text-text-secondary hover:text-text-primary hover:bg-black/5 transition-colors font-medium text-sm"
              @click="closeMobileMenu"
            >
              <div class="flex items-center gap-3">
                <component :is="link.icon" class="w-5 h-5 text-primary" />
                <span>{{ link.label }}</span>
              </div>
              <span v-if="link.badge" class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-error/15 text-error">
                {{ link.badge }}
              </span>
            </RouterLink>

            <RouterLink
              to="/categories"
              class="flex items-center justify-between px-4 py-3 rounded text-text-secondary hover:text-text-primary hover:bg-black/5 transition-colors font-medium text-sm"
              @click="closeMobileMenu"
            >
              <div class="flex items-center gap-3">
                <Menu class="w-5 h-5 text-primary" />
                <span>{{ t('nav.allCategories') }}</span>
              </div>
            </RouterLink>
          </nav>
        </div>

        <div class="pt-6 border-t border-black/10">
          <p class="text-xs text-text-muted text-center">iTorgo • MBank / Optima / DemirBank</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
