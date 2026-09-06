// frontend/src/stores/feature.ts
// Central feature flags and social/AI commerce features store

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/services/api'

export interface PublicFeatureConfig {
  groupBuy: {
    enabled: boolean
    minParticipants: number
    defaultDurationHours: number
    autoRefundOnFail: boolean
  }
  aiValuation: {
    enabled: boolean
    dailyUserLimit: number
  }
  priceDropAlert: {
    enabled: boolean
    minDropPct: number
  }
  sellerComparison: {
    enabled: boolean
    minSellerCount: number
  }
  aiAssistant: {
    enabled: boolean
    showSuggestions: boolean
  }
  videoListing: {
    enabled: boolean
    maxDurationSeconds: number
    maxFileSizeMb: number
  }
}

export interface GroupBuyData {
  id: string
  auctionId: string
  creatorId: string
  targetParticipants: number
  currentParticipants: number
  tierPrice1: number
  tierPrice5: number
  tierPrice10: number
  currentPrice: number
  status: 'active' | 'completed' | 'failed' | 'expired'
  expiresAt: string
  createdAt: string
  participants: Array<{
    id: string
    userId: string
    userName: string
    userAvatar?: string
    joinedAt: string
  }>
}

export interface MatchingSeller {
  id: string
  title: string
  currentPrice: number
  startingPrice: number
  sellerId: string
  sellerName: string
  sellerRating: number
  city: string
  deliveryDays: number
  images: string[]
  isBestOffer: boolean
}

export interface AiValuationResult {
  suggestedTitle: string
  suggestedCategory: string
  suggestedModel: string
  conditionEstimate: string
  estimatedMarketValueMin: number
  estimatedMarketValueMax: number
  recommendedStartPrice: number
  recommendedBuyNowPrice: number
  currency: string
  confidenceScore: number
  notes: string
}

export interface AiAssistantResponse {
  reply: string
  recommendedAuctions: Array<{
    id: string
    title: string
    currentPrice: number
    category: string
    city: string
    imageUrl: string
  }>
  quickSuggestions: string[]
}

export const useFeatureStore = defineStore('feature', () => {
  const config = ref<PublicFeatureConfig>({
    groupBuy: {
      enabled: true,
      minParticipants: 3,
      defaultDurationHours: 24,
      autoRefundOnFail: true
    },
    aiValuation: {
      enabled: true,
      dailyUserLimit: 5
    },
    priceDropAlert: {
      enabled: true,
      minDropPct: 5
    },
    sellerComparison: {
      enabled: true,
      minSellerCount: 2
    },
    aiAssistant: {
      enabled: true,
      showSuggestions: true
    },
    videoListing: {
      enabled: true,
      maxDurationSeconds: 30,
      maxFileSizeMb: 25
    }
  })

  const isLoading = ref(false)
  const isInitialized = ref(false)

  // Reactive Feature Flag Getters
  const isGroupBuyEnabled = computed(() => config.value.groupBuy?.enabled ?? true)
  const isAiValuationEnabled = computed(() => config.value.aiValuation?.enabled ?? true)
  const isPriceDropAlertEnabled = computed(() => config.value.priceDropAlert?.enabled ?? true)
  const isSellerComparisonEnabled = computed(() => config.value.sellerComparison?.enabled ?? true)
  const isAiAssistantEnabled = computed(() => config.value.aiAssistant?.enabled ?? true)
  const isVideoListingEnabled = computed(() => config.value.videoListing?.enabled ?? true)

  // Fetch Public Flags from Backend
  async function fetchFeaturesConfig() {
    isLoading.value = true
    try {
      const res = await apiClient.get<any>('/api/config/features')
      if (res && res.success && res.data) {
        config.value = res.data
        isInitialized.value = true
      }
    } catch (err) {
      console.warn('[FeatureStore] Using default feature config:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Feature 11: Group Buy Actions
  async function getAuctionGroupBuy(auctionId: string): Promise<GroupBuyData | null> {
    try {
      const res = await apiClient.get<any>(`/api/auctions/${auctionId}/group-buy`)
      if (res && res.success && res.data) {
        return res.data
      }
      return null
    } catch (err) {
      console.error('[FeatureStore] getAuctionGroupBuy failed:', err)
      return null
    }
  }

  async function joinGroupBuy(groupBuyId: string): Promise<any> {
    const res = await apiClient.post<any>(`/api/group-buys/${groupBuyId}/join`)
    return res
  }

  // Feature 13: AI Valuation Action
  async function evaluateProduct(formData: FormData): Promise<AiValuationResult> {
    const res = await apiClient.post<any>('/api/ai/evaluate-product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    if (res && res.success && res.data) {
      return res.data
    }
    throw new Error(res?.message || 'AI valuation failed')
  }

  // Feature 14: Price Drop Alert Actions
  async function createPriceAlert(auctionId: string, targetPrice?: number, channels?: any) {
    const res = await apiClient.post<any>(`/api/auctions/${auctionId}/price-alert`, {
      targetPrice,
      channels
    })
    return res
  }

  async function getUserPriceAlerts() {
    const res = await apiClient.get<any>('/api/user/price-alerts')
    return res?.data || []
  }

  async function deletePriceAlert(alertId: string) {
    const res = await apiClient.delete<any>(`/api/user/price-alerts/${alertId}`)
    return res
  }

  // Feature 16: Multi-Seller Comparison
  async function getMatchingSellers(auctionId: string): Promise<MatchingSeller[]> {
    try {
      const res = await apiClient.get<any>(`/api/auctions/${auctionId}/sellers`)
      if (res && res.success && Array.isArray(res.data)) {
        return res.data
      }
      return []
    } catch (err) {
      console.error('[FeatureStore] getMatchingSellers failed:', err)
      return []
    }
  }

  // Feature 17: AI Shopping Assistant
  async function askAiAssistant(message: string, history: Array<{ role: string; content: string }> = []): Promise<AiAssistantResponse> {
    const res = await apiClient.post<any>('/api/ai/shopping-assistant', {
      query: message,
      message,
      history
    })
    if (res && res.success && res.data) {
      return res.data
    }
    throw new Error(res?.message || 'AI assistant request failed')
  }

  return {
    config,
    isLoading,
    isInitialized,

    // Flags
    isGroupBuyEnabled,
    isAiValuationEnabled,
    isPriceDropAlertEnabled,
    isSellerComparisonEnabled,
    isAiAssistantEnabled,
    isVideoListingEnabled,

    // Actions
    fetchFeaturesConfig,
    getAuctionGroupBuy,
    joinGroupBuy,
    evaluateProduct,
    createPriceAlert,
    getUserPriceAlerts,
    deletePriceAlert,
    getMatchingSellers,
    askAiAssistant
  }
})

export default useFeatureStore
