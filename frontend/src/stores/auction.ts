// src/stores/auction.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Auction, AuctionFilters, Money } from '@/types'
import { mockAuctions } from '@/data/mockAuctions'

export const useAuctionStore = defineStore('auction', () => {
  // State
  const auctions = ref<Auction[]>([...mockAuctions])
  const currentAuction = ref<Auction | null>(null)
  const filters = ref<AuctionFilters>({
    page: 1,
    perPage: 20,
    sortBy: 'ending_soon',
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(false)
  const totalCount = ref(mockAuctions.length)
  
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

  // Filter helper for mock data
  function filterMockAuctions(currentFilters: AuctionFilters): Auction[] {
    let result = [...mockAuctions]

    if (currentFilters.category) {
      result = result.filter(a => a.category.toLowerCase() === currentFilters.category?.toLowerCase())
    }
    if (currentFilters.city) {
      result = result.filter(a => a.city.toLowerCase() === currentFilters.city?.toLowerCase())
    }
    if (currentFilters.search) {
      const q = currentFilters.search.toLowerCase()
      result = result.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
    }
    if (currentFilters.minPrice !== undefined) {
      result = result.filter(a => a.currentPrice.minorUnits >= (currentFilters.minPrice || 0))
    }
    if (currentFilters.maxPrice !== undefined) {
      result = result.filter(a => a.currentPrice.minorUnits <= (currentFilters.maxPrice || Infinity))
    }

    if (currentFilters.sortBy === 'ending_soon') {
      result.sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime())
    } else if (currentFilters.sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (currentFilters.sortBy === 'price_asc') {
      result.sort((a, b) => a.currentPrice.minorUnits - b.currentPrice.minorUnits)
    } else if (currentFilters.sortBy === 'price_desc') {
      result.sort((a, b) => b.currentPrice.minorUnits - a.currentPrice.minorUnits)
    } else if (currentFilters.sortBy === 'most_bids') {
      result.sort((a, b) => b.bidCount - a.bidCount)
    }

    return result
  }

  // Actions
  async function fetchAuctions(newFilters?: Partial<AuctionFilters>, append = false) {
    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters, page: append ? filters.value.page : 1 }
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      if (window.axios) {
        const response = await window.axios.get('/api/auctions', { 
          params: filters.value 
        })
        if (response?.data?.data && response.data.data.length > 0) {
          if (append) {
            auctions.value = [...auctions.value, ...response.data.data]
          } else {
            auctions.value = response.data.data
          }
          hasMore.value = response.data.meta?.hasMore || false
          totalCount.value = response.data.meta?.total || response.data.data.length
          return
        }
      }
      
      // Standalone / Mock fallback
      const filtered = filterMockAuctions(filters.value)
      auctions.value = filtered
      totalCount.value = filtered.length
      hasMore.value = false
    } catch (err: any) {
      console.warn('API error, using mock data:', err)
      const filtered = filterMockAuctions(filters.value)
      auctions.value = filtered
      totalCount.value = filtered.length
      hasMore.value = false
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAuction(id: string) {
    isLoading.value = true
    error.value = null
    
    try {
      if (window.axios) {
        const response = await window.axios.get(`/api/auctions/${id}`)
        if (response?.data?.data) {
          currentAuction.value = response.data.data
          return currentAuction.value
        }
      }
      
      // Fallback
      const found = auctions.value.find(a => a.id === id) || mockAuctions.find(a => a.id === id) || null
      currentAuction.value = found
      return currentAuction.value
    } catch (err: any) {
      const found = auctions.value.find(a => a.id === id) || mockAuctions.find(a => a.id === id) || null
      currentAuction.value = found
      return currentAuction.value
    } finally {
      isLoading.value = false
    }
  }

  function getAuctionById(id: string) {
    return auctions.value.find(a => a.id === id) || mockAuctions.find(a => a.id === id) || null
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
    clearCurrentAuction,
    clearAuctions,
    resetFilters,
  }
})