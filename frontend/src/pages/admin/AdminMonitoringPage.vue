<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Activity,
  Pause,
  Clock,
  Flame,
  User,
  CheckCircle2,
  Radio,
  ShieldCheck,
  Zap,
  Cpu,
  AlertTriangle,
  Server,
  Play
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
  if (seconds <= 0) return t('admin.monitoring.countdownEnded') || 'Sona Erdi'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const hourUnit = t('admin.monitoring.hourUnit') || 'sa'
  const minuteUnit = t('admin.monitoring.minuteUnit') || 'dk'
  const secondUnit = t('admin.monitoring.secondUnit') || 'sn'
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
  <div class="space-y-6 font-sans">
    <!-- Page Header & Top Badge -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold mb-2">
          <Activity class="w-3.5 h-3.5 text-rose-600 animate-pulse" />
          <span>{{ t('admin.monitoring.vitals.wsConnected') || 'WebSocket Canlı Ticker Aktif' }}</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-3">
          <span>{{ t('admin.monitoring.title') || 'Canlı İzleme ve Operasyon Merkezi (War Room)' }}</span>
        </h1>
        <p class="text-xs sm:text-sm text-gray-500 mt-1">
          {{ t('admin.monitoring.subtitle') || 'Gerçek zamanlı açık artırmalar, zamanlayıcılar, anti-fraud kontrolü ve acil yönetici durdurması' }}
        </p>
      </div>

      <!-- Live WebSocket Indicator Badge -->
      <div class="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-extrabold shadow-2xs">
        <span class="relative flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span>{{ t('admin.monitoring.websocketActive') || 'Canlı Akış Çevrimiçi' }}</span>
      </div>
    </div>

    <!-- System Vitals Ribbon (4 Telemetry Cards) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      <div class="bg-white rounded-2xl p-4 border border-black/[0.08] shadow-xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
          <ShieldCheck class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
            {{ t('admin.monitoring.vitals.antiFraud') || 'Anti-Fraud Koruması' }}
          </span>
          <span class="text-xs sm:text-sm font-extrabold text-gray-900 mt-0.5 block truncate">
            {{ t('admin.monitoring.vitals.antiFraudActive') || 'Aktif (0 Şüpheli)' }}
          </span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-black/[0.08] shadow-xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
          <Zap class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
            {{ t('admin.monitoring.vitals.eventRate') || 'Kafka Olay Hızı' }}
          </span>
          <span class="text-xs sm:text-sm font-extrabold text-gray-900 mt-0.5 block truncate">
            1,240 msg/sn
          </span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-black/[0.08] shadow-xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
          <Cpu class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
            {{ t('admin.monitoring.vitals.latency') || 'P99 Ağ Gecikmesi' }}
          </span>
          <span class="text-xs sm:text-sm font-extrabold text-gray-900 mt-0.5 block truncate">
            &lt; 14 ms
          </span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-black/[0.08] shadow-xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
          <Server class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
            {{ t('admin.monitoring.vitals.safeMode') || 'Platform Durumu' }}
          </span>
          <span class="text-xs sm:text-sm font-extrabold text-emerald-600 mt-0.5 block truncate">
            {{ t('admin.monitoring.vitals.safeModeNormal') || 'Normal Çalışma' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Active Live Auctions Section -->
    <div class="bg-white rounded-3xl p-6 border border-black/[0.08] shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-black/[0.05] pb-3.5">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Flame class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-gray-900">
              {{ t('admin.monitoring.activeCountdownGrid') || 'Aktif Canlı Açık Artırmalar' }}
            </h3>
          </div>
        </div>

        <span class="text-xs font-mono font-bold text-gray-500 bg-slate-100 px-3 py-1 rounded-full border border-black/[0.05]">
          {{ t('admin.monitoring.activeLotsCount', { count: adminStore.liveAuctions.length }) }}
        </span>
      </div>

      <!-- If Live Auctions Exist -->
      <div v-if="adminStore.liveAuctions.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <div
          v-for="auc in adminStore.liveAuctions"
          :key="auc.id"
          class="bg-white border border-black/[0.08] hover:border-primary/50 hover:shadow-md rounded-2xl p-4.5 space-y-3 transition-all relative overflow-hidden"
        >
          <!-- Top Tag & Time Remaining -->
          <div class="flex items-center justify-between text-xs">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-amber-950 border border-primary/20">
              {{ auc.category }}
            </span>

            <div class="flex items-center gap-1.5 font-bold font-mono text-gray-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
              <Clock class="w-3.5 h-3.5 text-primary" />
              <span>{{ formatCountdown(auc.endsAt) }}</span>
            </div>
          </div>

          <!-- Thumbnail & Title -->
          <div class="flex gap-3">
            <img
              :src="auc.images[0]"
              class="w-16 h-16 rounded-xl object-cover shrink-0 ring-1 ring-black/10 shadow-2xs"
            />
            <div class="min-w-0">
              <h4 class="font-extrabold text-gray-900 text-xs truncate">{{ auc.title }}</h4>
              <span class="text-[10px] text-gray-400">{{ auc.city }} • ID: {{ auc.id }}</span>
              <div class="mt-1">
                <span class="font-black text-base text-primary block">{{ auc.currentPrice.formatted }}</span>
              </div>
            </div>
          </div>

          <!-- Bid Count -->
          <div class="p-2.5 rounded-xl bg-slate-50 border border-black/[0.04] flex items-center justify-between text-[11px]">
            <div class="flex items-center gap-2">
              <User class="w-3.5 h-3.5 text-gray-400" />
              <span class="font-semibold text-gray-700">{{ t('admin.monitoring.bidsPlaced') || 'Verilen Teklifler' }}</span>
            </div>
            <span class="text-gray-900 font-mono font-bold">{{ auc.bidCount }}</span>
          </div>

          <!-- Quick Action Buttons -->
          <div class="pt-2 border-t border-black/[0.06] flex items-center justify-between gap-2">
            <button
              class="w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors bg-amber-500/10 text-amber-900 hover:bg-amber-500/20 border border-amber-500/20"
              @click="handleTogglePause(auc.id)"
            >
              <Pause class="w-3.5 h-3.5 text-amber-700" />
              <span>{{ t('admin.monitoring.actions.pauseAuction') || 'Açık Artırmayı Duraklat' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State When 0 Active Live Auctions -->
      <div v-else class="py-10 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-black/10">
        <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-100">
          <Radio class="w-7 h-7 animate-pulse" />
        </div>
        <div class="space-y-1">
          <h4 class="text-sm font-extrabold text-gray-900">
            {{ t('admin.monitoring.emptyLiveAuctionsTitle') || 'Şu Anda Aktif Canlı Açık Artırma Yok' }}
          </h4>
          <p class="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            {{ t('admin.monitoring.emptyLiveAuctionsDesc') || 'Yeni bir açık artırma başladığında sayaçlar ve anti-fraud kontrolleri gerçek zamanlı olarak bu alanda aktif olacaktır.' }}
          </p>
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
      class="fixed bottom-6 right-6 z-50 bg-white border border-black/10 text-gray-900 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom duration-200"
    >
      <CheckCircle2 class="w-4 h-4 text-emerald-600" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>