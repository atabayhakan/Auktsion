<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ChevronLeft, ChevronRight, Heart, Share, 
  User, Star, Truck, Shield, RotateCcw, Clock,
  Zap, Tag, MapPin, Eye, MessageSquare, 
  Minus, Plus, AlertCircle, CheckCircle
} from 'lucide-vue-next'
import LiquidButton from '@/components/ui/LiquidButton.vue'
import LiquidInput from '@/components/ui/LiquidInput.vue'
import { useI18n } from '@/composables/useI18n'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const auctionId = route.params.id
const currentImageIndex = ref(0)
const bidAmount = ref('')
const isBidding = ref(false)
const showBidModal = ref(false)
const quantity = ref(1)

const auction = ref({
  id: auctionId,
  title: 'iPhone 15 Pro Max 256GB Natural Titanium',
  description: 'Apple iPhone 15 Pro Max 256GB Natural Titanium model. Kutusunda, tüm aksesuarları eksiksiz, AppleCare+ garanti 2025 Aralık\'a kadar devam ediyor. Cihaz hiç kullanılmamış, sıfır durumdadır. Faturalı, resmi distribütör garanti.',
  images: [
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop',
  ],
  currentPrice: 125000,
  startingPrice: 85000,
  bidCount: 47,
  timeLeft: '2 saat 14 dakika',
  category: 'Elektronik > Telefonlar > Akıllı Telefonlar',
  condition: 'Sıfır',
  location: 'İstanbul, Kadıköy',
  isHot: true,
  isLive: true,
  seller: {
    id: '1',
    name: 'TechStore TR',
    avatar: null,
    rating: 4.9,
    totalSales: 1247,
    joinDate: '2022-03-15',
    isVerified: true,
    responseTime: '15 dakika',
    responseRate: '98%',
  },
  specs: [
    { label: 'Marka', value: 'Apple' },
    { label: 'Model', value: 'iPhone 15 Pro Max' },
    { label: 'Depolama', value: '256 GB' },
    { label: 'Renk', value: 'Natural Titanium' },
    { label: 'İşletim Sistemi', value: 'iOS 17' },
    { label: 'Ekran Boyutu', value: '6.7 inç' },
    { label: 'Çip', value: 'A17 Pro' },
    { label: 'Kamera', value: '48 MP Ana + 12 MP Ultra Geniş + 12 MP Telefoto' },
    { label: 'Batarya', value: '4422 mAh' },
    { label: 'Garanti', value: 'AppleCare+ (Aralık 2025)' },
    { label: 'Kutu Durumu', value: 'Kutulu, Tüm Aksesuarlar Dahil' },
    { label: 'Fatura', value: 'Evet, Resmi Distribütör' },
  ],
  bidHistory: [
    { bidder: 'TechEnthu***', amount: 125000, time: '2 dk önce', isWinning: true },
    { bidder: 'MobileFan***', amount: 124500, time: '5 dk önce', isWinning: false },
    { bidder: 'AppleUser***', amount: 124000, time: '12 dk önce', isWinning: false },
    { bidder: 'GadgetLo***', amount: 123500, time: '25 dk önce', isWinning: false },
    { bidder: 'PhonePro***', amount: 123000, time: '45 dk önce', isWinning: false },
  ],
  shipping: {
    free: true,
    estimatedDays: '1-2 İş Günü',
    options: [
      { name: 'Standart Kargo', price: 0, days: '1-2 İş Günü' },
      { name: 'Hızlı Kargo', price: 49, days: '24 Saat' },
      { name: 'Aynı Gün Teslimat (İstanbul)', price: 99, days: 'Bugün' },
    ],
  },
  returns: {
    days: 14,
    condition: 'Orijinal pakette, kullanılmamış',
    freeReturn: true,
  },
})

const minBid = computed(() => auction.value.currentPrice + 100)
const recommendedBid = computed(() => auction.value.currentPrice + 500)

function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(price)
}

function nextImage() {
  currentImageIndex.value = (currentImageIndex.value + 1) % auction.value.images.length
}

function prevImage() {
  currentImageIndex.value = (currentImageIndex.value - 1 + auction.value.images.length) % auction.value.images.length
}

function incrementQuantity() {
  quantity.value++
}

function decrementQuantity() {
  if (quantity.value > 1) quantity.value--
}

function placeBid() {
  const amount = parseInt(bidAmount.value.replace(/[^\d]/g, ''))
  if (amount >= minBid.value) {
    isBidding.value = true
    setTimeout(() => {
      isBidding.value = false
      showBidModal.value = false
      bidAmount.value = ''
      // Update auction data
      auction.value.currentPrice = amount
      auction.value.bidCount++
      auction.value.bidHistory.unshift({
        bidder: 'Siz',
        amount,
        time: 'Az önce',
        isWinning: true,
      })
    }, 1500)
  }
}

function buyNow() {
  router.push({ name: 'PaymentFlow', query: { auctionId: auction.value.id, type: 'buy-now' } })
}
</script>

<template>
  <div class="min-h-screen bg-[rgb(var(--color-background))]">
    <!-- Breadcrumb -->
    <nav class="bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))/0.3] py-4" aria-label="Breadcrumb">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ol class="flex items-center gap-2 text-sm text-[rgb(var(--color-text-muted))]" role="list">
          <li>
            <router-link to="/" class="hover:text-[rgb(var(--color-primary))] transition-colors flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Ana Sayfa
            </router-link>
          </li>
          <li class="flex items-center gap-2">
            <ChevronRight class="w-4 h-4" />
            <router-link to="/canli-acik-artirmalar" class="hover:text-[rgb(var(--color-primary))] transition-colors">
              {{ t('auctionDetail.liveAuctions') }}
            </router-link>
          </li>
          <li class="flex items-center gap-2">
            <ChevronRight class="w-4 h-4" />
            <span class="text-[rgb(var(--color-text-primary))] truncate max-w-[200px]" aria-current="page">
              {{ auction.title }}
            </span>
          </li>
        </ol>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Images & Details -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Image Gallery -->
          <div class="card-liquid-glow overflow-hidden">
            <div class="relative aspect-[4/3] bg-[rgb(var(--color-accent))]">
              <!-- Main Image -->
              <img
                :src="auction.images[currentImageIndex]"
                :alt="`${auction.title} - Görsel ${currentImageIndex + 1}`"
                class="w-full h-full object-cover transition-opacity duration-300"
              />

              <!-- Navigation Arrows -->
              <button
                @click="prevImage"
                class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass flex items-center justify-center text-[rgb(var(--color-text-primary))] hover:shadow-liquid-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Önceki görsel"
              >
                <ChevronLeft class="w-6 h-6" />
              </button>
              <button
                @click="nextImage"
                class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass flex items-center justify-center text-[rgb(var(--color-text-primary))] hover:shadow-liquid-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Sonraki görsel"
              >
                <ChevronRight class="w-6 h-6" />
              </button>

              <!-- Badges -->
              <div class="absolute top-4 left-4 flex flex-col gap-2">
                <span v-if="auction.isHot" class="badge-warning animate-bounce-in">
                  <Zap class="w-3 h-3 mr-1" /> {{ t('auctionDetail.hot') }}
                </span>
                <span v-if="auction.isLive" class="badge-error animate-pulse-glow">
                  <span class="w-2 h-2 rounded-full bg-current mr-1 animate-pulse" /> {{ t('auctionDetail.live') }}
                </span>
              </div>

              <!-- Favorite Button -->
              <button class="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center hover:shadow-liquid transition-all" aria-label="Favorilere ekle">
                <Heart class="w-5 h-5 text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-error))] hover:fill-current transition-colors" />
              </button>
            </div>

            <!-- Thumbnails -->
            <div class="flex gap-3 p-4 overflow-x-auto">
              <button
                v-for="(img, index) in auction.images"
                :key="index"
                @click="currentImageIndex = index"
                :class="[
                  'relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all',
                  'border-2',
                  currentImageIndex === index ? 'border-[rgb(var(--color-primary))] scale-105' : 'border-transparent hover:border-[rgb(var(--color-border))]'
                ]"
                :aria-label="`Görsel ${index + 1}`"
                :aria-current="currentImageIndex === index"
              >
                <img :src="img" :alt="`${auction.title} - Küçük görsel ${index + 1}`" class="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          <!-- Title & Meta -->
          <div class="card-liquid">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="badge-primary">
                    <Tag class="w-3 h-3 mr-1" /> {{ auction.category.split(' > ').pop() }}
                  </span>
                  <span class="badge-secondary">
                    <Clock class="w-3 h-3 mr-1" /> {{ auction.condition }}
                  </span>
                  <span v-if="auction.shipping.free" class="badge-success">
                    <Truck class="w-3 h-3 mr-1" /> {{ t('auctionDetail.freeShipping') }}
                  </span>
                </div>
                <h1 class="text-2xl lg:text-3xl font-extrabold text-[rgb(var(--color-text-primary))] mb-3">{{ auction.title }}</h1>
                <div class="flex flex-wrap items-center gap-4 text-sm text-[rgb(var(--color-text-muted))]">
                  <span class="flex items-center gap-1">
                    <MapPin class="w-4 h-4" /> {{ auction.location }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Eye class="w-4 h-4" /> {{ auction.bidCount.toLocaleString() }} {{ t('auctionDetail.views') }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Zap class="w-4 h-4 text-[rgb(var(--color-primary))]" /> {{ auction.bidCount }} {{ t('auctionDetail.bids') }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <LiquidButton variant="glass" size="sm" icon="Share" class="hidden sm:flex">
                  {{ t('auctionDetail.share') }}
                </LiquidButton>
                <button class="w-10 h-10 rounded-xl glass flex items-center justify-center hover:shadow-liquid transition-all sm:hidden" aria-label="Paylaş">
                  <Share class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Price & Bid Section -->
          <div class="card-liquid-glow">
            <div class="space-y-6">
              <!-- Current Price -->
              <div class="pt-2 border-t border-[rgb(var(--color-border))/0.5]">
                <div class="flex items-baseline justify-between gap-4 flex-wrap">
                  <div>
                    <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ t('auctionDetail.currentPrice') }}</p>
                    <p class="text-4xl lg:text-5xl font-extrabold text-[rgb(var(--color-text-primary))]">{{ formatPrice(auction.currentPrice) }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-[rgb(var(--color-text-muted))] line-through">{{ formatPrice(auction.startingPrice) }}</p>
                    <p class="text-xl font-bold text-[rgb(var(--color-primary))]">+{{ formatPrice(auction.currentPrice - auction.startingPrice) }}</p>
                  </div>
                </div>
              </div>

              <!-- Timer -->
              <div class="flex items-center gap-4 p-4 glass rounded-xl">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[rgb(var(--color-error))] to-red-600 flex items-center justify-center flex-shrink-0">
                  <Clock class="w-6 h-6 text-white" />
                </div>
                <div>
                  <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ t('auctionDetail.timeLeft') }}</p>
                  <p class="text-2xl font-extrabold text-[rgb(var(--color-error))] font-mono">{{ auction.timeLeft }}</p>
                </div>
                <div class="ml-auto flex items-center gap-2">
                  <span class="px-3 py-1.5 rounded-full text-xs font-bold bg-[rgb(var(--color-error))/0.15] text-[rgb(var(--color-error))] animate-pulse-glow">
                    {{ t('auctionDetail.live') }}
                  </span>
                </div>
              </div>

              <!-- Bid Form -->
              <div class="space-y-4">
                <LiquidInput
                  v-model="bidAmount"
                  type="number"
                  :label="t('auctionDetail.yourBid')"
                  :placeholder="formatPrice(minBid)"
                  :hint="t('auctionDetail.minBidHint', { min: formatPrice(minBid) })"
                  class="text-xl"
                />
                
                <div class="grid grid-cols-2 gap-3">
                  <LiquidButton
                    variant="outline"
                    size="lg"
                    class="h-14"
                    @click="bidAmount = String(recommendedBid)"
                    :disabled="isBidding"
                  >
                    {{ t('auctionDetail.recommendedBid', { amount: formatPrice(recommendedBid) }) }}
                  </LiquidButton>
                  <LiquidButton
                    variant="primary"
                    size="lg"
                    class="h-14"
                    :loading="isBidding"
                    @click="placeBid"
                    :disabled="isBidding || parseInt(bidAmount.value.replace(/[^\d]/g, '') || '0') < minBid"
                  >
                    {{ t('auctionDetail.placeBid') }}
                  </LiquidButton>
                </div>

                <!-- Quick Bid Buttons -->
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="increment in [100, 500, 1000, 5000]"
                    :key="increment"
                    @click="bidAmount = String(auction.currentPrice + increment)"
                    class="px-3 py-2 rounded-lg glass text-sm font-medium text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] hover:shadow-liquid transition-all"
                  >
                    +{{ formatPrice(increment) }}
                  </button>
                </div>
              </div>

              <!-- Buy Now -->
              <div class="pt-4 border-t border-[rgb(var(--color-border))/0.5]">
                <LiquidButton
                  variant="secondary"
                  size="xl"
                  class="w-full"
                  icon="Truck"
                  @click="buyNow"
                >
                  {{ t('auctionDetail.buyNow', { price: formatPrice(auction.currentPrice) }) }}
                </LiquidButton>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="card-liquid">
            <div class="border-b border-[rgb(var(--color-border))/0.3]">
              <nav class="flex flex-wrap gap-1 p-1" role="tablist" aria-label="İlan detay sekmeleri">
                <button
                  v-for="tab in [
                    { id: 'description', label: 'Açıklama', icon: FileText },
                    { id: 'specs', label: 'Özellikler', icon: Tag },
                    { id: 'bids', label: 'Teklif Geçmişi', icon: Zap },
                    { id: 'shipping', label: 'Kargo & İade', icon: Truck },
                    { id: 'seller', label: 'Satıcı', icon: User },
                  ]"
                  :key="tab.id"
                  @click="activeTab = tab.id"
                  :class="[
                    'px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-[rgb(var(--color-primary))] text-white shadow-lg'
                      : 'text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-accent))]'
                  ]"
                  :aria-selected="activeTab === tab.id"
                  role="tab"
                >
                  <component :is="tab.icon" class="w-4 h-4 inline-block mr-2" />
                  {{ t(`auctionDetail.tabs.${tab.id}`) }}
                </button>
              </nav>
            </div>

            <!-- Tab Panels -->
            <div class="p-6">
              <!-- Description -->
              <div v-if="activeTab === 'description'" class="animate-fade-in prose prose-slate dark:prose-invert max-w-none">
                <p class="text-[rgb(var(--color-text-secondary))] whitespace-pre-line">{{ auction.description }}</p>
              </div>

              <!-- Specs -->
              <div v-else-if="activeTab === 'specs'" class="animate-fade-in">
                <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-for="spec in auction.specs" :key="spec.label" class="flex flex-col md:flex-row md:items-center gap-2 p-4 glass rounded-xl">
                    <dt class="text-sm font-medium text-[rgb(var(--color-text-secondary))] md:w-40">{{ spec.label }}</dt>
                    <dd class="text-[rgb(var(--color-text-primary))] font-medium flex-1">{{ spec.value }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Bid History -->
              <div v-else-if="activeTab === 'bids'" class="animate-fade-in">
                <div class="space-y-3">
                  <div v-for="(bid, index) in auction.bidHistory" :key="index" class="flex items-center justify-between p-4 glass rounded-xl"
                       :class="bid.isWinning ? 'bg-[rgb(var(--color-primary))/0.05] border border-[rgb(var(--color-primary))/0.3]' : ''">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] flex items-center justify-center font-bold text-white text-sm">
                        {{ bid.bidder.charAt(0) }}
                      </div>
                      <div>
                        <p class="font-medium text-[rgb(var(--color-text-primary))]">{{ bid.bidder }}</p>
                        <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ bid.time }}</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-xl font-bold text-[rgb(var(--color-text-primary))]">{{ formatPrice(bid.amount) }}</p>
                      <span v-if="bid.isWinning" class="badge-success mt-1">
                        <CheckCircle class="w-3 h-3 mr-1" /> {{ t('auctionDetail.winning') }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Shipping & Returns -->
              <div v-else-if="activeTab === 'shipping'" class="animate-fade-in">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="card-liquid">
                    <h3 class="font-semibold text-[rgb(var(--color-text-primary))] mb-4 flex items-center gap-2">
                      <Truck class="w-5 h-5" />
                      {{ t('auctionDetail.shippingOptions') }}
                    </h3>
                    <div class="space-y-3">
                      <label v-for="option in auction.shipping.options" :key="option.name" class="flex items-center justify-between p-4 glass rounded-xl cursor-pointer hover:shadow-liquid transition-all">
                        <div>
                          <p class="font-medium text-[rgb(var(--color-text-primary))]">{{ option.name }}</p>
                          <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ option.days }}</p>
                        </div>
                        <div class="text-right">
                          <p class="font-bold text-[rgb(var(--color-text-primary))]">{{ option.price === 0 ? t('auctionDetail.free') : formatPrice(option.price) }}</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div class="card-liquid">
                    <h3 class="font-semibold text-[rgb(var(--color-text-primary))] mb-4 flex items-center gap-2">
                      <RotateCcw class="w-5 h-5" />
                      {{ t('auctionDetail.returns') }}
                    </h3>
                    <div class="space-y-3">
                      <div class="flex items-center gap-3 p-4 glass rounded-xl">
                        <div class="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                          <CheckCircle class="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p class="font-medium text-[rgb(var(--color-text-primary))]">{{ auction.returns.days }} {{ t('auctionDetail.daysReturn') }}</p>
                          <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ auction.returns.condition }}</p>
                        </div>
                      </div>
                      <div v-if="auction.returns.freeReturn" class="flex items-center gap-3 p-4 glass rounded-xl">
                        <div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          <Truck class="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p class="font-medium text-[rgb(var(--color-text-primary))]">{{ t('auctionDetail.freeReturn') }}</p>
                          <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ t('auctionDetail.freeReturnDesc') }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Seller Info -->
              <div v-else-if="activeTab === 'seller'" class="animate-fade-in">
                <div class="card-liquid">
                  <div class="flex items-center gap-4 mb-6">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] flex items-center justify-center font-bold text-2xl text-white">
                      {{ auction.seller.name.charAt(0) }}
                    </div>
                    <div>
                      <h3 class="text-xl font-bold text-[rgb(var(--color-text-primary))]">{{ auction.seller.name }}</h3>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="flex items-center gap-1 text-sm text-[rgb(var(--color-text-secondary))]">
                          <Star class="w-4 h-4 text-[rgb(var(--color-primary))] fill-current" />
                          {{ auction.seller.rating }} ({{ auction.seller.totalSales }} {{ t('auctionDetail.sales') }})
                        </span>
                        <span v-if="auction.seller.isVerified" class="badge-success">
                          <Shield class="w-3 h-3 mr-1" /> {{ t('auctionDetail.verifiedSeller') }}
                        </span>
                      </div>
                      <p class="text-sm text-[rgb(var(--color-text-muted))] mt-1">{{ t('auctionDetail.memberSince', { date: new Date(auction.seller.joinDate).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) }) }}</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="text-center p-4 glass rounded-xl">
                      <p class="text-2xl font-extrabold text-[rgb(var(--color-primary))]">{{ auction.seller.responseRate }}</p>
                      <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ t('auctionDetail.responseRate') }}</p>
                    </div>
                    <div class="text-center p-4 glass rounded-xl">
                      <p class="text-2xl font-extrabold text-[rgb(var(--color-secondary))]">{{ auction.seller.responseTime }}</p>
                      <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ t('auctionDetail.responseTime') }}</p>
                    </div>
                    <div class="text-center p-4 glass rounded-xl">
                      <p class="text-2xl font-extrabold text-[rgb(var(--color-text-primary))]">{{ auction.seller.totalSales }}+</p>
                      <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ t('auctionDetail.totalSales') }}</p>
                    </div>
                  </div>

                  <LiquidButton variant="primary" icon="MessageSquare" class="w-full">
                    {{ t('auctionDetail.contactSeller') }}
                  </LiquidButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Sticky Sidebar -->
        <div class="lg:col-span-1">
          <div class="sticky top-28 space-y-6">
            <!-- Seller Card -->
            <div class="card-liquid-glow">
              <h3 class="font-semibold text-[rgb(var(--color-text-primary))] mb-4">{{ t('auctionDetail.sellerInfo') }}</h3>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] flex items-center justify-center font-bold text-white">
                  {{ auction.seller.name.charAt(0) }}
                </div>
                <div>
                  <p class="font-medium text-[rgb(var(--color-text-primary))]">{{ auction.seller.name }}</p>
                  <div class="flex items-center gap-1 mt-1">
                    <Star class="w-3 h-3 text-[rgb(var(--color-primary))] fill-current" />
                    <span class="text-sm text-[rgb(var(--color-text-secondary))]">{{ auction.seller.rating }}</span>
                    <span class="text-sm text-[rgb(var(--color-text-muted))]">({{ auction.seller.totalSales }})</span>
                  </div>
                </div>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-[rgb(var(--color-text-muted))]">{{ t('auctionDetail.responseTime') }}</span>
                  <span class="font-medium text-[rgb(var(--color-text-primary))]">{{ auction.seller.responseTime }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[rgb(var(--color-text-muted))]">{{ t('auctionDetail.responseRate') }}</span>
                  <span class="font-medium text-[rgb(var(--color-text-primary))]">{{ auction.seller.responseRate }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[rgb(var(--color-text-muted))]">{{ t('auctionDetail.totalSales') }}</span>
                  <span class="font-medium text-[rgb(var(--color-text-primary))]">{{ auction.seller.totalSales }}+</span>
                </div>
              </div>
              <LiquidButton variant="outline" class="w-full mt-4" icon="MessageSquare" size="sm">
                {{ t('auctionDetail.message') }}
              </LiquidButton>
            </div>

            <!-- Trust Badges -->
            <div class="card-liquid">
              <h3 class="font-semibold text-[rgb(var(--color-text-primary))] mb-4">{{ t('auctionDetail.protections') }}</h3>
              <div class="space-y-3">
                <div v-for="badge in [
                  { icon: Shield, title: 'auctionDetail.buyerProtection', desc: 'auctionDetail.buyerProtectionDesc' },
                  { icon: Truck, title: 'auctionDetail.fastShipping', desc: 'auctionDetail.fastShippingDesc' },
                  { icon: RotateCcw, title: 'auctionDetail.easyReturns', desc: 'auctionDetail.easyReturnsDesc' },
                  { icon: CheckCircle, title: 'auctionDetail.authenticity', desc: 'auctionDetail.authenticityDesc' },
                ]" :key="badge.title" class="flex items-start gap-3 p-3 glass rounded-xl">
                  <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] flex items-center justify-center flex-shrink-0">
                    <component :is="badge.icon" class="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p class="font-medium text-[rgb(var(--color-text-primary))] text-sm">{{ t(badge.title) }}</p>
                    <p class="text-xs text-[rgb(var(--color-text-muted))]">{{ t(badge.desc) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Report -->
            <div class="card-liquid border-l-4 border-[rgb(var(--color-error))]">
              <LiquidButton variant="ghost" icon="AlertCircle" class="w-full justify-start text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))/0.1]" size="sm">
                {{ t('auctionDetail.reportListing') }}
              </LiquidButton>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Custom scrollbar for thumbnails */
.flex.gap-3.p-4.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.flex.gap-3.p-4.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.flex.gap-3.p-4.overflow-x-auto::-webkit-scrollbar-thumb {
  background: rgb(var(--color-border));
  border-radius: 2px;
}

/* Prose overrides */
.prose {
  color: rgb(var(--color-text-secondary));
}

.prose p {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

/* Sticky sidebar */
@media (max-width: 1024px) {
  .sticky.top-28 {
    position: static;
  }
}
</style>