<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useFormatters } from '@/composables/useFormatters'
import { useI18n } from '@/composables/useI18n'
import type { AuctionStatus } from '@/types'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'

interface Props {
  listing: {
    id: string
    title: string
    image: string
    currentPrice: { amount: string; minorUnits: number; currency: string; formatted: string }
    bidCount: number
    status: string
    endsAt: string
    views: number
  }
  showActions?: boolean
}

const props = defineProps<Props>()
const { currency, status: statusLabels } = useFormatters()
const { formatMoney } = currency
const { t } = useI18n()

const localizedStatus = computed(() => {
  return statusLabels.auction(props.listing.status as AuctionStatus)
})

const timeRemaining = computed(() => {
  const end = new Date(props.listing.endsAt).getTime()
  const now = Date.now()
  const diff = end - now
  
  if (diff <= 0) return { text: t('auction.auctionEnded'), isEnded: true, isCritical: false }
  
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  
  if (days > 0) return { text: `${days} ${t('common.days')} ${hours} ${t('common.hours')}`, isEnded: false, isCritical: days <= 1 }
  if (hours > 0) return { text: `${hours} ${t('common.hours')} ${minutes} ${t('common.minutes')}`, isEnded: false, isCritical: hours <= 1 }
  return { text: `${minutes} ${t('common.minutes')}`, isEnded: false, isCritical: true }
})

function getStatusBadgeVariant(status: string): 'default' | 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'gray' {
  const variants: Record<string, 'default' | 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
    active: 'success',
    pending_approval: 'warning',
    ended_sold: 'success',
    ended_unsold: 'gray',
    ended_reserve_not_met: 'warning',
    cancelled: 'danger',
    disputed: 'danger',
  }
  return variants[status] || 'default'
}
</script>

<template>
  <RouterLink :to="`/auctions/${listing.id}`" class="block">
    <Card variant="glass" class="p-0 overflow-hidden hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all duration-300">
      <!-- Image -->
      <div class="relative aspect-[4/3] overflow-hidden">
        <img 
          :src="listing.image" 
          :alt="listing.title"
          class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        
        <!-- Status Badge -->
        <div class="absolute top-3 right-3">
          <Badge :variant="getStatusBadgeVariant(listing.status)" class="text-sm">
            {{ localizedStatus }}
          </Badge>
        </div>
        
        <!-- Countdown -->
        <div class="absolute bottom-3 left-3 right-3">
          <div class="glass rounded-xl px-3 py-1.5 text-center">
            <span class="font-mono text-text-primary text-sm" :class="{ 'text-red-400 animate-pulse': timeRemaining.isCritical && !timeRemaining.isEnded }">
              {{ timeRemaining.text }}
            </span>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-3">
        <h3 class="text-sm font-bold text-text-primary line-clamp-1">{{ listing.title }}</h3>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-primary font-bold text-xl">{{ formatMoney(listing.currentPrice) }}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-text-muted">
            <span class="flex items-center gap-1">
              {{ listing.bidCount }} {{ t('common.bids') }}
            </span>
            <span class="flex items-center gap-1">
              {{ listing.views.toLocaleString() }} {{ t('common.views') }}
            </span>
          </div>
        </div>
      </div>
    </Card>
  </RouterLink>
</template>