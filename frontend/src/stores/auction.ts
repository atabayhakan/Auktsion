// src/stores/auction.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Auction, AuctionFilters, Money } from '@/types'
import apiClient from '@/services/api'

export const useAuctionStore = defineStore('auction', () => {
  // State
  const auctions = ref<Auction[]>([])
  const currentAuction = ref<Auction | null>(null)
  const filters = ref<AuctionFilters>({
    page: 1,
    perPage: 20,
    sortBy: 'ending_soon',
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(false)
  const totalCount = ref(0)
  
  // Real-time bid updates
  const priceUpdates = ref<Map<string, Money>>(new Map())

  // Getters
  const activeAuctions = computed(() => 
    auctions.value.filter(a => a.status === 'active')
  )
  
  const endingSoonAuctions = computed(() => 
    activeAuctions.value
      .filter(a => new Date(a.endsAt).getTime() - Date.now() < 3600000 * 24)
      .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime())
  )

  const featuredAuctions = computed(() =>
    activeAuctions.value
      .filter(a => a.isWatching || a.bidCount > 10)
      .slice(0, 6)
  )

  const newestAuctions = computed(() =>
    [...activeAuctions.value]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  )

  const mostActiveAuctions = computed(() =>
    [...activeAuctions.value]
      .sort((a, b) => b.bidCount - a.bidCount)
  )

  // Actions
  async function fetchAuctions(newFilters?: Partial<AuctionFilters>, append = false) {
    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters, page: append ? filters.value.page : 1 }
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await apiClient.get<any>('/api/auctions', filters.value)
      if (response?.data?.data && Array.isArray(response.data.data)) {
        if (append) {
          const existingIds = new Set(auctions.value.map(a => a.id))
          const fresh = response.data.data.filter((a: any) => !existingIds.has(a.id))
          auctions.value = [...auctions.value, ...fresh]
        } else {
          auctions.value = response.data.data
        }
        hasMore.value = Boolean(response.data.meta && response.data.meta.currentPage < response.data.meta.lastPage)
        totalCount.value = response.data.meta?.total ?? response.data.data.length
        return
      }
      
      auctions.value = []
      totalCount.value = 0
      hasMore.value = false
    } catch (err: any) {
      console.error('API error fetching auctions:', err)
      error.value = err.message || 'Ошибка загрузки аукционов'
      if (!append) {
        auctions.value = []
        totalCount.value = 0
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAuction(id: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await apiClient.get<any>(`/api/auctions/${id}`)
      if (response?.data?.data) {
        currentAuction.value = response.data.data
        return currentAuction.value
      }
      
      const found = auctions.value.find(a => a.id === id) || null
      currentAuction.value = found
      return currentAuction.value
    } catch (err: any) {
      const found = auctions.value.find(a => a.id === id) || null
      currentAuction.value = found
      return currentAuction.value
    } finally {
      isLoading.value = false
    }
  }

  function getAuctionById(id: string) {
    return auctions.value.find(a => a.id === id) || null
  }

  function updateAuctionPrice(auctionId: string, newPrice: Money, bidCount: number) {
    const auction = auctions.value.find(a => a.id === auctionId)
    if (auction) {
      auction.currentPrice = newPrice
      auction.bidCount = bidCount
    }
    
    if (currentAuction.value?.id === auctionId) {
      currentAuction.value.currentPrice = newPrice
      currentAuction.value.bidCount = bidCount
    }
    
    priceUpdates.value.set(auctionId, newPrice)
    
    // Auto-clear after 5 seconds
    setTimeout(() => priceUpdates.value.delete(auctionId), 5000)
  }

  function setAuctionStatus(auctionId: string, status: Auction['status']) {
    const auction = auctions.value.find(a => a.id === auctionId)
    if (auction) auction.status = status
    
    if (currentAuction.value?.id === auctionId) {
      currentAuction.value.status = status
    }
  }

  function setWatchlisted(auctionId: string, isWatching: boolean) {
    const auction = auctions.value.find(a => a.id === auctionId)
    if (auction) auction.isWatching = isWatching
    
    if (currentAuction.value?.id === auctionId) {
      currentAuction.value.isWatching = isWatching
    }
  }

  function clearCurrentAuction() {
    currentAuction.value = null
  }

  function clearAuctions() {
    auctions.value = []
    hasMore.value = false
    totalCount.value = 0
    filters.value.page = 1
  }

  function resetFilters() {
    filters.value = {
      page: 1,
      perPage: 20,
      sortBy: 'ending_soon',
    }
  }

  function addAuction(auction: any) {
    const formatted: Auction = {
      id: auction.id || 'auc-' + Date.now(),
      title: auction.title || '',
      description: auction.description || '',
      category: auction.category || 'other',
      city: auction.city || 'Бишкек',
      startingPrice: auction.startingPrice && typeof auction.startingPrice === 'object'
        ? auction.startingPrice
        : { amount: String(auction.startingPrice || 0), currency: 'KGS', minorUnits: (Number(auction.startingPrice) || 0) * 100 },
      currentPrice: auction.currentPrice && typeof auction.currentPrice === 'object'
        ? auction.currentPrice
        : { amount: String(auction.startingPrice || 0), currency: 'KGS', minorUnits: (Number(auction.startingPrice) || 0) * 100 },
      bidCount: auction.bidCount || 0,
      sellerId: auction.sellerId || 'usr-1',
      status: auction.status || 'active',
      images: Array.isArray(auction.images) ? auction.images : [],
      createdAt: auction.createdAt || new Date().toISOString(),
      endsAt: auction.endsAt || new Date(Date.now() + (auction.durationHours || 72) * 3600000).toISOString(),
      isBlitz: Boolean(auction.isBlitz),
      isFeatured: Boolean(auction.isFeatured),
      isWatching: false,
    }
    auctions.value.unshift(formatted)
    totalCount.value++
  }

  async function placeBid(auctionId: string, data: { amount: string | number }) {
    try {
      const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount
      const response = await apiClient.post<any>(`/api/auctions/${auctionId}/bids`, { amount })
      if (response?.data?.data) {
        return { success: true, data: response.data.data }
      }
      return { success: false, error: response?.data?.error || 'Ставка кабыл алынган жок' }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.data?.error || err.response?.data?.message || err.message
      return { success: false, error: msg }
    }
  }

  return {
    // State
    auctions,
    currentAuction,
    filters,
    isLoading,
    error,
    hasMore,
    totalCount,
    priceUpdates,
    
    // Getters
    activeAuctions,
    endingSoonAuctions,
    featuredAuctions,
    newestAuctions,
    mostActiveAuctions,

    // Actions
    fetchAuctions,
    fetchAuction,
    getAuctionById,
    updateAuctionPrice,
    setAuctionStatus,
    setWatchlisted,
    addAuction,
    clearCurrentAuction,
    clearAuctions,
    resetFilters,
    placeBid,
  }
})