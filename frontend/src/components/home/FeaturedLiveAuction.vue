<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Flame, Clock, TrendingUp, ShieldCheck, Eye,
  Sparkles, CheckCircle2, ChevronRight, Zap
} from 'lucide-vue-next'
import type { Auction } from '@/types'
import { useFormatters } from '@/composables/useFormatters'
import { useI18n } from '@/composables/useI18n'

interface Props {
  auction: Auction
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'openBid': [auction: Auction]
}>()

const { currency } = useFormatters()
const { formatMoney } = currency
const { t } = useI18n()

// Live ticking seconds countdown
const timeLeftSeconds = ref(0)
let timerId: ReturnType<typeof setInterval> | null = null

function updateCountdown() {
  if (!props.auction.endsAt) return
  const diff = new Date(props.auction.endsAt).getTime() - Date.now()
  timeLeftSeconds.value = Math.max(0, Math.floor(diff / 1000))
}

onMounted(() => {
  updateCountdown()
  timerId = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})

const formattedCountdown = computed(() => {
  const total = timeLeftSeconds.value
  if (total <= 0) return { hours: '00', mins: '00', secs: '00', ended: true }
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return {
    hours: String(h).padStart(2, '0'),
    mins: String(m).padStart(2, '0'),
    secs: String(s).padStart(2, '0'),
    ended: false
  }
})

const liveViewers = computed(() => {
  return Math.min(68, Math.max(12, Math.floor((props.auction.views || 300) / 18)))
})
</script>

<template>
  <div class="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0B0D13] via-[#12151F] to-[#181C28] border border-white/10 text-white shadow-2xl w-full max-w-full">
    <!-- Ambient Studio Lighting Effects -->
    <div class="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

    <div class="relative grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-10 p-3.5 sm:p-6 lg:p-10 items-center w-full min-w-0">
      
      <!-- Left: Hero Product Photography & Live Status -->
      <div class="lg:col-span-7 flex flex-col justify-center min-w-0">
        <div class="relative rounded-2xl overflow-hidden h-40 sm:h-56 lg:h-[340px] bg-black/40 border border-white/10 shadow-inner group">
          <img
            :src="auction.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'"
            :alt="auction.title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

          <!-- Top Status Bar -->
          <div class="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            <!-- Pulsing LIVE Badge -->
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600/90 text-white backdrop-blur-md text-[11px] font-black tracking-wide shadow-lg">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
                <span class="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span>{{ t('home.liveBroadcast') || 'ПРЯМОЙ ЭФИР' }}</span>
            </div>

            <!-- Live Viewers Counter -->
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 text-white/90 backdrop-blur-md text-[11px] font-semibold border border-white/10">
              <Eye class="w-3.5 h-3.5 text-amber-400" />
              <span>{{ t('home.watchingNow', { n: liveViewers }) || `${liveViewers} сейчас смотрят` }}</span>
            </div>
          </div>

          <!-- Bottom Image Highlights -->
          <div class="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] pointer-events-none">
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-white/90 font-medium">
              <ShieldCheck class="w-3.5 h-3.5 text-emerald-400" />
              <span>{{ t('home.officialWarranty') || 'Официальная гарантия & IMEI' }}</span>
            </div>
            <div class="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-amber-400 font-bold">
              <TrendingUp class="w-3.5 h-3.5" />
              <span>{{ t('home.bidsCount', { n: auction.bidCount }) || `${auction.bidCount} ставок` }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Commercial Info & Fully Visible CTAs -->
      <div class="lg:col-span-5 flex flex-col justify-between space-y-3 sm:space-y-4 lg:space-y-6 min-w-0">
        
        <!-- Header & Seller -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
              {{ t('home.featuredLotOfDay') || 'Главный лот дня' }}
            </span>
            <span class="text-xs text-white/50">{{ auction.city }}</span>
          </div>

          <h2 class="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight leading-snug line-clamp-2">
            {{ auction.title }}
          </h2>

          <!-- Verified Seller Compact Chip -->
          <div class="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/5">
            <img
              v-if="auction.seller?.avatar"
              :src="auction.seller.avatar"
              :alt="auction.seller?.fullName || 'Seller'"
              class="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1 text-xs font-bold text-white truncate">
                <span>{{ auction.seller?.fullName || 'Сатуучу' }}</span>
                <CheckCircle2 v-if="auction.seller?.kycStatus === 'verified'" class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>
              <div class="text-[10px] text-white/50 flex items-center gap-2">
                <span v-if="auction.seller?.rating">⭐ {{ auction.seller.rating }}</span>
                <span v-if="auction.seller?.totalSales !== undefined">•</span>
                <span v-if="auction.seller?.totalSales !== undefined">{{ t('home.successfulDeals', { n: auction.seller.totalSales }) || `${auction.seller.totalSales} успешных сделок` }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Price & Live Countdown Matrix -->
        <div class="grid grid-cols-2 gap-2 sm:gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10">
          <!-- Current Bid -->
          <div class="space-y-0.5">
            <div class="text-[10px] font-bold text-white/60 uppercase tracking-wider">
              {{ t('home.currentBid') || 'Текущая ставка' }}
            </div>
            <div class="text-xl sm:text-2xl lg:text-3xl font-black text-amber-400 tracking-tight font-mono">
              {{ formatMoney(auction.currentPrice) }}
            </div>
            <div class="text-[10px] text-white/40">
              {{ t('home.bidStep', { step: formatMoney(auction.bidIncrement) }) || `Шаг: +${formatMoney(auction.bidIncrement)}` }}
            </div>
          </div>

          <!-- Countdown Timer -->
          <div class="space-y-0.5 text-right">
            <div class="text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center justify-end gap-1">
              <Clock class="w-3.5 h-3.5 text-rose-400" />
              <span>{{ t('home.timeLeft') || 'До конца' }}</span>
            </div>
            <div class="text-lg sm:text-xl lg:text-2xl font-black text-white font-mono tracking-wider">
              <span>{{ formattedCountdown.hours }}</span>:<span>{{ formattedCountdown.mins }}</span>:<span class="text-amber-400">{{ formattedCountdown.secs }}</span>
            </div>
            <div class="text-[10px] text-emerald-400 font-medium">
              {{ t('home.antiSnipingActive') || 'Антиснайпинг активен' }}
            </div>
          </div>
        </div>

        <!-- Action CTAs (100% visible on mobile without scrolling) -->
        <div class="space-y-2">
          <!-- Primary CTA: Make Bid -->
          <button
            type="button"
            class="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-gray-950 font-black text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-98"
            @click="emit('openBid', auction)"
          >
            <TrendingUp class="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{{ t('home.placeBidNow') || 'Сделать ставку' }}</span>
          </button>

          <!-- Secondary CTA: Buy Now & Detail -->
          <div class="grid grid-cols-2 gap-2">
            <RouterLink
              v-if="auction.buyNowPrice"
              :to="`/auctions/${auction.id}`"
              class="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-[11px] sm:text-xs text-center transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
            >
              <Zap class="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span class="truncate">{{ t('home.buyNow') || 'Купить' }}: {{ formatMoney(auction.buyNowPrice) }}</span>
            </RouterLink>

            <RouterLink
              :to="`/auctions/${auction.id}`"
              class="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 hover:text-white font-medium text-[11px] sm:text-xs text-center transition-all flex items-center justify-center gap-1 truncate"
              :class="{ 'col-span-2': !auction.buyNowPrice }"
            >
              <span class="truncate">{{ t('home.lotDetails') || 'Подробнее о лоте' }}</span>
              <ChevronRight class="w-3.5 h-3.5 shrink-0" />
            </RouterLink>
          </div>
        </div>

        <!-- Subtle Escrow Security Stamp -->
        <div class="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-white/50">
          <span class="flex items-center gap-1">
            <ShieldCheck class="w-3 h-3 text-emerald-400" />
            {{ t('home.safeEscrowDeal') || 'Безопасная сделка через Escrow' }}
          </span>
          <span>MBank • Optima • Demir</span>
        </div>

      </div>

    </div>
  </div>
</template>
