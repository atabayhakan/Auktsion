<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Menu, X, ChevronDown, Search, User, LogOut,
  Store, CreditCard, ShieldCheck, Settings,
  PlusCircle, ArrowRight, Check, Radio, Gauge,
  Gavel, Landmark, Heart, HelpCircle, LayoutGrid, MapPin, Sparkles
} from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useI18n } from '@/composables/useI18n'
import { useRouter, RouterLink } from 'vue-router'
import Dropdown from '@/components/ui/Dropdown.vue'
import Badge from '@/components/ui/Badge.vue'
import MegaMenu from '@/components/layout/MegaMenu.vue'
import SearchModal from '@/components/layout/SearchModal.vue'
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
const cityMenuOpen = ref(false)
const categoryMenuOpen = ref(false)
const isSearchModalOpen = ref(false)

const selectedCity = ref({ id: 'bishkek', name: 'Бишкек' })
const cities = [
  { id: 'all', name: 'Весь Кыргызстан' },
  { id: 'bishkek', name: 'Бишкек' },
  { id: 'osh', name: 'Ош' },
  { id: 'chuy', name: 'Чуй' },
  { id: 'issyk_kul', name: 'Иссык-Куль' },
  { id: 'jalal_abad', name: 'Джалал-Абад' },
]

const navLinks = computed(() => [
  { path: '/auctions', label: t('nav.auctions') || 'Каталог', icon: Store },
  { path: '/auctions?status=live', label: t('nav.liveAuctions') || 'Живые торги', icon: Radio, badge: t('common.live') || 'LIVE' },
  { path: '/how-it-works', label: t('nav.howItWorks') || 'Как это работает', icon: HelpCircle },
])

const userMenuItems = computed(() => [
  ...(userStore.isAdmin ? [{
    label: t('nav.adminPanel'),
    path: '/admin',
    icon: Gauge,
    badge: 'ADMIN',
    isVerified: true
  }] : []),
  { label: t('dashboard.overview') || 'Обзор', path: '/dashboard/overview', icon: User },
  { label: t('nav.myListings'), path: '/dashboard/listings', icon: Store },
  { label: t('nav.myBids'), path: '/dashboard/bids', icon: Gavel },
  { label: t('dashboard.watchlist') || 'Избранное', path: '/dashboard/watchlist', icon: Heart },
  { label: t('nav.payments'), path: '/dashboard/payments', icon: CreditCard },
  { label: t('nav.payouts'), path: '/dashboard/payouts', icon: Landmark },
  {
    label: t('nav.kycStatus'),
    path: '/dashboard/kyc',
    icon: ShieldCheck,
    badge: userStore.kycStatus === 'verified' ? (t('status.kyc.verified') || 'Подтвержден') : (t('status.kyc.pending') || 'Ожидает'),
    isVerified: userStore.kycStatus === 'verified'
  },
  { label: t('nav.settings'), path: '/dashboard/settings', icon: Settings, divider: true },
])

function selectCity(city: { id: string; name: string }) {
  selectedCity.value = city
  cityMenuOpen.value = false
  if (city.id !== 'all') {
    router.push({ path: '/auctions', query: { city: city.name } })
  } else {
    router.push({ path: '/auctions' })
  }
}

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

function openSearch() {
  isSearchModalOpen.value = true
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
      'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
      isScrolled
        ? 'bg-white/95 backdrop-blur-2xl border-b border-black/[0.08] shadow-sm'
        : 'bg-white/90 backdrop-blur-md border-b border-black/[0.06]'
    ]"
  >
    <div class="w-full max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">
      <div class="flex items-center justify-between h-16 sm:h-18 gap-2 xl:gap-4">
        
        <!-- Left: Brand & City Selector -->
        <div class="flex items-center gap-2.5 xl:gap-3.5 shrink-0">
          <RouterLink to="/" class="flex items-center gap-2 group shrink-0" :aria-label="themeStore.theme.logoText || 'ITOrgo'">
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

            <!-- Default Icon + Text -->
            <template v-else>
              <div
                class="w-9 h-9 sm:w-10 sm:h-10 p-1.5 shadow-2xs group-hover:scale-105 transition-all flex items-center justify-center shrink-0 border border-amber-300/30 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600"
              >
                <IlbirsIcon class="w-full h-full text-gray-950" />
              </div>
              <div class="flex flex-col">
                <span class="font-sans font-black text-lg sm:text-xl text-gray-950 tracking-tight flex items-center leading-none">
                  {{ themeStore.theme.logoText || 'ITOrgo' }}<span class="w-1.5 h-1.5 rounded-full bg-amber-500 ml-1 shrink-0" />
                </span>
                <span class="text-[8.5px] text-gray-400 tracking-widest uppercase font-mono font-black hidden sm:block mt-1 leading-none">
                  COMMERCE 2026
                </span>
              </div>
            </template>
          </RouterLink>

          <!-- City Location Selector Dropdown -->
          <div class="relative shrink-0">
            <Dropdown
              v-model="cityMenuOpen"
              trigger="click"
              placement="bottom"
              align="start"
            >
              <template #trigger>
                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-black/5 text-gray-800 transition-all text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                  title="Выбрать город"
                >
                  <MapPin class="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span class="hidden sm:inline">{{ selectedCity.name }}</span>
                  <span class="sm:hidden">{{ selectedCity.name.slice(0, 4) }}.</span>
                  <ChevronDown class="w-3 h-3 text-gray-400 transition-transform duration-200" :class="{ 'rotate-180': cityMenuOpen }" />
                </button>
              </template>

              <div class="w-48 p-1.5 bg-white rounded-2xl shadow-xl border border-black/10 space-y-1">
                <button
                  v-for="c in cities"
                  :key="c.id"
                  class="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-colors text-left cursor-pointer"
                  :class="c.name === selectedCity.name
                    ? 'bg-amber-50 text-amber-900 font-extrabold border border-amber-200'
                    : 'text-gray-700 hover:bg-slate-50'"
                  @click="selectCity(c)"
                >
                  <span>{{ c.name }}</span>
                  <Check v-if="c.name === selectedCity.name" class="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
                </button>
              </div>
            </Dropdown>
          </div>

          <!-- Categories Mega-Menu Trigger (Desktop) -->
          <div class="hidden lg:block relative shrink-0">
            <Dropdown
              v-model="categoryMenuOpen"
              trigger="hover"
              placement="bottom"
              align="start"
            >
              <template #trigger>
                <button
                  type="button"
                  class="px-3 py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 text-gray-800 hover:text-gray-950 font-extrabold text-xs border border-black/5 transition-all flex items-center gap-2 shadow-2xs group cursor-pointer whitespace-nowrap"
                >
                  <LayoutGrid class="w-3.5 h-3.5 text-gray-600 group-hover:text-amber-800 transition-colors" />
                  <span>{{ t('nav.allCategories') || 'Каталог' }}</span>
                  <ChevronDown class="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 transition-transform duration-200" :class="{ 'rotate-180': categoryMenuOpen }" />
                </button>
              </template>

              <div class="bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden">
                <MegaMenu @navigate="categoryMenuOpen = false" />
              </div>
            </Dropdown>
          </div>
        </div>

        <!-- Center: Interactive Search Bar Trigger (Desktop & Mobile) -->
        <div class="flex-1 max-w-lg mx-2">
          <button
            type="button"
            class="w-full relative flex items-center bg-slate-100/90 hover:bg-slate-100 focus:bg-white rounded-2xl border border-black/[0.08] hover:border-amber-500/40 px-3.5 py-2 transition-all duration-200 cursor-pointer text-left shadow-2xs group"
            @click="openSearch"
          >
            <Search class="w-4 h-4 text-gray-400 group-hover:text-amber-600 transition-colors shrink-0" />
            <span class="text-xs font-medium text-gray-500 truncate ml-2.5 flex-1">
              {{ t('nav.searchPlaceholder') || 'Что вы ищете? Например: iPhone, Camry, Арашан...' }}
            </span>
            <span class="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white border border-black/10 text-gray-400 shadow-2xs">
              <Sparkles class="w-3 h-3 text-amber-500" />
              <span>Поиск</span>
            </span>
          </button>
        </div>

        <!-- Right Side: Links & CTAs & Profile -->
        <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          <!-- Primary Navigation Links (Desktop) -->
          <nav class="hidden xl:flex items-center gap-1 shrink-0 mr-1">
            <RouterLink
              v-for="link in navLinks"
              :key="link.path"
              :to="link.path"
              class="relative px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-950 hover:bg-slate-100 transition-all flex items-center gap-1.5 whitespace-nowrap"
              active-class="!text-amber-950 !bg-amber-500/15 !border-amber-500/30 border font-extrabold"
            >
              <component :is="link.icon" class="w-3.5 h-3.5 text-gray-500" />
              <span>{{ link.label }}</span>
              <span v-if="link.badge" class="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                {{ link.badge }}
              </span>
            </RouterLink>
          </nav>

          <!-- Sell Accent Button -->
          <RouterLink 
            to="/sell" 
            class="hidden sm:inline-flex px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-black text-xs shadow-sm hover:shadow hover:scale-[1.02] active:scale-95 transition-all items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <PlusCircle class="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{{ t('nav.sell') || '+ Продать' }}</span>
          </RouterLink>

          <!-- Language Selector Dropdown -->
          <div class="relative shrink-0">
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
          <div class="relative shrink-0">
            <Dropdown
              v-if="userStore.isAuthenticated"
              v-model="userMenuOpen"
              trigger="click"
              placement="bottom"
              align="end"
            >
              <template #trigger>
                <div class="flex items-center gap-2 px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-black/5 transition-all cursor-pointer shadow-2xs">
                  <div class="w-6 h-6 rounded-lg bg-primary flex items-center justify-center font-black text-xs text-gray-950 shrink-0 shadow-2xs">
                    {{ userStore.fullName?.charAt(0) || 'U' }}
                  </div>
                  <span class="hidden sm:inline-block text-xs font-bold text-gray-900 max-w-[90px] md:max-w-[120px] truncate">
                    {{ userStore.fullName }}
                  </span>
                  <ChevronDown class="hidden sm:block w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0" :class="{ 'rotate-180': userMenuOpen }" />
                </div>
              </template>

              <div class="w-64 p-1.5 bg-white rounded-3xl shadow-2xl border border-black/10">
                <div class="px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/[0.04] mb-1.5">
                  <p class="text-xs font-black text-gray-950 truncate">{{ userStore.fullName }}</p>
                  <p class="text-[11px] text-gray-400 truncate">{{ userStore.user?.email }}</p>
                  <div class="mt-2.5 pt-2 border-t border-black/[0.06] flex items-center justify-between text-xs">
                    <span class="text-gray-500 font-medium">{{ t('nav.balance') || 'Баланс' }}</span>
                    <span class="font-black text-amber-700 font-mono">{{ userStore.formattedBalance }}</span>
                  </div>
                </div>

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

                <button
                  class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  @click="handleLogout"
                >
                  <LogOut class="w-4 h-4 text-rose-500" />
                  <span>{{ t('nav.logout') || 'Выйти' }}</span>
                </button>
              </div>
            </Dropdown>

            <div v-else class="flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
              <RouterLink
                to="/login"
                class="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-gray-700 hover:text-gray-950 hover:bg-slate-100 rounded-xl transition-colors shrink-0 whitespace-nowrap"
              >
                {{ t('nav.login') || 'Войти' }}
              </RouterLink>
              <RouterLink
                to="/register"
                class="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-black rounded-xl bg-primary text-gray-950 hover:bg-primary-hover shadow-sm transition-all shrink-0 whitespace-nowrap"
              >
                {{ t('nav.register') || 'Регистрация' }}
              </RouterLink>
            </div>
          </div>

          <!-- Mobile Hamburger Drawer Trigger -->
          <button
            class="lg:hidden p-2 rounded-xl bg-slate-100 text-gray-700 hover:text-gray-950 transition-colors cursor-pointer ml-1"
            aria-label="Toggle menu"
            @click="toggleMobileMenu"
          >
            <Menu v-if="!mobileMenuOpen" class="w-5 h-5" />
            <X v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Search Modal / Sheet -->
    <SearchModal v-model="isSearchModalOpen" />
  </header>

  <!-- Mobile Drawer Menu -->
  <Transition name="sidebar">
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 top-16 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
      @click="closeMobileMenu"
    >
      <div class="h-[calc(100vh-4rem)] max-h-screen w-4/5 max-w-sm bg-white border-r border-black/10 p-5 sm:p-6 flex flex-col justify-between shadow-2xl overflow-y-auto custom-scrollbar" @click.stop>
        <div class="space-y-4">
          <RouterLink 
            to="/sell" 
            class="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer" 
            @click="closeMobileMenu"
          >
            <PlusCircle class="w-4 h-4" />
            <span>{{ t('nav.sell') || '+ Продать лот' }}</span>
          </RouterLink>

          <div v-if="!userStore.isAuthenticated" class="grid grid-cols-2 gap-2 pt-1">
            <RouterLink
              to="/login"
              class="py-2.5 text-center text-xs font-bold text-gray-700 bg-slate-100 rounded-xl border border-black/5"
              @click="closeMobileMenu"
            >
              {{ t('nav.login') || 'Войти' }}
            </RouterLink>
            <RouterLink
              to="/register"
              class="py-2.5 text-center text-xs font-black rounded-xl bg-primary text-gray-950 shadow-sm"
              @click="closeMobileMenu"
            >
              {{ t('nav.register') || 'Регистрация' }}
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

          <nav class="space-y-1 pt-2">
            <RouterLink
              to="/categories"
              class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-gray-700 hover:text-gray-950 hover:bg-slate-100 transition-colors font-bold text-xs"
              @click="closeMobileMenu"
            >
              <div class="flex items-center gap-3">
                <LayoutGrid class="w-4 h-4 text-amber-800" />
                <span>{{ t('nav.allCategories') || 'Все категории' }}</span>
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

          <div class="pt-4 border-t border-black/[0.06] mt-3">
            <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
              {{ t('nav.language') || 'Язык платформы' }}
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
          <p class="text-[11px] text-gray-400 font-medium">ITOrgo • MBank / Optima / DemirBank</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.sidebar-enter-active,
.sidebar-leave-active {
  transition: opacity 0.25s ease;
}
.sidebar-enter-from,
.sidebar-leave-to {
  opacity: 0;
}
</style>
