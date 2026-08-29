<script setup lang="ts">
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
  <div class="glass rounded-2xl overflow-hidden flex flex-col h-full">
    <!-- Header -->
    <div class="p-4 border-b border-border flex items-center justify-between bg-accent/40">
      <div class="flex items-center gap-2.5">
        <span class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <h3 class="font-bold text-text-primary text-xs uppercase tracking-wider">
          {{ t('admin.monitoring.feedTicker.heading') }}
        </h3>
      </div>
      <span class="text-[10px] font-mono font-bold text-text-muted bg-accent px-2 py-0.5 rounded-full">
        {{ t('admin.monitoring.feedTicker.realtime') }}
      </span>
    </div>

    <!-- Feed List -->
    <div class="flex-1 p-3 overflow-y-auto space-y-2.5 max-h-[500px] divide-y divide-border">
      <div
        v-for="b in bids"
        :key="b.id"
        class="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs transition-all"
      >
        <div class="flex items-center gap-3 min-w-0">
          <img
            :src="b.bidderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'"
            class="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-border"
          />
          <div class="min-w-0">
            <span class="font-bold text-text-primary truncate block">{{ b.bidderName }}</span>
            <p class="text-[11px] text-text-muted truncate mt-0.5">
              {{ b.auctionTitle }}
            </p>
          </div>
        </div>

        <div class="text-right shrink-0">
          <span class="font-extrabold text-primary block text-sm">
            {{ b.amount.formatted }}
          </span>
          <div class="flex items-center justify-end gap-1.5 text-[10px] text-text-muted">
            <span>{{ new Date(b.placedAt).toLocaleTimeString('ru-RU') }}</span>
            <button
              class="text-error hover:underline font-bold"
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
</template>
