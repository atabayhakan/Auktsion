// src/composables/useAuction.ts
import { ref, computed, watch } from 'vue'
import { useAuctionStore } from '@/stores/auction'
import { useBiddingStore } from '@/stores/bidding'
import { useEcho } from './useEcho'
import type { Auction, AuctionFilters, Money } from '@/types'


export function useAuction() {
  const auctionStore = useAuctionStore()
  const biddingStore = useBiddingStore()
  const { joinAuctionChannel, leaveAuctionChannel, isConnected } = useEcho()

  // Local state
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const selectedAuctionId = ref<string | null>(null)

  // Computed from store
  const auctions = computed(() => auctionStore.auctions)
  const currentAuction = computed(() => auctionStore.currentAuction)
  const activeAuctions = computed(() => auctionStore.activeAuctions)
  const endingSoonAuctions = computed(() => auctionStore.endingSoonAuctions)
  const featuredAuctions = computed(() => auctionStore.featuredAuctions)
  const filters = computed(() => auctionStore.filters)
  const hasMore = computed(() => auctionStore.hasMore)
  const totalCount = computed(() => auctionStore.totalCount)
  const priceUpdates = computed(() => auctionStore.priceUpdates)

  // Actions
  async function loadAuctions(newFilters?: Partial<AuctionFilters>, append = false) {
    isLoading.value = true
    error.value = null
    
    try {
      await auctionStore.fetchAuctions(newFilters, append)
    } catch (err: any) {
      error.value = err.message || 'Failed to load auctions'
    } finally {
      isLoading.value = false
    }
  }

  async function loadAuction(id: string) {
    isLoading.value = true
    error.value = null
    selectedAuctionId.value = id
    
    try {
      const auction = await auctionStore.fetchAuction(id)
      
      // Join real-time channel
      if (auction && isConnected.value) {
        joinAuctionChannel(id)
        biddingStore.setCurrentAuction(id)
        biddingStore.setMinBidIncrement(auction.bidIncrement)
      }
      
      return auction
    } catch (err: any) {
      error.value = err.message || 'Failed to load auction'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function leaveCurrentAuction() {
    if (selectedAuctionId.value) {
      leaveAuctionChannel(selectedAuctionId.value)
      biddingStore.setCurrentAuction(null)
      selectedAuctionId.value = null
    }
  }

  function updateFilters(newFilters: Partial<AuctionFilters>) {
    auctionStore.filters = { ...auctionStore.filters, ...newFilters, page: 1 }
    loadAuctions()
  }

  function setSortBy(sortBy: AuctionFilters['sortBy']) {
    updateFilters({ sortBy })
  }

  function setCategory(category: string | undefined) {
    updateFilters({ category })
  }

  function setCity(city: string | undefined) {
    updateFilters({ city })
  }

  function setPriceRange(min: number | undefined, max: number | undefined) {
    updateFilters({ priceMin: min, priceMax: max })
  }

  function setStatusFilter(status: AuctionFilters['status']) {
    updateFilters({ status })
  }

  function setSearch(query: string | undefined) {
    updateFilters({ search: query })
  }

  function clearFilters() {
    auctionStore.resetFilters()
    loadAuctions()
  }

  function loadMore() {
    if (!hasMore.value || isLoading.value) return
    loadAuctions({}, true)
  }

  function toggleWatchlist(auctionId: string) {
    const auction = auctions.value.find(a => a.id === auctionId)
    if (auction) {
      auctionStore.setWatchlisted(auctionId, !auction.isWatchlisted)
    }
  }

  function isWatchlisted(auctionId: string): boolean {
    return auctions.value.find(a => a.id === auctionId)?.isWatchlisted ?? false
  }

  function getAuctionById(id: string): Auction | undefined {
    return auctions.value.find(a => a.id === id)
  }

  function getPriceUpdate(auctionId: string): Money | undefined {
    return priceUpdates.value.get(auctionId)
  }

  function hasPriceUpdate(auctionId: string): boolean {
    return priceUpdates.value.has(auctionId)
  }

  // Watch for filter changes
  watch(filters, () => {
    // Filters changed - could trigger analytics
  }, { deep: true })

  // Cleanup on unmount
  // Note: The component using this composable should call leaveCurrentAuction()

  return {
    // State
    isLoading,
    error,
    selectedAuctionId,
    
    // Computed
    auctions,
    currentAuction,
    activeAuctions,
    endingSoonAuctions,
    featuredAuctions,
    filters,
    hasMore,
    totalCount,
    priceUpdates,
    
    // Actions
    loadAuctions,
    loadAuction,
    fetchAuction: loadAuction,
    fetchAuctions: loadAuctions,
    leaveCurrentAuction,
    updateFilters,
    setSortBy,
    setCategory,
    setCity,
    setPriceRange,
    setStatusFilter,
    setSearch,
    clearFilters,
    loadMore,
    toggleWatchlist,
    isWatchlisted,
    getAuctionById,
    getPriceUpdate,
    hasPriceUpdate,
  }
}