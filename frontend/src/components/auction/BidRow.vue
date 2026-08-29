<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useFormatters } from '@/composables/useFormatters'
import { useI18n } from '@/composables/useI18n'
import type { BidStatus } from '@/types'
import Badge from '@/components/ui/Badge.vue'

interface Props {
  bid: {
    id: string
    auctionTitle: string
    auctionImage: string
    amount: { amount: string; minorUnits: number; currency: string; formatted: string }
    status: string
    auctionId: string
    endsAt: string
    isWinning: boolean
  }
}

const props = defineProps<Props>()
const { currency, status: statusLabels } = useFormatters()
const { formatMoney } = currency
const { t } = useI18n()

const localizedStatus = computed(() => {
  return statusLabels.bid(props.bid.status as BidStatus)
})

const statusBadgeVariant = computed(() => {
  if (props.bid.status === 'winning' || props.bid.status === 'won') return 'success'
  if (props.bid.status === 'outbid' || props.bid.status === 'lost') return 'danger'
  if (props.bid.status === 'active') return 'info'
  return 'warning'
})

const timeRemaining = computed(() => {
  const end = new Date(props.bid.endsAt).getTime()
  const now = Date.now()
  const diff = end - now
  
  if (diff <= 0) return t('auction.auctionEnded')
  
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  
  if (days > 0) return `${days} ${t('common.days')} ${hours} ${t('common.hours')}`
  if (hours > 0) return `${hours} ${t('common.hours')} ${minutes} ${t('common.minutes')}`
  return `${minutes} ${t('common.minutes')}`
})
</script>

<template>
  <div class="glass rounded-xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-primary/20">
    <RouterLink :to="`/auctions/${bid.auctionId}`" class="flex items-center gap-3 flex-1 min-w-0">
      <img
        :src="bid.auctionImage"
        :alt="bid.auctionTitle"
        class="w-16 h-16 rounded-xl object-cover"
      />
      <div class="min-w-0 flex-1">
        <p class="text-text-primary font-medium truncate">{{ bid.auctionTitle }}</p>
        <p class="text-text-muted text-sm">{{ formatMoney(bid.amount) }}</p>
      </div>
    </RouterLink>

    <div class="flex flex-col items-end gap-1 min-w-[140px]">
      <Badge :variant="statusBadgeVariant">
        {{ localizedStatus }}
      </Badge>
      <span class="text-text-muted text-xs">{{ timeRemaining }}</span>
    </div>
  </div>
</template>