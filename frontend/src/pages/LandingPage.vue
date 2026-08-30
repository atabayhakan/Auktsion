<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowRight, ShieldCheck, CreditCard, Store,
  ChevronRight, Sparkles,
  Car, Home as HomeIcon, Smartphone, Flame,
  Grid
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

// Ensure auctions always has fallback data
const allAuctions = computed(() => {
  if (auctionStore.auctions && auctionStore.auctions.length > 0) {
    return auctionStore.auctions
  }
  return mockAuctions
})

// Photo-based category tiles — real taxonomy only; urgency/promo badges live
// in the dedicated Discovery rails (Section 3) instead of being interleaved
// here. Same localization pattern as CategoriesPage.vue / MegaMenu.vue.
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
  { id: 'all', label: t('home.tabAll'), icon: Grid },
  { id: 'livestock', label: t('home.tabLivestock'), icon: Store },
  { id: 'vehicles', label: t('home.tabVehicles'), icon: Car },
  { id: 'real-estate', label: t('home.tabRealEstate'), icon: HomeIcon },
  { id: 'electronics', label: t('home.tabElectronics'), icon: Smartphone },
  { id: 'ending_soon', label: t('home.tabEndingSoon'), icon: Flame },
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

// Featured hero auctions — electronics & vehicles only, the categories with
// the broadest general appeal; livestock has its own shelf further down the
// page instead of taking over the hero spotlight.
const featuredAuctions = computed(() =>
  allAuctions.value.filter(a => a.category === 'electronics' || a.category === 'vehicles').slice(0, 4)
)

// Livestock shelf
const livestockAuctions = computed(() =>
  allAuctions.value.filter(a => a.category === 'livestock').slice(0, 4)
)

// Vehicle shelf
const vehicleAuctions = computed(() =>
  allAuctions.value.filter(a => a.category === 'vehicles').slice(0, 4)
)

// Real estate & Dordoy shelf
const realEstateAuctions = computed(() =>
  allAuctions.value.filter(a => a.category === 'real-estate').slice(0, 4)
)

// Discovery rails — real data only (store getters), no fabricated
// trending/watch-count signals. Falls back to sorting allAuctions directly
// when the store hasn't loaded yet, mirroring the allAuctions fallback above.
const endingSoonRail = computed(() =>
  (auctionStore.auctions.length > 0 ? auctionStore.endingSoonAuctions : allAuctions.value).slice(0, 4)
)
const newestRail = computed(() =>
  (auctionStore.auctions.length > 0 ? auctionStore.newestAuctions : allAuctions.value).slice(0, 4)
)
const mostActiveRail = computed(() =>
  (auctionStore.auctions.length > 0 ? auctionStore.mostActiveAuctions : allAuctions.value).slice(0, 4)
)

// Secondary promo tiles (campaign strip below the hero carousel) — the old
// "flash auction" tile was dropped: it duplicated the new Ending Soon rail
// (Section 3) exactly. The concierge tile is a standalone service pitch, not
// a data signal, so it stays.
const promoTiles = computed(() => [
  {
    id: 'concierge',
    label: t('home.conciergeLabel'),
    title: t('home.conciergeTitle'),
    desc: t('home.conciergeDesc'),
    icon: Sparkles,
    link: '/how-it-works',
    tone: 'bg-primary/[0.06] border-primary/15',
    iconTone: 'text-primary bg-primary/10',
  },
])

// Bank partners
const bankPartners = computed(() => [
  { name: 'MBank', badge: 'QR & MBank Pay', desc: t('home.escrowBankMbankDesc'), icon: Smartphone, color: 'text-emerald-600' },
  { name: 'DemirBank Escrow', badge: t('home.escrowBankDemirBadge'), desc: t('home.escrowBankDemirDesc'), icon: ShieldCheck, color: 'text-blue-600' },
  { name: 'Optima Bank', badge: '3D Secure 2.0', desc: t('home.escrowBankOptimaDesc'), icon: CreditCard, color: 'text-red-600' },
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
  <div class="min-h-screen bg-background text-text-primary font-sans pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-10 lg:space-y-14">

      <!-- ================================================================
           SECTION 1: CATEGORY TILES (photo-based, replaces the old
           emoji-circle "quick stories" row)
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
           SECTION 2: HERO BANNER CAROUSEL + PROMO TILES
           ================================================================ -->
      <section aria-labelledby="hero-title" class="relative space-y-4">
        <h1 id="hero-title" class="sr-only">{{ t('home.heroTitle') }}</h1>

        <HeroBannerCarousel :featured-auctions="featuredAuctions" />

        <!-- Promo Tile Strip -->
        <div class="grid grid-cols-1 sm:max-w-md gap-4">
          <RouterLink
            v-for="tile in promoTiles"
            :key="tile.id"
            :to="tile.link"
            class="group rounded-2xl border p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5"
            :class="tile.tone"
          >
            <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" :class="tile.iconTone">
              <component :is="tile.icon" class="w-6 h-6" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[10px] font-bold tracking-wider text-text-muted">{{ tile.label }}</div>
              <div class="text-sm font-bold text-text-primary">{{ tile.title }}</div>
              <div class="text-xs text-text-secondary line-clamp-1">{{ tile.desc }}</div>
            </div>
            <ChevronRight class="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </RouterLink>
        </div>
      </section>

      <!-- ================================================================
           SECTION 3: LIVE ACTIVITY — real cross-auction bid feed (GET
           /api/activity/recent) plus live bid.placed WebSocket pushes
           (see stores/activity.ts, composables/useEcho.ts). Hidden entirely
           when empty rather than showing a fabricated "quiet" state.
           ================================================================ -->
      <section aria-labelledby="rail-live-title" class="space-y-5">
        <div class="flex items-center gap-2.5">
          <span class="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
          </span>
          <h3 id="rail-live-title" class="text-xl font-extrabold text-text-primary">{{ t('discovery.liveActivity.title') }}</h3>
        </div>
        <LiveActivityFeed />
      </section>

      <!-- ================================================================
           SECTION 4: DISCOVERY RAILS — real data only (ending soon / newest /
           most active by bid count), replacing the promo badges that used to
           live in the category-icon row above.
           ================================================================ -->
      <section v-if="endingSoonRail.length > 0" class="space-y-5" aria-labelledby="rail-ending-soon-title">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🔥</span>
            <h3 id="rail-ending-soon-title" class="text-xl font-extrabold text-text-primary">{{ t('discovery.endingSoon.title') }}</h3>
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
            <h3 id="rail-newest-title" class="text-xl font-extrabold text-text-primary">{{ t('discovery.newest.title') }}</h3>
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

      <section v-if="mostActiveRail.length > 0" class="space-y-5" aria-labelledby="rail-most-active-title">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">📈</span>
            <h3 id="rail-most-active-title" class="text-xl font-extrabold text-text-primary">{{ t('discovery.mostActive.title') }}</h3>
          </div>
          <RouterLink to="/auctions?sort=most_bids" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>{{ t('discovery.mostActive.viewAll') }}</span>
            <ChevronRight class="w-4 h-4" />
          </RouterLink>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <AuctionCard v-for="auction in mostActiveRail" :key="auction.id" :auction="auction as any" />
        </div>
      </section>

      <!-- ================================================================
           SECTION 5: FOR YOU — derived entirely from the watchlist (see
           GET /api/user/recommendations). Hidden for logged-out users and
           for anyone not watching anything yet — never a generic fallback.
           ================================================================ -->
      <section v-if="recommendationsStore.items.length > 0" class="space-y-5" aria-labelledby="rail-for-you-title">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">💜</span>
          <h3 id="rail-for-you-title" class="text-xl font-extrabold text-text-primary">{{ t('discovery.forYou.title') }}</h3>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <AuctionCard v-for="auction in recommendationsStore.items" :key="auction.id" :auction="auction as any" />
        </div>
      </section>

      <!-- ================================================================
           SECTION 6: BANK ESCROW & SECURITY GUARANTEE — moved up from the
           bottom of the page (was Section 7) for more visibility, right
           after the new discovery rails.
           ================================================================ -->
      <section class="glass p-6 sm:p-10 rounded-3xl shadow-sm space-y-8">
        <div class="text-center max-w-2xl mx-auto space-y-2">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-bold border border-success/20">
            <ShieldCheck class="w-4 h-4" />
            <span>{{ t('home.escrowBadge') }}</span>
          </div>
          <h3 class="text-2xl sm:text-3xl font-extrabold text-text-primary">
            {{ t('home.escrowTitle') }}
          </h3>
          <p class="text-xs sm:text-sm text-text-secondary">
            {{ t('home.escrowSubtitle') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="bank in bankPartners"
            :key="bank.name"
            class="p-6 rounded-2xl bg-black/[0.02] border border-black/[0.06] space-y-3"
          >
            <div class="flex items-center justify-between">
              <div class="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center shadow-sm" :class="bank.color">
                <component :is="bank.icon" class="w-5 h-5" />
              </div>
              <span class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                {{ bank.badge }}
              </span>
            </div>
            <h4 class="text-base font-bold text-text-primary">{{ bank.name }}</h4>
            <p class="text-xs text-text-secondary leading-relaxed">{{ bank.desc }}</p>
          </div>
        </div>
      </section>

      <!-- ================================================================
           SECTION 7: IMMEDIATE LIVE LOTS (Explore Directly)
           ================================================================ -->
      <section class="space-y-6" aria-labelledby="live-lots-title">

        <!-- Header & Category Switcher Tabs -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-error/10 text-error border border-error/20">
                <span class="w-1.5 h-1.5 rounded-full bg-error animate-ping" />
                {{ t('home.heroLiveBadge') }}
              </span>
              <span class="text-xs text-text-muted font-medium">{{ t('home.heroLiveSubtitle') }}</span>
            </div>
            <h2 id="live-lots-title" class="font-extrabold text-2xl sm:text-3xl text-text-primary">
              {{ t('home.popularTitle') }}
            </h2>
          </div>

          <!-- Quick Filter Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              v-for="tab in filterTabs"
              :key="tab.id"
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
              :class="activeFilterTab === tab.id
                ? 'bg-primary text-text-primary shadow-md'
                : 'bg-white border border-border text-text-secondary hover:bg-black/5'"
              @click="activeFilterTab = tab.id"
            >
              <span>{{ tab.label }}</span>
            </button>
          </div>
        </div>

        <!-- Lots Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <AuctionCard
            v-for="auction in filteredPopularAuctions"
            :key="auction.id"
            :auction="auction as any"
          />
        </div>

        <!-- View All Link -->
        <div class="text-center pt-4">
          <RouterLink
            to="/auctions"
            class="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white border border-border text-text-primary font-bold text-xs sm:text-sm hover:border-primary/40 hover:shadow-md transition-all group"
          >
            <span>{{ t('home.allLotsCount', { n: allAuctions.length }) }}</span>
            <ArrowRight class="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
          </RouterLink>
        </div>

      </section>

      <!-- ================================================================
           SECTION 8: LIVESTOCK (Мал Базары) SHELF
           ================================================================ -->
      <section v-if="livestockAuctions.length > 0" class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🐄</span>
            <div>
              <h3 class="text-xl font-extrabold text-text-primary">{{ t('home.shelfLivestockTitle') }}</h3>
              <p class="text-xs text-text-secondary">{{ t('home.shelfLivestockDesc') }}</p>
            </div>
          </div>
          <RouterLink to="/auctions?category=livestock" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>{{ t('home.shelfViewAll') }}</span>
            <ChevronRight class="w-4 h-4" />
          </RouterLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <AuctionCard
            v-for="auction in livestockAuctions"
            :key="auction.id"
            :auction="auction as any"
          />
        </div>
      </section>

      <!-- ================================================================
           SECTION 9: VEHICLES (Автоунаалар) SHELF
           ================================================================ -->
      <section v-if="vehicleAuctions.length > 0" class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🚗</span>
            <div>
              <h3 class="text-xl font-extrabold text-text-primary">{{ t('home.shelfVehiclesTitle') }}</h3>
              <p class="text-xs text-text-secondary">{{ t('home.shelfVehiclesDesc') }}</p>
            </div>
          </div>
          <RouterLink to="/auctions?category=vehicles" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>{{ t('home.shelfViewAll') }}</span>
            <ChevronRight class="w-4 h-4" />
          </RouterLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <AuctionCard
            v-for="auction in vehicleAuctions"
            :key="auction.id"
            :auction="auction as any"
          />
        </div>
      </section>

      <!-- ================================================================
           SECTION 10: REAL ESTATE & DORDOY SHOPS SHELF
           ================================================================ -->
      <section v-if="realEstateAuctions.length > 0" class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🏢</span>
            <div>
              <h3 class="text-xl font-extrabold text-text-primary">{{ t('home.shelfRealEstateTitle') }}</h3>
              <p class="text-xs text-text-secondary">{{ t('home.shelfRealEstateDesc') }}</p>
            </div>
          </div>
          <RouterLink to="/auctions?category=real-estate" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>{{ t('home.shelfViewAll') }}</span>
            <ChevronRight class="w-4 h-4" />
          </RouterLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <AuctionCard
            v-for="auction in realEstateAuctions"
            :key="auction.id"
            :auction="auction as any"
          />
        </div>
      </section>

      <!-- ================================================================
           SECTION 11: SEO KNOWLEDGE & MARKET GUIDE
           ================================================================ -->
      <section class="mt-8 pt-8 border-t border-black/[0.08] space-y-6 bg-black/[0.015] rounded-3xl p-6 sm:p-8">
        <div class="space-y-2 max-w-4xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-extrabold text-text-primary">
            <ShieldCheck class="w-3.5 h-3.5 text-primary" />
            <span>{{ t('home.escrowBadge') }}</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
            {{ t('home.seoTitle') }}
          </h2>
          <p class="text-xs sm:text-sm text-text-secondary leading-relaxed">
            {{ t('home.seoDesc1') }}
          </p>
        </div>

        <!-- 4-Pillar Pillars Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-4 border-t border-black/[0.06]">
          <div class="space-y-1.5 p-4 rounded-2xl bg-white/80 border border-black/[0.06] shadow-xs">
            <h3 class="text-sm font-extrabold text-text-primary">{{ t('home.seoCol1Title') }}</h3>
            <p class="text-xs text-text-muted leading-relaxed">{{ t('home.seoCol1Desc') }}</p>
          </div>
          <div class="space-y-1.5 p-4 rounded-2xl bg-white/80 border border-black/[0.06] shadow-xs">
            <h3 class="text-sm font-extrabold text-text-primary">{{ t('home.seoCol2Title') }}</h3>
            <p class="text-xs text-text-muted leading-relaxed">{{ t('home.seoCol2Desc') }}</p>
          </div>
          <div class="space-y-1.5 p-4 rounded-2xl bg-white/80 border border-black/[0.06] shadow-xs">
            <h3 class="text-sm font-extrabold text-text-primary">{{ t('home.seoCol3Title') }}</h3>
            <p class="text-xs text-text-muted leading-relaxed">{{ t('home.seoCol3Desc') }}</p>
          </div>
          <div class="space-y-1.5 p-4 rounded-2xl bg-white/80 border border-black/[0.06] shadow-xs">
            <h3 class="text-sm font-extrabold text-text-primary">{{ t('home.seoCol4Title') }}</h3>
            <p class="text-xs text-text-muted leading-relaxed">{{ t('home.seoCol4Desc') }}</p>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>
