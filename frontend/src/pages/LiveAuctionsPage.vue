<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  Filter, Search, SlidersHorizontal, ArrowUpDown,
  RotateCcw, Sparkles, Check, ChevronDown, CheckCircle2,
  MapPin, Flame, Zap, X
} from 'lucide-vue-next'
import { useAuctionStore } from '@/stores/auction'
import { useI18n } from '@/composables/useI18n'
import AuctionCard from '@/components/auction/AuctionCard.vue'
import { platformCategories } from '@/data/categories'
import { kyrgyzstanRegions } from '@/data/regions'
import { mockAuctions } from '@/data/mockAuctions'

const route = useRoute()
const router = useRouter()
const auctionStore = useAuctionStore()
const { t, locale } = useI18n()

const searchQuery = ref('')
const selectedCategory = ref((route.query.category as string) || 'all')
const selectedRegion = ref((route.query.region as string) || 'all')
const selectedSort = ref((route.query.sort as string) || 'ending_soon')
const minPrice = ref<number | null>(null)
const maxPrice = ref<number | null>(null)
const isBlitzOnly = ref(false)
const showMobileFilters = ref(false)

watch(() => route.query.category, (newCat) => {
  selectedCategory.value = (newCat as string) || 'all'
})

watch(() => route.query.region, (newReg) => {
  selectedRegion.value = (newReg as string) || 'all'
})

watch(() => route.query.sort, (newSort) => {
  if (newSort) selectedSort.value = newSort as string
})

const categories = computed(() => {
  const currentLang = (locale.value as 'ky' | 'ru' | 'tr') || 'ky'
  return [
    { id: 'all', name: 'Бардыгы', icon: '✨' },
    ...platformCategories.map(c => ({
      id: c.slug,
      name: c.name[currentLang] || c.name.ky,
      icon: c.icon
    }))
  ]
})

const sortOptions = computed(() => [
  { value: 'ending_soon', label: 'Жакында Бүтөт 🔥' },
  { value: 'price_desc', label: 'Баа: Кымбаттан Арзанга' },
  { value: 'price_asc', label: 'Баа: Арзандан Кымбатка' },
  { value: 'most_bids', label: 'Эң Көп Сунуш Түшкөн' },
  { value: 'newest', label: 'Эң Жаңы Кошулган' },
])

const allAuctions = computed(() => {
  if (auctionStore.auctions && auctionStore.auctions.length > 0) {
    return auctionStore.auctions
  }
  return mockAuctions
})

const filteredAuctions = computed(() => {
  let list = [...allAuctions.value]

  // Category filter
  if (selectedCategory.value !== 'all') {
    list = list.filter(a => {
      const catSlug = typeof a.category === 'object' ? (a.category as any)?.slug : a.category
      return catSlug === selectedCategory.value
    })
  }

  // Region filter
  if (selectedRegion.value !== 'all') {
    list = list.filter(a => a.regionId === selectedRegion.value || a.city.toLowerCase().includes(selectedRegion.value.toLowerCase()))
  }

  // Blitz only
  if (isBlitzOnly.value) {
    list = list.filter(a => a.isBlitz)
  }

  // Search query
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a => 
      a.title.toLowerCase().includes(q) || 
      (a.description && a.description.toLowerCase().includes(q))
    )
  }

  // Min Price
  if (minPrice.value !== null && minPrice.value > 0) {
    list = list.filter(a => {
      const price = a.currentPrice?.minorUnits ? a.currentPrice.minorUnits / 100 : parseFloat(a.currentPrice?.amount || '0')
      return price >= minPrice.value!
    })
  }

  // Max Price
  if (maxPrice.value !== null && maxPrice.value > 0) {
    list = list.filter(a => {
      const price = a.currentPrice?.minorUnits ? a.currentPrice.minorUnits / 100 : parseFloat(a.currentPrice?.amount || '0')
      return price <= maxPrice.value!
    })
  }

  // Sort
  if (selectedSort.value === 'ending_soon') {
    list.sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime())
  } else if (selectedSort.value === 'price_desc') {
    list.sort((a, b) => (b.currentPrice?.minorUnits || 0) - (a.currentPrice?.minorUnits || 0))
  } else if (selectedSort.value === 'price_asc') {
    list.sort((a, b) => (a.currentPrice?.minorUnits || 0) - (b.currentPrice?.minorUnits || 0))
  } else if (selectedSort.value === 'most_bids') {
    list.sort((a, b) => (b.bidCount || 0) - (a.bidCount || 0))
  } else if (selectedSort.value === 'newest') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return list
})

const activeFilterCount = computed(() => {
  let n = 0
  if (selectedRegion.value !== 'all') n++
  if (selectedSort.value !== 'ending_soon') n++
  if (minPrice.value !== null && minPrice.value > 0) n++
  if (maxPrice.value !== null && maxPrice.value > 0) n++
  if (isBlitzOnly.value) n++
  return n
})

function resetFilters() {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  selectedRegion.value = 'all'
  selectedSort.value = 'ending_soon'
  minPrice.value = null
  maxPrice.value = null
  isBlitzOnly.value = false
  router.push({ query: {} })
}

onMounted(() => {
  if (auctionStore.auctions.length === 0) {
    auctionStore.fetchAuctions()
  }
})
</script>

<template>
  <div class="min-h-screen bg-background text-text-primary pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-7xl mx-auto space-y-8">

      <!-- Top Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-black/[0.06]">
        <div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error/10 text-error text-xs font-bold mb-2 border border-error/20">
            <span class="w-2 h-2 rounded-full bg-error animate-ping" />
            <span>{{ filteredAuctions.length }} Активдүү Аукцион</span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Кыргызстан боюнча Түз Эфирдеги Аукциондор
          </h1>
          <p class="text-xs sm:text-sm text-text-secondary mt-1">
            Мал базары, автоунаалар, Дордой соода контейнерлери жана башка буюмдар
          </p>
        </div>

        <!-- Search Bar -->
        <div class="w-full md:w-80 relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Лоттун аты же шаар боюнча издөө..."
            class="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-border text-base focus:outline-none focus:border-secondary shadow-sm text-text-primary placeholder-text-muted"
          />
          <Search class="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <!-- Quick Category Horizontal Pills -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer"
          :class="selectedCategory === cat.id
            ? 'bg-primary text-text-primary shadow-md'
            : 'bg-white border border-border text-text-secondary hover:bg-black/5'"
          @click="selectedCategory = cat.id"
        >
          <span>{{ cat.icon }}</span>
          <span>{{ cat.name }}</span>
        </button>
      </div>

      <!-- Mobile Filters Trigger -->
      <button
        class="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-border text-sm font-bold text-text-primary shadow-sm"
        @click="showMobileFilters = true"
      >
        <SlidersHorizontal class="w-4 h-4 text-primary" />
        <span>Фильтрлер</span>
        <span v-if="activeFilterCount > 0" class="w-5 h-5 rounded-full bg-primary text-text-primary text-[11px] font-extrabold flex items-center justify-center">
          {{ activeFilterCount }}
        </span>
      </button>

      <!-- Mobile Filters Drawer -->
      <Transition name="fade">
        <div
          v-if="showMobileFilters"
          class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden flex items-end"
          @click="showMobileFilters = false"
        >
          <div
            class="w-full max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl p-6 space-y-6 shadow-2xl animate-slide-up"
            @click.stop
          >
            <div class="flex items-center justify-between pb-3 border-b border-black/5">
              <div class="flex items-center gap-2 text-sm font-bold text-text-primary">
                <SlidersHorizontal class="w-4 h-4 text-primary" />
                <span>Фильтрлер</span>
              </div>
              <button class="p-2 rounded-xl hover:bg-black/5 text-text-secondary" aria-label="Жабуу" @click="showMobileFilters = false">
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Region Filter -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                <MapPin class="w-3.5 h-3.5 text-primary" />
                <span>Облус / Шаар</span>
              </label>
              <select
                v-model="selectedRegion"
                class="w-full px-3.5 py-3 rounded-xl bg-black/[0.02] border border-border text-base font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/30 text-text-primary"
              >
                <option value="all">Бүткүл Кыргызстан (Бардыгы)</option>
                <option v-for="r in kyrgyzstanRegions" :key="r.id" :value="r.id">
                  {{ r.name.ky }}
                </option>
              </select>
            </div>

            <!-- Sort Filter -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-text-secondary">Сорттоо</label>
              <select
                v-model="selectedSort"
                class="w-full px-3.5 py-3 rounded-xl bg-black/[0.02] border border-border text-base font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/30 text-text-primary"
              >
                <option v-for="s in sortOptions" :key="s.value" :value="s.value">
                  {{ s.label }}
                </option>
              </select>
            </div>

            <!-- Price Range -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-text-secondary">Баа Диапазону (KGS сом)</label>
              <div class="grid grid-cols-2 gap-2">
                <input
                  v-model.number="minPrice"
                  type="number"
                  placeholder="Мин"
                  class="w-full px-3 py-2.5 rounded-xl bg-black/[0.02] border border-border text-base font-mono"
                />
                <input
                  v-model.number="maxPrice"
                  type="number"
                  placeholder="Макс"
                  class="w-full px-3 py-2.5 rounded-xl bg-black/[0.02] border border-border text-base font-mono"
                />
              </div>
            </div>

            <!-- Blitz Only Checkbox -->
            <div class="pt-2 border-t border-black/5">
              <label class="flex items-center gap-2 text-sm font-bold text-error cursor-pointer">
                <input v-model="isBlitzOnly" type="checkbox" class="w-4 h-4 rounded text-error" />
                <span>🔥 Флаш Аукциондор (1 Саат)</span>
              </label>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button
                class="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-text-secondary flex items-center justify-center gap-1.5"
                @click="resetFilters"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span>Тазалоо</span>
              </button>
              <button
                class="flex-1 py-3 rounded-xl bg-primary text-text-primary font-bold text-sm shadow-md"
                @click="showMobileFilters = false"
              >
                {{ filteredAuctions.length }} натыйжаны көрүү
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Main Layout: Sidebar Filters + Products Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        <!-- Sidebar Filters (Desktop) -->
        <aside class="hidden lg:block lg:col-span-3 glass p-6 rounded-3xl shadow-sm space-y-6">

          <div class="flex items-center justify-between pb-3 border-b border-black/5">
            <div class="flex items-center gap-2 text-sm font-bold text-text-primary">
              <SlidersHorizontal class="w-4 h-4 text-primary" />
              <span>Фильтрлер</span>
            </div>
            <button class="text-[11px] text-text-muted hover:text-error transition-colors flex items-center gap-1 cursor-pointer" @click="resetFilters">
              <RotateCcw class="w-3 h-3" />
              <span>Тазалоо</span>
            </button>
          </div>

          <!-- Region Filter -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-text-secondary flex items-center gap-1.5">
              <MapPin class="w-3.5 h-3.5 text-primary" />
              <span>Облус / Шаар</span>
            </label>
            <select
              v-model="selectedRegion"
              class="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-border text-base font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/30 text-text-primary"
            >
              <option value="all">Бүткүл Кыргызстан (Бардыгы)</option>
              <option v-for="r in kyrgyzstanRegions" :key="r.id" :value="r.id">
                {{ r.name.ky }}
              </option>
            </select>
          </div>

          <!-- Sort Filter -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-text-secondary">Сорттоо</label>
            <select
              v-model="selectedSort"
              class="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-border text-base font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/30 text-text-primary"
            >
              <option v-for="s in sortOptions" :key="s.value" :value="s.value">
                {{ s.label }}
              </option>
            </select>
          </div>

          <!-- Price Range -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-text-secondary">Баа Диапазону (KGS сом)</label>
            <div class="grid grid-cols-2 gap-2">
              <input
                v-model.number="minPrice"
                type="number"
                placeholder="Мин"
                class="w-full px-3 py-2 rounded-xl bg-black/[0.02] border border-border text-base font-mono"
              />
              <input
                v-model.number="maxPrice"
                type="number"
                placeholder="Макс"
                class="w-full px-3 py-2 rounded-xl bg-black/[0.02] border border-border text-base font-mono"
              />
            </div>
          </div>

          <!-- Blitz Only Checkbox -->
          <div class="pt-2 border-t border-black/5">
            <label class="flex items-center gap-2 text-xs font-bold text-error cursor-pointer">
              <input v-model="isBlitzOnly" type="checkbox" class="w-4 h-4 rounded text-error" />
              <span>🔥 Флаш Аукциондор (1 Саат)</span>
            </label>
          </div>

        </aside>

        <!-- Product Grid -->
        <main class="lg:col-span-9 space-y-6">
          <div v-if="filteredAuctions.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AuctionCard
              v-for="auction in filteredAuctions"
              :key="auction.id"
              :auction="auction as any"
            />
          </div>

          <div v-else class="text-center py-20 p-8 glass rounded-3xl space-y-3">
            <div class="text-4xl">🔍</div>
            <h3 class="text-lg font-bold text-text-primary">Бул фильтрлер боюнча лот табылган жок</h3>
            <p class="text-xs text-text-muted">Башка категорияны же аймакты тандап көрүңүз.</p>
            <button class="px-5 py-2.5 rounded-xl bg-primary text-text-primary font-bold text-xs" @click="resetFilters">
              Фильтрлерди баштапкы абалга келтирүү
            </button>
          </div>
        </main>

      </div>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>