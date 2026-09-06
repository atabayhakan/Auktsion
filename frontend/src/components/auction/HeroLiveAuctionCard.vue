<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { 
  Zap, Clock, TrendingUp, ShieldCheck, 
  Smartphone, CheckCircle2, Gavel, Crown, Lock
} from 'lucide-vue-next'
import { currency } from '@/composables/useFormatters'
import { useI18n } from '@/composables/useI18n'
import type { Auction } from '@/types'
import Button from '@/components/ui/Button.vue'
import SmartShareModal from '@/components/auction/SmartShareModal.vue'

interface Props {
  /** The auction to display as the hero featured lot */
  auction: Auction
  /** Whether this is in a compact mode (e.g., for mobile) */
  compact?: boolean
  /** Show the quick-bid panel inline */
  showQuickBid?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  showQuickBid: true,
})

const emit = defineEmits<{
  'place-bid': [amount: number, auctionId: string]
  'navigate': [path: string]
  'watch': [auctionId: string]
  'share': [auctionId: string]
}>()

const { formatMoney } = currency
const { t } = useI18n()

// ============================================================================
// REACTIVE STATE FOR REAL-TIME SIMULATION
// ============================================================================

// Current price that can be updated in real-time
const currentPrice = ref({
  ...props.auction.currentPrice,
  minorUnits: props.auction.currentPrice?.minorUnits || 0,
})

// Real-time bidder avatars streaming in
const liveBidders = ref<Array<{
  id: string
  name: string
  avatar?: string
  amount: number
  timestamp: number
  isCurrentUser: boolean
}>>([])

// Connection status for WebSocket
const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('connecting')

// Countdown timer
const timeRemaining = ref<{
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
  isCritical: boolean
  isEnded: boolean
  formatted: string
  formattedShort: string
}>({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  milliseconds: 0,
  isCritical: false,
  isEnded: false,
  formatted: '',
  formattedShort: '',
})

// Bid increment for quick bid buttons
const bidIncrement = computed(() => 
  props.auction.bidIncrement?.minorUnits || 50000
)

// Minimum next bid
const minimumNextBid = computed(() => {
  const nextMinor = (currentPrice.value.minorUnits || 0) + bidIncrement.value
  return {
    ...currentPrice.value,
    minorUnits: nextMinor,
    amount: (nextMinor / 100).toFixed(2),
    formatted: formatMoney({ ...currentPrice.value, minorUnits: nextMinor }),
  }
})

// Quick bid amounts (preset buttons)
const quickBidAmounts = computed(() => {
  const base = currentPrice.value.minorUnits || 0
  const inc = bidIncrement.value
  return [
    { label: '+1', minor: base + inc, multiplier: 1 },
    { label: '+2', minor: base + inc * 2, multiplier: 2 },
    { label: '+5', minor: base + inc * 5, multiplier: 5 },
    { label: 'Max', minor: base + inc * 10, multiplier: 10 },
  ].map(b => ({
    ...b,
    formatted: formatMoney({ ...currentPrice.value, minorUnits: b.minor }),
  }))
})

// Bid count animation
const bidCount = ref(props.auction.bidCount || 0)
const bidCountDisplay = ref(props.auction.bidCount || 0)

// Animation states
const isPriceAnimating = ref(false)
const isOutbid = ref(false)
const isWinning = ref(false)
const showConfetti = ref(false)
const pulseTrigger = ref(0)

// ============================================================================
// COUNTDOWN TIMER LOGIC
// ============================================================================

let countdownInterval: number | null = null
let msInterval: number | null = null

function updateCountdown() {
  if (!props.auction.endsAt) {
    timeRemaining.value = {
      days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0,
      isCritical: false, isEnded: true,
      formatted: t('auction.auctionEnded'),
      formattedShort: t('auction.auctionEnded'),
    }
    return
  }

  const diff = new Date(props.auction.endsAt).getTime() - Date.now()
  
  if (diff <= 0) {
    timeRemaining.value = {
      days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0,
      isCritical: false, isEnded: true,
      formatted: t('auction.auctionEnded'),
      formattedShort: t('auction.auctionEnded'),
    }
    return
  }

  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  const milliseconds = diff % 1000
  
  const isCritical = diff < 300000 // Less than 5 minutes

  timeRemaining.value = {
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    isCritical,
    isEnded: false,
    formatted: days > 0 
      ? `${days} ${t('common.days')} ${hours} ${t('common.hours')}`
      : hours > 0
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`,
    formattedShort: days > 0
      ? `${days}d ${hours}h`
      : hours > 0
        ? `${hours}h ${minutes}m`
        : `${minutes}m ${seconds}s`,
  }
}

function startCountdown() {
  updateCountdown()
  countdownInterval = window.setInterval(updateCountdown, 1000)
  // Millisecond updates for final minute
  msInterval = window.setInterval(() => {
    if (timeRemaining.value.milliseconds > 0 && !timeRemaining.value.isEnded) {
      timeRemaining.value = {
        ...timeRemaining.value,
        milliseconds: Math.max(0, timeRemaining.value.milliseconds - 50),
      }
    }
  }, 50)
}

function stopCountdown() {
  if (countdownInterval) window.clearInterval(countdownInterval)
  if (msInterval) window.clearInterval(msInterval)
}

// ============================================================================
// REAL-TIME SIMULATION (Replace with actual WebSocket in production)
// ============================================================================

let simulationInterval: number | null = null
let bidderNameIndex = 0

const mockBidderNames = [
  'А. Токтосунов', 'М. Абдыраимова', 'Э. Суюнбаев', 'Ж. Маматов',
  'К. Исаева', 'Н. Кудойбердиев', 'С. Тургунбаева', 'Б. Асанов',
  'Айбек_99', 'Султан_07', 'Эркин_М', 'Жанар_К', 'Тилек_Бишкек',
  'Коллекционер_КГ', 'VIP_Биддер', 'Анонимный_123',
]

function simulateLiveActivity() {
  // Simulate other bidders
  if (Math.random() < 0.15) { // 15% chance per interval
    const isCurrentUser = Math.random() < 0.1
    const bidAmount = (currentPrice.value.minorUnits || 0) + bidIncrement.value * (Math.floor(Math.random() * 3) + 1)
    
    const newBidder = {
      id: `bidder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: mockBidderNames[bidderNameIndex % mockBidderNames.length],
      amount: bidAmount,
      timestamp: Date.now(),
      isCurrentUser,
    }
    bidderNameIndex++

    liveBidders.value = [newBidder, ...liveBidders.value.slice(0, 7)] // Keep max 8

    if (isCurrentUser) {
      // Current user placed a bid
      triggerWinningAnimation(bidAmount)
    } else if (bidAmount > (currentPrice.value.minorUnits || 0)) {
      // Someone outbid
      triggerOutbidAnimation(bidAmount)
    }
  }

  // Randomly update price to simulate live bidding
  if (Math.random() < 0.08) {
    const newPrice = (currentPrice.value.minorUnits || 0) + bidIncrement.value
    triggerPriceUpdate(newPrice)
  }
}

function triggerPriceUpdate(newMinorUnits: number) {
  isPriceAnimating.value = true
  pulseTrigger.value++
  
  // Animate the number
  currentPrice.value = {
    ...currentPrice.value,
    minorUnits: newMinorUnits,
    amount: (newMinorUnits / 100).toFixed(2),
    formatted: formatMoney({ ...currentPrice.value, minorUnits: newMinorUnits }),
  }
  
  bidCount.value++
  animateBidCount()
  
  setTimeout(() => {
    isPriceAnimating.value = false
  }, 600)
}

function triggerWinningAnimation(newMinorUnits: number) {
  isWinning.value = true
  isOutbid.value = false
  showConfetti.value = true
  
  triggerPriceUpdate(newMinorUnits)
  
  setTimeout(() => {
    isWinning.value = false
    showConfetti.value = false
  }, 3000)
}

function triggerOutbidAnimation(newMinorUnits: number) {
  isOutbid.value = true
  isWinning.value = false
  
  triggerPriceUpdate(newMinorUnits)
  
  setTimeout(() => {
    isOutbid.value = false
  }, 2000)
}

function animateBidCount() {
  const target = bidCount.value
  const duration = 400
  const start = bidCountDisplay.value
  const startTime = Date.now()
  
  function animate() {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
    bidCountDisplay.value = Math.round(start + (target - start) * eased)
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  animate()
}

function startSimulation() {
  simulationInterval = window.setInterval(simulateLiveActivity, 3000)
}

function stopSimulation() {
  if (simulationInterval) window.clearInterval(simulationInterval)
}

// ============================================================================
// QUICK BID HANDLERS
// ============================================================================

async function handleQuickBid(minorUnits: number) {
  // Optimistic update
  triggerWinningAnimation(minorUnits)
  
  // Emit to parent for actual API call
  emit('place-bid', minorUnits, props.auction.id)
  
  // Haptic feedback (if supported)
  if ('vibrate' in navigator) {
    navigator.vibrate([50, 30, 50])
  }
}

function handleCustomBid() {
  const customAmount = prompt(
    `${t('auction.minimumBid')}: ${minimumNextBid.value.formatted}\n${t('home.placeBid')} (KGS):`,
    ''
  )
  if (customAmount) {
    const amount = parseFloat(customAmount.replace(/[^\d.]/g, ''))
    if (!isNaN(amount) && amount * 100 >= minimumNextBid.value.minorUnits) {
      handleQuickBid(Math.round(amount * 100))
    } else {
      alert(`${t('auction.minimumBid')}: ${minimumNextBid.value.formatted}`)
    }
  }
}

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  startCountdown()
  startSimulation()
  connectionStatus.value = 'connected'
})

onUnmounted(() => {
  stopCountdown()
  stopSimulation()
})

// Watch for prop changes (e.g., real-time updates from WebSocket)
watch(() => props.auction.currentPrice, (newPrice) => {
  if (newPrice && newPrice.minorUnits !== currentPrice.value.minorUnits) {
    triggerPriceUpdate(newPrice.minorUnits)
  }
})

watch(() => props.auction.bidCount, (newCount) => {
  if (newCount !== undefined && newCount > bidCount.value) {
    bidCount.value = newCount
    animateBidCount()
  }
})
</script>

<template>
  <!-- 
    HERO LIVE AUCTION INTERACTIVE CARD
    2026 Design System - Obsidian Dark + Cyber Emerald + Laser Amber
    Features: Real-time bidding, kinetic typography, millisecond countdown,
    live bidder stream, quick-bid presets, haptic feedback, confetti celebrations
  -->
  
  <div 
    class="relative overflow-hidden rounded-4xl bg-gradient-to-br from-emerald-500/[0.04] via-dark-950/60 to-amber-500/[0.03] dark:from-emerald-500/[0.06] dark:via-dark-950/80 dark:to-amber-500/[0.04] border border-emerald-500/15 dark:border-emerald-500/15 backdrop-blur-3xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5),0_8px_48px_-8px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(255,255,255,0.04)] p-6 lg:p-8 xl:p-10"
    :class="{
      'ring-1 ring-emerald-500/30 shadow-glow-emerald-md': isPriceAnimating,
      'ring-1 ring-gold-500/40 shadow-glow-gold-lg': isWinning,
      'ring-1 ring-red-500/40 shadow-glow-alive-pulse': isOutbid,
    }"
  >
    <!-- Background Atmosphere -->
    <div class="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <!-- Radial glow from center -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-emerald-500/10 via-transparent to-amber-500/5 blur-3xl animate-pulse-slow" />
      <!-- Subtle grid pattern -->
      <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V0h4V0h-4z%22 fill=%22%23ffffff%22 fill-opacity=%220.015%22/%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
    </div>

    <!-- Live Indicator Badge -->
    <div class="absolute top-4 left-4 z-10 flex items-center gap-2">
      <div
        :class="['flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl border text-caption-sm font-semibold', 
          connectionStatus === 'connected' 
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
            : connectionStatus === 'connecting'
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 animate-pulse'
              : 'bg-red-500/15 border-red-500/30 text-red-400'
        ]"
      >
        <span
          class="w-2 h-2 rounded-full"
          :class="connectionStatus === 'connected' ? 'bg-emerald-400' : connectionStatus === 'connecting' ? 'bg-amber-400' : 'bg-red-400'"
        />
        <span>{{ connectionStatus === 'connected' ? 'LIVE' : connectionStatus === 'connecting' ? t('common.loading') : 'OFFLINE' }}</span>
        <span class="text-[10px] font-mono text-emerald-400/70">WEBSOCKET</span>
      </div>
    </div>

    <!-- VIP / Featured Badge -->
    <div class="absolute top-4 right-4 z-10">
      <div
      >
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-gold-500/20 to-amber-500/10 border border-gold-500/30 text-gold-300 text-caption-sm font-bold backdrop-blur-xl">
          <Crown class="w-3.5 h-3.5" />
          {{ t('home.heroBadge') }}
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
      <!-- LEFT: IMAGE & VISUAL SHOWCASE (2/3) -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Main Image with Overlays -->
        <div class="relative aspect-[16/9] rounded-3xl overflow-hidden bg-dark-950">
          <img
            :src="auction.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=80'"
            :alt="auction.title"
            class="w-full h-full object-cover transition-transform duration-1000"
          />
          
          <!-- Gradient Overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
          
          <!-- Top Badges -->
          <div class="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            <div
              class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-950/90 backdrop-blur-xl border border-white/10 text-white text-caption-sm font-medium shadow-lg"
            >
              <Zap class="w-3.5 h-3.5 text-emerald-400" />
              <span>{{ categoryName }}</span>
            </div>
            
            <div
              class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-950/90 backdrop-blur-xl border text-caption-sm font-mono font-bold shadow-lg"
              :class="timeRemaining.isCritical && !timeRemaining.isEnded
                ? 'border-red-500/50 text-red-300 bg-red-950/30'
                : 'border-gold-500/30 text-gold-300'"
            >
              <Clock class="w-3.5 h-3.5" :class="timeRemaining.isCritical && !timeRemaining.isEnded ? 'text-red-400 animate-pulse' : 'text-gold-400'" />
              <span class="tabular-nums">{{ timeRemaining.formatted }}</span>
              <span
                v-if="timeRemaining.isCritical && !timeRemaining.isEnded"
                class="ml-1 text-red-400 font-extrabold"
              >
                ⚠
              </span>
            </div>
          </div>

          <!-- Bottom Info Bar -->
          <div class="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            <div
              class="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 text-white text-caption-md shadow-lg"
            >
              <span class="flex items-center gap-1.5">
                <span class="w-7 h-7 rounded-full bg-gradient-to-tr from-gold-600 to-gold-400 flex items-center justify-center text-dark-950 font-bold text-xs">
                  {{ auction.seller?.fullName?.charAt(0) || 'S' }}
                </span>
                <span class="font-medium truncate max-w-[150px]">{{ auction.seller?.fullName || t('auction.seller') }}</span>
              </span>
              <span class="flex items-center gap-1 text-emerald-400 text-[11px]">
                <ShieldCheck class="w-3 h-3" />
                KYC
              </span>
            </div>

            <div
              class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 text-white text-caption-md shadow-lg"
            >
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Escrow 100%</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Verified</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Fast Deal</span>
            </div>
          </div>

          <!-- Price Flash Overlay -->
          <div
            v-if="isPriceAnimating"
            class="absolute inset-0 pointer-events-none z-10"
            style="background: radial-gradient(circle at center, rgba(251,191,36,0.3) 0%, transparent 70%)"
          />
        </div>

        <!-- LIVE BIDDER STREAM -->
        <div
          class="glass-panel p-4 rounded-2xl border border-white/10 backdrop-blur-xl"
        >
          <div class="flex items-center justify-between mb-4">
            <h4 class="flex items-center gap-2 text-body-sm font-semibold text-white">
              <span
                class="w-2 h-2 rounded-full bg-emerald-400"
              />
              {{ t('auction.realtimeKafka') }}
            </h4>
            <span class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-caption-xs font-mono text-gray-400">
              <TrendingUp class="w-3 h-3 text-emerald-400" />
              {{ bidCountDisplay }} {{ t('common.bids') }}
            </span>
          </div>

          <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <!-- Current User (if winning) -->
            <div
              v-if="isWinning"
              key="current-user-winning"
              class="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl bg-gradient-to-br from-gold-500/20 to-amber-500/10 border border-gold-500/40 shadow-glow-gold-sm"
            >
              <div class="relative">
                <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-gold-500 to-gold-400 flex items-center justify-center text-dark-950 font-bold text-xl ring-2 ring-gold-500/50 ring-offset-2 ring-offset-dark-950">
                  {{ auction.seller?.fullName?.charAt(0) || 'S' }}
                </div>
                <div
                  class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gold-500 border-2 border-dark-950 flex items-center justify-center"
                >
                  <CheckCircle2 class="w-3.5 h-3.5 text-dark-950" />
                </div>
              </div>
              <span class="text-caption-sm font-bold text-gold-300 text-center">{{ t('auction.you') }}<br><span class="font-mono tabular-nums">{{ formatMoney({ ...currentPrice.value, minorUnits: currentPrice.value.minorUnits }) }}</span></span>
            </div>

            <!-- Live Bidders Stream -->
            <div
              v-for="bidder in liveBidders"
              :key="bidder.id"
              class="flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl bg-white/5 dark:bg-dark-900/60 border border-white/10 dark:border-white/10 transition-all duration-300 hover:border-gold-500/30 hover:shadow-glow-gold-sm"
              :class="bidder.isCurrentUser ? 'border-emerald-500/40 shadow-glow-emerald-sm' : ''"
            >
              <div class="relative">
                <div
class="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-400 flex items-center justify-center text-white font-bold text-lg"
                     :class="bidder.isCurrentUser ? 'ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-dark-950' : ''">
                  {{ bidder.name.charAt(0).toUpperCase() }}
                </div>
                <div
                  v-if="bidder.isCurrentUser"
                  class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-dark-950 flex items-center justify-center"
                >
                  <CheckCircle2 class="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <span class="text-caption-xs font-medium text-gray-300 truncate max-w-[60px] text-center">{{ bidder.name }}</span>
              <span class="text-caption-xs font-mono tabular-nums text-gold-400">{{ formatMoney({ ...currentPrice.value, minorUnits: bidder.amount }) }}</span>
              <span class="text-[9px] text-gray-500">{{ formatRelativeTime(bidder.timestamp) }}</span>
            </div>

            <!-- Empty State -->
            <div v-if="liveBidders.length === 0" class="flex items-center gap-2 px-4 py-3 text-gray-500 text-caption-sm">
              <Clock class="w-4 h-4" />
              {{ t('auction.loading') }}
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: BID PANEL & INFO (1/3) -->
      <div class="lg:col-span-1 space-y-4">
        <!-- CURRENT PRICE - KINETIC TYPOGRAPHY -->
        <div
          class="relative glass-panel p-6 rounded-3xl border border-white/10 backdrop-blur-xl"
          :class="{
            'ring-1 ring-emerald-500/40 shadow-glow-emerald-md': isPriceAnimating,
            'ring-1 ring-gold-500/50 shadow-glow-gold-lg': isWinning,
            'ring-1 ring-red-500/50 shadow-glow-alive-pulse': isOutbid,
          }"
        >
          <!-- Status Badge -->
          <div
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4"
            :class="[
              'text-caption-sm font-semibold backdrop-blur-xl border',
              timeRemaining.isEnded ? 'bg-gray-500/15 border-gray-500/30 text-gray-400' :
              timeRemaining.isCritical ? 'bg-red-500/15 border-red-500/40 text-red-400 animate-pulse-urgent' :
              isWinning ? 'bg-gold-500/15 border-gold-500/40 text-gold-400' :
              isOutbid ? 'bg-red-500/15 border-red-500/40 text-red-400' :
              'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
            ]"
          >
            <span
              v-if="!timeRemaining.isEnded"
              class="w-2 h-2 rounded-full"
              :class="timeRemaining.isCritical ? 'bg-red-400' : isWinning ? 'bg-gold-400' : isOutbid ? 'bg-red-400' : 'bg-emerald-400'"
            />
            <span v-if="timeRemaining.isEnded">{{ t('auction.auctionEnded') }}</span>
            <span v-else-if="timeRemaining.isCritical">{{ t('home.endingSoon') }}</span>
            <span v-else-if="isWinning">{{ t('status.bid.winning') }}</span>
            <span v-else-if="isOutbid">{{ t('status.bid.outbid') }}</span>
            <span v-else>{{ t('status.auction.active') }}</span>
          </div>

          <!-- Current Price Display -->
          <div class="space-y-2">
            <span class="block text-caption-sm uppercase tracking-widest text-gray-500 font-medium">{{ t('home.currentPrice') }}</span>
            
            <div
              :key="`price-${currentPrice.value.minorUnits}`"
              class="relative"
            >
              <span
                class="font-display font-extrabold text-4xl lg:text-5xl xl:text-6xl tabular-nums tracking-tight text-white"
                :class="isPriceAnimating ? 'text-gold-400' : isWinning ? 'text-gold-400' : isOutbid ? 'text-red-400' : ''"
              >
                {{ formatMoney(currentPrice) }}
              </span>
              
              <!-- Price change indicator -->
              <div
                v-if="hasPriceUpdate"
                class="absolute -top-3 right-0 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-caption-xs font-bold"
              >
                <TrendingUp class="w-3 h-3" />
                +{{ formatBidIncrement(bidIncrement.value) }}
              </div>
            </div>

            <!-- Next Minimum Bid -->
            <div class="pt-3 border-t border-white/10 flex items-center justify-between text-caption-sm">
              <span class="text-gray-500">{{ t('auction.minimumBid') }}:</span>
              <span
                class="font-mono font-semibold tabular-nums text-gold-400"
                :class="isPriceAnimating ? 'text-amber-400' : ''"
              >
                {{ minimumNextBid.formatted }}
              </span>
            </div>
          </div>

          <!-- Countdown Timer - MILLISECOND PRECISION -->
          <div
            class="mt-6 pt-6 border-t border-white/10"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-caption-sm uppercase tracking-widest text-gray-500 font-medium">{{ t('auction.timeRemaining') }}</span>
              <span class="font-mono text-caption-xs text-gray-400">{{ timeRemaining.milliseconds.toString().padStart(3, '0') }} ms</span>
            </div>
            
            <div class="flex items-center justify-center gap-1.5">
              <div
                v-if="timeRemaining.days > 0"
                class="flex items-center gap-1.5"
              >
                <CountdownSegment 
                  :value="timeRemaining.days" 
                  :label="t('common.days')" 
                  :is-critical="timeRemaining.isCritical"
                  :is-ended="timeRemaining.isEnded"
                />
                <CountdownSegment 
                  :value="timeRemaining.hours" 
                  :label="t('common.hours')" 
                  :is-critical="timeRemaining.isCritical"
                  :is-ended="timeRemaining.isEnded"
                />
              </div>
              
              <div
                v-else
                class="flex items-center gap-1.5"
              >
                <CountdownSegment 
                  :value="timeRemaining.hours" 
                  :label="t('common.hours')" 
                  :is-critical="timeRemaining.isCritical"
                  :is-ended="timeRemaining.isEnded"
                />
                <CountdownSegment 
                  :value="timeRemaining.minutes" 
                  :label="t('common.minutes')" 
                  :is-critical="timeRemaining.isCritical"
                  :is-ended="timeRemaining.isEnded"
                />
                <CountdownSegment 
                  :value="timeRemaining.seconds" 
                  :label="t('common.seconds')" 
                  :is-critical="timeRemaining.isCritical"
                  :is-ended="timeRemaining.isEnded"
                />
                <CountdownSegment 
                  :value="Math.floor(timeRemaining.milliseconds / 100)" 
                  label="MS" 
                  :is-critical="timeRemaining.isCritical"
                  :is-ended="timeRemaining.isEnded"
                  :show-milliseconds="true"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- QUICK BID BUTTONS -->
        <div
          v-if="showQuickBid && !timeRemaining.isEnded"
          class="space-y-3"
        >
          <div class="flex items-center justify-between">
            <span class="text-caption-sm uppercase tracking-widest text-gray-500 font-medium">{{ t('home.placeBid') }}</span>
            <span class="text-caption-xs text-gray-400">{{ t('auction.minimumBid') }}: {{ minimumNextBid.formatted }}</span>
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="bid in quickBidAmounts"
              :key="bid.multiplier"
              :disabled="isPriceAnimating || timeRemaining.isEnded"
              class="relative group px-4 py-3 rounded-2xl bg-white/5 dark:bg-dark-900/60 border border-white/10 dark:border-white/10 hover:border-gold-500/40 hover:shadow-glow-gold-sm transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-1"
              style="--delay: 0.1"
              @click="handleQuickBid(bid.minor)"
            >
              <span class="text-caption-xs font-bold text-gray-400 group-hover:text-gold-400 transition-colors">{{ bid.label }}</span>
              <span
                class="font-display font-bold text-lg tabular-nums text-gold-400"
              >
                {{ bid.formatted }}
              </span>
              <div
                class="absolute inset-0 rounded-2xl bg-gradient-to-r from-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
            </button>
          </div>
          
          <Button
            variant="secondary"
            size="lg"
            class="w-full"
            :disabled="isPriceAnimating || timeRemaining.isEnded"
            icon="ExternalLink"
            @click="handleCustomBid"
          >
            {{ t('home.placeBid') }}
          </Button>
        </div>

        <!-- TRUST BADGES -->
        <div
          class="space-y-3 pt-4 border-t border-white/10"
        >
          <div class="flex items-center gap-2 text-caption-xs text-gray-500">
            <Lock class="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Escrow Protection</span>
          </div>
          <div class="flex items-center gap-2 text-caption-xs text-gray-500">
            <ShieldCheck class="w-3.5 h-3.5 text-cyan-400" />
            <span>NBKR License</span>
          </div>
          <div class="flex items-center gap-2 text-caption-xs text-gray-500">
            <Smartphone class="w-3.5 h-3.5 text-gold-400" />
            <span>MBank QR Instant</span>
          </div>
          <div class="flex items-center gap-2 text-caption-xs text-gray-500">
            <Gavel class="w-3.5 h-3.5 text-amber-400" />
            <span>Transparent Live Auction</span>
          </div>
        </div>

        <!-- ACTION BUTTONS -->
        <div
          class="space-y-3 pt-4 border-t border-white/10"
        >
          <RouterLink :to="`/auctions/${auction.id}`">
            <Button variant="primary" size="xl" class="w-full justify-center gap-2" icon="ExternalLink">
              {{ t('home.fullDetails') }}
            </Button>
          </RouterLink>
          
          <div class="flex items-center gap-3">
            <Button variant="ghost" size="md" class="flex-1" icon="Eye" @click="$emit('watch', auction.id)">
              {{ t('auction.watchlist') }}
            </Button>
            <Button variant="ghost" size="md" class="flex-1" icon="ExternalLink" @click="$emit('share', auction.id)">
              {{ t('auction.share') }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- CONFETTI CELEBRATION -->
    <ConfettiCannon v-if="showConfetti" :count="50" />
  </div>
</template>

<!-- ============================================================================
     COUNTDOWN SEGMENT SUB-COMPONENT
     ============================================================================ -->
<script setup lang="ts">
interface CountdownSegmentProps {
  value: number
  label: string
  isCritical: boolean
  isEnded: boolean
  showMilliseconds?: boolean
}

const props = defineProps<CountdownSegmentProps>()

const formattedValue = computed(() => 
  props.showMilliseconds 
    ? props.value.toString().padStart(1, '0')
    : props.value.toString().padStart(2, '0')
)
</script>

<template>
  <div
    class="flex flex-col items-center gap-1 px-2 py-2 rounded-xl bg-dark-950/60 backdrop-blur-xl border"
    :class="[
      'transition-all duration-200',
      props.isCritical && !props.isEnded ? 'border-red-500/40 shadow-glow-alive-sm' : 'border-white/10',
      props.isEnded ? 'border-gray-500/20' : ''
    ]"
  >
    <span
      class="font-mono font-extrabold tabular-nums text-xl lg:text-2xl"
      :class="[
        'transition-colors duration-200',
        props.isCritical && !props.isEnded ? 'text-red-400' : props.isEnded ? 'text-gray-500' : 'text-white'
      ]"
      :key="formattedValue"
    >
      {{ formattedValue }}
    </span>
    <span class="text-[9px] uppercase tracking-wider font-medium text-gray-500">
      {{ label }}
    </span>
  </div>
</template>

<!-- ============================================================================
     CONFETTI CANNON SUB-COMPONENT
     ============================================================================ -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

interface ConfettiCannonProps {
  count: number
}

const props = defineProps<ConfettiCannonProps>()

const particles = ref<Array<{
  x: number
  y: number
  size: number
  color: string
  rotation: number
  velocityX: number
  velocityY: number
  gravity: number
  opacity: number
  delay: number
}>>([])

const colors = ['#FBBF24', '#F59E0B', '#D97706', '#10B981', '#34D399', '#FFFFFF', '#FDE047']

onMounted(() => {
  // Create particles
  for (let i = 0; i < props.count; i++) {
    particles.value.push({
      x: 50 + (Math.random() - 0.5) * 30, // Center-ish
      y: 30 + Math.random() * 20,
      size: 6 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      velocityX: (Math.random() - 0.5) * 8,
      velocityY: -5 - Math.random() * 10,
      gravity: 0.15 + Math.random() * 0.1,
      opacity: 1,
      delay: Math.random() * 200,
    })
  }
  
  // Animate
  let animationId: number
  const startTime = Date.now()
  
  function animate() {
    const elapsed = Date.now() - startTime
    let allDead = true
    
    particles.value = particles.value.map(p => {
      if (elapsed < p.delay) return p
      
      const newY = p.y + p.velocityY
      const newX = p.x + p.velocityX
      const newVelocityY = p.velocityY + p.gravity
      const newOpacity = Math.max(0, p.opacity - 0.015)
      
      if (newOpacity > 0 && newY < 120) allDead = false
      
      return {
        ...p,
        x: newX,
        y: newY,
        velocityY: newVelocityY,
        rotation: p.rotation + (p.velocityX * 2),
        opacity: newOpacity,
      }
    })
    
    if (!allDead && elapsed < 5000) {
      animationId = requestAnimationFrame(animate)
    }
  }
  
  animate()
  
  onUnmounted(() => {
    cancelAnimationFrame(animationId)
  })
})
</script>

<template>
  <div class="absolute inset-0 pointer-events-none overflow-hidden z-50">
    <div 
      v-for="(p, i) in particles" 
      :key="i"
      class="absolute pointer-events-none"
      :style="{
        left: p.x + '%',
        top: p.y + '%',
        width: p.size + 'px',
        height: p.size + 'px',
        transform: `rotate(${p.rotation}deg)`,
        opacity: p.opacity,
        background: p.color,
        borderRadius: Math.random() > 0.5 ? '50%' : '4px',
      }"
    />
  </div>
</template>

<style scoped>
/* Custom scrollbar hide */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Animations */
@keyframes pulse-slow {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
}
.animate-pulse-slow {
  animation: pulse-slow 4s ease-in-out infinite;
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}

@keyframes pulse-urgent {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.02); }
}
.animate-pulse-urgent {
  animation: pulse-urgent 0.6s ease-in-out infinite;
}

/* Tabular numbers for financial data */
.tabular-nums {
  font-variant-numeric: tabular-nums;
  font-family: 'Geist Mono', 'JetBrains Mono', monospace;
}

/* Glass panel utilities */
.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Shadow utilities (referenced in class names) */
.shadow-glow-emerald-sm { box-shadow: 0 0 8px rgba(16, 185, 129, 0.25), 0 0 16px rgba(16, 185, 129, 0.15); }
.shadow-glow-emerald-md { box-shadow: 0 0 12px rgba(16, 185, 129, 0.35), 0 0 24px rgba(16, 185, 129, 0.2), 0 0 48px rgba(16, 185, 129, 0.1); }
.shadow-glow-emerald-lg { box-shadow: 0 0 16px rgba(16, 185, 129, 0.4), 0 0 32px rgba(16, 185, 129, 0.25), 0 0 64px rgba(16, 185, 129, 0.15); }
.shadow-glow-gold-sm { box-shadow: 0 0 8px rgba(251, 191, 36, 0.25), 0 0 16px rgba(251, 191, 36, 0.15); }
.shadow-glow-gold-md { box-shadow: 0 0 12px rgba(251, 191, 36, 0.35), 0 0 24px rgba(251, 191, 36, 0.2), 0 0 48px rgba(251, 191, 36, 0.1); }
.shadow-glow-gold-lg { box-shadow: 0 0 16px rgba(251, 191, 36, 0.4), 0 0 32px rgba(251, 191, 36, 0.25), 0 0 64px rgba(251, 191, 36, 0.15); }
.shadow-glow-alive-sm { box-shadow: 0 0 8px rgba(239, 68, 68, 0.3), 0 0 16px rgba(239, 68, 68, 0.2); }
.shadow-glow-alive-pulse { box-shadow: 0 0 16px rgba(239, 68, 68, 0.6), 0 0 32px rgba(239, 68, 68, 0.4), 0 0 64px rgba(239, 68, 68, 0.2); }
</style>