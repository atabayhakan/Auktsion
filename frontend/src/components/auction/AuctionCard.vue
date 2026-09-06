<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Clock, TrendingUp, MapPin, Flame, CheckCircle2,
  Wheat, Car, Building2, Zap, ArrowUpRight, Video
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
    return { text: `${days}д ${hours % 24}ч`, isEnded: false, isCritical: false }
  } else if (hours > 0) {
    return { text: `${hours}ч ${minutes}м`, isEnded: false, isCritical: hours < 2 }
  } else {
    return { text: `${minutes}м`, isEnded: false, isCritical: true }
  }
})

// Clean spec chips without text emojis
const categorySpec = computed(() => {
  if (props.auction.livestock) {
    return {
      icon: Wheat,
      text: `${props.auction.livestock.weightKg ? props.auction.livestock.weightKg + ' кг • ' : ''}${props.auction.livestock.breed || ''}`.trim()
    }
  }
  if (props.auction.vehicle) {
    const steeringText = props.auction.vehicle.steering === 'right' ? 'Прав. руль' : 'Лев. руль'
    const customsText = props.auction.vehicle.isCustomsCleared ? 'Растаможен' : ''
    return {
      icon: Car,
      text: `${props.auction.vehicle.year} • ${steeringText}${customsText ? ' • ' + customsText : ''}`
    }
  }
  if (props.auction.realEstate) {
    const deedText = props.auction.realEstate.deedType === 'red_book' ? 'Красная книга' : 'Техпаспорт'
    return {
      icon: Building2,
      text: `${props.auction.realEstate.areaSqm} м² • ${deedText}`
    }
  }
  return null
})
</script>

<template>
  <RouterLink
    :to="`/auctions/${auction.id}`"
    class="bg-white rounded-2xl overflow-hidden border border-black/[0.08] hover:border-amber-500/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full relative"
    :class="{ 'ring-2 ring-amber-500 ring-offset-2': justFlashed }"
  >
    <!-- Top Image Container -->
    <div class="relative aspect-16/10 overflow-hidden bg-slate-100">
      <img
        :src="auction.images[0] || '/placeholder-lot.svg'"
        :alt="auction.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/15 pointer-events-none" />

      <!-- Top Floating Badges -->
      <div class="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
        <!-- Countdown Badge -->
        <span
          class="px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white shadow-sm flex items-center gap-1 backdrop-blur-md"
          :class="timeRemaining.isCritical ? 'bg-rose-600 animate-pulse' : 'bg-black/60 border border-white/10'"
        >
          <Clock class="w-3 h-3" />
          <span>{{ timeRemaining.text }}</span>
        </span>

        <div class="flex items-center gap-1.5">
          <!-- Video Listing Badge (Feature 18) -->
          <span
            v-if="auction.videoUrl || (auction as any).video_url"
            class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-sm flex items-center gap-1"
            title="Видеолуу лот"
          >
            <Video class="w-3 h-3" />
            <span>ВИДЕО</span>
          </span>

          <!-- Blitz Flame Badge -->
          <span v-if="auction.isBlitz" class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-sm flex items-center gap-1">
            <Flame class="w-3 h-3" />
            <span>HOT</span>
          </span>

          <!-- Bids Count Badge -->
          <span
            :key="auction.bidCount"
            class="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-400 text-gray-950 shadow-sm flex items-center gap-1"
            :class="{ 'animate-bounce': justFlashed }"
          >
            <TrendingUp class="w-3 h-3" />
            <span>{{ auction.bidCount }}</span>
          </span>
        </div>
      </div>

      <!-- Spec Attribute Tag (Bottom of image) -->
      <div v-if="categorySpec" class="absolute bottom-2.5 left-2.5 right-2.5 pointer-events-none">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-black/75 text-white backdrop-blur-md border border-white/10 truncate max-w-full">
          <component :is="categorySpec.icon" class="w-3 h-3 text-amber-400 shrink-0" />
          <span class="truncate">{{ categorySpec.text }}</span>
        </span>
      </div>
    </div>

    <!-- Card Body Content -->
    <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
      
      <div>
        <!-- City & Seller Line -->
        <div class="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
          <div class="flex items-center gap-1 truncate">
            <MapPin class="w-3 h-3 text-gray-400 shrink-0" />
            <span class="truncate">{{ auction.city }}{{ auction.district ? ', ' + auction.district : '' }}</span>
          </div>
          <div v-if="auction.seller?.rating" class="flex items-center gap-0.5 font-bold text-amber-600 shrink-0">
            <span>⭐ {{ auction.seller.rating }}</span>
          </div>
        </div>

        <!-- Lot Title -->
        <h3 class="text-xs sm:text-sm font-extrabold text-gray-950 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {{ auction.title }}
        </h3>
      </div>

      <!-- Price Box Matrix -->
      <div class="pt-2.5 border-t border-black/[0.06] flex items-end justify-between">
        <div>
          <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Текущая ставка</div>
          <div
            class="text-base sm:text-lg font-black text-gray-950 font-mono tracking-tight transition-colors"
            :class="{ 'text-amber-600': justFlashed }"
          >
            {{ formatMoney(currentPrice) }}
          </div>
        </div>

        <!-- Buy Now or Action Button -->
        <div class="text-right">
          <div v-if="auction.buyNowPrice" class="space-y-0.5">
            <div class="text-[9px] font-black text-emerald-700 uppercase flex items-center justify-end gap-0.5">
              <Zap class="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
              <span>Купить сразу</span>
            </div>
            <div class="text-xs font-bold text-gray-600 font-mono">
              {{ formatMoney(auction.buyNowPrice) }}
            </div>
          </div>
          <div v-else class="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-primary group-hover:text-gray-950 flex items-center justify-center text-gray-600 transition-colors">
            <ArrowUpRight class="w-4 h-4" />
          </div>
        </div>
      </div>

    </div>
  </RouterLink>
</template>

<style scoped>
</style>