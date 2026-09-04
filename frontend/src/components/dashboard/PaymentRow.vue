<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useFormatters } from '@/composables/useFormatters'
import type { PaymentStatus } from '@/types'
import Badge from '@/components/ui/Badge.vue'

interface Props {
  payment: {
    id: string
    auctionId?: string
    auction_id?: string
    auctionTitle: string
    amount: { amount: string; minorUnits: number; currency: string; formatted: string }
    gateway: string
    status: string
    createdAt: string
    txnId: string
  }
}

const props = defineProps<Props>()
const { currency, date, status: statusLabels } = useFormatters()
const { formatMoney } = currency

const statusLabel = computed(() => {
  return statusLabels.getPaymentLabel(props.payment.status as PaymentStatus)
})

function getPaymentGatewayInfo(gateway: string) {
  const gateways: Record<string, { name: string; color: string; icon: string }> = {
    mbank: { name: 'MBank', color: '#0052CC', icon: 'MB' },
    optima: { name: 'Optima Bank', color: '#E60012', icon: 'OB' },
    demirbank: { name: 'DemirBank', color: '#00A651', icon: 'DB' },
    stripe: { name: 'Stripe', color: '#635BFF', icon: 'ST' },
  }
  return gateways[gateway] || { name: gateway, color: 'gray', icon: gateway.charAt(0).toUpperCase() }
}

const gatewayInfo = computed(() => getPaymentGatewayInfo(props.payment.gateway))
</script>

<template>
  <div class="glass rounded-xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-primary/20">
    <!-- Gateway Info -->
    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm" :style="{ backgroundColor: gatewayInfo.color + '20' }">
      <span :style="{ color: gatewayInfo.color }">{{ gatewayInfo.icon }}</span>
    </div>

    <!-- Payment Details -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-3 mb-1">
        <RouterLink v-if="payment.auctionId || payment.auction_id" :to="`/auctions/${payment.auctionId || payment.auction_id}`" class="text-text-primary font-medium truncate hover:text-primary transition-colors">
          {{ payment.auctionTitle }}
        </RouterLink>
        <span v-else class="text-text-primary font-medium truncate">{{ payment.auctionTitle }}</span>
        <Badge :variant="gatewayInfo.color === '#0052CC' ? 'info' : gatewayInfo.color === '#E60012' ? 'danger' : gatewayInfo.color === '#00A651' ? 'success' : 'info'" size="sm">
          {{ gatewayInfo.name }}
        </Badge>
      </div>
      <p class="text-text-muted text-sm">{{ date.formatDateTime(payment.createdAt) }} · TXN: {{ payment.txnId }}</p>
    </div>

    <!-- Amount & Status -->
    <div class="flex flex-col items-end gap-1 shrink-0">
      <p class="text-primary font-bold text-lg">{{ formatMoney(payment.amount) }}</p>
      <Badge :variant="statusLabel.color === 'green' ? 'success' : statusLabel.color === 'yellow' ? 'warning' : statusLabel.color === 'blue' ? 'info' : statusLabel.color === 'red' ? 'danger' : 'gray'">
        {{ statusLabel.label }}
      </Badge>
    </div>
  </div>
</template>