<script setup lang="ts">
import { Activity, Radio, ShieldAlert } from 'lucide-vue-next'
import type { AdminLiveBidEvent } from '@/types/admin'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

const props = defineProps<{
  bids: AdminLiveBidEvent[]
}>()

const emit = defineEmits<{
  (e: 'cancel-bid', bidId: string): void
}>()
</script>

<template>
  <div class="bg-white rounded-3xl overflow-hidden flex flex-col border border-black/[0.08] shadow-xs">
    <!-- Header -->
    <div class="p-4 sm:px-6 border-b border-black/[0.06] flex items-center justify-between bg-slate-50/70">
      <div class="flex items-center gap-2.5">
        <span class="relative flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <h3 class="font-extrabold text-gray-900 text-xs uppercase tracking-wider">
          {{ t('admin.monitoring.feedTicker.heading') }}
        </h3>
      </div>
      <span class="text-[11px] font-mono font-bold text-gray-600 bg-white border border-black/[0.08] px-2.5 py-0.5 rounded-full shadow-2xs">
        {{ t('admin.monitoring.feedTicker.realtime') }}
      </span>
    </div>

    <!-- Feed Content -->
    <div class="p-4 sm:p-6">
      <div v-if="bids.length === 0" class="py-10 text-center space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-100">
          <Radio class="w-6 h-6 animate-pulse" />
        </div>
        <h4 class="text-xs font-bold text-gray-800">
          {{ t('admin.monitoring.feedTicker.emptyTitle') || 'Canlı Teklif Akışı Hazır' }}
        </h4>
        <p class="text-[11px] text-gray-500 max-w-sm mx-auto">
          {{ t('admin.monitoring.feedTicker.emptyDesc') || 'Sistem WebSocket & Kafka üzerinden gerçek zamanlı teklifleri dinliyor. Yeni teklifler anında burada listelenecektir.' }}
        </p>
      </div>

      <div v-else class="space-y-3 max-h-[400px] overflow-y-auto divide-y divide-black/[0.05]">
        <div
          v-for="b in bids"
          :key="b.id"
          class="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 p-2 rounded-xl transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0">
            <img
              :src="b.bidderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'"
              class="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-black/10 shadow-2xs"
            />
            <div class="min-w-0">
              <span class="font-bold text-gray-900 truncate block">{{ b.bidderName }}</span>
              <p class="text-[11px] text-gray-500 truncate mt-0.5">
                {{ b.auctionTitle }}
              </p>
            </div>
          </div>

          <div class="text-right shrink-0">
            <span class="font-extrabold text-amber-600 block text-sm">
              {{ b.amount.formatted }}
            </span>
            <div class="flex items-center justify-end gap-2 text-[10px] text-gray-400 mt-0.5">
              <span>{{ new Date(b.placedAt).toLocaleTimeString() }}</span>
              <button
                class="text-rose-600 hover:text-rose-700 hover:underline font-bold"
                :title="t('admin.monitoring.feedTicker.cancelBidTitle')"
                @click="emit('cancel-bid', b.id)"
              >
                {{ t('admin.monitoring.feedTicker.cancelBidButton') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>