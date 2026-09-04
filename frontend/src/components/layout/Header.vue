<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Menu, X, ChevronDown, Search, User, LogOut,
  Store, CreditCard, ShieldCheck, Settings,
  Plus, PlusCircle, ArrowRight, Check, Radio, Gauge,
  Gavel, Landmark, Heart, HelpCircle, Wallet, LayoutGrid
} from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useI18n } from '@/composables/useI18n'
import { useRouter, RouterLink } from 'vue-router'
import Dropdown from '@/components/ui/Dropdown.vue'
import Badge from '@/components/ui/Badge.vue'
import MegaMenu from '@/components/layout/MegaMenu.vue'
import IlbirsIcon from '@/components/icons/IlbirsIcon.vue'
import FlagIcon from '@/components/icons/FlagIcon.vue'

const userStore = useUserStore()
const themeStore = useThemeStore()
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
  { path: '/auctions', label: t('nav.auctions'), icon: Gavel },
  { path: '/auctions?status=live', label: t('nav.liveAuctions'), icon: Radio, badge: t('common.live') },
  { path: '/how-it-works', label: t('nav.howItWorks'), icon: HelpCircle },
])

const userMenuItems = computed(() => [
  ...(userStore.isAdmin ? [{
    label: t('nav.adminPanel'),
    path: '/admin',
    icon: Gauge,
    badge: 'ADMIN',
    isVerified: true
  }] : []),
  { label: t('dashboard.overview') || 'Genel Bakış', path: '/dashboard/overview', icon: User },
  { label: t('nav.myListings'), path: '/dashboard/listings', icon: Store },
  { label: t('nav.myBids'), path: '/dashboard/bids', icon: Gavel },
  { label: t('dashboard.watchlist') || 'Takip Listem', path: '/dashboard/watchlist', icon: Heart },
  { label: t('nav.payments'), path: '/dashboard/payments', icon: CreditCard },
  { label: t('nav.payouts'), path: '/dashboard/payouts', icon: Landmark },
  {
    label: t('nav.kycStatus'),
    path: '/dashboard/kyc',
    icon: ShieldCheck,
    badge: userStore.kycStatus === 'verified' ? (t('status.kyc.verified') || 'Doğrulandı') : (t('status.kyc.pending') || 'Bekliyor'),
    isVerified: userStore.kycStatus === 'verified'
  },
  { label: t('nav.settings'), path: '/dashboard/settings', icon: Settings, divider: true },
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

function handleSearch(event?: Event) {
  if (event) event.preventDefault()
  const q = searchQuery.value.trim()
  if (q) {
    router.push({ path: '/auctions', query: { search: q } })
    closeSearch()
    closeMobileMenu()
  }
}

async function handleLogout() {
  await userStore.logout()
  router.push('/')
  closeUserMenu()
  closeMobileMenu()
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
        ? 'bg-white/95 backdrop-blur-2xl border-b border-black/[0.08] shadow-sm'
        : 'bg-white/85 backdrop-blur-md border-b border-black/[0.06]'
    ]"
  >
    <!-- Top Navigation Bar -->
    <div class="w-full max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">
      <div class="flex items-center justify-between h-16 sm:h-18 gap-2 xl:gap-3">
        
        <!-- Left: Brand & Logo -->
        <div class="flex items-center gap-2.5 xl:gap-3.5 flex-shrink-0">
          <RouterLink to="/" class="flex items-center gap-2 group shrink-0" :aria-label="themeStore.theme.logoText || 'iTorgo'">
            <!-- Custom Image Logo -->
            <img
              v-if="themeStore.theme.logoType === 'image' && themeStore.theme.logoUrl"
              :src="themeStore.theme.logoUrl"
              :alt="themeStore.theme.logoText"
              :style="{ height: (themeStore.theme.logoHeightPx || 40) + 'px' }"
              class="w-auto object-contain transition-transform group-hover:scale-105"
            />

            <!-- Text Only Logo -->
            <span
              v-else-if="themeStore.theme.logoType === 'text_only'"
              class="font-black text-xl text-gray-950 tracking-tight"
            >
              {{ themeStore.theme.logoText }}
            </span>

            <!-- Icon + Text (Default) -->
            <template v-else>
              <div
                class="w-9 h-9 sm:w-10 sm:h-10 p-1.5 shadow-2xs group-hover:scale-105 transition-all flex items-center justify-center shrink-0 border border-amber-300/30"
                :class="[
                  themeStore.theme.logoBadgeShape === 'circle' ? 'rounded-full' :
                  themeStore.theme.logoBadgeShape === 'square' ? 'rounded-none' :
                  themeStore.theme.logoBadgeShape === 'transparent' ? 'bg-transparent shadow-none border-0' :
                  'rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600'
                ]"
              >
                <IlbirsIcon class="w-full h-full text-gray-950" />
              </div>
              <div class="flex flex-col">
                <span class="font-sans font-black text-lg sm:text-xl text-gray-950 tracking-tight flex items-center leading-none">
                  {{ themeStore.theme.logoText || 'iTorgo' }}<span class="w-1.5 h-1.5 rounded-full bg-amber-500 ml-1 shrink-0" />
                </span>
                <span class="text-[8.5px] text-gray-400 tracking-widest uppercase font-mono font-black hidden sm:block mt-1 leading-none">
                  {{ themeStore.theme.logoTagline || 'REAL-TIME PLATFORM' }}
                </span>
              </div>
            </template>
          </RouterLink>

          <!-- Categories Mega-Menu Trigger (Desktop) -->
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
                  class="px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 text-gray-800 hover:text-gray-950 font-extrabold text-xs border border-black/5 transition-all flex items-center gap-1.5 xl:gap-2 shadow-2xs group cursor-pointer whitespace-nowrap"
                >
                  <LayoutGrid class="w-3.5 h-3.5 text-gray-600 group-hover:text-amber-800 transition-colors" />
                  <span>{{ t('nav.allCategories') }}</span>
                  <ChevronDown class="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 transition-transform duration-200" :class="{ 'rotate-180': categoryMenuOpen }" />
                </button>
              </template>

              <div class="bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden">
                <MegaMenu @navigate="categoryMenuOpen = false" />
              </div>
            </Dropdown>
          </div>
        </div>

        <!-- Center: Search Bar (Desktop) -->
        <div class="hidden md:flex flex-1 min-w-[120px] max-w-[190px] xl:max-w-xs 2xl:max-w-sm mx-1 xl:mx-2">
          <form class="w-full relative group" @submit.prevent="handleSearch">
            <div class="relative flex items-center w-full bg-slate-100/90 hover:bg-slate-100 focus-within:bg-white rounded-full border border-black/[0.08] focus-within:border-primary/80 focus-within:ring-3 focus-within:ring-primary/20 transition-all duration-200 pl-3 pr-1 py-1">
              <Search class="w-3.5 h-3.5 text-gray-400 group-focus-within:text-amber-600 transition-colors flex-shrink-0" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('nav.searchPlaceholder') || 'MacBook, Camry...'"
                class="bg-transparent border-none focus:ring-0 w-full text-xs font-medium text-gray-900 placeholder-gray-400 outline-none ml-1.5 min-w-0"
              />
              <button
                v-if="searchQuery"
                type="button"
                class="p-1 text-gray-400 hover:text-gray-700 transition-colors mr-1 cursor-pointer"
                aria-label="Clear"
                @click="searchQuery = ''"
              >
                <X class="w-3.5 h-3.5" />
              </button>
              <button
                type="submit"
                class="w-6 h-6 rounded-full bg-gray-950 text-white flex items-center justify-center hover:bg-primary hover:text-gray-950 transition-all hover:scale-105 flex-shrink-0 cursor-pointer shadow-xs"
                aria-label="Search"
              >
                <ArrowRight class="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>

        <!-- Center-Right: Navigation Links (Desktop) -->
        <nav class="hidden xl:flex items-center gap-0.5 2xl:gap-1 flex-shrink-0">
          <RouterLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="relative px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-950 hover:bg-slate-100 transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap"
            active-class="!text-amber-950 !bg-amber-500/15 !border-amber-500/30 border font-extrabold"
          >
            <component :is="link.icon" class="w-3.5 h-3.5 flex-shrink-0 text-gray-500 group-hover:text-gray-900" />
            <span>{{ link.label }}</span>
            <span v-if="link.badge" class="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block ml-0.5 shrink-0" />
          </RouterLink>
        </nav>

        <!-- Right Side: CTA Actions & Profiles -->
        <div class="flex items-center gap-1 sm:gap-1.5 xl:gap-2 flex-shrink-0">

          <!-- Mobile Search Toggle -->
          <button
            class="md:hidden p-2 rounded-xl bg-slate-100 text-gray-600 hover:text-gray-950 transition-colors cursor-pointer"
            aria-label="Search"
            @click="toggleSearch"
          >
            <Search class="w-4 h-4" />
          </button>

          <!-- Sell / Lot Sat Button -->
          <RouterLink 
            to="/sell" 
            class="hidden sm:inline-flex px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-black text-xs shadow-sm hover:shadow hover:scale-[1.02] active:scale-95 transition-all items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <PlusCircle class="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{{ t('nav.sell') || 'Lot Sat' }}</span>
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
                  class="px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-black/5 text-gray-800 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
                  :title="t('nav.language')"
                >
                  <FlagIcon :code="currentLocale.code" custom-class="w-3.5 h-2.5 rounded-[2px]" />
                  <span class="uppercase text-[11px] font-extrabold text-gray-700">{{ currentLocale.code }}</span>
                  <ChevronDown class="w-3 h-3 text-gray-400 transition-transform duration-200" :class="{ 'rotate-180': langMenuOpen }" />
                </button>
              </template>

              <div class="w-48 p-1.5 bg-white rounded-2xl shadow-xl border border-black/10 space-y-1">
                <button
                  v-for="loc in supportedLocales"
                  :key="loc.code"
                  class="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-colors text-left cursor-pointer"
                  :class="loc.code === currentLocale.code
                    ? 'bg-amber-50 text-amber-900 font-extrabold border border-amber-200'
                    : 'text-gray-600 hover:bg-slate-50 hover:text-gray-950'"
                  @click="handleLanguageChange(loc.code)"
                >
                  <div class="flex items-center gap-2.5">
                    <FlagIcon :code="loc.code" custom-class="w-4 h-3 rounded-[2px]" />
                    <span>{{ loc.nativeName }}</span>
                  </div>
                  <Check v-if="loc.code === currentLocale.code" class="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
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
                <div class="flex items-center gap-2 px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-black/5 transition-all cursor-pointer shadow-2xs">
                  <div class="w-6 h-6 rounded-lg bg-primary flex items-center justify-center font-black text-xs text-gray-950 flex-shrink-0 shadow-2xs">
                    {{ userStore.fullName?.charAt(0) || 'U' }}
                  </div>
                  <span class="hidden sm:inline-block text-xs font-bold text-gray-900 max-w-[90px] md:max-w-[120px] truncate">
                    {{ userStore.fullName }}
                  </span>
                  <ChevronDown class="hidden sm:block w-3.5 h-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0" :class="{ 'rotate-180': userMenuOpen }" />
                </div>
              </template>

              <div class="w-64 p-1.5 bg-white rounded-3xl shadow-2xl border border-black/10">
                <!-- User Header Info -->
                <div class="px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/[0.04] mb-1.5">
                  <p class="text-xs font-black text-gray-950 truncate">{{ userStore.fullName }}</p>
                  <p class="text-[11px] text-gray-400 truncate">{{ userStore.user?.email }}</p>
                  <div class="mt-2.5 pt-2 border-t border-black/[0.06] flex items-center justify-between text-xs">
                    <span class="text-gray-500 font-medium">{{ t('nav.balance') || 'Bakiye' }}</span>
                    <span class="font-black text-amber-700 font-mono">{{ userStore.formattedBalance }}</span>
                  </div>
                </div>

                <!-- Navigation List -->
                <div class="space-y-0.5">
                  <RouterLink
                    v-for="item in userMenuItems"
                    :key="item.label"
                    :to="item.path"
                    class="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-gray-950 hover:bg-slate-50 rounded-xl transition-colors"
                    @click="closeUserMenu"
                  >
                    <component :is="item.icon" class="w-4 h-4 text-gray-400 group-hover:text-gray-800" />
                    <span class="truncate">{{ item.label }}</span>
                    <Badge v-if="item.badge" :variant="(item as any).isVerified ? 'success' : 'warning'" size="sm" class="ml-auto">
                      {{ item.badge }}
                    </Badge>
                  </RouterLink>
                </div>

                <div class="border-t border-black/[0.06] my-1" />

                <!-- Logout Button -->
                <button
                  class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  @click="handleLogout"
                >
                  <LogOut class="w-4 h-4 text-rose-500" />
                  <span>{{ t('nav.logout') }}</span>
                </button>
              </div>
            </Dropdown>

            <div v-else class="flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
              <RouterLink
                to="/login"
                class="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-gray-700 hover:text-gray-950 hover:bg-slate-100 rounded-xl transition-colors shrink-0 whitespace-nowrap"
              >
                {{ t('nav.login') }}
              </RouterLink>
              <RouterLink
                to="/register"
                class="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-black rounded-xl bg-primary text-gray-950 hover:bg-primary-hover shadow-sm transition-all shrink-0 whitespace-nowrap"
              >
                {{ t('nav.register') }}
              </RouterLink>
            </div>
          </div>

          <!-- Mobile Hamburger Menu Button -->
          <button
            class="lg:hidden p-2 rounded-xl bg-slate-100 text-gray-700 hover:text-gray-950 transition-colors cursor-pointer"
            aria-label="Toggle menu"
            @click="toggleMobileMenu"
          >
            <Menu v-if="!mobileMenuOpen" class="w-5 h-5" />
            <X v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Search Dropdown (Slide Down) -->
    <div v-if="isSearchOpen" class="md:hidden px-4 pb-3 pt-1 border-t border-black/10 bg-white/98 backdrop-blur-xl">
      <form class="relative" @submit.prevent="handleSearch">
        <input
          id="header-search-mobile"
          v-model="searchQuery"
          type="text"
          :placeholder="t('nav.searchPlaceholder') || 'MacBook, Camry, Bişkek...'"
          class="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-100 border border-black/10 text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:bg-white"
        />
        <Search class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <button
          v-if="searchQuery"
          type="button"
          class="p-1 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
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
      <div class="h-[calc(100vh-4rem)] max-h-screen w-4/5 max-w-sm bg-white border-r border-black/10 p-5 sm:p-6 flex flex-col justify-between shadow-2xl overflow-y-auto custom-scrollbar" @click.stop>
        <div class="space-y-4">
          <!-- Mobile Sell Action -->
          <RouterLink 
            to="/sell" 
            class="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer" 
            @click="closeMobileMenu"
          >
            <PlusCircle class="w-4 h-4" />
            <span>{{ t('nav.sell') || 'Lot Sat' }}</span>
          </RouterLink>

          <!-- User Card / Auth Buttons -->
          <div v-if="!userStore.isAuthenticated" class="grid grid-cols-2 gap-2 pt-1">
            <RouterLink
              to="/login"
              class="py-2.5 text-center text-xs font-bold text-gray-700 bg-slate-100 rounded-xl border border-black/5"
              @click="closeMobileMenu"
            >
              {{ t('nav.login') }}
            </RouterLink>
            <RouterLink
              to="/register"
              class="py-2.5 text-center text-xs font-black rounded-xl bg-primary text-gray-950 shadow-sm"
              @click="closeMobileMenu"
            >
              {{ t('nav.register') }}
            </RouterLink>
          </div>
          <div v-else class="pt-1">
            <RouterLink
              to="/dashboard/overview"
              class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-black/5"
              @click="closeMobileMenu"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-xl bg-primary flex items-center justify-center font-black text-xs text-gray-950 shrink-0">
                  {{ userStore.fullName?.charAt(0) || 'U' }}
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-black text-gray-950 truncate">{{ userStore.fullName }}</p>
                  <p class="text-[10px] text-gray-400 truncate">{{ userStore.formattedBalance }}</p>
                </div>
              </div>
              <ChevronDown class="w-4 h-4 text-gray-400 -rotate-90" />
            </RouterLink>
          </div>

          <!-- Navigation Links -->
          <nav class="space-y-1 pt-2">
            <RouterLink
              to="/categories"
              class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-gray-700 hover:text-gray-950 hover:bg-slate-100 transition-colors font-bold text-xs"
              @click="closeMobileMenu"
            >
              <div class="flex items-center gap-3">
                <LayoutGrid class="w-4 h-4 text-amber-800" />
                <span>{{ t('nav.allCategories') }}</span>
              </div>
              <ChevronDown class="w-3.5 h-3.5 text-gray-400 -rotate-90" />
            </RouterLink>

            <RouterLink
              v-for="link in navLinks"
              :key="link.path"
              :to="link.path"
              class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-gray-700 hover:text-gray-950 hover:bg-slate-100 transition-colors font-bold text-xs"
              @click="closeMobileMenu"
            >
              <div class="flex items-center gap-3">
                <component :is="link.icon" class="w-4 h-4 text-gray-500" />
                <span>{{ link.label }}</span>
              </div>
              <span v-if="link.badge" class="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white">
                {{ link.badge }}
              </span>
            </RouterLink>
          </nav>

          <!-- Mobile Language Switcher Row -->
          <div class="pt-4 border-t border-black/[0.06] mt-3">
            <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
              {{ t('nav.language') || 'Язык / Тил / Dil' }}
            </p>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="loc in supportedLocales"
                :key="loc.code"
                type="button"
                class="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer"
                :class="loc.code === currentLocale.code
                  ? 'bg-amber-500/15 border-amber-500 text-amber-950 font-black shadow-xs'
                  : 'bg-slate-50 border-black/10 text-gray-700 hover:bg-slate-100'"
                @click="handleLanguageChange(loc.code)"
              >
                <FlagIcon :code="loc.code" custom-class="w-4 h-3 rounded-[2px]" />
                <span class="truncate">{{ loc.nativeName }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="pt-6 pb-2 border-t border-black/[0.06] mt-4 text-center">
          <p class="text-[11px] text-gray-400 font-medium">iTorgo • MBank / Optima / DemirBank</p>
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
