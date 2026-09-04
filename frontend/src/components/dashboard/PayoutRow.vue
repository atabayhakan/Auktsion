<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useFormatters } from '@/composables/useFormatters'
import { useI18n } from '@/composables/useI18n'
import type { PayoutStatus } from '@/types'
import Badge from '@/components/ui/Badge.vue'

interface Props {
  payout: {
    id: string
    amount: { amount: string; minorUnits: number; currency: string; formatted: string }
    bankName: string
    status: string
    requestedAt: string
    completedAt?: string
  }
}

const props = defineProps<Props>()
const { currency, date, status: statusLabels } = useFormatters()
const { formatMoney } = currency
const { t } = useI18n()

const localizedStatus = computed(() => {
  return statusLabels.payout(props.payout.status as PayoutStatus)
})

function getBankInfo(bankName: string) {
  const banks: Record<string, { color: string; icon: string }> = {
    'MBank': { color: '#0052CC', icon: 'MB' },
    'Optima Bank': { color: '#E60012', icon: 'OB' },
    'DemirBank': { color: '#00A651', icon: 'DB' },
  }
  return banks[bankName] || { color: 'gray', icon: bankName.charAt(0).toUpperCase() }
}

const bankInfo = computed(() => getBankInfo(props.payout.bankName))
</script>

<template>
  <div class="glass rounded-xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-primary/20">
    <!-- Bank Info -->
    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm" :style="{ backgroundColor: bankInfo.color + '20' }">
      <span :style="{ color: bankInfo.color }">{{ bankInfo.icon }}</span>
    </div>

    <!-- Payout Details -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-3 mb-1">
        <span class="text-text-primary font-medium">{{ props.payout.bankName }}</span>
      </div>
      <p class="text-text-muted text-sm">{{ date.formatDateTime(props.payout.requestedAt) }} {{ props.payout.completedAt ? '· ' + t('auction.endsAt') + ': ' + date.formatDateTime(props.payout.completedAt) : '' }}</p>
    </div>

    <!-- Amount & Status -->
    <div class="flex flex-col items-end gap-1 shrink-0">
      <p class="text-primary font-bold text-lg">{{ formatMoney(payout.amount) }}</p>
      <Badge variant="info">
        {{ localizedStatus }}
      </Badge>
    </div>
  </div>
</template>