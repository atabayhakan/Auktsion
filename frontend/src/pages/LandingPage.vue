<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowRight, ShieldCheck, CreditCard, Store,
  ChevronRight, Sparkles, PlusCircle,
  Car, Home as HomeIcon, Smartphone, Flame,
  Grid, Zap, CheckCircle2, Lock, HelpCircle, Layers,
  Wheat, Gem, Palette, Tractor, Building2
} from 'lucide-vue-next'
import AuctionCard from '@/components/auction/AuctionCard.vue'
import CategoryCard from '@/components/auction/CategoryCard.vue'
import HeroBannerCarousel from '@/components/home/HeroBannerCarousel.vue'
import LiveActivityFeed from '@/components/home/LiveActivityFeed.vue'
import { useAuctionStore } from '@/stores/auction'
import { useActivityStore } from '@/stores/activity'
import { useRecommendationsStore } from '@/stores/recommendations'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/composables/useI18n'
import { useFormatters } from '@/composables/useFormatters'
import { mockAuctions } from '@/data/mockAuctions'
import { platformCategories } from '@/data/categories'

const auctionStore = useAuctionStore()
const activityStore = useActivityStore()
const recommendationsStore = useRecommendationsStore()
const userStore = useUserStore()
const { currency } = useFormatters()
const { formatMoney } = currency
const { t, locale } = useI18n()
const activeFilterTab = ref('all')

const allAuctions = computed(() => {
  if (auctionStore.auctions && auctionStore.auctions.length > 0) {
    return auctionStore.auctions
  }
  return mockAuctions
})

const categoryTiles = computed(() => {
  const currentLang = (locale.value as 'ky' | 'ru' | 'tr') || 'ky'
  return platformCategories.map(cat => ({
    slug: cat.slug,
    name: cat.name[currentLang] || cat.name.ky,
    icon: cat.icon,
    coverImage: cat.coverImage,
    count: cat.count,
  }))
})

// Tab filters for top immediate grid
const filterTabs = computed(() => [
  { id: 'all', label: t('home.tabAll') || 'Tümü', icon: Grid },
  { id: 'livestock', label: t('home.tabLivestock') || '🐄 Hayvan Pazarı', icon: Store },
  { id: 'vehicles', label: t('home.tabVehicles') || '🚗 Araçlar', icon: Car },
  { id: 'real-estate', label: t('home.tabRealEstate') || '🏢 Dordoy & Emlak', icon: HomeIcon },
  { id: 'electronics', label: t('home.tabElectronics') || '📱 Elektronik', icon: Smartphone },
  { id: 'ending_soon', label: t('home.tabEndingSoon') || '🔥 Yakında Bitiyor', icon: Flame },
])

const filteredPopularAuctions = computed(() => {
  let list = [...allAuctions.value]
  if (activeFilterTab.value === 'ending_soon') {
    return list.sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime()).slice(0, 8)
  }
  if (activeFilterTab.value === 'livestock') {
    return list.filter(a => a.category === 'livestock').slice(0, 8)
  }
  if (activeFilterTab.value === 'vehicles') {
    return list.filter(a => a.category === 'vehicles').slice(0, 8)
  }
  if (activeFilterTab.value === 'real-estate') {
    return list.filter(a => a.category === 'real-estate').slice(0, 8)
  }
  if (activeFilterTab.value === 'electronics') {
    return list.filter(a => a.category === 'electronics').slice(0, 8)
  }
  return list.slice(0, 8)
})

const featuredAuctions = computed(() =>
  allAuctions.value.filter(a => a.category === 'electronics' || a.category === 'vehicles').slice(0, 4)
)

const livestockAuctions = computed(() =>
  allAuctions.value.filter(a => a.category === 'livestock').slice(0, 4)
)

const vehicleAuctions = computed(() =>
  allAuctions.value.filter(a => a.category === 'vehicles').slice(0, 4)
)

const realEstateAuctions = computed(() =>
  allAuctions.value.filter(a => a.category === 'real-estate').slice(0, 4)
)

const endingSoonRail = computed(() =>
  (auctionStore.auctions.length > 0 ? auctionStore.endingSoonAuctions : allAuctions.value).slice(0, 4)
)
const newestRail = computed(() =>
  (auctionStore.auctions.length > 0 ? auctionStore.newestAuctions : allAuctions.value).slice(0, 4)
)
const mostActiveRail = computed(() =>
  (auctionStore.auctions.length > 0 ? auctionStore.mostActiveAuctions : allAuctions.value).slice(0, 4)
)

// 3-Column Feature Promo Strip
const promoTiles = computed(() => [
  {
    id: 'concierge',
    label: t('home.conciergeLabel') || 'PREMİUM HİZMET',
    title: t('home.conciergeTitle') || 'iTorgo Konsiyerj',
    desc: t('home.conciergeDesc') || 'Uzmanlarımız sizin için ilan oluştursun ve en yüksek fiyata satsın.',
    icon: Sparkles,
    link: '/sell',
    tone: 'bg-amber-500/[0.06] border-amber-500/20 hover:border-amber-500/40',
    iconTone: 'text-amber-800 bg-amber-500/15',
  },
  {
    id: 'escrow',
    label: 'GÜVENLİ TİCARET',
    title: '%100 Banka Emaneti',
    desc: 'Teslimatı onaylayana kadar paranız banka emanetinde (Escrow) bloke edilir.',
    icon: ShieldCheck,
    link: '/how-it-works',
    tone: 'bg-emerald-500/[0.06] border-emerald-500/20 hover:border-emerald-500/40',
    iconTone: 'text-emerald-800 bg-emerald-500/15',
  },
  {
    id: 'instant-pay',
    label: 'ANINDA ÇEKİM',
    title: 'MBank & Optima QR',
    desc: '5 saniyede komisyonsuz ödeme ve doğrudan banka hesabına bakiye çekimi.',
    icon: Zap,
    link: '/how-it-works',
    tone: 'bg-blue-500/[0.06] border-blue-500/20 hover:border-blue-500/40',
    iconTone: 'text-blue-800 bg-blue-500/15',
  },
])

// Bank partners
const bankPartners = computed(() => [
  { name: 'MBank', badge: 'QR & MBank Pay', desc: t('home.escrowBankMbankDesc') || 'Ulusal ödeme sistemi ile %0 komisyonla anında ödeme.', icon: Smartphone, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { name: 'DemirBank Escrow', badge: t('home.escrowBankDemirBadge') || 'Emanet Güvencesi', desc: t('home.escrowBankDemirDesc') || 'Ürünü görüp teslim alana kadar paranız bankada güvenle saklanır.', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Optima Bank', badge: '3D Secure 2.0', desc: t('home.escrowBankOptimaDesc') || 'Kırgızistan\'daki tüm Visa/Mastercard ve Elkart kartları desteklenir.', icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50' },
])

onMounted(async () => {
  if (auctionStore.auctions.length === 0) {
    await auctionStore.fetchAuctions()
  }
  activityStore.fetchInitial()
  if (userStore.isAuthenticated) {
    recommendationsStore.fetchRecommendations()
  }
})
</script>

<template>
  <div class="min-h-screen bg-background text-text-primary font-sans pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-10 lg:space-y-12">

      <!-- ================================================================
           SECTION 1: CATEGORY TILES (Photo Cards)
           ================================================================ -->
      <section aria-label="Category Tiles">
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          <CategoryCard
            v-for="cat in categoryTiles"
            :key="cat.slug"
            :category="cat"
          />
        </div>
      </section>

      <!-- ================================================================
           SECTION 2: HERO BANNER CAROUSEL + 3-COLUMN PROMO STRIP
           ================================================================ -->
      <section aria-labelledby="hero-title" class="relative space-y-5">
        <h1 id="hero-title" class="sr-only">{{ t('home.heroTitle') }}</h1>

        <HeroBannerCarousel :featured-auctions="featuredAuctions" />

        <!-- 3-Column Promo Strip -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RouterLink
            v-for="tile in promoTiles"
            :key="tile.id"
            :to="tile.link"
            class="group rounded-3xl border p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5 shadow-2xs"
            :class="tile.tone"
          >
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xs" :class="tile.iconTone">
              <component :is="tile.icon" class="w-6 h-6" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[10px] font-black tracking-wider uppercase opacity-70">{{ tile.label }}</div>
              <div class="text-sm font-extrabold text-gray-950 truncate">{{ tile.title }}</div>
              <div class="text-xs text-gray-500 line-clamp-1 mt-0.5">{{ tile.desc }}</div>
            </div>
            <ChevronRight class="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </RouterLink>
        </div>
      </section>

      <!-- ================================================================
           SECTION 3: LIVE ACTIVITY (Only when activity exists)
           ================================================================ -->
      <section v-if="activityStore.recentActivity?.length" aria-labelledby="rail-live-title" class="space-y-4">
        <div class="flex items-center gap-2.5">
          <span class="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
          <h3 id="rail-live-title" class="text-xl font-extrabold text-gray-950">{{ t('discovery.liveActivity.title') }}</h3>
        </div>
        <LiveActivityFeed />
      </section>

      <!-- ================================================================
           SECTION 4: DISCOVERY RAILS (Ending Soon, Newest, Most Active)
           ================================================================ -->
      <section v-if="endingSoonRail.length > 0" class="space-y-5" aria-labelledby="rail-ending-soon-title">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🔥</span>
            <h3 id="rail-ending-soon-title" class="text-xl font-black text-gray-950">{{ t('discovery.endingSoon.title') }}</h3>
          </div>
          <RouterLink to="/auctions?sort=ending_soon" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>{{ t('discovery.endingSoon.viewAll') }}</span>
            <ChevronRight class="w-4 h-4" />
          </RouterLink>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <AuctionCard v-for="auction in endingSoonRail" :key="auction.id" :auction="auction as any" />
        </div>
      </section>

      <section v-if="newestRail.length > 0" class="space-y-5" aria-labelledby="rail-newest-title">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">✨</span>
            <h3 id="rail-newest-title" class="text-xl font-black text-gray-950">{{ t('discovery.newest.title') }}</h3>
          </div>
          <RouterLink to="/auctions?sort=newest" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>{{ t('discovery.newest.viewAll') }}</span>
            <ChevronRight class="w-4 h-4" />
          </RouterLink>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <AuctionCard v-for="auction in newestRail" :key="auction.id" :auction="auction as any" />
        </div>
      </section>

      <!-- ================================================================
           SECTION 5: POPULAR / LIVE LOTS & ONBOARDING HUB
           ================================================================ -->
      <section class="space-y-6" aria-labelledby="live-lots-title">

        <!-- Header & Category Switcher Tabs -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-600 border border-rose-200">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                {{ t('home.heroLiveBadge') || 'CANLI YAYIN' }}
              </span>
              <span class="text-xs text-gray-500 font-medium">{{ t('home.heroLiveSubtitle') || 'Kırgızistan genelindeki tüm aktif açık artırmalar' }}</span>
            </div>
            <h2 id="live-lots-title" class="font-black text-2xl sm:text-3xl text-gray-950 tracking-tight">
              {{ t('home.popularTitle') || 'Popüler Lotlar' }}
            </h2>
          </div>

          <!-- Quick Filter Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              v-for="tab in filterTabs"
              :key="tab.id"
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
              :class="activeFilterTab === tab.id
                ? 'bg-primary text-gray-950 font-black shadow-sm ring-2 ring-primary/20'
                : 'bg-white border border-black/10 text-gray-600 hover:bg-slate-50 hover:text-gray-950'"
              @click="activeFilterTab = tab.id"
            >
              <span>{{ tab.label }}</span>
            </button>
          </div>
        </div>

        <!-- Lots Grid (When lots exist) -->
        <div v-if="filteredPopularAuctions.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <AuctionCard
            v-for="auction in filteredPopularAuctions"
            :key="auction.id"
            :auction="auction as any"
          />
        </div>

        <!-- Zero-Listings Engaging Onboarding & Category Explorer (When 0 listings) -->
        <div v-else class="bg-gradient-to-br from-slate-50 via-white to-amber-500/[0.04] border border-black/[0.08] rounded-3xl p-8 sm:p-12 text-center space-y-8 shadow-2xs">
          <div class="max-w-2xl mx-auto space-y-3">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs font-black">
              <Sparkles class="w-4 h-4 text-amber-600" />
              <span>İlk Ay %0 Komisyon Fırsatı</span>
            </div>
            <h3 class="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
              Henüz Bu Kategoride Aktif İlan Bulunmuyor
            </h3>
            <p class="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-lg mx-auto">
              Kırgızistan genelinde binlerce alıcı yeni ilanları bekliyor. İlk açık artırmanızı komisyonsuz başlatın, dakikalar içinde en yüksek teklifi alın.
            </p>
            <div class="pt-2 flex flex-wrap items-center justify-center gap-3">
              <RouterLink
                to="/sell"
                class="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <PlusCircle class="w-4 h-4" />
                <span>+ Hemen İlk İlanı Siz Verin</span>
              </RouterLink>
              <RouterLink
                to="/how-it-works"
                class="px-6 py-3 rounded-2xl bg-white border border-black/10 text-gray-800 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <HelpCircle class="w-4 h-4 text-gray-500" />
                <span>Açık Artırma Nasıl Çalışır?</span>
              </RouterLink>
            </div>
          </div>

          <!-- 3-Step Quick Guide -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-6 border-t border-black/[0.06]">
            <div class="p-5 rounded-2xl bg-white border border-black/[0.05] space-y-2 shadow-2xs">
              <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h4 class="text-sm font-black text-gray-950">İlanınızı Oluşturun</h4>
              <p class="text-xs text-gray-500 leading-relaxed">Yapay zeka asistanımızla fotoğrafları yükleyin, başlangıç fiyatını belirleyin.</p>
            </div>

            <div class="p-5 rounded-2xl bg-white border border-black/[0.05] space-y-2 shadow-2xs">
              <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h4 class="text-sm font-black text-gray-950">Canlı Teklifleri Toplayın</h4>
              <p class="text-xs text-gray-500 leading-relaxed">Gerçek zamanlı WebSocket ile alıcıların rekabetini anlık izleyin.</p>
            </div>

            <div class="p-5 rounded-2xl bg-white border border-black/[0.05] space-y-2 shadow-2xs">
              <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h4 class="text-sm font-black text-gray-950">Escrow ile Güvenli Ödeme</h4>
              <p class="text-xs text-gray-500 leading-relaxed">Teslimat onaylandığında kazandığınız tutar anında banka hesabınıza geçer.</p>
            </div>
          </div>
        </div>

        <!-- View All Link (if auctions exist) -->
        <div v-if="filteredPopularAuctions.length > 0" class="text-center pt-2">
          <RouterLink
            to="/auctions"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-black/10 text-gray-900 font-extrabold text-xs sm:text-sm hover:bg-slate-50 transition-all shadow-2xs"
          >
            <span>{{ t('home.allLotsCount', { n: allAuctions.length }) || 'Tüm Lotları Gör' }}</span>
            <ArrowRight class="w-4 h-4" />
          </RouterLink>
        </div>

      </section>

      <!-- ================================================================
           SECTION 6: CATEGORY SHELVES (When auctions exist)
           ================================================================ -->
      <section v-if="livestockAuctions.length > 0" class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🐎</span>
            <div>
              <h3 class="text-xl font-extrabold text-gray-950">{{ t('home.shelfLivestockTitle') }}</h3>
              <p class="text-xs text-gray-500">{{ t('home.shelfLivestockDesc') }}</p>
            </div>
          </div>
          <RouterLink to="/auctions?category=livestock" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>{{ t('home.shelfViewAll') }}</span>
            <ChevronRight class="w-4 h-4" />
          </RouterLink>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <AuctionCard v-for="auction in livestockAuctions" :key="auction.id" :auction="auction as any" />
        </div>
      </section>

      <section v-if="vehicleAuctions.length > 0" class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🚗</span>
            <div>
              <h3 class="text-xl font-extrabold text-gray-950">{{ t('home.shelfVehiclesTitle') }}</h3>
              <p class="text-xs text-gray-500">{{ t('home.shelfVehiclesDesc') }}</p>
            </div>
          </div>
          <RouterLink to="/auctions?category=vehicles" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>{{ t('home.shelfViewAll') }}</span>
            <ChevronRight class="w-4 h-4" />
          </RouterLink>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <AuctionCard v-for="auction in vehicleAuctions" :key="auction.id" :auction="auction as any" />
        </div>
      </section>

      <!-- ================================================================
           SECTION 7: UNIFIED BANK ESCROW & TRUST COMPLIANCE HUB
           ================================================================ -->
      <section class="bg-white p-6 sm:p-10 rounded-3xl border border-black/[0.08] shadow-2xs space-y-8">
        
        <!-- Header -->
        <div class="text-center max-w-2xl mx-auto space-y-2">
          <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200">
            <ShieldCheck class="w-4 h-4 text-emerald-600" />
            <span>{{ t('home.escrowBadge') || '%100 Banka Emanet (Escrow) Güvencesi' }}</span>
          </div>
          <h3 class="text-xl sm:text-3xl font-black text-gray-950 tracking-tight">
            {{ t('home.escrowTitle') || 'Kırgızistan\'ın Güvenilir Banka Emanetli Açık Artırma Platformu' }}
          </h3>
          <p class="text-xs sm:text-sm text-gray-500 leading-relaxed">
            {{ t('home.escrowSubtitle') || 'Paranız ve satıcının ürünü, teslimat onaylanana kadar güvenli banka emanet hesabında korunur.' }}
          </p>
        </div>

        <!-- 3 Bank Integration Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div
            v-for="bank in bankPartners"
            :key="bank.name"
            class="p-6 rounded-3xl bg-slate-50/80 border border-black/[0.05] space-y-3 hover:bg-slate-100/80 transition-all shadow-2xs"
          >
            <div class="flex items-center justify-between">
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xs border border-black/5" :class="[bank.bg, bank.color]">
                <component :is="bank.icon" class="w-5 h-5" />
              </div>
              <span class="text-[11px] font-black px-2.5 py-1 rounded-full bg-white text-gray-800 border border-black/5 shadow-2xs">
                {{ bank.badge }}
              </span>
            </div>
            <h4 class="text-base font-black text-gray-950">{{ bank.name }}</h4>
            <p class="text-xs text-gray-500 leading-relaxed">{{ bank.desc }}</p>
          </div>
        </div>

        <!-- 4 Security & Ecosystem Pillars -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-black/[0.06]">
          <div class="space-y-1.5 p-4 rounded-2xl bg-slate-50/50 border border-black/[0.04]">
            <h4 class="text-xs font-black text-gray-950 flex items-center gap-1.5">
              <span>🔒</span> {{ t('home.seoCol1Title') || '%100 Banka Emanet Güvencesi' }}
            </h4>
            <p class="text-[11px] text-gray-500 leading-relaxed">{{ t('home.seoCol1Desc') || 'Ödeme, ürün teslim alınıp onaylanana kadar güvenli banka emanetinde saklanır.' }}</p>
          </div>
          <div class="space-y-1.5 p-4 rounded-2xl bg-slate-50/50 border border-black/[0.04]">
            <h4 class="text-xs font-black text-gray-950 flex items-center gap-1.5">
              <span>⚡</span> {{ t('home.seoCol2Title') || 'MBank ve Optima ile Anında Ödeme' }}
            </h4>
            <p class="text-[11px] text-gray-500 leading-relaxed">{{ t('home.seoCol2Desc') || 'MBank QR ve Optima Bank ile KGS para biriminde anında ve masrafsız işlem kolaylığı.' }}</p>
          </div>
          <div class="space-y-1.5 p-4 rounded-2xl bg-slate-50/50 border border-black/[0.04]">
            <h4 class="text-xs font-black text-gray-950 flex items-center gap-1.5">
              <span>🎯</span> {{ t('home.seoCol3Title') || 'Şeffaf ve Gerçek Zamanlı Teklifler' }}
            </h4>
            <p class="text-[11px] text-gray-500 leading-relaxed">{{ t('home.seoCol3Desc') || 'WebSocket altyapısıyla her teklif anlık güncellenir; botlar veya gizli komisyonlar yoktur.' }}</p>
          </div>
          <div class="space-y-1.5 p-4 rounded-2xl bg-slate-50/50 border border-black/[0.04]">
            <h4 class="text-xs font-black text-gray-950 flex items-center gap-1.5">
              <span>🐄</span> {{ t('home.seoCol4Title') || 'Dordoy ve Canlı Hayvan Pazarı' }}
            </h4>
            <p class="text-[11px] text-gray-500 leading-relaxed">{{ t('home.seoCol4Desc') || 'Araşan koçlarından araçlara ve Dordoy toptan ürünlerine kadar zengin ilan yelpazesi.' }}</p>
          </div>
        </div>

      </section>

    </div>
  </div>
</template>
