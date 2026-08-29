// src/stores/bidding.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuctionStore } from './auction'
import { useUserStore } from './user'

import { useUIStore } from './ui'
import { useI18n } from '@/composables/useI18n'
import type { Bid, Money, BidFormData, BidPlacedEvent } from '@/types'

export const useBiddingStore = defineStore('bidding', () => {
  const auctionStore = useAuctionStore()
  const userStore = useUserStore()
  const uiStore = useUIStore()
  const { t } = useI18n()
  
  // State
  const isPlacingBid = ref(false)
  const lastBidAmount = ref<string>('')
  const bidHistory = ref<Bid[]>([])
  const minBidIncrement = ref<Money | null>(null)
  const currentAuctionId = ref<string | null>(null)
  const bidError = ref<string | null>(null)

  // Getters
  const canPlaceBid = computed(() => 
    userStore.canBid && !isPlacingBid.value && currentAuctionId.value !== null
  )

  const currentAuction = computed(() => 
    auctionStore.currentAuction
  )

  const currentPrice = computed(() => 
    currentAuction.value?.currentPrice || null
  )

  const minimumNextBid = computed(() => {
    if (!currentPrice.value || !minBidIncrement.value) return null
    
    // Calculate minimum next bid: current price + increment
    const currentMinor = currentPrice.value.minorUnits
    const incrementMinor = minBidIncrement.value.minorUnits
    const nextMinor = currentMinor + incrementMinor
    
    return {
      ...currentPrice.value,
      minorUnits: nextMinor,
      amount: (nextMinor / 100).toFixed(2),
    } as Money
  })

  // Actions
  async function placeBid(formData: BidFormData) {
    if (!canPlaceBid.value || !currentAuctionId.value) return false

    isPlacingBid.value = true
    bidError.value = null

    const amount = typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount
    lastBidAmount.value = formData.amount

    // Declared outside try/catch so the catch block can remove the SAME
    // object it added — the previous version recomputed `temp-${Date.now()}`
    // at catch-time, which is never equal to the id generated moments
    // earlier, so a failed bid's placeholder row was never cleaned up.
    const optimisticBid: Bid = {
      id: `temp-${Date.now()}`,
      auctionId: currentAuctionId.value,
      bidderId: userStore.user!.id,
      bidder: {
        id: userStore.user!.id,
        uuid: userStore.user!.uuid,
        fullName: userStore.user!.fullName,
        avatar: userStore.user!.avatar,
        rating: userStore.user!.rating,
        reviewCount: userStore.user!.reviewCount,
        kyStatus: userStore.kycStatus,
        isSeller: userStore.user!.isSeller,
        joinedAt: userStore.user!.createdAt,
      },
      amount: {
        amount: formData.amount,
        minorUnits: Math.round(amount * 100),
        currency: 'KGS',
        formatted: `${Number(amount).toLocaleString()} ${t('common.currency')}`,
      },
      sequence: Date.now(),
      placedAt: new Date().toISOString(),
      status: 'pending',
      isWinning: true,
    }

    try {
      // Optimistic update is local to this browser's own bid history only —
      // the shared auction price/bidCount is deliberately left untouched
      // here. It updates solely from the authoritative bid.placed WebSocket
      // broadcast (handleRealTimeBid → auctionStore.updateAuctionPrice), so
      // a rejected bid never leaves every OTHER viewer looking at a price
      // that was optimistically bumped and then never corrected.
      bidHistory.value.unshift(optimisticBid)

      // Make API call — the backend converts to minor units itself
      // (auctionController.ts: amountMinor = Math.round(Number(amount) * 100)),
      // so this must send the plain major-unit amount, not pre-multiplied.
      const response = await window.axios?.post(`/api/auctions/${currentAuctionId.value}/bids`, {
        amount,
      })

      if (response?.data?.data) {
        // Server confirmed - replace optimistic with real
        const confirmedBid = response.data.data
        const index = bidHistory.value.findIndex(b => b.id === optimisticBid.id)
        if (index !== -1) {
          bidHistory.value[index] = confirmedBid
        }

        uiStore.toastSuccess(t('toasts.bidPlaced'), t('toasts.bidPlacedSuccess'))
        return true
      }

      throw new Error('Invalid response')
    } catch (err: any) {
      // Remove optimistic bid on error
      const index = bidHistory.value.findIndex(b => b.id === optimisticBid.id)
      if (index !== -1) bidHistory.value.splice(index, 1)

      bidError.value = err.response?.data?.message || t('toasts.bidError')
      uiStore.toastError(t('common.error'), bidError.value || undefined)
      return false
    } finally {
      isPlacingBid.value = false
    }
  }

  function handleRealTimeBid(event: BidPlacedEvent) {
    const bid = event.bid
    if (!bid) return

    const auctionId = (event.auctionId || event.auction_id || '').toString()
    const bidCount = event.auctionState?.bidCount ?? event.auction_state?.bid_count ?? 0
    // Update auction price
    auctionStore.updateAuctionPrice(auctionId, bid.amount, bidCount)

    // Add to bid history if it's for current auction
    if (currentAuctionId.value === auctionId) {
      const bidderId = (bid.bidderId || bid.bidder_id || '').toString()
      const realBidId = bid.id

      // Duplicate delivery of an already-recorded bid, or the HTTP response
      // for our own bid already installed the confirmed version — nothing
      // more to do. Checking this BEFORE the cleanup filter below matters:
      // otherwise the filter would strip the already-correct entry and this
      // function would go on to replace it with a lower-fidelity
      // reconstruction (generic bidder name, zeroed rating, etc.).
      if (realBidId && bidHistory.value.some(b => b.id === realBidId)) {
        return
      }

      // This bidder's optimistic placeholder (see placeBid) is now confirmed
      // — drop it so the real, server-assigned bid doesn't show up twice.
      bidHistory.value = bidHistory.value.filter(b =>
        !(b.auctionId === auctionId && b.bidderId === bidderId && String(b.id).startsWith('temp-'))
      )

      // Whichever bid was previously winning THIS auction gets demoted — not
      // just the viewing user's own bid. Otherwise two bids from bidders
      // other than the current viewer, placed back to back, could both end
      // up marked isWinning.
      const previousWinnerIndex = bidHistory.value.findIndex(b => b.auctionId === auctionId && b.isWinning)
      const outbidCurrentUser = previousWinnerIndex !== -1 && bidHistory.value[previousWinnerIndex].bidderId === userStore.user?.id
      if (previousWinnerIndex !== -1) {
        bidHistory.value[previousWinnerIndex].isWinning = false
        bidHistory.value[previousWinnerIndex].status = outbidCurrentUser ? 'outbid' : 'active'
      }

      const newBid: Bid = {
        id: realBidId || `bid-${Date.now()}`,
        auctionId,
        bidderId,
        bidder: {
          id: bidderId,
          uuid: '',
          fullName: bid.bidderName || t('auction.bidder'),
          rating: 0,
          reviewCount: 0,
          kyStatus: 'verified',
          isSeller: false,
          joinedAt: '',
        },
        amount: bid.amount,
        sequence: bid.sequence ?? 0,
        placedAt: bid.placedAt || bid.placed_at || new Date().toISOString(),
        status: bidderId === userStore.user?.id ? 'winning' : 'active',
        isWinning: true,
      }

      bidHistory.value.unshift(newBid)

      // Show toast only when THIS event is what just outbid the current
      // user (not merely "the current user has ever bid on this auction",
      // which used to re-fire on every later, unrelated bid too).
      if (bidderId !== userStore.user?.id && outbidCurrentUser) {
        uiStore.toastWarning(t('toasts.outbid'), t('toasts.newBidPlaced', { amount: bid.amount.formatted }))
      }
    }
  }

  function handleAuctionEnded(event: { auction_id: number; result: any }) {
    if (currentAuctionId.value === event.auction_id.toString()) {
      auctionStore.setAuctionStatus(currentAuctionId.value, event.result.status)
      
      if (event.result.winner_id === userStore.user?.id) {
        uiStore.toastSuccess(t('toasts.youWon'), t('toasts.youWonAuction'))
      } else {
        uiStore.toastInfo(t('toasts.auctionEnded'), t('toasts.auctionEndedNotice'))
      }
    }
  }

  function setCurrentAuction(auctionId: string | null) {
    currentAuctionId.value = auctionId
    if (auctionId) {
      const auction = auctionStore.auctions.find(a => a.id === auctionId)
      if (auction) {
        minBidIncrement.value = auction.bidIncrement
      }
    }
    bidError.value = null
  }

  function setMinBidIncrement(increment: Money) {
    minBidIncrement.value = increment
  }

  function setBidHistory(bids: Bid[]) {
    bidHistory.value = bids
  }

  function clearBidError() {
    bidError.value = null
  }

  function clearHistory() {
    bidHistory.value = []
    currentAuctionId.value = null
    minBidIncrement.value = null
  }

  return {
    // State
    isPlacingBid,
    lastBidAmount,
    bidHistory,
    minBidIncrement,
    currentAuctionId,
    bidError,
    
    // Getters
    canPlaceBid,
    currentAuction,
    currentPrice,
    minimumNextBid,
    
    // Actions
    placeBid,
    handleRealTimeBid,
    handleAuctionEnded,
    setCurrentAuction,
    setMinBidIncrement,
    setBidHistory,
    clearBidError,
    clearHistory,
  }
})