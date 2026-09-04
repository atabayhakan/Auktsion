<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useActivityStore } from '@/stores/activity'
import { useFormatters } from '@/composables/useFormatters'
import { useI18n } from '@/composables/useI18n'

const activityStore = useActivityStore()
const { date } = useFormatters()
const { t } = useI18n()

const items = computed(() => activityStore.items)
</script>

<template>
  <div v-if="items.length > 0" class="glass rounded-2xl divide-y divide-border/60 overflow-hidden">
    <RouterLink
      v-for="item in items"
      :key="item.id"
      :to="`/auctions/${item.auctionId}`"
      class="flex items-center gap-3 p-3.5 hover:bg-accent/40 transition-colors"
    >
      <span class="relative flex h-2 w-2 flex-shrink-0" aria-hidden="true">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
        <span class="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
      </span>

      <img
        v-if="item.auctionImage"
        :src="item.auctionImage"
        :alt="item.auctionTitle"
        class="w-9 h-9 rounded-lg object-cover flex-shrink-0"
        loading="lazy"
      />

      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-text-primary truncate">
          {{ t('discovery.liveActivity.newBid', { title: item.auctionTitle || t('discovery.liveActivity.unknownLot') }) }}
        </p>
        <p class="text-xs text-text-muted truncate">
          <span v-if="item.bidderName">{{ item.bidderName }} · </span>{{ date.formatRelative(item.placedAt) }}
        </p>
      </div>

      <span class="text-sm font-bold text-primary flex-shrink-0">{{ item.amount?.formatted }}</span>
    </RouterLink>
  </div>
</template>
