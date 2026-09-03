<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronLeft, ChevronRight, Sparkles, Gavel, Zap, ShieldCheck, Store, CheckCircle2, ArrowRight, Clock, QrCode } from 'lucide-vue-next'
import { useFormatters } from '@/composables/useFormatters'
import { useI18n } from '@/composables/useI18n'
import type { Auction } from '@/types'

interface Props {
  featuredAuctions?: Auction[]
}

const props = withDefaults(defineProps<Props>(), {
  featuredAuctions: () => [],
})
const { currency } = useFormatters()
const { formatMoney } = currency
const { t } = useI18n()

interface Slide {
  id: string
  eyebrow: string
  eyebrowIcon: any
  title: string
  subtitle: string
  ctaLabel: string
  ctaLink: string
  badgeText: string
  highlights: string[]
  gradient: string
}

const promoSlides = computed<Slide[]>(() => [
  {
    id: 'mbank-instant',
    eyebrow: t('home.promoMbankEyebrow') || 'MBank Instant Pay',
    eyebrowIcon: Zap,
    title: t('home.promoMbankTitle') || 'MBank QR ile Anında Ödeme',
    subtitle: t('home.promoMbankDesc') || 'Komisyonsuz, 5 saniyede — kazandığınız lotu hemen güvenle ödeyin.',
    ctaLabel: t('home.promoMbankCta') || 'Nasıl Çalışır?',
    ctaLink: '/how-it-works',
    badgeText: t('home.promoMbankBadge') || '0% Komisyon • MBank QR',
    highlights: [
      t('home.promoMbankH1') || '5 Saniyede QR ile Doğrudan Ödeme',
      t('home.promoMbankH2') || '%100 Güvenli Banka Emaneti',
      t('home.promoMbankH3') || 'Optima & DemirBank Desteği'
    ],
    gradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
  },
  {
    id: 'new-sellers',
    eyebrow: t('home.promoNewSellersEyebrow') || 'Yeni Satıcılar',
    eyebrowIcon: Sparkles,
    title: t('home.promoNewSellersTitle') || 'İlk Ay %0 Komisyon ile Satış Yapın',
    subtitle: t('home.promoNewSellersDesc') || 'Şimdi kaydolun ve lotunuzu yayınlayın — binlerce gerçek alıcıya anında ulaşın.',
    ctaLabel: t('home.promoNewSellersCta') || 'Hemen İlan Ver',
    ctaLink: '/sell',
    badgeText: t('home.promoNewSellersBadge') || 'Satıcı Avantajı',
    highlights: [
      t('home.promoNewSellersH1') || 'Yapay Zeka Destekli İlan Asistanı',
      t('home.promoNewSellersH2') || 'Canlı İhalede En Yüksek Fiyat',
      t('home.promoNewSellersH3') || 'Anında Banka Hesabına Çekim'
    ],
    gradient: 'from-blue-500/15 via-blue-500/5 to-transparent',
  },
  {
    id: 'flash-ending',
    eyebrow: t('home.promoFlashEyebrow') || 'Flaş Açık Artırmalar',
    eyebrowIcon: Gavel,
    title: t('home.promoFlashTitle') || 'Gerçek Zamanlı Canlı İhaleler',
    subtitle: t('home.promoFlashDesc') || 'Rezerv fiyatsız onlarca lot — hemen teklif verin ve en iyi fiyata kazanın.',
    ctaLabel: t('home.promoFlashCta') || 'Açık Artırmaları Gör',
    ctaLink: '/auctions',
    badgeText: t('home.promoFlashBadge') || 'Canlı WebSocket',
    highlights: [
      t('home.promoFlashH1') || 'Gecikmesiz Anlık Teklifler',
      t('home.promoFlashH2') || 'Şeffaf Teklif Geçmişi',
      t('home.promoFlashH3') || 'Adil & Denetimli Sistem'
    ],
    gradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
  },
])

const slideCount = computed(() => props.featuredAuctions.length + promoSlides.value.length)

const activeIndex = ref(0)
const isPaused = ref(false)
let timer: number | null = null

function startAutoplay() {
  stopAutoplay()
  timer = window.setInterval(() => {
    if (!isPaused.value) next()
  }, 6000)
}

function stopAutoplay() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function goTo(index: number) {
  if (slideCount.value === 0) return
  activeIndex.value = (index + slideCount.value) % slideCount.value
}

function next() {
  goTo(activeIndex.value + 1)
}

function prev() {
  goTo(activeIndex.value - 1)
}

onMounted(startAutoplay)
onUnmounted(stopAutoplay)
</script>

<template>
  <div
    class="bg-white rounded-3xl relative overflow-hidden shadow-2xs border border-black/[0.08] min-h-[360px] sm:min-h-[340px]"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
  >
    <!-- Featured-auction spotlight slides (when auctions exist) -->
    <div
      v-for="(auction, i) in featuredAuctions"
      v-show="i === activeIndex"
      :key="auction.id"
      :aria-hidden="i !== activeIndex"
      class="absolute inset-0 p-6 sm:p-8 lg:p-10"
    >
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
        <div class="lg:col-span-6 relative group rounded-2xl overflow-hidden aspect-4/3 bg-black/5">
          <img
            :src="auction.images[0] || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80'"
            :alt="auction.title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute top-3 left-3 flex items-center gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-sm flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-white animate-ping" />
              {{ t('home.heroLiveBadge') }}
            </span>
            <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white">
              {{ auction.bidCount }} {{ t('common.bids') }}
            </span>
          </div>
        </div>
        <div class="lg:col-span-6 space-y-6">
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-xs font-black text-amber-700">
              <Sparkles class="w-4 h-4" />
              <span>{{ t('home.heroBadge') }}</span>
            </div>
            <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-950 tracking-tight">
              {{ auction.title }}
            </h2>
            <p class="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed">
              {{ auction.description }}
            </p>
          </div>
          <div class="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div>
              <div class="text-xs text-gray-500 font-medium">{{ t('home.currentPrice') }}</div>
              <div class="text-2xl sm:text-3xl font-black text-amber-900">{{ formatMoney(auction.currentPrice) }}</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-500 font-medium">{{ t('home.nextStep') }}</div>
              <div class="text-sm font-black text-emerald-600 font-mono">+{{ formatMoney(auction.bidIncrement) }}</div>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row items-center gap-3">
            <RouterLink
              :to="`/auctions/${auction.id}`"
              class="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-primary text-gray-950 font-black text-sm hover:bg-primary-hover shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Gavel class="w-4 h-4" />
              <span>{{ t('home.placeBid') }}</span>
            </RouterLink>
            <RouterLink
              :to="`/auctions/${auction.id}`"
              class="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-white border border-black/10 text-gray-900 font-bold text-sm hover:bg-black/5 transition-all text-center"
            >
              {{ t('home.fullDetails') }}
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Promo slides (campaign banners) -->
    <div
      v-for="(slide, i) in promoSlides"
      v-show="(featuredAuctions.length + i) === activeIndex"
      :key="slide.id"
      :aria-hidden="(featuredAuctions.length + i) !== activeIndex"
      class="absolute inset-0 p-6 sm:p-10 lg:p-12 bg-gradient-to-br flex items-center justify-between"
      :class="slide.gradient"
    >
      <div class="max-w-xl space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-xs font-black text-gray-800 shadow-2xs border border-black/[0.06]">
          <component :is="slide.eyebrowIcon" class="w-3.5 h-3.5 text-primary" />
          <span>{{ slide.eyebrow }}</span>
        </div>
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-950 tracking-tight leading-tight">
          {{ slide.title }}
        </h2>
        <p class="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-lg">
          {{ slide.subtitle }}
        </p>
        <div class="pt-2 flex items-center gap-3">
          <RouterLink
            :to="slide.ctaLink"
            class="py-3 px-6 rounded-2xl bg-primary text-gray-950 font-black text-xs sm:text-sm hover:bg-primary-hover shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>{{ slide.ctaLabel }}</span>
            <ChevronRight class="w-4 h-4" />
          </RouterLink>
        </div>
      </div>

      <!-- Right Visual Card (Fintech Feature Highlights) -->
      <div class="hidden lg:flex w-80 p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-black/[0.08] shadow-sm flex-col gap-3 shrink-0">
        <div class="flex items-center justify-between pb-2 border-b border-black/[0.06]">
          <span class="text-xs font-black text-gray-900">{{ slide.badgeText }}</span>
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div class="space-y-2.5">
          <div v-for="item in slide.highlights" :key="item" class="flex items-center gap-2 text-xs font-bold text-gray-700">
            <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{{ item }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Arrow navigation -->
    <button
      type="button"
      class="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md border border-black/5 flex items-center justify-center text-gray-800 transition-all hover:scale-105 cursor-pointer"
      aria-label="Previous slide"
      @click="prev"
    >
      <ChevronLeft class="w-5 h-5" />
    </button>
    <button
      type="button"
      class="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md border border-black/5 flex items-center justify-center text-gray-800 transition-all hover:scale-105 cursor-pointer"
      aria-label="Next slide"
      @click="next"
    >
      <ChevronRight class="w-5 h-5" />
    </button>

    <!-- Dot indicators -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
      <button
        v-for="i in slideCount"
        :key="i"
        type="button"
        class="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
        :class="activeIndex === i - 1 ? 'w-6 bg-primary' : 'w-1.5 bg-black/20 hover:bg-black/40'"
        :aria-label="`Go to slide ${i}`"
        @click="goTo(i - 1)"
      />
    </div>
  </div>
</template>
