<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { 
  Clock, TrendingUp, MapPin, Flame
} from 'lucide-vue-next'
import { useFormatters } from '@/composables/useFormatters'
import { useI18n } from '@/composables/useI18n'
import type { Auction, Money } from '@/types'

interface Props {
  auction: Auction
  priceUpdate?: Money
}

const props = defineProps<Props>()
const { currency } = useFormatters()
const { formatMoney } = currency
const { t } = useI18n()

const currentPrice = computed(() => {
  return props.priceUpdate || props.auction.currentPrice
})

// auction.bidCount/currentPrice are mutated in place by the store when a real
// bid.placed WebSocket event arrives (see stores/auction.ts updateAuctionPrice),
// so this card lights up live on every page it's already rendered on.
const justFlashed = ref(false)
let flashTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.auction.bidCount, () => {
  justFlashed.value = true
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { justFlashed.value = false }, 1800)
})

onUnmounted(() => {
  if (flashTimer) clearTimeout(flashTimer)
})

const timeRemaining = computed(() => {
  if (!props.auction.endsAt) return { text: `2 ${t('common.hours')}`, isEnded: false, isCritical: false }
  const diff = new Date(props.auction.endsAt).getTime() - Date.now()
  if (diff <= 0) return { text: t('auction.auctionEnded'), isEnded: true, isCritical: false }
  
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return { text: `${days}к ${hours % 24}с`, isEnded: false, isCritical: false }
  } else if (hours > 0) {
    return { text: `${hours}с ${minutes}м`, isEnded: false, isCritical: hours < 2 }
  } else {
    return { text: `${minutes}м`, isEnded: false, isCritical: true }
  }
})

// Quick attribute badge
const specificBadge = computed(() => {
  if (props.auction.livestock) {
    return `🐄 ${props.auction.livestock.weightKg ? props.auction.livestock.weightKg + ' кг' : ''} ${props.auction.livestock.breed || ''}`.trim()
  }
  if (props.auction.vehicle) {
    return `🚗 ${props.auction.vehicle.year} • ${props.auction.vehicle.steering === 'right' ? t('auctionCard.rightHandDrive') : t('auctionCard.leftHandDrive')} • ${props.auction.vehicle.isCustomsCleared ? t('auctionCard.customsCleared') : ''}`.trim()
  }
  if (props.auction.realEstate) {
    return `🏢 ${props.auction.realEstate.areaSqm} м² • ${props.auction.realEstate.deedType === 'red_book' ? t('auctionCard.redBook') : t('auctionCard.techPassport')}`
  }
  return null
})
</script>

<template>
  <RouterLink
    :to="`/auctions/${auction.id}`"
    class="glass rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group flex flex-col h-full relative"
    :class="{ 'ring-2 ring-[rgb(var(--color-secondary))] ring-offset-2': justFlashed }"
  >
    <!-- Top-light streak (Liquid Luster signature) -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-10">
      <div class="absolute -inset-y-full -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 animate-shimmer-sweep" />
    </div>

    <!-- Image & Badges -->
    <div class="relative aspect-16/10 overflow-hidden bg-black/5">
      <img
        :src="auction.images[0] || 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=800&auto=format&fit=crop&q=80'"
        :alt="auction.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />

      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 pointer-events-none" />

      <!-- Top Badges -->
      <div class="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
        <span
          class="px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-sm flex items-center gap-1 backdrop-blur-md"
          :class="timeRemaining.isCritical ? 'bg-error animate-pulse' : 'bg-black/60'"
        >
          <Clock class="w-3 h-3" />
          <span>{{ timeRemaining.text }}</span>
        </span>

        <span v-if="auction.isBlitz" class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-error text-white shadow-sm flex items-center gap-1">
          <Flame class="w-3 h-3" />
          <span>{{ t('auctionCard.flashBadge') }}</span>
        </span>

        <span
          :key="auction.bidCount"
          class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary-container text-onPrimaryContainer shadow-sm flex items-center gap-1 animate-bounce-in"
        >
          <TrendingUp class="w-3 h-3" />
          <span>{{ auction.bidCount }} {{ t('common.bids') }}</span>
        </span>
      </div>

      <!-- Specific Category Tag Overlay -->
      <div v-if="specificBadge" class="absolute bottom-2.5 left-2.5 right-2.5 pointer-events-none">
        <span class="inline-block px-2.5 py-1 rounded-xl text-[10px] font-bold bg-black/75 text-primary-container backdrop-blur-md border border-white/10 truncate max-w-full">
          {{ specificBadge }}
        </span>
      </div>
    </div>

    <!-- Content Details -->
    <div class="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white/60">

      <div>
        <div class="flex items-center gap-1 text-[11px] text-text-muted font-medium mb-1">
          <MapPin class="w-3.5 h-3.5 text-secondary flex-shrink-0" />
          <span class="truncate">{{ auction.city }}{{ auction.district ? ', ' + auction.district : '' }}</span>
        </div>

        <h3 class="text-sm font-bold text-text-primary line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {{ auction.title }}
        </h3>
      </div>

      <!-- Price Box -->
      <div class="pt-2 border-t border-black/5 flex items-end justify-between">
        <div>
          <div class="text-[10px] text-text-muted font-medium">{{ t('home.currentPrice') }}</div>
          <div
            class="text-base sm:text-lg font-extrabold text-primary rounded px-1 -mx-1"
            :class="{ 'price-flash': justFlashed }"
          >
            {{ formatMoney(currentPrice) }}
          </div>
        </div>

        <div v-if="auction.buyNowPrice" class="text-right">
          <div class="text-[9px] text-secondary font-bold">{{ t('auctionCard.buyNow') }}</div>
          <div class="text-xs font-bold text-text-secondary font-mono">
            {{ formatMoney(auction.buyNowPrice) }}
          </div>
        </div>
      </div>

    </div>
  </RouterLink>
</template>

<style scoped>
@keyframes shimmer-sweep {
  0% { transform: translateX(0) skewX(-12deg); }
  100% { transform: translateX(600%) skewX(-12deg); }
}
.animate-shimmer-sweep {
  animation: shimmer-sweep 5s ease-in-out infinite;
}

@keyframes price-flash {
  0% { background-color: rgba(var(--color-secondary), 0.22); }
  100% { background-color: transparent; }
}
.price-flash {
  animation: price-flash 1.8s ease-out;
}
</style>