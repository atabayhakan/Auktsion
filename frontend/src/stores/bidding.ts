// src/stores/bidding.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuctionStore } from './auction'
import { useUserStore } from './user'

import { useUIStore } from './ui'
import { useI18n } from '@/composables/useI18n'
import apiClient from '@/services/api'
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
    if (!currentAuctionId.value) return false

    if (!userStore.isAuthenticated) {
      uiStore.toastWarning(t('toasts.warning'), t('toasts.loginRequired') || 'Войдите в систему')
      return false
    }

    if (!userStore.canBid) {
      bidError.value = t('toasts.accountSuspended') || 'Ваш аккаунт заблокирован'
      uiStore.toastError(t('common.error'), bidError.value)
      return false
    }

    isPlacingBid.value = true
    bidError.value = null

    const amount = typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount
    lastBidAmount.value = String(formData.amount)

    const optimisticBid: Bid = {
      id: `temp-${Date.now()}`,
      auctionId: currentAuctionId.value,
      bidderId: userStore.user?.id || 'anon',
      bidder: {
        id: userStore.user?.id || 'anon',
        uuid: (userStore.user as any)?.uuid || userStore.user?.id || '',
        fullName: userStore.user?.fullName || 'Катышуучу',
        avatar: userStore.user?.avatar || '',
        rating: (userStore.user as any)?.rating || 5.0,
        reviewCount: (userStore.user as any)?.reviewCount || 0,
        kyStatus: userStore.kycStatus,
        isSeller: (userStore.user as any)?.isSeller || false,
        joinedAt: (userStore.user as any)?.createdAt || new Date().toISOString(),
      },
      amount: {
        amount: String(amount),
        minorUnits: Math.round(amount * 100),
        currency: 'KGS',
        formatted: `${Number(amount).toLocaleString('ru-RU')} ${t('common.currency') || 'сом'}`,
      },
      sequence: Date.now(),
      placedAt: new Date().toISOString(),
      status: 'pending',
      isWinning: true,
    }

    try {
      bidHistory.value.unshift(optimisticBid)

      const response = await apiClient.post(`/api/auctions/${currentAuctionId.value}/bids`, {
        amount,
      })

      if (response?.data?.data) {
        const confirmedBid = response.data.data
        const index = bidHistory.value.findIndex(b => b.id === optimisticBid.id)
        if (index !== -1) {
          bidHistory.value[index] = confirmedBid
        }

        uiStore.toastSuccess(t('toasts.bidPlaced'), t('toasts.bidPlacedSuccess'))
        return true
      }

      throw new Error('Invalid response from server')
    } catch (err: any) {
      const index = bidHistory.value.findIndex(b => b.id === optimisticBid.id)
      if (index !== -1) bidHistory.value.splice(index, 1)

      const serverMsg = err.response?.data?.error || err.data?.error || err.response?.data?.message || err.message
      bidError.value = serverMsg || t('toasts.bidError')
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
    // Anti-sniping: sync endsAt if server extended it
    const newEndsAt = (event as any).auctionState?.endsAt || (event as any).auction_state?.ends_at || (event as any).endsAt
    if (newEndsAt) {
      const auction = auctionStore.auctions.find(a => a.id === auctionId)
      if (auction) (auction as any).endsAt = newEndsAt
      if (auctionStore.currentAuction?.id === auctionId) (auctionStore.currentAuction as any).endsAt = newEndsAt
    }

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