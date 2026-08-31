<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  Filter, Search, SlidersHorizontal, ArrowUpDown,
  RotateCcw, Sparkles, Check, ChevronDown, CheckCircle2,
  MapPin, Flame, Zap, X, AlertCircle, PlusCircle, Radio,
  Store, Gavel, Layers, ShieldCheck, ArrowRight, Smartphone,
  Car, Home as HomeIcon, Gem, Palette, Tractor, Wheat
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
const { t, currentLocale } = useI18n()

const currentLang = computed(() => (currentLocale.value?.code as 'ky' | 'ru' | 'tr') || 'tr')

const searchQuery = ref((route.query.search as string) || '')
const selectedCategory = ref((route.query.category as string) || 'all')
const selectedRegion = ref((route.query.region as string) || 'all')
const selectedSort = ref((route.query.sort as string) || 'ending_soon')
const statusFilter = ref((route.query.status as string) || 'all')
const minPrice = ref<number | null>(route.query.minPrice ? Number(route.query.minPrice) : null)
const maxPrice = ref<number | null>(route.query.maxPrice ? Number(route.query.maxPrice) : null)
const isBlitzOnly = ref(route.query.blitz === '1')
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

watch(() => route.query.status, (newStatus) => {
  statusFilter.value = (newStatus as string) || 'all'
})

watch(() => route.query.search, (newSearch) => {
  searchQuery.value = (newSearch as string) || ''
})

// Sync state -> URL (shareable filters)
function updateRouteQuery() {
  const query: Record<string, string> = {}
  if (selectedCategory.value !== 'all') query.category = selectedCategory.value
  if (selectedRegion.value !== 'all') query.region = selectedRegion.value
  if (selectedSort.value !== 'ending_soon') query.sort = selectedSort.value
  if (statusFilter.value !== 'all') query.status = statusFilter.value
  if (searchQuery.value.trim()) query.search = searchQuery.value.trim()
  if (minPrice.value) query.minPrice = String(minPrice.value)
  if (maxPrice.value) query.maxPrice = String(maxPrice.value)
  if (isBlitzOnly.value) query.blitz = '1'
  
  const current = route.query as Record<string, string>
  const same = Object.keys({ ...query, ...current }).every(k => (query[k] || '') === (current[k] || ''))
  if (!same) router.replace({ query })
}

watch(selectedCategory, updateRouteQuery)
watch(selectedRegion, updateRouteQuery)
watch(selectedSort, updateRouteQuery)
watch(statusFilter, updateRouteQuery)
watch(isBlitzOnly, updateRouteQuery)
watch(minPrice, updateRouteQuery)
watch(maxPrice, updateRouteQuery)

let searchDebounce: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(updateRouteQuery, 400)
})

const categories = computed(() => {
  const lang = currentLang.value
  return [
    { id: 'all', name: t('liveAuctionsPage.allCategories') || 'Tüm Kategoriler', icon: '✨' },
    ...platformCategories.map(c => ({
      id: c.slug,
      name: c.name[lang] || c.name.tr || c.name.ky,
      icon: c.icon
    }))
  ]
})

const quickCategories = computed(() => {
  const lang = currentLang.value
  return [
    { 
      slug: 'livestock', 
      name: lang === 'ky' ? 'Мал базары' : lang === 'ru' ? 'Скотный рынок' : 'Hayvan Pazarı & Tarım',
      desc: lang === 'ky' ? 'Арашан кочкорлору, жылкылар, бодо мал' : lang === 'ru' ? 'Арашанские бараны, лошади, КРС' : 'Arashan koçları, atlar, büyükbaş hayvanlar',
      icon: '🐎',
      color: 'bg-amber-50 text-amber-900 border-amber-200'
    },
    { 
      slug: 'vehicles', 
      name: lang === 'ky' ? 'Автоунаалар' : lang === 'ru' ? 'Автомобили' : 'Otomotiv & Araçlar',
      desc: lang === 'ky' ? 'Toyota Camry, Lexus, Hyundai, коммерциялык' : lang === 'ru' ? 'Toyota Camry, Lexus, Hyundai, коммерческий транспорт' : 'Toyota Camry, Lexus, Hyundai, ticari araçlar',
      icon: '🚗',
      color: 'bg-rose-50 text-rose-900 border-rose-200'
    },
    { 
      slug: 'real-estate', 
      name: lang === 'ky' ? 'Дордой & Кыймылсыз мүлк' : lang === 'ru' ? 'Дордой и Недвижимость' : 'Dordoy & Gayrimenkul',
      desc: lang === 'ky' ? 'Соода контейнерлери, дүкөндөр, батирлер' : lang === 'ru' ? 'Контейнеры Дордой, магазины, квартиры' : 'Ticari konteynerler, dükkanlar, daireler',
      icon: '🏢',
      color: 'bg-emerald-50 text-emerald-900 border-emerald-200'
    },
    { 
      slug: 'electronics', 
      name: lang === 'ky' ? 'Электроника' : lang === 'ru' ? 'Электроника' : 'Elektronik & Cihazlar',
      desc: lang === 'ky' ? 'MacBook, iPhone, акылдуу түзмөктөр' : lang === 'ru' ? 'MacBook, iPhone, гаджеты и техника' : 'MacBook, iPhone, akıllı saatler',
      icon: '📱',
      color: 'bg-blue-50 text-blue-900 border-blue-200'
    },
  ]
})

const sortOptions = computed(() => [
  { value: 'ending_soon', label: t('liveAuctionsPage.sortEndingSoon') || 'Yakında Bitenler 🔥' },
  { value: 'price_desc', label: t('liveAuctionsPage.sortPriceDesc') || 'Fiyat: Yüksekten Düşüğe' },
  { value: 'price_asc', label: t('liveAuctionsPage.sortPriceAsc') || 'Fiyat: Düşükten Yükseğe' },
  { value: 'most_bids', label: t('liveAuctionsPage.sortMostBids') || 'En Çok Teklif Alan ⚡' },
  { value: 'newest', label: t('liveAuctionsPage.sortNewest') || 'En Yeniler ✨' },
])

const allAuctions = computed(() => {
  if (auctionStore.auctions && auctionStore.auctions.length > 0) {
    return auctionStore.auctions
  }
  return mockAuctions
})

const filteredAuctions = computed(() => {
  let list = [...allAuctions.value]

  // Status filter (live vs all)
  if (statusFilter.value === 'live') {
    list = list.filter(a => a.status === 'active' || (a as any).isLive)
  }

  // Category filter
  if (selectedCategory.value !== 'all') {
    list = list.filter(a => {
      const catSlug = typeof a.category === 'object' ? (a.category as any)?.slug : a.category
      return catSlug === selectedCategory.value
    })
  }

  // SubCategory filter (from MegaMenu ?subCategory=)
  const subCatQuery = route.query.subCategory as string | undefined
  if (subCatQuery) {
    list = list.filter(a => {
      const sub = (a as any).subCategory || (a as any).sub_category
      return sub === subCatQuery
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
  if (statusFilter.value !== 'all') n++
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
  statusFilter.value = 'all'
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
  <div class="min-h-screen bg-background text-text-primary pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-7xl mx-auto space-y-6 sm:space-y-8">

      <!-- Top Header & Search Bar -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-black/[0.06]">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span 
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border"
              :class="statusFilter === 'live' 
                ? 'bg-rose-50 text-rose-600 border-rose-200' 
                : 'bg-amber-500/10 text-amber-900 border-amber-500/20'"
            >
              <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{{ t('liveAuctionsPage.activeLots', { n: filteredAuctions.length }) || `${filteredAuctions.length} Aktif İlan` }}</span>
            </span>

            <!-- Status filter pills -->
            <div class="inline-flex items-center p-0.5 rounded-full bg-slate-100 border border-black/5 text-[11px] font-bold">
              <button
                type="button"
                class="px-2.5 py-1 rounded-full transition-all cursor-pointer"
                :class="statusFilter === 'all' ? 'bg-white text-gray-950 shadow-2xs font-extrabold' : 'text-gray-500 hover:text-gray-950'"
                @click="statusFilter = 'all'"
              >
                {{ t('liveAuctionsPage.allStatusTab') || '✨ Tümü' }}
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-full transition-all cursor-pointer"
                :class="statusFilter === 'live' ? 'bg-rose-500 text-white shadow-2xs font-extrabold' : 'text-gray-500 hover:text-gray-950'"
                @click="statusFilter = 'live'"
              >
                {{ t('liveAuctionsPage.liveStatusTab') || '🔴 Canlı' }}
              </button>
            </div>
          </div>

          <h1 class="text-2xl sm:text-4xl font-black text-gray-950 tracking-tight">
            {{ t('liveAuctionsPage.title') || 'Kırgızistan Canlı ve Aktif Açık Artırmalar' }}
          </h1>
          <p class="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
            {{ t('liveAuctionsPage.subtitle') || 'Hayvan pazarı, otomotiv, Dordoy toptan ticaret ürünleri ve gayrimenkul' }}
          </p>
        </div>

        <!-- Search Bar -->
        <div class="w-full md:w-84 relative group">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('liveAuctionsPage.searchPlaceholder') || 'Lot adı veya şehir ara...'"
            class="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-black/10 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-3 focus:ring-amber-400/20 shadow-2xs text-gray-900 placeholder-gray-400 font-medium transition-all"
          />
          <Search class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-amber-700 transition-colors" />
          <button 
            v-if="searchQuery"
            type="button" 
            class="p-1 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
            @click="searchQuery = ''"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Quick Category Horizontal Pills -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer shadow-2xs"
          :class="selectedCategory === cat.id
            ? 'bg-primary text-gray-950 font-black shadow-sm ring-2 ring-primary/25 scale-[1.02]'
            : 'bg-white border border-black/10 text-gray-600 hover:bg-slate-50 hover:text-gray-950'"
          @click="selectedCategory = cat.id"
        >
          <span>{{ cat.icon }}</span>
          <span>{{ cat.name }}</span>
        </button>
      </div>

      <!-- Mobile Filters Trigger -->
      <button
        class="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-black/10 text-xs sm:text-sm font-black text-gray-900 shadow-2xs cursor-pointer"
        @click="showMobileFilters = true"
      >
        <SlidersHorizontal class="w-4 h-4 text-primary" />
        <span>{{ t('liveAuctionsPage.filters') || 'Filtreler' }}</span>
        <span v-if="activeFilterCount > 0" class="w-5 h-5 rounded-full bg-primary text-gray-950 text-[10px] font-black flex items-center justify-center">
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
              <div class="flex items-center gap-2 text-sm font-black text-gray-950">
                <SlidersHorizontal class="w-4 h-4 text-primary" />
                <span>{{ t('liveAuctionsPage.filters') || 'Filtreler' }}</span>
              </div>
              <button class="p-2 rounded-xl hover:bg-black/5 text-gray-500" aria-label="Kapat" @click="showMobileFilters = false">
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Region Filter -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <MapPin class="w-3.5 h-3.5 text-primary" />
                <span>{{ t('liveAuctionsPage.regionCity') || 'Bölge / Şehir' }}</span>
              </label>
              <select
                v-model="selectedRegion"
                class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary text-gray-900"
              >
                <option value="all">{{ t('liveAuctionsPage.allKyrgyzstan') || 'Tüm Kırgızistan (Tümü)' }}</option>
                <option v-for="r in kyrgyzstanRegions" :key="r.id" :value="r.id">
                  {{ r.name[currentLang] || r.name.tr || r.name.ky }}
                </option>
              </select>
            </div>

            <!-- Sort Filter -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-700">{{ t('liveAuctionsPage.sorting') || 'Sıralama' }}</label>
              <select
                v-model="selectedSort"
                class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary text-gray-900"
              >
                <option v-for="s in sortOptions" :key="s.value" :value="s.value">
                  {{ s.label }}
                </option>
              </select>
            </div>

            <!-- Price Range -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-700">{{ t('liveAuctionsPage.priceRange') || 'Fiyat Aralığı (KGS)' }}</label>
              <div class="grid grid-cols-2 gap-2">
                <input
                  v-model.number="minPrice"
                  type="number"
                  :placeholder="t('liveAuctionsPage.min') || 'Min'"
                  class="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-black/10 text-xs font-mono font-bold"
                />
                <input
                  v-model.number="maxPrice"
                  type="number"
                  :placeholder="t('liveAuctionsPage.max') || 'Maks'"
                  class="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-black/10 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <!-- Blitz Only Checkbox -->
            <div class="pt-2 border-t border-black/5">
              <label class="flex items-center gap-2 text-xs font-bold text-rose-600 cursor-pointer">
                <input v-model="isBlitzOnly" type="checkbox" class="w-4 h-4 rounded text-rose-600" />
                <span>🔥 {{ t('liveAuctionsPage.flashOnly') || '1 Saatlik Flaş İhaleler' }}</span>
              </label>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button
                class="flex-1 py-3 rounded-2xl border border-black/10 text-xs font-bold text-gray-600 flex items-center justify-center gap-1.5"
                @click="resetFilters"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span>{{ t('liveAuctionsPage.clearFilters') || 'Temizle' }}</span>
              </button>
              <button
                class="flex-1 py-3 rounded-2xl bg-primary text-gray-950 font-black text-xs shadow-md"
                @click="showMobileFilters = false"
              >
                {{ t('liveAuctionsPage.resultsCount', { n: filteredAuctions.length }) || `${filteredAuctions.length} Sonuç Göster` }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Main Layout: Sidebar Filters + Products Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        <!-- Sidebar Filters (Desktop Sticky) -->
        <aside class="hidden lg:block lg:col-span-3 sticky top-28 bg-white p-6 rounded-3xl border border-black/[0.08] shadow-2xs space-y-6">

          <div class="flex items-center justify-between pb-3 border-b border-black/5">
            <div class="flex items-center gap-2 text-xs font-black text-gray-950 uppercase tracking-wider">
              <SlidersHorizontal class="w-4 h-4 text-primary" />
              <span>{{ t('liveAuctionsPage.filters') || 'Filtreler' }}</span>
            </div>
            <button 
              class="text-[11px] font-bold text-gray-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer" 
              @click="resetFilters"
            >
              <RotateCcw class="w-3 h-3" />
              <span>{{ t('liveAuctionsPage.clearFilters') || 'Temizle' }}</span>
            </button>
          </div>

          <!-- Region Filter -->
          <div class="space-y-2">
            <label class="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
              <MapPin class="w-3.5 h-3.5 text-primary" />
              <span>{{ t('liveAuctionsPage.regionCity') || 'Bölge / Şehir' }}</span>
            </label>
            <select
              v-model="selectedRegion"
              class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-black/10 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 cursor-pointer"
            >
              <option value="all">{{ t('liveAuctionsPage.allKyrgyzstan') || 'Tüm Kırgızistan (Tümü)' }}</option>
              <option v-for="r in kyrgyzstanRegions" :key="r.id" :value="r.id">
                {{ r.name[currentLang] || r.name.tr || r.name.ky }}
              </option>
            </select>
          </div>

          <!-- Sort Filter -->
          <div class="space-y-2">
            <label class="text-xs font-extrabold text-gray-700">{{ t('liveAuctionsPage.sorting') || 'Sıralama' }}</label>
            <select
              v-model="selectedSort"
              class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-black/10 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 cursor-pointer"
            >
              <option v-for="s in sortOptions" :key="s.value" :value="s.value">
                {{ s.label }}
              </option>
            </select>
          </div>

          <!-- Price Range -->
          <div class="space-y-2">
            <label class="text-xs font-extrabold text-gray-700">{{ t('liveAuctionsPage.priceRange') || 'Fiyat Aralığı (KGS)' }}</label>
            <div class="grid grid-cols-2 gap-2">
              <input
                v-model.number="minPrice"
                type="number"
                :placeholder="t('liveAuctionsPage.min') || 'Min'"
                class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-black/10 text-xs font-mono font-bold"
              />
              <input
                v-model.number="maxPrice"
                type="number"
                :placeholder="t('liveAuctionsPage.max') || 'Maks'"
                class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-black/10 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <!-- Blitz Only Checkbox -->
          <div class="pt-3 border-t border-black/5">
            <label class="flex items-center gap-2 text-xs font-bold text-rose-600 cursor-pointer">
              <input v-model="isBlitzOnly" type="checkbox" class="w-4 h-4 rounded text-rose-600" />
              <span>🔥 {{ t('liveAuctionsPage.flashOnly') || '1 Saatlik Flaş İhaleler' }}</span>
            </label>
          </div>

        </aside>

        <!-- Product Grid / Rich Discovery Hub -->
        <main class="lg:col-span-9 space-y-6">
          <div v-if="auctionStore.isLoading" class="flex flex-col items-center justify-center py-20 gap-3">
            <div class="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p class="text-xs font-bold text-gray-400">{{ t('common.loading') }}</p>
          </div>

          <div v-else-if="auctionStore.error" class="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
            <AlertCircle class="w-5 h-5 shrink-0" />
            <span>{{ auctionStore.error }}</span>
            <button class="ml-auto underline font-bold" @click="auctionStore.fetchAuctions()">{{ t('common.retry') }}</button>
          </div>

          <!-- Auction Cards Grid (When items exist) -->
          <div v-else-if="filteredAuctions.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AuctionCard
              v-for="auction in filteredAuctions"
              :key="auction.id"
              :auction="auction as any"
            />
          </div>

          <!-- Rich Interactive Discovery Hub (When 0 items found) -->
          <div v-else class="space-y-6">
            
            <!-- Main Empty State Banner -->
            <div class="bg-gradient-to-br from-slate-50 via-white to-amber-500/[0.04] rounded-3xl border border-black/[0.08] p-8 sm:p-12 text-center space-y-6 shadow-2xs">
              <div class="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-gray-950 flex items-center justify-center mx-auto shadow-md">
                <Gavel class="w-8 h-8" />
              </div>

              <div class="max-w-lg mx-auto space-y-2">
                <h3 class="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                  {{ t('liveAuctionsPage.noResultsTitle') || 'Bu Filtrelere Uygun İlan Bulunamadı' }}
                </h3>
                <p class="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  Filtrelerinizi genişleterek diğer kategorilere göz atabilir veya ilk açık artırmayı %0 komisyonla siz başlatabilirsiniz.
                </p>
              </div>

              <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button 
                  type="button" 
                  class="px-5 py-2.5 rounded-2xl border border-black/10 bg-white hover:bg-slate-50 text-gray-800 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                  @click="resetFilters"
                >
                  {{ t('liveAuctionsPage.resetFiltersBtn') || 'Filtreleri Sıfırla' }}
                </button>

                <RouterLink 
                  to="/sell"
                  class="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
                >
                  <PlusCircle class="w-4 h-4" />
                  <span>{{ t('liveAuctionsPage.startAuctionBtn') || '+ Hemen İlan Ver (%0 Komisyon)' }}</span>
                </RouterLink>
              </div>
            </div>

            <!-- Quick Categories Discovery Strip -->
            <div class="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-4">
              <div class="flex items-center justify-between pb-2 border-b border-black/[0.05]">
                <div class="flex items-center gap-2">
                  <Sparkles class="w-4 h-4 text-amber-600" />
                  <h4 class="text-sm font-black text-gray-950">Popüler Kategorileri Keşfedin</h4>
                </div>
                <RouterLink to="/categories" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  <span>Tüm Kategoriler</span>
                  <ArrowRight class="w-3.5 h-3.5" />
                </RouterLink>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <RouterLink
                  v-for="qCat in quickCategories"
                  :key="qCat.slug"
                  :to="`/auctions?category=${qCat.slug}`"
                  class="p-4 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5 flex items-center gap-3.5 group shadow-2xs"
                  :class="qCat.color"
                >
                  <span class="text-2xl shrink-0 group-hover:scale-110 transition-transform">{{ qCat.icon }}</span>
                  <div class="flex-1 min-w-0">
                    <h5 class="text-xs font-black truncate text-gray-950">{{ qCat.name }}</h5>
                    <p class="text-[11px] opacity-75 line-clamp-1 mt-0.5">{{ qCat.desc }}</p>
                  </div>
                  <ArrowRight class="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                </RouterLink>
              </div>
            </div>

            <!-- 3 Trust Badges -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-2xs flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <ShieldCheck class="w-4 h-4" />
                </div>
                <div>
                  <h5 class="text-xs font-black text-gray-950">%100 Banka Emaneti</h5>
                  <p class="text-[11px] text-gray-500">DemirBank Escrow koruması</p>
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-2xs flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <Zap class="w-4 h-4" />
                </div>
                <div>
                  <h5 class="text-xs font-black text-gray-950">MBank & Optima QR</h5>
                  <p class="text-[11px] text-gray-500">5 saniyede anında ödeme</p>
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-2xs flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Radio class="w-4 h-4" />
                </div>
                <div>
                  <h5 class="text-xs font-black text-gray-950">Canlı WebSocket İhale</h5>
                  <p class="text-[11px] text-gray-500">Gecikmesiz anlık teklifler</p>
                </div>
              </div>
            </div>

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
