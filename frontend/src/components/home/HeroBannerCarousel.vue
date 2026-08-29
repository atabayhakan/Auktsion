<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronLeft, ChevronRight, Sparkles, Gavel, Zap, ShieldCheck, Store } from 'lucide-vue-next'
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
  visualIcon: any
  gradient: string
}

const promoSlides = computed<Slide[]>(() => [
  {
    id: 'new-sellers',
    eyebrow: t('home.promoNewSellersEyebrow'),
    eyebrowIcon: Sparkles,
    title: t('home.promoNewSellersTitle'),
    subtitle: t('home.promoNewSellersDesc'),
    ctaLabel: t('home.promoNewSellersCta'),
    ctaLink: '/sell',
    visualIcon: Store,
    gradient: 'from-secondary/15 via-secondary/5 to-transparent',
  },
  {
    id: 'mbank-instant',
    eyebrow: t('home.promoMbankEyebrow'),
    eyebrowIcon: Zap,
    title: t('home.promoMbankTitle'),
    subtitle: t('home.promoMbankDesc'),
    ctaLabel: t('home.promoMbankCta'),
    ctaLink: '/how-it-works',
    visualIcon: ShieldCheck,
    gradient: 'from-primary/15 via-primary/5 to-transparent',
  },
  {
    id: 'flash-ending',
    eyebrow: t('home.promoFlashEyebrow'),
    eyebrowIcon: Gavel,
    title: t('home.promoFlashTitle'),
    subtitle: t('home.promoFlashDesc'),
    ctaLabel: t('home.promoFlashCta'),
    ctaLink: '/auctions?sort=ending_soon',
    visualIcon: Zap,
    gradient: 'from-error/15 via-error/5 to-transparent',
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
  }, 5500)
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
    class="glass rounded-3xl relative overflow-hidden shadow-sm min-h-[420px] sm:min-h-[380px]"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
  >
    <!-- Featured-auction spotlight slides (data-driven — electronics & vehicles) -->
    <div
      v-for="(auction, i) in featuredAuctions"
      :key="auction.id"
      v-show="i === activeIndex"
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
            <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-error text-white shadow-sm flex items-center gap-1.5">
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
            <div class="flex items-center gap-2 text-xs font-bold text-primary">
              <Sparkles class="w-4 h-4" />
              <span>{{ t('home.heroBadge') }}</span>
            </div>
            <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight">
              {{ auction.title }}
            </h2>
            <p class="text-xs sm:text-sm text-text-secondary line-clamp-2 leading-relaxed">
              {{ auction.description }}
            </p>
          </div>
          <div class="p-5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
            <div>
              <div class="text-xs text-text-secondary font-medium">{{ t('home.currentPrice') }}</div>
              <div class="text-2xl sm:text-3xl font-extrabold text-primary">{{ formatMoney(auction.currentPrice) }}</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-text-secondary font-medium">{{ t('home.nextStep') }}</div>
              <div class="text-sm font-bold text-success font-mono">+{{ formatMoney(auction.bidIncrement) }}</div>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row items-center gap-3">
            <RouterLink
              :to="`/auctions/${auction.id}`"
              class="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-primary text-text-primary font-extrabold text-sm hover:bg-primary-hover shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Gavel class="w-4 h-4" />
              <span>{{ t('home.placeBid') }}</span>
            </RouterLink>
            <RouterLink
              :to="`/auctions/${auction.id}`"
              class="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-white border border-border text-text-primary font-bold text-sm hover:bg-black/5 transition-all text-center"
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
      :key="slide.id"
      v-show="(featuredAuctions.length + i) === activeIndex"
      class="absolute inset-0 p-8 sm:p-10 lg:p-14 bg-gradient-to-br flex items-center"
      :class="slide.gradient"
    >
      <div class="max-w-2xl space-y-5">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 text-xs font-bold text-text-secondary shadow-2xs">
          <component :is="slide.eyebrowIcon" class="w-3.5 h-3.5 text-primary" />
          <span>{{ slide.eyebrow }}</span>
        </div>
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight leading-tight">
          {{ slide.title }}
        </h2>
        <p class="text-sm sm:text-base text-text-secondary leading-relaxed max-w-lg">
          {{ slide.subtitle }}
        </p>
        <div class="pt-2 flex items-center gap-3">
          <RouterLink
            :to="slide.ctaLink"
            class="py-3 px-6 rounded-2xl bg-primary text-text-primary font-bold text-sm hover:bg-primary-hover shadow-md transition-all inline-flex items-center gap-2"
          >
            <span>{{ slide.ctaLabel }}</span>
            <ChevronRight class="w-4 h-4" />
          </RouterLink>
        </div>
      </div>
      <component
        :is="slide.visualIcon"
        class="hidden lg:block absolute -right-6 -bottom-6 w-56 h-56 text-primary/10"
        stroke-width="1"
      />
    </div>

    <!-- Arrow navigation -->
    <button
      @click="prev"
      class="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-md backdrop-blur-md flex items-center justify-center text-text-primary transition-all hover:scale-105"
      aria-label="Previous slide"
    >
      <ChevronLeft class="w-5 h-5" />
    </button>
    <button
      @click="next"
      class="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-md backdrop-blur-md flex items-center justify-center text-text-primary transition-all hover:scale-105"
      aria-label="Next slide"
    >
      <ChevronRight class="w-5 h-5" />
    </button>

    <!-- Dot indicators -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
      <button
        v-for="i in slideCount"
        :key="i"
        @click="goTo(i - 1)"
        class="h-1.5 rounded-full transition-all duration-300"
        :class="activeIndex === i - 1 ? 'w-6 bg-primary' : 'w-1.5 bg-black/20 hover:bg-black/30'"
        :aria-label="`Go to slide ${i}`"
      />
    </div>
  </div>
</template>
