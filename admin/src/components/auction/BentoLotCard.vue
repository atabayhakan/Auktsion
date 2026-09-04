<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Clock, TrendingUp, ShieldCheck, Zap, Heart } from 'lucide-vue-next'
import { currency } from '@/composables/useFormatters'
import { useCountdown } from '@/composables/useCountdown'
import { useI18n } from '@/composables/useI18n'
import type { Auction } from '@/types'

interface Props {
  /** The auction data */
  auction: Auction
  /** Variant for different grid positions */
  variant?: 'default' | 'featured' | 'compact' | 'vip' | 'live'
  /** Show quick actions on hover */
  showQuickActions?: boolean
  /** Show as a bento grid item (asymmetric sizing) */
  bentoSize?: 'small' | 'medium' | 'large' | 'wide' | 'tall'
  /** Index for staggered animations */
  index?: number
  /** Priority for loading */
  priority?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  showQuickActions: true,
  bentoSize: 'medium',
  index: 0,
  priority: false,
})

const emit = defineEmits<{
  'quick-bid': [auctionId: string, amount: number]
  'toggle-watch': [auctionId: string]
  'share': [auctionId: string]
  'navigate': [path: string]
}>()

const { formatMoney } = currency
const { t } = useI18n()

// Current price
const currentPrice = computed(() => props.auction.currentPrice)

// Bid increment
const bidIncrement = computed(() => 
  props.auction.bidIncrement?.minorUnits || 50000
)

// Minimum next bid
const minimumNextBid = computed(() => {
  const nextMinor = (currentPrice.value?.minorUnits || 0) + bidIncrement.value
  return {
    ...currentPrice.value!,
    minorUnits: nextMinor,
    amount: (nextMinor / 100).toFixed(2),
    formatted: formatMoney({ ...currentPrice.value!, minorUnits: nextMinor }),
  }
})

// Category display name
const categoryName = computed(() => {
  if (typeof props.auction.category === 'object' && props.auction.category?.name) {
    return props.auction.category.name
  }
  const slug = typeof props.auction.category === 'string' 
    ? props.auction.category 
    : props.auction.category?.slug
  const map: Record<string, string> = {
    electronics: t('categories.electronics'),
    vehicles: t('categories.vehicles'),
    'real-estate': t('categories.realEstate'),
    jewelry: t('categories.jewelry'),
    art: t('categories.art'),
    machinery: t('categories.machinery'),
  }
  return map[slug || ''] || t('categories.electronics')
})

// Countdown timer (reactive, used via timeRemaining computed)
useCountdown({
  endsAt: computed(() => props.auction.endsAt),
})

// Time remaining with millisecond precision for critical moments
const timeRemaining = computed(() => {
  if (!props.auction.endsAt) return { text: `2 ${t('common.hours')}`, isEnded: false, isCritical: false, isUrgent: false }
  const diff = new Date(props.auction.endsAt).getTime() - Date.now()
  if (diff <= 0) return { text: t('auction.auctionEnded'), isEnded: true, isCritical: false, isUrgent: false }
  
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const days = Math.floor(hours / 24)
  const isCritical = diff < 300000 // 5 minutes
  const isUrgent = diff < 60000 // 1 minute
  
  if (days > 0) {
    return { text: `${days} ${t('common.days')} ${hours % 24} ${t('common.hours')}`, isEnded: false, isCritical, isUrgent }
  } else if (hours > 0) {
    return { text: `${hours} ${t('common.hours')} ${minutes} ${t('common.minutes')}`, isEnded: false, isCritical, isUrgent }
  } else {
    return { text: `${minutes} ${t('common.minutes')}`, isEnded: false, isCritical, isUrgent }
  }
})

// Animation states
const isHovered = ref(false)

// Bento size classes
const bentoSizeClasses = computed(() => {
  const base = 'transition-all duration-500 ease-[0.23,1,0.32,1]'
  switch (props.bentoSize) {
    case 'small': return `${base} col-span-1 row-span-1`
    case 'medium': return `${base} col-span-1 row-span-1 sm:col-span-2`
    case 'large': return `${base} col-span-2 row-span-2`
    case 'wide': return `${base} col-span-2 row-span-1`
    case 'tall': return `${base} col-span-1 row-span-2`
    default: return `${base} col-span-1 row-span-1`
  }
})

// Variant-specific classes
const variantClasses = computed(() => {
  const base = 'relative overflow-hidden rounded-3xl bg-white/95 dark:bg-dark-900/60 backdrop-blur-2xl shadow-xs dark:shadow-none border transition-all duration-300 group'
  
  switch (props.variant) {
    case 'featured':
      return `${base} border-gold-500/30 dark:border-gold-500/30 shadow-glow-gold-sm hover:border-gold-500/50 hover:shadow-glow-gold-md hover:-translate-y-1`
    case 'vip':
      return `${base} border-violet-500/30 dark:border-violet-500/30 bg-gradient-to-br from-violet-500/5 via-white/3 to-transparent dark:from-violet-500/5 dark:via-dark-900/60 dark:to-dark-950/80 shadow-glow-violet-sm hover:border-violet-500/50 hover:shadow-glow-violet-md hover:-translate-y-1`
    case 'live':
      return `${base} border-emerald-500/30 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-white/3 to-transparent dark:from-emerald-500/5 dark:via-dark-900/60 dark:to-dark-950/80 shadow-glow-emerald-sm hover:border-emerald-500/50 hover:shadow-glow-emerald-md hover:-translate-y-1`
    case 'compact':
      return `${base} border-white/10 dark:border-white/10 hover:border-gold-500/30 hover:shadow-md hover:-translate-y-0.5`
    default:
      return `${base} border-black/[0.08] dark:border-white/10 hover:border-amber-400/60 dark:hover:border-gold-400/50 hover:shadow-md dark:hover:shadow-gold hover:-translate-y-0.5`
  }
})

function handleWatchToggle() {
  emit('toggle-watch', props.auction.id)
}
</script>

<template>
  <article
    :class="[bentoSizeClasses, variantClasses]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Top Image Media Container -->
    <div class="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-dark-950">
      <img
        :src="auction.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'"
        :alt="auction.title"
        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 dark:from-dark-950/90 via-transparent to-black/20 pointer-events-none" />

      <!-- Badges -->
      <div class="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-dark-950/85 backdrop-blur-md border border-white/10 text-white flex items-center gap-1.5 shadow-sm">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {{ categoryName }}
        </span>

        <span
class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-dark-950/85 backdrop-blur-md border border-gold-500/30 text-gold-300 flex items-center gap-1.5 shadow-sm"
              :class="{ '!border-red-500/50 !text-red-300 !bg-red-950/85': timeRemaining.isCritical && !timeRemaining.isEnded }">
          <Clock class="w-3.5 h-3.5" />
          {{ timeRemaining.text }}
        </span>
      </div>

      <!-- City & Banks -->
      <div class="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
        <span class="text-xs font-medium text-white bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-sm shadow-sm">
          📍 {{ (typeof auction.city === 'object' ? auction.city?.name : auction.city) || t('cities.bishkek') }}
        </span>

        <div class="flex items-center gap-1">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">MBank</span>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Optima</span>
        </div>
      </div>
    </div>

    <!-- Content Body -->
    <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
      <div>
        <RouterLink :to="`/auctions/${auction.id}`" class="block">
          <h3 class="font-display font-semibold text-base md:text-lg text-gray-900 dark:text-white group-hover:text-gold-500 transition-colors line-clamp-1 leading-snug">
            {{ auction.title }}
          </h3>
        </RouterLink>
        <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
          {{ auction.description }}
        </p>
      </div>

      <!-- Price Box -->
      <div class="glass-well rounded-xl p-3 border border-black/5 dark:border-white/5 space-y-2">
        <div class="flex items-end justify-between">
          <div>
            <span class="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium block">{{ t('home.currentPrice') }}:</span>
            <span class="font-display text-xl md:text-2xl font-bold text-amber-700 dark:text-gold-400 tracking-tight">
              {{ formatMoney(currentPrice) }}
            </span>
          </div>

          <div class="text-right">
            <span class="text-[11px] text-gray-500 dark:text-gray-400 block">{{ t('common.bids') }}:</span>
            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
              <TrendingUp class="w-3.5 h-3.5" />
              {{ auction.bidCount }} {{ t('common.bids') }}
            </span>
          </div>
        </div>

        <div class="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{{ t('auction.minimumBid') }}:</span>
          <span class="font-mono font-medium text-gold-600 dark:text-gold-400">{{ minimumNextBid.formatted }}</span>
        </div>
      </div>

      <!-- Seller and Actions -->
      <div class="flex items-center justify-between gap-3 pt-1">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-gold-600 to-gold-400 flex items-center justify-center text-dark-950 font-bold text-xs">
            {{ auction.seller?.fullName?.charAt(0) || 'S' }}
          </div>
          <div class="flex flex-col">
            <span class="text-xs font-medium text-gray-800 dark:text-gray-300 leading-none truncate max-w-[100px]">
              {{ auction.seller?.fullName || t('auction.seller') }}
            </span>
            <span class="text-[10px] text-gold-600 dark:text-gold-400 flex items-center gap-0.5 mt-0.5">
              <ShieldCheck class="w-3 h-3 text-emerald-500" /> {{ t('common.verified') }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="showQuickActions"
            class="p-2 rounded-xl bg-white/10 dark:bg-dark-900/60 border border-black/10 dark:border-white/10 text-gray-400 hover:text-red-500 hover:border-red-500/40 transition-all duration-200 active:scale-95"
            :title="t('auction.watchlist')"
            @click="handleWatchToggle"
          >
            <Heart :class="auction.isWatchlisted ? 'fill-current text-red-500' : ''" class="w-4 h-4" />
          </button>

          <RouterLink :to="`/auctions/${auction.id}`">
            <button class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-dark-950 font-bold text-xs hover:from-gold-400 hover:to-gold-300 shadow-gold transition-all active:scale-95 flex items-center gap-1.5">
              <Zap class="w-3.5 h-3.5" />
              <span>{{ t('home.placeBid') }}</span>
            </button>
          </RouterLink>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.glass-well {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
  font-family: 'Geist Mono', 'JetBrains Mono', monospace;
}
</style>