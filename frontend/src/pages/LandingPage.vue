<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Flame, Sparkles, ChevronRight, ArrowRight, ShieldCheck,
  CreditCard, Zap, CheckCircle2, Store, Smartphone, Car, Wheat,
  Building2, Bot, Layers
} from 'lucide-vue-next'
import AuctionCard from '@/components/auction/AuctionCard.vue'
import FeaturedLiveAuction from '@/components/home/FeaturedLiveAuction.vue'
import CategoryPillBar from '@/components/home/CategoryPillBar.vue'
import StoreCard, { type MerchantStore } from '@/components/home/StoreCard.vue'
import BidBottomSheet from '@/components/auction/BidBottomSheet.vue'
import AiAssistantModal from '@/components/layout/AiAssistantModal.vue'
import { useAuctionStore } from '@/stores/auction'
import { useActivityStore } from '@/stores/activity'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/composables/useI18n'
import { mockAuctions } from '@/data/mockAuctions'
import type { Auction } from '@/types'

const auctionStore = useAuctionStore()
const activityStore = useActivityStore()
const userStore = useUserStore()
const { t } = useI18n()

// Selected category filter
const activeCategorySlug = ref('all')

// Interactive Modals State
const isBidModalOpen = ref(false)
const selectedBidAuction = ref<Auction | null>(null)
const isAiModalOpen = ref(false)

// Guaranteed non-empty auctions list
const allAuctions = computed<Auction[]>(() => {
  if (auctionStore.auctions && auctionStore.auctions.length > 0) {
    return auctionStore.auctions
  }
  return mockAuctions
})

// Signature Featured Hero Auction
const featuredHeroAuction = computed<Auction>(() => {
  const blitz = allAuctions.value.find(a => a.isBlitz && a.status === 'active')
  if (blitz) return blitz
  return allAuctions.value[0] || mockAuctions[0]
})

// Ending Soon Rail (lots with closest endsAt)
const endingSoonRail = computed(() => {
  return [...allAuctions.value]
    .filter(a => a.status === 'active')
    .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime())
    .slice(0, 4)
})

// Filtered "Для вас" Grid
const forYouAuctions = computed(() => {
  let list = allAuctions.value.filter(a => a.status === 'active')
  if (activeCategorySlug.value !== 'all') {
    list = list.filter(a => a.category === activeCategorySlug.value)
  }
  return list.slice(0, 8)
})

// Category Showcases
const vehicleAuctions = computed(() =>
  allAuctions.value.filter(a => a.category === 'vehicles').slice(0, 4)
)

const electronicsAuctions = computed(() =>
  allAuctions.value.filter(a => a.category === 'electronics').slice(0, 4)
)

const livestockAuctions = computed(() =>
  allAuctions.value.filter(a => a.category === 'livestock').slice(0, 4)
)

// Verified Kyrgyz Merchant Storefronts
const verifiedStores = ref<MerchantStore[]>([
  {
    id: 'user-kyrgyz-tech',
    name: 'Bishkek iStore',
    city: 'Бишкек',
    category: 'Официальная электроника',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 4.95,
    totalSales: 342,
    activeLotsCount: 18,
    previewImages: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=400&q=80'
    ]
  },
  {
    id: 'user-auto-bishkek',
    name: 'AutoAsia Kyrgyzstan',
    city: 'Бишкек',
    category: 'Автомобили и транспорт',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    rating: 4.9,
    totalSales: 89,
    activeLotsCount: 12,
    previewImages: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'
    ]
  },
  {
    id: 'user-chuy-ferma',
    name: 'Племхоз «Чуй-Арашан»',
    city: 'Токмок',
    category: 'Племенное животноводство',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    rating: 4.97,
    totalSales: 112,
    activeLotsCount: 14,
    previewImages: [
      'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=400&q=80'
    ]
  }
])

function openBidSheet(lot: Auction) {
  selectedBidAuction.value = lot
  isBidModalOpen.value = true
}

onMounted(async () => {
  if (auctionStore.auctions.length === 0) {
    await auctionStore.fetchAuctions()
  }
  activityStore.fetchInitial()
})
</script>

<template>
  <div class="min-h-screen bg-[#F8F9FC] text-gray-900 font-sans pt-28 sm:pt-32 lg:pt-24 pb-24 px-3 sm:px-5 lg:px-8">
    <div class="max-w-[1440px] mx-auto space-y-8 sm:space-y-12">

      <!-- ================================================================
           1. THE SIGNATURE: FEATURED LIVE AUCTION (Dark Studio Hero)
           ================================================================ -->
      <section aria-label="Featured Live Auction">
        <FeaturedLiveAuction
          :auction="featuredHeroAuction"
          @open-bid="openBidSheet"
        />
      </section>

      <!-- ================================================================
           2. QUICK HORIZONTAL CATEGORY NAVIGATION BAR
           ================================================================ -->
      <section aria-label="Category Navigation" class="relative">
        <CategoryPillBar
          :active-slug="activeCategorySlug"
          @select="activeCategorySlug = $event"
        />
      </section>

      <!-- ================================================================
           3. ENDING SOON URGENCY RAIL ("Скоро завершаются")
           ================================================================ -->
      <section v-if="endingSoonRail.length > 0" aria-labelledby="rail-ending-soon-title" class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 sm:gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Flame class="w-4 h-4" />
            </div>
            <div>
              <h2 id="rail-ending-soon-title" class="text-lg sm:text-xl font-black text-gray-950 tracking-tight">
                Скоро завершаются
              </h2>
              <p class="text-xs text-gray-500 hidden sm:block">Лоты с минимальным остатком времени и горячими ставками</p>
            </div>
          </div>
          <RouterLink
            to="/auctions?sort=ending_soon&status=live"
            class="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 group"
          >
            <span>Смотреть все</span>
            <ChevronRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </RouterLink>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <AuctionCard
            v-for="auction in endingSoonRail"
            :key="auction.id"
            :auction="auction"
          />
        </div>
      </section>

      <!-- ================================================================
           4. "ДЛЯ ВАС" / PERSONALIZED COMMERCE (2-Col Mobile / 4-Col Desktop)
           ================================================================ -->
      <section aria-labelledby="for-you-title" class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Sparkles class="w-4 h-4" />
            </div>
            <div>
              <h2 id="for-you-title" class="text-lg sm:text-xl font-black text-gray-950 tracking-tight">
                {{ activeCategorySlug === 'all' ? 'Рекомендуемые лоты' : 'Лоты в категории' }}
              </h2>
              <p class="text-xs text-gray-500 hidden sm:block">Лучшие цены и проверенные продавцы по всему Кыргызстану</p>
            </div>
          </div>

          <!-- AI Assistant Trigger Button -->
          <button
            type="button"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-black/10 hover:border-amber-500/40 text-xs font-black text-gray-800 hover:text-gray-950 shadow-2xs hover:shadow-xs transition-all cursor-pointer self-start sm:self-auto group"
            @click="isAiModalOpen = true"
          >
            <Bot class="w-4 h-4 text-amber-600 group-hover:rotate-12 transition-transform" />
            <span>✨ Помочь найти лот?</span>
          </button>
        </div>

        <!-- Mobile 2-column, Desktop 4-column Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <AuctionCard
            v-for="auction in forYouAuctions"
            :key="auction.id"
            :auction="auction"
          />
        </div>

        <div class="text-center pt-2">
          <RouterLink
            :to="activeCategorySlug === 'all' ? '/auctions' : `/auctions?category=${activeCategorySlug}`"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-black/10 text-gray-900 font-extrabold text-xs sm:text-sm hover:bg-slate-50 transition-all shadow-2xs"
          >
            <span>Показать больше лотов</span>
            <ArrowRight class="w-4 h-4" />
          </RouterLink>
        </div>
      </section>

      <!-- ================================================================
           5. VERIFIED MERCHANT STOREFRONTS ("Проверенные магазины")
           ================================================================ -->
      <section aria-labelledby="verified-stores-title" class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 class="w-4 h-4" />
            </div>
            <div>
              <h2 id="verified-stores-title" class="text-lg sm:text-xl font-black text-gray-950 tracking-tight">
                Проверенные магазины Кыргызстана
              </h2>
              <p class="text-xs text-gray-500 hidden sm:block">Магазины с официальной верификацией, рейтингом от 4.8 и гарантией возврата</p>
            </div>
          </div>
          <RouterLink
            to="/auctions"
            class="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>Все магазины</span>
            <ChevronRight class="w-4 h-4" />
          </RouterLink>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <StoreCard
            v-for="store in verifiedStores"
            :key="store.id"
            :store="store"
          />
        </div>
      </section>

      <!-- ================================================================
           6. CURATED CATEGORY SHOWCASES (Vehicles, Electronics, Livestock)
           ================================================================ -->
      <!-- Vehicles Showcase -->
      <section v-if="vehicleAuctions.length > 0" class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Car class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-lg sm:text-xl font-black text-gray-950 tracking-tight">
                Автомобили и транспорт
              </h3>
              <p class="text-xs text-gray-500 hidden sm:block">Седаны, внедорожники и коммерческий транспорт с чистой историей</p>
            </div>
          </div>
          <RouterLink
            to="/auctions?category=vehicles"
            class="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>Смотреть авто</span>
            <ChevronRight class="w-4 h-4" />
          </RouterLink>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <AuctionCard v-for="auction in vehicleAuctions" :key="auction.id" :auction="auction" />
        </div>
      </section>

      <!-- Electronics Showcase -->
      <section v-if="electronicsAuctions.length > 0" class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Smartphone class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-lg sm:text-xl font-black text-gray-950 tracking-tight">
                Гаджеты и Электроника
              </h3>
              <p class="text-xs text-gray-500 hidden sm:block">Официальные устройства с зарегистрированным кодом IMEI</p>
            </div>
          </div>
          <RouterLink
            to="/auctions?category=electronics"
            class="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>Смотреть гаджеты</span>
            <ChevronRight class="w-4 h-4" />
          </RouterLink>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <AuctionCard v-for="auction in electronicsAuctions" :key="auction.id" :auction="auction" />
        </div>
      </section>

      <!-- Livestock Showcase -->
      <section v-if="livestockAuctions.length > 0" class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-amber-800/10 text-amber-800 flex items-center justify-center">
              <Wheat class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-lg sm:text-xl font-black text-gray-950 tracking-tight">
                Скотный рынок и Сельское хозяйство
              </h3>
              <p class="text-xs text-gray-500 hidden sm:block">Породистые бараны Арашан, скаковые лошади и дойные коровы</p>
            </div>
          </div>
          <RouterLink
            to="/auctions?category=livestock"
            class="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>Смотреть рынок</span>
            <ChevronRight class="w-4 h-4" />
          </RouterLink>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <AuctionCard v-for="auction in livestockAuctions" :key="auction.id" :auction="auction" />
        </div>
      </section>

      <!-- ================================================================
           7. SUBTLE ESCROW TRUST STRIP (MBank, Optima, DemirBank)
           ================================================================ -->
      <section class="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-8 shadow-2xs space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/[0.06]">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200">
              <ShieldCheck class="w-4 h-4 text-emerald-600" />
              <span>100% Банковский эскроу</span>
            </div>
            <h3 class="text-lg sm:text-xl font-black text-gray-950">
              Безопасные расчеты через ведущие банки Кыргызстана
            </h3>
            <p class="text-xs text-gray-500">
              Деньги блокируются на защищенном эскроу-счете и переводятся продавцу только после вашего личного подтверждения получения товара.
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <RouterLink
              to="/how-it-works"
              class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-800 font-bold text-xs transition-colors"
            >
              Как это работает?
            </RouterLink>
            <RouterLink
              to="/sell"
              class="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-gray-950 font-black text-xs transition-colors shadow-2xs"
            >
              Начать продавать
            </RouterLink>
          </div>
        </div>

        <!-- 3 Bank Integration Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 rounded-2xl bg-slate-50 border border-black/5 space-y-2">
            <div class="flex items-center justify-between">
              <div class="font-black text-xs text-gray-950">MBank Pay & QR</div>
              <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">0% комиссия</span>
            </div>
            <p class="text-xs text-gray-500 leading-relaxed">
              Мгновенное пополнение и оплата через приложение MBank без очередей и скрытых комиссий.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-slate-50 border border-black/5 space-y-2">
            <div class="flex items-center justify-between">
              <div class="font-black text-xs text-gray-950">DemirBank Escrow</div>
              <span class="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">Защита средств</span>
            </div>
            <p class="text-xs text-gray-500 leading-relaxed">
              Официальное банковское хранение средств до момента передачи и проверки лота покупателем.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-slate-50 border border-black/5 space-y-2">
            <div class="flex items-center justify-between">
              <div class="font-black text-xs text-gray-950">Optima Bank & Элкарт</div>
              <span class="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">3D Secure 2.0</span>
            </div>
            <p class="text-xs text-gray-500 leading-relaxed">
              Поддержка всех национальных карт Элкарт, Visa и Mastercard с мгновенным выводом выручки.
            </p>
          </div>
        </div>
      </section>

    </div>

    <!-- Quick Bid Bottom Sheet -->
    <BidBottomSheet
      v-model="isBidModalOpen"
      :auction="selectedBidAuction"
    />

    <!-- AI Assistant Modal -->
    <AiAssistantModal
      v-model="isAiModalOpen"
    />
  </div>
</template>

<style scoped>
</style>
