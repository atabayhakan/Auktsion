<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuctionStore } from '@/stores/auction'
import { useBiddingStore } from '@/stores/bidding'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'
import { useI18n } from '@/composables/useI18n'
import { useFormatters } from '@/composables/useFormatters'
import { auctionService } from '@/services/auctionService'
import type { Auction, Money } from '@/types'
import {
  Heart, Share2, Clock, AlertCircle, ChevronLeft,
  ChevronRight, MessageSquare, Flame, Send, CreditCard,
  Loader2, Gauge, MapPin, Zap, Car, Building2, Sparkles, ShieldCheck
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Modal from '@/components/ui/Modal.vue'
import PaymentModal from '@/components/payment/PaymentModal.vue'
import DisputeModal from '@/components/auction/DisputeModal.vue'


const route = useRoute()
const router = useRouter()
const auctionStore = useAuctionStore()
const biddingStore = useBiddingStore()
const userStore = useUserStore()
const uiStore = useUIStore()
const { t } = useI18n()
const { currency, date } = useFormatters()

const auctionId = computed(() => route.params.id as string)
const auction = ref<Auction | null>(null)
const isLoading = ref(true)

// Media carousel state
const selectedImageIndex = ref(0)

// Bidding Form state
const showBidModal = ref(false)
const showPaymentModal = ref(false)
const showDisputeModal = ref(false)
const bidAmount = ref<string>('')

const isPlacingBid = ref(false)
const bidError = ref<string | null>(null)
const bidConfirmed = ref(true)

// Countdown Timer logic
const timeRemaining = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isEnded: false,
  isCritical: false,
  text: '',
})

let timerInterval: number | null = null

function updateCountdown() {
  if (!auction.value) return
  const now = new Date().getTime()
  const end = new Date(auction.value.endsAt).getTime()
  const diff = end - now

  if (diff <= 0) {
    timeRemaining.value = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isEnded: true,
      isCritical: false,
      text: t('auction.auctionEnded'),
    }
    if (timerInterval) clearInterval(timerInterval)
    return
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  const isCritical = diff < 1000 * 60 * 5 // < 5 mins

  timeRemaining.value = {
    days,
    hours,
    minutes,
    seconds,
    isEnded: false,
    isCritical,
    text: days > 0
      ? `${days} ${t('common.days')} ${hours} ${t('common.hours')}`
      : `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
  }
}

function injectAuctionJsonLd(item: Auction) {
  let script = document.getElementById('auction-jsonld') as HTMLScriptElement | null
  if (!script) {
    script = document.createElement('script')
    script.id = 'auction-jsonld'
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': item.title,
    'description': item.description,
    'image': item.images || [],
    'sku': item.id,
    'offers': {
      '@type': 'Offer',
      'url': `https://www.itorgo.kg/auctions/${item.id}`,
      'priceCurrency': item.currency || 'KGS',
      'price': item.currentPrice?.amount || item.startingPrice?.amount || '0',
      'availability': item.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      'validThrough': item.endsAt,
      'seller': {
        '@type': 'Person',
        'name': (item as any).sellerName || (item as any).seller?.fullName || 'iTorgo Колдонуучусу'
      }
    }
  }

  script.textContent = JSON.stringify(structuredData)
}

onMounted(async () => {
  isLoading.value = true
  try {
    const fetched = await auctionStore.fetchAuction(auctionId.value)
    auction.value = fetched
    if (!fetched) return

    document.title = `${fetched.title} — iTorgo Аукцион`
    injectAuctionJsonLd(fetched)

    biddingStore.setCurrentAuction(fetched.id)
    biddingStore.setMinBidIncrement(fetched.bidIncrement)

    try {
      const response = await window.axios?.get(`/api/auctions/${fetched.id}/bids`)
      if (response?.data?.data) {
        biddingStore.setBidHistory(response.data.data)
      }
    } catch {
      // Bid history is supplementary — the auction itself still renders without it.
    }

    updateCountdown()
    timerInterval = window.setInterval(updateCountdown, 1000)
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  document.getElementById('auction-jsonld')?.remove()
  biddingStore.clearHistory()
})

const currentPrice = computed(() => {
  if (!auction.value?.currentPrice) return { amount: '0', formatted: '0 ' + t('common.currency') }
  return auction.value.currentPrice
})

const minimumNextBid = computed(() => {
  if (!auction.value) return null
  const current = parseFloat(auction.value.currentPrice?.amount || '0')
  const inc = parseFloat(auction.value.bidIncrement?.amount || '100')
  const minVal = current + inc
  return {
    amount: String(minVal),
    minorUnits: Math.round(minVal * 100),
    currency: 'KGS',
    formatted: `${minVal.toLocaleString()} ${t('common.currency')}`,
  }
})

const canBid = computed(() => {
  return auction.value?.status === 'active' && !timeRemaining.value.isEnded
})

const isOwnListing = computed(() => {
  if (!userStore.user || !auction.value) return false
  const sellerId = auction.value.sellerId || (auction.value as any).seller_id || (auction.value.seller as any)?.id
  return sellerId === userStore.user.id
})

const buyNowPrice = computed(() => (auction.value as any)?.buyNowPrice || (auction.value as any)?.buy_now_price || null)
const canBuyNow = computed(() => !!buyNowPrice.value && canBid.value && !isOwnListing.value)
const isBuyingNow = ref(false)

async function handleBuyNow() {
  if (!userStore.isAuthenticated) {
    uiStore.toastWarning(t('toasts.warning'), t('toasts.loginRequired'))
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (!auction.value) return
  isBuyingNow.value = true
  try {
    const res: any = await auctionService.buyNow(auctionId.value)
    const updated = res?.data || res?.auction
    if (updated) auction.value = updated
    uiStore.toastSuccess(t('toasts.success'), t('auctionDetail.buyNow') + ' — ' + t('paymentModal.successDescription'))
    router.push('/dashboard/payouts')
  } catch (err: any) {
    const msg = err?.response?.data?.error || err?.data?.error || err?.message || t('common.error')
    uiStore.toastWarning(t('toasts.warning'), msg)
  } finally {
    isBuyingNow.value = false
  }
}

const categoryName = computed(() => {
  const cat = auction.value?.category
  const slug = typeof cat === 'object' ? cat?.slug : cat
  if (slug === 'electronics') return t('categories.electronics')
  if (slug === 'vehicles') return t('categories.vehicles')
  if (slug === 'real-estate') return t('categories.realEstate')
  if (slug === 'jewelry') return t('categories.jewelry')
  if (slug === 'art') return t('categories.art')
  if (slug === 'machinery') return t('categories.machinery')
  return typeof cat === 'object' ? cat?.name : (cat || t('categories.electronics'))
})

function nextImage() {
  if (!auction.value?.images.length) return
  selectedImageIndex.value = (selectedImageIndex.value + 1) % auction.value.images.length
}

function prevImage() {
  if (!auction.value?.images.length) return
  selectedImageIndex.value = (selectedImageIndex.value - 1 + auction.value.images.length) % auction.value.images.length
}

function openBidModal() {
  if (!userStore.isAuthenticated) {
    uiStore.toastWarning(t('toasts.warning'), t('toasts.loginRequired'))
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (auction.value) {
    biddingStore.setCurrentAuction(auction.value.id)
  }
  bidAmount.value = minimumNextBid.value?.amount || ''
  bidError.value = null
  showBidModal.value = true
}

const quickIncrementOptions = computed(() => {
  if (!auction.value) return []
  const current = parseFloat(auction.value.currentPrice?.amount || '0')
  const inc = parseFloat(auction.value.bidIncrement?.amount || '500')
  const step = inc > 0 ? inc : 500
  return [
    { label: `+${step.toLocaleString('ru-RU')} с`, value: current + step },
    { label: `+${(step * 2).toLocaleString('ru-RU')} с`, value: current + step * 2 },
    { label: `+${(step * 5).toLocaleString('ru-RU')} с`, value: current + step * 5 },
    { label: `+${(step * 10).toLocaleString('ru-RU')} с`, value: current + step * 10 },
  ]
})

async function submitBid() {
  if (!bidAmount.value || isPlacingBid.value) return

  if (isOwnListing.value) {
    bidError.value = t('auction.ownListingNotice') || 'Сиз өзүңүздүн лотуңузга коюм коё албайсыз (Вы не можете делать ставки на собственный лот)'
    return
  }

  const amountNum = parseFloat(bidAmount.value)
  const minNum = minimumNextBid.value ? parseFloat(minimumNextBid.value.amount) : 0

  if (isNaN(amountNum) || amountNum < minNum) {
    bidError.value = `${t('auction.minimumBid')}: ${minimumNextBid.value?.formatted}`
    return
  }

  isPlacingBid.value = true
  bidError.value = null

  try {
    const ok = await biddingStore.placeBid({ amount: bidAmount.value })
    if (ok) {
      showBidModal.value = false
    } else {
      bidError.value = biddingStore.bidError || t('common.error')
    }
  } catch (err: any) {
    bidError.value = err?.message || t('common.error')
  } finally {
    isPlacingBid.value = false
  }
}

const shareUrl = computed(() => typeof window !== 'undefined' ? window.location.href : '')

function copyShareLink() {
  const url = shareUrl.value
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => uiStore.toastSuccess(t('toasts.success'), t('toasts.copiedToClipboard')))
      .catch(() => uiStore.toastSuccess(t('toasts.success'), t('toasts.copiedToClipboard')))
  } else {
    uiStore.toastSuccess(t('toasts.success'), t('toasts.copiedToClipboard'))
  }
}
</script>

<template>
  <div class="min-h-screen bg-background text-text-primary pt-28 sm:pt-32 pb-24 lg:pb-20 px-3 sm:px-6 lg:px-8 font-sans">

    <!-- Loading State -->
    <div v-if="isLoading" class="max-w-7xl mx-auto py-24 text-center">
      <Loader2 class="w-10 h-10 animate-spin text-primary mx-auto" />
      <p class="mt-4 text-sm font-semibold text-text-secondary">{{ t('auction.loading') }}</p>
    </div>

    <!-- Main Content -->
    <div v-else-if="auction" class="max-w-7xl mx-auto space-y-6">

      <!-- Breadcrumbs -->
      <nav class="flex items-center gap-2 text-xs font-medium text-text-muted py-1" aria-label="Breadcrumb">
        <RouterLink to="/" class="hover:text-primary transition-colors">{{ t('auction.breadcrumbHome') }}</RouterLink>
        <ChevronRight class="w-3.5 h-3.5" />
        <RouterLink to="/auctions" class="hover:text-primary transition-colors">{{ t('nav.auctions') }}</RouterLink>
        <ChevronRight class="w-3.5 h-3.5" />
        <span class="text-text-primary font-bold truncate max-w-[200px] sm:max-w-md">{{ auction.title }}</span>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">

        <!-- Left 2 Columns: Media Gallery & Lot Details -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Image Gallery Card -->
          <div class="glass rounded-3xl overflow-hidden shadow-sm">
            <div class="relative aspect-[16/10] sm:aspect-[16/9] bg-black/5 overflow-hidden">
              <img
                :src="auction.images[selectedImageIndex] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=80'"
                :alt="auction.title"
                class="w-full h-full object-cover transition-all duration-300"
              />

              <!-- Badges Over Image -->
              <div class="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <span class="px-3 py-1.5 rounded-full text-xs font-bold bg-black/70 backdrop-blur-md text-white border border-white/15 flex items-center gap-1.5 shadow-sm">
                  <span class="w-2 h-2 rounded-full bg-success animate-pulse" />
                  {{ categoryName }}
                </span>

                <span
class="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-black/70 backdrop-blur-md border border-primary-container/40 text-primary-container flex items-center gap-1.5 shadow-sm"
                  :class="{ '!border-red-400/60 !text-red-300 !bg-red-950/85': timeRemaining.isCritical && !timeRemaining.isEnded }">
                  <Clock class="w-3.5 h-3.5" />
                  {{ timeRemaining.text }}
                </span>
              </div>

              <!-- Navigation Arrows -->
              <div v-if="auction.images.length > 1" class="absolute inset-y-0 inset-x-3 flex items-center justify-between pointer-events-none">
                <button
                  class="pointer-events-auto p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all hover:scale-105 active:scale-95 shadow-md"
                  aria-label="Previous"
                  @click="prevImage"
                >
                  <ChevronLeft class="w-5 h-5" />
                </button>
                <button
                  class="pointer-events-auto p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all hover:scale-105 active:scale-95 shadow-md"
                  aria-label="Next"
                  @click="nextImage"
                >
                  <ChevronRight class="w-5 h-5" />
                </button>
              </div>
            </div>

            <!-- Thumbnails -->
            <div v-if="auction.images.length > 1" class="p-3 sm:p-4 border-t border-black/[0.06] flex items-center gap-2.5 overflow-x-auto">
              <button
                v-for="(img, idx) in auction.images"
                :key="idx"
                class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all"
                :class="selectedImageIndex === idx ? 'border-primary scale-95 ring-2 ring-primary/30' : 'border-transparent opacity-70 hover:opacity-100'"
                @click="selectedImageIndex = idx"
              >
                <img :src="img" class="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          <!-- Lot Title & Header Info -->
          <div class="glass p-6 sm:p-7 rounded-3xl shadow-sm space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    {{ t('auction.lotId') }} #{{ auction.id }}
                  </span>
                  <span class="text-xs font-medium text-text-muted flex items-center gap-1">
                    <MapPin class="w-3.5 h-3.5 text-error" /> {{ (typeof auction.city === 'object' ? auction.city?.name : auction.city) || t('cities.bishkek') }} {{ auction.district ? ', ' + auction.district : '' }}
                  </span>
                  <span class="text-xs font-medium text-text-muted flex items-center gap-1">
                    <Gauge class="w-3.5 h-3.5 text-secondary" /> {{ auction.bidCount || 0 }} {{ t('common.bids') }}
                  </span>
                </div>

                <h1 class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-text-primary leading-tight">
                  {{ auction.title }}
                </h1>
              </div>

              <!-- Action buttons -->
              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  class="p-2.5 rounded-xl border border-border bg-white/80 hover:bg-black/5 text-text-secondary transition-all shadow-sm flex items-center gap-1.5 text-xs font-semibold"
                  @click="uiStore.toastSuccess(t('auction.watchlist'), t('auction.watchlistAdded'))"
                >
                  <Heart class="w-4 h-4 text-error" />
                  <span>{{ t('auction.watchlist') }}</span>
                </button>

                <button
                  class="p-2.5 rounded-xl border border-border bg-white/80 hover:bg-black/5 text-text-secondary transition-all shadow-sm flex items-center gap-1.5 text-xs font-semibold"
                  @click="copyShareLink"
                >
                  <Share2 class="w-4 h-4 text-secondary" />
                  <span>{{ t('auction.share') }}</span>
                </button>
              </div>
            </div>

            <!-- Specific Category Attributes Box (Livestock / Vehicle / Real Estate) -->
            <div v-if="auction.livestock" class="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
              <div class="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles class="w-4 h-4 text-primary" />
                <span>{{ t('lotAttributes.livestockTitle') }}</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div class="p-2 rounded-xl bg-white">
                  <div class="text-[10px] text-text-muted">{{ t('lotAttributes.breed') }}</div>
                  <div class="font-bold text-text-primary">{{ auction.livestock.breed || 'Ала-Тоо' }}</div>
                </div>
                <div class="p-2 rounded-xl bg-white">
                  <div class="text-[10px] text-text-muted">{{ t('lotAttributes.weight') }}</div>
                  <div class="font-bold font-mono text-text-primary">{{ auction.livestock.weightKg }} {{ t('lotAttributes.weightKg') }}</div>
                </div>
                <div class="p-2 rounded-xl bg-white">
                  <div class="text-[10px] text-text-muted">{{ t('lotAttributes.milkOrAge') }}</div>
                  <div class="font-bold text-text-primary">{{ auction.livestock.milkYieldLiters ? auction.livestock.milkYieldLiters + ' ' + t('lotAttributes.litersPerDay') : auction.livestock.ageYears + ' ' + t('lotAttributes.yearsOld') }}</div>
                </div>
                <div class="p-2 rounded-xl bg-white">
                  <div class="text-[10px] text-text-muted">{{ t('lotAttributes.vetPassport') }}</div>
                  <div class="font-bold text-success">{{ t('lotAttributes.present') }}</div>
                </div>
              </div>
            </div>

            <div v-else-if="auction.vehicle" class="p-4 rounded-2xl bg-secondary/5 border border-secondary/20 space-y-2">
              <div class="text-xs font-bold text-secondary flex items-center gap-1.5">
                <Car class="w-4 h-4 text-secondary" />
                <span>{{ t('lotAttributes.vehicleTitle') }}</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div class="p-2 rounded-xl bg-white">
                  <div class="text-[10px] text-text-muted">{{ t('lotAttributes.yearEngine') }}</div>
                  <div class="font-bold text-text-primary">{{ auction.vehicle.year }} • {{ auction.vehicle.engineVolume }}L</div>
                </div>
                <div class="p-2 rounded-xl bg-white">
                  <div class="text-[10px] text-text-muted">{{ t('lotAttributes.mileage') }}</div>
                  <div class="font-bold font-mono text-text-primary">{{ auction.vehicle.mileageKm?.toLocaleString() }} {{ t('lotAttributes.kmUnit') }}</div>
                </div>
                <div class="p-2 rounded-xl bg-white">
                  <div class="text-[10px] text-text-muted">{{ t('lotAttributes.steeringFuel') }}</div>
                  <div class="font-bold text-text-primary">{{ auction.vehicle.steering === 'right' ? t('lotAttributes.rightSteering') : t('lotAttributes.leftSteering') }} • {{ auction.vehicle.fuelType }}</div>
                </div>
                <div class="p-2 rounded-xl bg-white">
                  <div class="text-[10px] text-text-muted">{{ t('lotAttributes.customsCleared') }}</div>
                  <div class="font-bold text-success">{{ auction.vehicle.isCustomsCleared ? t('lotAttributes.paidYes') : t('lotAttributes.paidNo') }}</div>
                </div>
              </div>
            </div>

            <div v-else-if="auction.realEstate" class="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
              <div class="text-xs font-bold text-primary flex items-center gap-1.5">
                <Building2 class="w-4 h-4 text-primary" />
                <span>{{ t('lotAttributes.realEstateTitle') }}</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div class="p-2 rounded-xl bg-white">
                  <div class="text-[10px] text-text-muted">{{ t('lotAttributes.area') }}</div>
                  <div class="font-bold font-mono text-text-primary">{{ auction.realEstate.areaSqm }} {{ t('lotAttributes.sqmUnit') }}</div>
                </div>
                <div class="p-2 rounded-xl bg-white">
                  <div class="text-[10px] text-text-muted">{{ t('lotAttributes.deed') }}</div>
                  <div class="font-bold text-success">{{ auction.realEstate.deedType === 'red_book' ? t('lotAttributes.redBook') : t('lotAttributes.techPassport') }}</div>
                </div>
                <div class="p-2 rounded-xl bg-white">
                  <div class="text-[10px] text-text-muted">{{ t('lotAttributes.monthlyRevenue') }}</div>
                  <div class="font-bold font-mono text-success">{{ auction.realEstate.monthlyRevenue?.toLocaleString() }} {{ t('lotAttributes.revenueCurrency') }}</div>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div class="pt-4 border-t border-black/[0.06] space-y-2">
              <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">{{ t('auction.description') }}</h3>
              <p class="text-sm text-text-secondary leading-relaxed whitespace-pre-line font-normal">
                {{ auction.description }}
              </p>
            </div>
          </div>

          <!-- Bidding Section & Price Box -->
          <div class="glass p-6 sm:p-7 rounded-3xl !border-primary/25 bg-gradient-to-br from-primary/[0.08] to-secondary/[0.05] shadow-sm space-y-6">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <!-- Left: Price info -->
              <div class="space-y-1.5">
                <span class="text-xs font-bold uppercase tracking-wider text-text-muted">{{ t('home.currentPrice') }}</span>
                <div class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary tracking-tight">
                  {{ currentPrice.formatted || `${Number(currentPrice.amount || 0).toLocaleString()} ${t('common.currency')}` }}
                </div>
                <div class="text-xs font-medium text-text-secondary flex items-center gap-2 pt-1">
                  <span>{{ t('auction.minimumBid') }}:</span>
                  <span class="font-bold text-primary font-mono">{{ minimumNextBid?.formatted }}</span>
                </div>
              </div>

              <!-- Right: Live Countdown -->
              <div class="bg-white/90 rounded-2xl p-3 sm:p-4 border border-border shadow-sm flex flex-col items-center">
                <span class="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                  {{ timeRemaining.isEnded ? t('auction.auctionEnded') : t('auction.timeRemaining') }}
                </span>

                <div class="flex items-center gap-1 sm:gap-2 font-mono">
                  <div class="flex flex-col items-center bg-black/[0.04] px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl min-w-[42px] sm:min-w-[52px]">
                    <span class="text-base sm:text-xl font-bold text-text-primary">{{ timeRemaining.days }}</span>
                    <span class="text-[8px] sm:text-[9px] font-bold text-text-muted uppercase">{{ t('common.days') }}</span>
                  </div>
                  <span class="text-text-muted font-bold">:</span>
                  <div class="flex flex-col items-center bg-black/[0.04] px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl min-w-[42px] sm:min-w-[52px]">
                    <span class="text-base sm:text-xl font-bold text-text-primary">{{ String(timeRemaining.hours).padStart(2, '0') }}</span>
                    <span class="text-[8px] sm:text-[9px] font-bold text-text-muted uppercase">{{ t('common.hours') }}</span>
                  </div>
                  <span class="text-text-muted font-bold">:</span>
                  <div class="flex flex-col items-center bg-black/[0.04] px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl min-w-[42px] sm:min-w-[52px]">
                    <span class="text-base sm:text-xl font-bold text-text-primary">{{ String(timeRemaining.minutes).padStart(2, '0') }}</span>
                    <span class="text-[8px] sm:text-[9px] font-bold text-text-muted uppercase">{{ t('common.minutes') }}</span>
                  </div>
                  <span class="text-text-muted font-bold">:</span>
                  <div class="flex flex-col items-center bg-black/[0.04] px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl min-w-[42px] sm:min-w-[52px]">
                    <span class="text-base sm:text-xl font-bold text-primary animate-pulse">{{ String(timeRemaining.seconds).padStart(2, '0') }}</span>
                    <span class="text-[8px] sm:text-[9px] font-bold text-text-muted uppercase">{{ t('common.seconds') }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bidding Action Bar -->
            <div class="pt-4 border-t border-black/[0.06] flex flex-col sm:flex-row items-center gap-3">
              <button
                v-if="isOwnListing"
                disabled
                class="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2 shadow-2xs"
              >
                <span>{{ t('auction.ownListingNotice') || 'Сиз бул лоттун сатуучусусуз (Собственный лот)' }}</span>
              </button>

              <button
                v-else-if="canBid"
                class="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-primary text-text-primary font-extrabold text-sm sm:text-base hover:bg-primary-hover shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                @click="openBidModal"
              >
                <Send class="w-4 h-4" />
                <span>{{ t('home.placeBid') }} ({{ minimumNextBid?.formatted }})</span>
              </button>

              <button
                v-else
                disabled
                class="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-black/10 text-text-muted font-bold text-sm cursor-not-allowed"
              >
                {{ t('auction.auctionEnded') }}
              </button>

              <button
                v-if="canBuyNow"
                :disabled="isBuyingNow"
                class="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-white font-bold text-xs sm:text-sm hover:from-amber-400 hover:to-amber-300 shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                @click="handleBuyNow"
              >
                <Zap v-if="!isBuyingNow" class="w-4 h-4" />
                <Loader2 v-else class="w-4 h-4 animate-spin" />
                <span>{{ isBuyingNow ? t('auction.submitting') : `${t('auctionDetail.buyNow')} — ${buyNowPrice?.formatted || ''}` }}</span>
              </button>

              <button
                class="w-full sm:w-auto py-3.5 px-5 rounded-2xl border border-success/40 bg-success/10 text-success font-bold text-xs sm:text-sm hover:bg-success/20 transition-all flex items-center justify-center gap-1.5"
                @click="showPaymentModal = true"
              >
                <CreditCard class="w-4 h-4" />
                <span>{{ t('auction.mbankQR') }}</span>
              </button>
            </div>

          </div>

          <!-- Bid History Feed (Kafka Live) -->
          <div class="glass p-6 sm:p-7 rounded-3xl shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Flame class="w-4 h-4 text-orange-500" />
                <h3 class="text-base font-bold text-text-primary">{{ t('auction.bidHistory') }}</h3>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                {{ t('auction.realtimeLive') }}
              </span>
            </div>

            <div class="divide-y divide-black/5">
              <div
                v-for="bid in biddingStore.bidHistory"
                :key="bid.id"
                class="py-3 flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-text-primary">
                    {{ (bid.bidderName || bid.bidder?.fullName || '?').charAt(0) }}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-text-primary">{{ bid.bidderName || bid.bidder?.fullName || t('auction.bidder') }}</span>
                      <span v-if="bid.bidderId === userStore.user?.id" class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary text-text-primary">{{ t('auction.you') }}</span>
                    </div>
                    <span class="text-[11px] text-text-muted">{{ date.formatRelative(bid.placedAt) }}</span>
                  </div>
                </div>

                <div class="text-right">
                  <span class="text-sm font-bold text-primary font-mono">{{ bid.amount?.formatted }}</span>
                </div>
              </div>

              <p v-if="biddingStore.bidHistory.length === 0" class="text-xs text-text-muted text-center py-6">
                {{ t('auction.noBidsYet') }}
              </p>
            </div>
          </div>

        </div>

        <!-- Right 1 Column: Lot Stats & Kyrgyz Banking Support -->
        <div class="space-y-6">

          <!-- Quick Action Buttons -->
          <div class="glass p-5 sm:p-6 rounded-3xl shadow-sm space-y-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-text-muted">{{ t('auction.quickActions') }}</h3>

            <div class="space-y-2">
              <button
                class="w-full py-2.5 px-3.5 rounded-xl border border-border bg-white/90 hover:bg-black/5 text-text-primary font-semibold text-xs transition-all flex items-center gap-2 shadow-sm"
                @click="uiStore.toastInfo(t('contactPage.title'), t('auction.writeToSeller'))"
              >
                <MessageSquare class="w-4 h-4 text-primary" />
                <span>{{ t('auction.writeToSeller') }}</span>
              </button>

              <button
                class="w-full py-2.5 px-3.5 rounded-xl border border-border bg-white/90 hover:bg-black/5 text-text-primary font-semibold text-xs transition-all flex items-center gap-2 shadow-sm"
                @click="copyShareLink"
              >
                <Share2 class="w-4 h-4 text-secondary" />
                <span>{{ t('auction.share') }}</span>
              </button>

              <button
                class="w-full py-2.5 px-3.5 rounded-xl border border-border bg-white/90 hover:bg-black/5 text-text-primary font-semibold text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                @click="showDisputeModal = true"
              >
                <AlertCircle class="w-4 h-4 text-error" />
                <span>{{ isOwnListing ? (t('dashboard.reportDispute') || 'Şikayet / İtiraz Bildir') : t('auction.reportAuction') }}</span>
              </button>
            </div>

          </div>

          <!-- Auction Details Info Table -->
          <div class="glass p-5 sm:p-6 rounded-3xl shadow-sm space-y-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-text-muted">{{ t('auction.lotDetails') }}</h3>

            <dl class="divide-y divide-black/5 text-xs">
              <div class="py-2.5 flex items-center justify-between">
                <dt class="text-text-muted font-medium">{{ t('common.status') }}</dt>
                <dd class="font-bold text-success">{{ t('status.auction.active') }}</dd>
              </div>

              <div class="py-2.5 flex items-center justify-between">
                <dt class="text-text-muted font-medium">{{ t('filters.category') }}</dt>
                <dd class="font-bold text-text-primary">{{ categoryName }}</dd>
              </div>

              <div class="py-2.5 flex items-center justify-between">
                <dt class="text-text-muted font-medium">{{ t('sell.city') }}</dt>
                <dd class="font-bold text-text-primary">{{ (typeof auction.city === 'object' ? auction.city?.name : auction.city) || t('cities.bishkek') }}</dd>
              </div>

              <div class="py-2.5 flex items-center justify-between">
                <dt class="text-text-muted font-medium">{{ t('auction.startsAt') }}</dt>
                <dd class="font-bold text-text-primary">{{ date.formatDateTime(auction.startAt || auction.createdAt) }}</dd>
              </div>

              <div class="py-2.5 flex items-center justify-between">
                <dt class="text-text-muted font-medium">{{ t('auction.endsAt') }}</dt>
                <dd class="font-bold text-text-primary">{{ date.formatDateTime(auction.endsAt) }}</dd>
              </div>

              <div class="py-2.5 flex items-center justify-between">
                <dt class="text-text-muted font-medium">{{ t('auction.bidIncrement') }}</dt>
                <dd class="font-bold text-primary font-mono">{{ currency.formatMoney(auction.bidIncrement) }}</dd>
              </div>

              <div class="py-2.5 flex items-center justify-between">
                <dt class="text-text-muted font-medium">{{ t('auction.viewsCount') }}</dt>
                <dd class="font-bold text-text-primary">{{ (auction.views || 1420).toLocaleString() }}</dd>
              </div>
            </dl>
          </div>

          <!-- Kyrgyz Banking Methods Supported -->
          <div class="glass p-5 sm:p-6 rounded-3xl !border-primary/25 shadow-sm space-y-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-text-muted">{{ t('auction.paymentMethods') }}</h3>

            <div class="space-y-2.5">
              <div class="p-3 rounded-2xl border border-black/[0.06] bg-black/[0.02] flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center font-bold text-xs text-primary">
                  MB
                </div>
                <div>
                  <h4 class="text-xs font-bold text-text-primary">MBank</h4>
                  <p class="text-[10px] text-text-muted">{{ t('auction.mbankDesc') }}</p>
                </div>
              </div>

              <div class="p-3 rounded-2xl border border-black/[0.06] bg-black/[0.02] flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center font-bold text-xs text-secondary">
                  OB
                </div>
                <div>
                  <h4 class="text-xs font-bold text-text-primary">Optima Bank</h4>
                  <p class="text-[10px] text-text-muted">{{ t('auction.optimaDesc') }}</p>
                </div>
              </div>

              <div class="p-3 rounded-2xl border border-black/[0.06] bg-black/[0.02] flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-success/15 border border-success/30 flex items-center justify-center font-bold text-xs text-success">
                  DB
                </div>
                <div>
                  <h4 class="text-xs font-bold text-text-primary">DemirBank</h4>
                  <p class="text-[10px] text-text-muted">{{ t('auction.demirDesc') }}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>

    <!-- Not Found State -->
    <div v-else class="max-w-2xl mx-auto py-24 text-center space-y-4">
      <AlertCircle class="w-10 h-10 text-text-muted mx-auto" />
      <p class="text-sm font-semibold text-text-secondary">{{ t('auction.notFoundTitle') }}</p>
      <RouterLink to="/auctions" class="inline-block text-sm font-bold text-primary hover:underline">{{ t('nav.auctions') }}</RouterLink>
    </div>

    <!-- Sticky Mobile Bid Bar — the desktop price/CTA block is already
         reachable without scrolling far, but on a phone it can sit well
         below the fold, so the action stays pinned within thumb reach. -->
    <div
      v-if="auction && !isLoading"
      class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] flex items-center gap-3 transition-colors"
      :class="timeRemaining.isCritical && !timeRemaining.isEnded ? 'border-error/40 shadow-[0_-2px_16px_rgba(192,57,43,0.15)]' : 'border-border shadow-[0_-2px_12px_rgba(0,0,0,0.06)]'"
    >
      <div class="min-w-0 flex-1">
        <div class="text-[10px] font-bold uppercase tracking-wide text-text-muted">{{ t('home.currentPrice') }}</div>
        <div
          class="text-lg font-extrabold text-primary truncate"
          :class="{ 'animate-pulse text-error': timeRemaining.isCritical && !timeRemaining.isEnded }"
        >
          {{ currentPrice.formatted }}
        </div>
      </div>
      <button
        v-if="isOwnListing"
        disabled
        class="flex-shrink-0 py-3 px-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs cursor-not-allowed"
      >
        <span>{{ t('auction.ownListingNotice') }}</span>
      </button>
      <button
        v-else-if="canBid"
        class="flex-shrink-0 py-3 px-5 rounded-2xl bg-primary text-text-primary font-extrabold text-sm shadow-md active:scale-95 transition-transform flex items-center gap-1.5"
        :class="{ 'scale-105': timeRemaining.isCritical && !timeRemaining.isEnded }"
        @click="openBidModal"
      >
        <Send class="w-4 h-4" />
        <span>{{ t('home.placeBid') }}</span>
      </button>
      <span v-else class="flex-shrink-0 py-3 px-5 rounded-2xl bg-black/10 text-text-muted font-bold text-sm">
        {{ t('auction.auctionEnded') }}
      </span>
    </div>

    <!-- Bid Submission Modal -->
    <Modal
      v-model="showBidModal"
      :title="t('auction.placeBid')"
      :description="`${t('auction.minimumBid')}: ${minimumNextBid?.formatted || ''}`"
      @cancel="showBidModal = false"
    >
      <div class="space-y-4 pt-2">
        <div v-if="isOwnListing" class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
          {{ t('auction.ownListingNotice') }}
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1.5">{{ t('auction.bidAmount') }}</label>
          <Input
            v-model="bidAmount"
            type="number"
            :placeholder="minimumNextBid?.amount"
            :min="minimumNextBid?.amount"
            :error="bidError"
            @keydown.enter="submitBid"
          />
          <p v-if="minimumNextBid" class="text-xs text-text-muted mt-1">
            {{ t('auction.minimumBid') }}: <span class="font-bold text-primary">{{ minimumNextBid.formatted }}</span>
          </p>
        </div>

        <!-- Quick Increment Pill Buttons -->
        <div v-if="quickIncrementOptions.length > 0" class="space-y-1.5">
          <label class="block text-[11px] font-bold text-text-muted uppercase tracking-wider">{{ t('bidSheet.quickOptions') || 'Быстрые варианты:' }}</label>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="inc in quickIncrementOptions"
              :key="inc.label"
              type="button"
              class="py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center"
              :class="parseFloat(bidAmount) === inc.value
                ? 'bg-primary border-primary text-text-primary shadow-xs'
                : 'bg-white border-black/10 text-gray-800 hover:bg-slate-50'"
              @click="bidAmount = String(inc.value)"
            >
              {{ inc.label }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input id="bid-terms" v-model="bidConfirmed" type="checkbox" class="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
          <label for="bid-terms" class="text-xs text-text-secondary">
            <RouterLink to="/terms" class="text-primary hover:underline">{{ t('auction.agreeTermsEscrow') }}</RouterLink>
          </label>
        </div>

        <div v-if="bidError" class="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs">
          {{ bidError }}
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            class="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-black/5 transition-colors"
            @click="showBidModal = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            :disabled="isPlacingBid || !bidConfirmed || isOwnListing"
            class="px-5 py-2 rounded-xl bg-primary text-text-primary font-bold text-xs hover:bg-primary-hover shadow-md transition-all disabled:opacity-50"
            @click="submitBid"
          >
            <span v-if="isPlacingBid">{{ t('auction.submitting') }}</span>
            <span v-else>{{ t('auction.confirmBid') }}</span>
          </button>
        </div>
      </template>
    </Modal>

    <!-- Payment Modal -->
    <PaymentModal
      v-model="showPaymentModal"
      :amount="Number(currentPrice.amount || 185000)"
      :auction-title="auction?.title || t('paymentModal.title')"
      @payment-success="() => { showPaymentModal = false; uiStore.toastSuccess(t('toasts.paymentCompleted'), t('paymentModal.successDescription')); }"
    />

    <!-- Dispute / Report Modal -->
    <DisputeModal
      v-model="showDisputeModal"
      :auction="auction"
      :is-seller="isOwnListing"
    />

  </div>
</template>

