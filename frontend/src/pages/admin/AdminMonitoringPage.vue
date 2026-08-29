<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Activity,
  Pause,
  Clock,
  Flame,
  User,
  CheckCircle2
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import LiveFeedTicker from '@/components/admin/LiveFeedTicker.vue'
import { useI18n } from '@/composables/useI18n'

const adminStore = useAdminStore()
const { t } = useI18n()

const toastMessage = ref<string | null>(null)
const now = ref(Date.now())
let tickInterval: any = null

onMounted(async () => {
  await adminStore.fetchMonitoring()
  tickInterval = setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (tickInterval) clearInterval(tickInterval)
})

function showToast(msg: string) {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3500)
}

function formatCountdown(endsAt: string) {
  const seconds = Math.max(0, Math.floor((new Date(endsAt).getTime() - now.value) / 1000))
  if (seconds <= 0) return t('admin.monitoring.countdownEnded')
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const hourUnit = t('admin.monitoring.hourUnit')
  const minuteUnit = t('admin.monitoring.minuteUnit')
  const secondUnit = t('admin.monitoring.secondUnit')
  if (h > 0) {
    return `${h}${hourUnit} ${m}${minuteUnit} ${s}${secondUnit}`
  }
  return `${m}${minuteUnit} ${s}${secondUnit}`
}

async function handleTogglePause(id: string) {
  const success = await adminStore.toggleAuctionPause(id)
  showToast(success ? t('admin.monitoring.toast.pauseSuccess', { id }) : t('admin.monitoring.toast.pauseFailure', { id }))
}

async function handleCancelBid(bidId: string) {
  const success = await adminStore.cancelSuspiciousBid(bidId, t('admin.monitoring.autoCancelReason'))
  if (success) {
    showToast(t('admin.monitoring.toast.bidCancelled'))
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2.5">
          <Activity class="w-6 h-6 text-error animate-pulse" />
          <span>{{ t('admin.monitoring.title') }}</span>
        </h1>
        <p class="text-xs text-text-muted mt-1">
          {{ t('admin.monitoring.subtitle') }}
        </p>
      </div>

      <!-- Live WebSocket Indicator Badge -->
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30 text-success text-xs font-bold shadow-xs">
        <span class="relative flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
        </span>
        <span>{{ t('admin.monitoring.websocketActive') }}</span>
      </div>
    </div>

    <!-- Active Live Auctions Grid -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
          <Flame class="w-4 h-4 text-amber-500" />
          <span>{{ t('admin.monitoring.activeCountdownGrid') }}</span>
        </h3>
        <span class="text-xs text-text-muted font-mono">{{ t('admin.monitoring.activeLotsCount', { count: adminStore.liveAuctions.length }) }}</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="auc in adminStore.liveAuctions"
          :key="auc.id"
          class="bg-white border border-border rounded-2xl p-4 shadow-xs space-y-3 transition-all relative overflow-hidden"
        >
          <!-- Top Tag & Time Remaining -->
          <div class="flex items-center justify-between text-xs">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary">
              {{ auc.category }}
            </span>

            <div class="flex items-center gap-1.5 font-bold font-mono text-text-primary">
              <Clock class="w-3.5 h-3.5 text-primary" />
              <span>{{ formatCountdown(auc.endsAt) }}</span>
            </div>
          </div>

          <!-- Thumbnail & Title -->
          <div class="flex gap-3">
            <img
              :src="auc.images[0]"
              class="w-16 h-16 rounded-xl object-cover shrink-0 ring-1 ring-border"
            />
            <div class="min-w-0">
              <h4 class="font-bold text-text-primary text-xs truncate">{{ auc.title }}</h4>
              <span class="text-[10px] text-text-muted">{{ auc.city }} • ID: {{ auc.id }}</span>
              <div class="mt-1">
                <span class="font-extrabold text-base text-primary block">{{ auc.currentPrice.formatted }}</span>
              </div>
            </div>
          </div>

          <!-- Bid Count -->
          <div class="p-2.5 rounded-xl bg-accent/50 border border-border flex items-center justify-between text-[11px]">
            <div class="flex items-center gap-2">
              <User class="w-3.5 h-3.5 text-text-muted" />
              <span class="font-medium text-text-primary">{{ t('admin.monitoring.bidsPlaced') }}</span>
            </div>
            <span class="text-text-muted font-mono font-bold">{{ auc.bidCount }}</span>
          </div>

          <!-- Quick Action Buttons -->
          <div class="pt-2 border-t border-border flex items-center justify-between gap-2">
            <button
              @click="handleTogglePause(auc.id)"
              class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors bg-warning/20 text-warning hover:bg-warning/30"
            >
              <Pause class="w-3.5 h-3.5" />
              <span>{{ t('admin.monitoring.actions.pauseAuction') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Bidding Stream -->
    <div class="grid grid-cols-1 gap-6">
      <LiveFeedTicker
        :bids="adminStore.liveBids"
        @cancel-bid="handleCancelBid"
      />
    </div>

    <!-- Global Toast Notification -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 bg-white border border-black/10 text-text-primary px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200"
    >
      <CheckCircle2 class="w-4 h-4 text-success" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
