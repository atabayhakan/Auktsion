<script setup lang="ts">
import { ChevronDown, Sun, Moon, Search, ShoppingBag, User, Bell, Menu, X } from 'lucide-vue-next'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@/composables/useI18n'

interface Props {
  transparent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  transparent: false,
})

const router = useRouter()
const { t, locale, setLocale } = useI18n()

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
const isSearchOpen = ref(false)
const isUserMenuOpen = ref(false)
const isLanguageOpen = ref(false)
const searchQuery = ref('')

const languages = [
  { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча', flag: '🇰🇬' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
]

const currentLang = computed(() => languages.find(l => l.code === locale.value) || languages[0])

const navItems = [
  { path: '/', label: 'Ana Sayfa', exact: true },
  { path: '/canli-acik-artirmalar', label: 'Canlı Açık Artırmalar' },
  { path: '/kategoriler', label: 'Kategoriler' },
  { path: '/nasıl-calışır', label: 'Nasıl Çalışır?' },
]

const userMenuItems = [
  { path: '/profil', label: 'Profilim', icon: User },
  { path: '/ilanlarim', label: 'İlanlarım', icon: ShoppingBag },
  { path: '/tekliflerim', label: 'Tekliflerim', icon: Bell },
  { path: '/odemeler', label: 'Ödeme Geçmişi' },
  { path: '/ayarlar', label: 'Ayarlar' },
]

function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

function handleSearch(event: Event) {
  event.preventDefault()
  if (searchQuery.value.trim()) {
    router.push({ path: '/kategoriler', query: { q: searchQuery.value } })
  }
}

function toggleLanguage(langCode: string) {
  setLocale(langCode as any)
  isLanguageOpen.value = false
}

function closeAllDropdowns() {
  isUserMenuOpen.value = false
  isLanguageOpen.value = false
  isMobileMenuOpen.value = false
}

function handleOutsideClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('[data-dropdown-trigger]') && !target.closest('[data-dropdown-content]')) {
    closeAllDropdowns()
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('click', handleOutsideClick)
  
  // Initial scroll check
  isScrolled.value = window.scrollY > 20
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <header
    :class="[
      'navbar-liquid',
      'transition-all duration-300',
      isScrolled ? 'shadow-liquid-lg py-3' : 'py-4',
      props.transparent && !isScrolled ? 'bg-transparent border-none shadow-none' : ''
    ]"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between gap-4">
        <!-- Logo & Mobile Menu -->
        <div class="flex items-center gap-4">
          <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="lg:hidden p-2 rounded-lg glass hover:bg-[rgb(var(--color-accent))/0.5] transition-all"
            aria-label="Menü"
          >
            <Menu v-if="!isMobileMenuOpen" class="w-6 h-6 text-[rgb(var(--color-text-primary))]" />
            <X v-else class="w-6 h-6 text-[rgb(var(--color-text-primary))]" />
          </button>

          <router-link to="/" class="flex items-center gap-2" aria-label="iTorgo Ana Sayfa">
            <div class="w-9 h-9 rounded-xl bg-gradient-hero flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span class="font-bold text-xl text-[rgb(var(--color-text-primary))] hidden sm:block">
              iTorgo
            </span>
          </router-link>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden lg:flex items-center gap-6" aria-label="Ana navigasyon">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            :class="[
              'text-sm font-medium transition-all duration-200 relative',
              'text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))]',
              router.currentRoute.value.path === item.path ? 'text-[rgb(var(--color-primary))]' : ''
            ]"
          >
            {{ t(item.label) }}
            <span v-if="item.path === '/canli-acik-artirmalar'" class="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[rgb(var(--color-error))] text-white animate-pulse-glow">
              CANLI
            </span>
          </router-link>
        </nav>

        <!-- Search Bar -->
        <div class="flex-1 max-w-xl lg:max-w-md mx-4 hidden lg:block">
          <form @submit.prevent="handleSearch" class="relative">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--color-text-muted))]" aria-hidden="true" />
            <input
              v-model="searchQuery"
              type="search"
              :placeholder="t('navbar.searchPlaceholder')"
              class="input-liquid-glass pl-12 pr-4 py-2.5 text-sm"
              aria-label="Arama"
            />
          </form>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 lg:gap-3">
          <!-- Language Selector -->
          <div class="relative" data-dropdown-trigger>
            <button
              @click="isLanguageOpen = !isLanguageOpen"
              class="flex items-center gap-1.5 px-3 py-2 rounded-lg glass hover:bg-[rgb(var(--color-accent))/0.5] transition-all"
              aria-expanded="isLanguageOpen"
              aria-haspopup="listbox"
            >
              <span class="text-base">{{ currentLang.value.flag }}</span>
              <span class="text-sm font-medium text-[rgb(var(--color-text-primary))]">{{ currentLang.value.nativeName }}</span>
              <ChevronDown class="w-4 h-4 text-[rgb(var(--color-text-muted))] transition-transform" :class="{ 'rotate-180': isLanguageOpen }" />
            </button>

            <Teleport to="body">
              <Transition name="dropdown">
                <div
                  v-show="isLanguageOpen"
                  class="absolute right-0 mt-2 w-40 glass-strong rounded-xl shadow-liquid-lg border border-[rgb(var(--color-border))/0.3] py-1 z-50 animate-fade-in"
                  data-dropdown-content
                  role="listbox"
                >
                  <button
                    v-for="lang in languages"
                    :key="lang.code"
                    @click="toggleLanguage(lang.code)"
                    class="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-[rgb(var(--color-accent))/0.5] transition-colors"
                    role="option"
                    :aria-selected="lang.code === locale"
                  >
                    <span class="text-base">{{ lang.flag }}</span>
                    <span>{{ lang.nativeName }}</span>
                    <Sun v-if="lang.code === locale" class="ml-auto w-4 h-4 text-[rgb(var(--color-primary))]" />
                  </button>
                </div>
              </Transition>
            </Teleport>
          </div>

          <!-- Theme Toggle -->
          <button
            @click="document.documentElement.classList.toggle('dark')"
            class="p-2.5 rounded-lg glass hover:bg-[rgb(var(--color-accent))/0.5] transition-all"
            aria-label="Tema değiştir"
          >
            <Sun v-if="document.documentElement.classList.contains('dark')" class="w-5 h-5 text-[rgb(var(--color-primary))]" />
            <Moon v-else class="w-5 h-5 text-[rgb(var(--color-secondary))]" />
          </button>

          <!-- User Menu / Auth Buttons -->
          <div class="relative" data-dropdown-trigger>
            <div v-if="false" class="flex items-center gap-2">
              <!-- Authenticated user dropdown - placeholder for future auth integration -->
              <button
                @click="isUserMenuOpen = !isUserMenuOpen"
                class="flex items-center gap-2 px-3 py-2 rounded-lg glass hover:bg-[rgb(var(--color-accent))/0.5] transition-all"
                aria-expanded="isUserMenuOpen"
                aria-haspopup="menu"
              >
                <div class="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center font-bold text-white text-sm">
                  U
                </div>
                <span class="hidden sm:block text-sm font-medium text-[rgb(var(--color-text-primary))]">Kullanıcı</span>
                <ChevronDown class="w-4 h-4 text-[rgb(var(--color-text-muted))] hidden sm:block transition-transform" :class="{ 'rotate-180': isUserMenuOpen }" />
              </button>

              <Teleport to="body">
                <Transition name="dropdown">
                  <div
                    v-show="isUserMenuOpen"
                    class="absolute right-0 mt-2 w-56 glass-strong rounded-xl shadow-liquid-lg border border-[rgb(var(--color-border))/0.3] py-1 z-50 animate-fade-in"
                    data-dropdown-content
                    role="menu"
                  >
                    <div class="px-3 py-2 border-b border-[rgb(var(--color-border))/0.3]">
                      <p class="text-sm font-semibold text-[rgb(var(--color-text-primary))]">Kullanıcı Adı</p>
                      <p class="text-xs text-[rgb(var(--color-text-muted))]">user@auktsion.com</p>
                    </div>
                    <router-link
                      v-for="item in userMenuItems"
                      :key="item.path"
                      :to="item.path"
                      @click="closeAllDropdowns"
                      class="flex items-center gap-3 px-3 py-2.5 text-sm text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-accent))/0.5] transition-colors"
                    >
                      <component :is="item.icon" class="w-5 h-5" />
                      <span>{{ t(item.label) }}</span>
                    </router-link>
                    <hr class="my-1 border-[rgb(var(--color-border))/0.3]" />
                    <button
                      @click="closeAllDropdowns"
                      class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))/0.1] transition-colors"
                    >
                      <LogOut class="w-5 h-5" />
                      <span>{{ t('navbar.logout') }}</span>
                    </button>
                  </div>
                </Transition>
              </Teleport>
            </div>

            <!-- Guest buttons -->
            <template v-else>
              <router-link
                to="/giris"
                class="hidden sm:block px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))] transition-colors"
              >
                {{ t('navbar.login') }}
              </router-link>
              <router-link
                to="/kayit"
                class="btn-liquid-primary px-5 py-2.5 text-sm"
              >
                {{ t('navbar.register') }}
              </router-link>
            </template>
          </div>

          <!-- Mobile Menu Trigger -->
          <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="lg:hidden p-2.5 rounded-lg glass hover:bg-[rgb(var(--color-accent))/0.5] transition-all"
            aria-label="Mobil menü"
          >
            <Menu v-if="!isMobileMenuOpen" class="w-6 h-6 text-[rgb(var(--color-text-primary))]" />
            <X v-else class="w-6 h-6 text-[rgb(var(--color-text-primary))]" />
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <Transition name="slide">
        <div
          v-show="isMobileMenuOpen"
          class="lg:hidden glass-strong border-t border-[rgb(var(--color-border))/0.3] animate-slide-down"
        >
          <div class="px-4 py-4 space-y-3">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              @click="isMobileMenuOpen = false"
              class="block px-3 py-2.5 rounded-lg text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-accent))/0.5] transition-colors"
            >
              {{ t(item.label) }}
            </router-link>
            
            <div class="pt-2 border-t border-[rgb(var(--color-border))/0.3]">
              <router-link
                to="/giris"
                class="block px-3 py-2.5 rounded-lg text-center text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))] transition-colors"
              >
                {{ t('navbar.login') }}
              </router-link>
              <router-link
                to="/kayit"
                class="btn-liquid-primary w-full mt-2 text-center"
              >
                {{ t('navbar.register') }}
              </router-link>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </header>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.animate-slide-down {
  animation: slideDown 0.3s ease-out forwards;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>