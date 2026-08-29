// src/stores/activity.ts
// Cross-auction "what's happening right now" feed. Backed entirely by real
// bids (GET /api/activity/recent, server/src/models/bidModel.ts
// getRecentActivity) plus live bid.placed WebSocket events — no fabricated
// watcher counts or trending scores.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Money } from '@/types'

export interface ActivityItem {
  id: string
  auctionId: string
  auctionTitle: string
  auctionImage: string
  bidderName: string
  amount: Money
  placedAt: string
}

const MAX_ITEMS = 10

export const useActivityStore = defineStore('activity', () => {
  const items = ref<ActivityItem[]>([])
  const isLoading = ref(false)

  async function fetchInitial() {
    isLoading.value = true
    try {
      if (window.axios) {
        const response = await window.axios.get('/api/activity/recent', { limit: MAX_ITEMS })
        if (response?.data?.data) {
          items.value = response.data.data
        }
      }
    } catch {
      // Non-critical — the homepage works fine without this feed.
    } finally {
      isLoading.value = false
    }
  }

  function pushLive(item: ActivityItem) {
    items.value = [item, ...items.value.filter(i => i.id !== item.id)].slice(0, MAX_ITEMS)
  }

  return {
    items,
    isLoading,
    fetchInitial,
    pushLive,
  }
})
