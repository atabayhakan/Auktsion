// src/stores/recommendations.ts
// "For You" — derived entirely from the user's watchlist (see
// server/src/controllers/userController.ts getRecommendations). No browsing
// history or ML model exists, so this never fabricates suggestions: logged
// out or watching nothing both simply mean an empty list.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Auction } from '@/types'

export const useRecommendationsStore = defineStore('recommendations', () => {
  const items = ref<Auction[]>([])
  const isLoading = ref(false)
  const hasFetched = ref(false)

  async function fetchRecommendations() {
    isLoading.value = true
    try {
      if (window.axios) {
        const response = await window.axios.get('/api/user/recommendations')
        if (response?.data?.data) {
          items.value = response.data.data
        }
      }
    } catch {
      // Not logged in, or no watchlist yet — the section just stays hidden.
      items.value = []
    } finally {
      isLoading.value = false
      hasFetched.value = true
    }
  }

  return {
    items,
    isLoading,
    hasFetched,
    fetchRecommendations,
  }
})
