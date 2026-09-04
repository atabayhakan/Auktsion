// src/stores/admin.ts
// Pinia Admin Store for the iTorgo Admin Panel

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  AdminKPIStats,
  AdminUser,
  AdminUserDetail,
  AdminListing,
  AdminDispute,
  AdminKycApplication,
  AdminPayoutRequest,
  AdminTreasuryOverview,
  AdminLiveAuctionState,
  AdminLiveBidEvent,
  AdminAnalyticsData,
  AdminMediaItem,
  PlatformSettings,
  MediaExplorerData,
  MediaFolderItem,
  MediaExplorerFile
} from '@/types/admin'
import { adminService } from '@/services/adminService'

export const useAdminStore = defineStore('admin', () => {
  // Loading & Error states
  const isLoading = ref(false)
  const isActionLoading = ref(false)
  const error = ref<string | null>(null)
  const sidebarCollapsed = ref(false)

  // 1. Overview KPIs
  const stats = ref<AdminKPIStats | null>(null)

  // 2. Users State
  const users = ref<AdminUser[]>([])
  const usersMeta = ref({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0
  })
  const selectedUser = ref<AdminUserDetail | null>(null)
  const userFilters = ref({
    search: '',
    role: 'all',
    status: 'all',
    kycStatus: 'all'
  })

  // 3. Listings State
  const listings = ref<AdminListing[]>([])
  const listingsMeta = ref({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0
  })
  const selectedListing = ref<AdminListing | null>(null)
  const listingFilters = ref({
    search: '',
    category: 'all',
    status: 'all'
  })

  // 4. Disputes State
  const disputes = ref<AdminDispute[]>([])
  const disputesMeta = ref({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0
  })
  const selectedDispute = ref<AdminDispute | null>(null)
  const disputeFilters = ref({
    status: 'all'
  })

  // 5. KYC State
  const kycRecords = ref<AdminKycApplication[]>([])
  const kycMeta = ref({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0
  })
  const selectedKyc = ref<AdminKycApplication | null>(null)
  const kycFilters = ref({
    status: 'all',
    search: ''
  })

  // 6. Financials State
  const treasury = ref<AdminTreasuryOverview | null>(null)
  const payouts = ref<AdminPayoutRequest[]>([])
  const payoutFilters = ref({
    gateway: 'all',
    status: 'all'
  })

  // 7. Real-Time Monitoring & Controls
  const liveAuctions = ref<AdminLiveAuctionState[]>([])
  const liveBids = ref<AdminLiveBidEvent[]>([])
  const isLiveMonitoringActive = ref(true)

  // 8. Analytics State
  const analytics = ref<AdminAnalyticsData | null>(null)
  const analyticsTimeframe = ref<'today' | '7d' | '30d' | '90d' | 'year'>('30d')

  // Media Library
  const media = ref<AdminMediaItem[]>([])

  // Notification Feed
  const notifications = ref<Array<{
    id: string
    title: string
    message: string
    time: string
    read: boolean
    type: 'info' | 'warning' | 'alert' | 'success'
    link?: string
    createdAt?: string
  }>>([])

  // Getters
  const pendingKycCount = computed(() => {
    if (stats.value?.pendingKycCount !== undefined) return stats.value.pendingKycCount
    return kycRecords.value.filter(k => k.status === 'pending').length
  })

  const openDisputesCount = computed(() => {
    if (stats.value?.openDisputesCount !== undefined) return stats.value.openDisputesCount
    return disputes.value.filter(d => ['open', 'under_review'].includes(d.status)).length
  })

  const pendingPayoutsCount = computed(() => {
    if (stats.value?.pendingPayoutsCount !== undefined) return stats.value.pendingPayoutsCount
    return payouts.value.filter(p => p.status === 'pending').length
  })

  const unreadNotificationsCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })

  // Actions
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  async function fetchNotifications() {
    try {
      const res = await adminService.getNotifications()
      if (res.success && Array.isArray(res.data)) {
        notifications.value = res.data
      }
    } catch (err) {
      console.warn('[adminStore] Failed to fetch notifications:', err)
    }
  }

  async function markNotificationRead(id: string) {
    const item = notifications.value.find(n => n.id === id)
    if (item) item.read = true
    try {
      await adminService.markNotificationRead(id)
    } catch {}
  }

  async function markAllNotificationsRead() {
    notifications.value.forEach(n => { n.read = true })
    try {
      await adminService.markAllNotificationsRead()
    } catch {}
  }

  // 1. Fetch Overview
  async function fetchOverview() {
    isLoading.value = true
    error.value = null
    try {
      const res = await adminService.getOverview()
      if (res.success) {
        stats.value = res.data
      }
    } catch (err: any) {
      error.value = err.message || 'KPI маалыматтарын жүктөөдө ката кетти'
    } finally {
      isLoading.value = false
    }
  }

  // 2. Fetch Users
  async function fetchUsers(page = 1) {
    isLoading.value = true
    error.value = null
    try {
      const res = await adminService.getUsers({
        ...userFilters.value,
        page,
        perPage: usersMeta.value.perPage
      })
      users.value = res.data
      usersMeta.value = res.meta
    } catch (err: any) {
      error.value = err.message || 'Колдонуучуларды жүктөөдө ката кетти'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUserDetail(id: string) {
    isActionLoading.value = true
    try {
      const res = await adminService.getUserDetail(id)
      if (res.success) {
        selectedUser.value = res.data
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      isActionLoading.value = false
    }
  }

  async function updateUserStatus(id: string, status: 'active' | 'suspended' | 'banned', reason?: string) {
    isActionLoading.value = true
    try {
      await adminService.updateUserStatus(id, status, reason)
      // Update local state
      const u = users.value.find(x => x.id === id)
      if (u) {
        u.status = status
        u.banReason = reason
      }
      if (selectedUser.value && selectedUser.value.id === id) {
        selectedUser.value.status = status
        selectedUser.value.banReason = reason
      }
      return true
    } catch (err: any) {
      error.value = err.message
      return false
    } finally {
      isActionLoading.value = false
    }
  }

  async function updateUserRole(id: string, role: string) {
    isActionLoading.value = true
    try {
      await adminService.updateUserRole(id, role)
      const u = users.value.find(x => x.id === id)
      if (u) u.role = role as any
      if (selectedUser.value && selectedUser.value.id === id) {
        selectedUser.value.role = role as any
      }
      return true
    } catch (err: any) {
      error.value = err.message
      return false
    } finally {
      isActionLoading.value = false
    }
  }

  async function resetUserPassword(id: string) {
    isActionLoading.value = true
    try {
      const res = await adminService.resetUserPassword(id)
      return res
    } finally {
      isActionLoading.value = false
    }
  }

  // 3. Fetch Listings
  async function fetchListings(page = 1) {
    isLoading.value = true
    error.value = null
    try {
      const res = await adminService.getListings({
        ...listingFilters.value,
        page,
        perPage: listingsMeta.value.perPage
      })
      listings.value = res.data
      listingsMeta.value = res.meta
    } catch (err: any) {
      error.value = err.message || 'Аукцион лотторун жүктөөдө ката кетти'
    } finally {
      isLoading.value = false
    }
  }

  async function approveListing(id: string) {
    isActionLoading.value = true
    try {
      await adminService.updateListingStatus(id, 'active')
      const item = listings.value.find(l => l.id === id)
      if (item) item.status = 'active'
      if (selectedListing.value && selectedListing.value.id === id) {
        selectedListing.value.status = 'active'
      }
      return true
    } finally {
      isActionLoading.value = false
    }
  }

  async function rejectListing(id: string, reason?: string) {
    isActionLoading.value = true
    try {
      await adminService.updateListingStatus(id, 'cancelled', reason)
      const item = listings.value.find(l => l.id === id)
      if (item) item.status = 'cancelled'
      if (selectedListing.value && selectedListing.value.id === id) {
        selectedListing.value.status = 'cancelled'
      }
      return true
    } finally {
      isActionLoading.value = false
    }
  }

  async function toggleListingFeatured(id: string) {
    const item = listings.value.find(l => l.id === id)
    if (!item) return
    const newState = !item.isFeatured
    item.isFeatured = newState
    try {
      await adminService.updateListingFeatured(id, newState)
    } catch (err) {
      item.isFeatured = !newState // revert on error
    }
  }

  // 4. Fetch Disputes
  async function fetchDisputes(page = 1) {
    isLoading.value = true
    error.value = null
    try {
      const res = await adminService.getDisputes({
        ...disputeFilters.value,
        page,
        perPage: disputesMeta.value.perPage
      })
      disputes.value = res.data
      disputesMeta.value = res.meta
    } catch (err: any) {
      error.value = err.message || 'Диспуттарды жүктөөдө ката кетти'
    } finally {
      isLoading.value = false
    }
  }

  async function resolveDispute(id: string, decision: 'refund_buyer' | 'release_seller', options: {
    refundAmount?: number
    reason: string
  }) {
    isActionLoading.value = true
    try {
      const res = await adminService.resolveDispute(id, {
        decision,
        ...options
      })
      const d = disputes.value.find(x => x.id === id)
      if (d && res.data) {
        Object.assign(d, res.data)
      }
      if (selectedDispute.value && selectedDispute.value.id === id && res.data) {
        Object.assign(selectedDispute.value, res.data)
      }
      return true
    } finally {
      isActionLoading.value = false
    }
  }

  // 5. Fetch KYC Records
  async function fetchKycRecords(page = 1) {
    isLoading.value = true
    error.value = null
    try {
      const res = await adminService.getKycRecords({
        ...kycFilters.value,
        page,
        perPage: kycMeta.value.perPage
      })
      kycRecords.value = res.data
      kycMeta.value = res.meta
    } catch (err: any) {
      error.value = err.message || 'KYC билдирмелерин жүктөөдө ката кетти'
    } finally {
      isLoading.value = false
    }
  }

  async function reviewKyc(id: string, status: 'approved' | 'rejected', details?: {
    rejectionReasonCode?: string
    rejectionNotes?: string
  }) {
    isActionLoading.value = true
    try {
      const res = await adminService.reviewKyc(id, {
        status,
        ...details
      })
      const item = kycRecords.value.find(k => k.id === id)
      if (item && res.data) {
        Object.assign(item, res.data)
      }
      if (selectedKyc.value && selectedKyc.value.id === id && res.data) {
        Object.assign(selectedKyc.value, res.data)
      }
      return true
    } finally {
      isActionLoading.value = false
    }
  }

  // 6. Fetch Financials
  async function fetchFinancials() {
    isLoading.value = true
    error.value = null
    try {
      const res = await adminService.getFinancials()
      if (res.success) {
        treasury.value = {
          gmv: res.data.gmv,
          commissionRevenue: res.data.commissionRevenue,
          pendingPayouts: res.data.pendingPayouts
        }
        payouts.value = res.data.payouts
      }
    } catch (err: any) {
      error.value = err.message || 'Финансылык маалыматтарды жүктөөдө ката кетти'
    } finally {
      isLoading.value = false
    }
  }

  async function processPayout(id: string, action: 'approve' | 'reject', options?: {
    reason?: string
    transactionReference?: string
  }) {
    isActionLoading.value = true
    try {
      const res = await adminService.processPayout(id, {
        action,
        ...options
      })
      const p = payouts.value.find(x => x.id === id)
      if (p && res.data) {
        Object.assign(p, res.data)
      }
      return true
    } finally {
      isActionLoading.value = false
    }
  }

  // 7. Fetch Monitoring
  async function fetchMonitoring() {
    try {
      const res = await adminService.getMonitoring()
      if (res.success) {
        liveAuctions.value = res.data.liveAuctions
        liveBids.value = res.data.liveBids
      }
    } catch (err: any) {
      console.warn('Monitoring fetch error:', err)
    }
  }

  // Pausing sets the auction back to 'draft', so it drops out of the
  // active-auctions monitoring feed — resuming happens from the Listings page.
  async function toggleAuctionPause(id: string) {
    try {
      await adminService.pauseAuction(id, true)
      liveAuctions.value = liveAuctions.value.filter(a => a.id !== id)
      return true
    } catch (err) {
      return false
    }
  }

  async function cancelSuspiciousBid(bidId: string, reason: string) {
    try {
      await adminService.cancelBid(bidId, reason)
      liveBids.value = liveBids.value.filter(b => b.id !== bidId)
      return true
    } catch (err: any) {
      error.value = err.message
      return false
    }
  }

  function addLiveBid(bid: AdminLiveBidEvent) {
    liveBids.value.unshift(bid)
    if (liveBids.value.length > 50) liveBids.value.pop()
  }

  // 8. Fetch Analytics
  async function fetchAnalytics(timeframe: 'today' | '7d' | '30d' | '90d' | 'year' = '30d') {
    isLoading.value = true
    analyticsTimeframe.value = timeframe
    try {
      const res = await adminService.getAnalytics(timeframe)
      if (res.success) {
        analytics.value = res.data
      }
    } catch (err: any) {
      error.value = err.message || 'Аналитиканы жүктөөдө ката кетти'
    } finally {
      isLoading.value = false
    }
  }

  // 9. Fetch Media Library (Legacy)
  async function fetchMedia(source?: 'auction' | 'avatar') {
    isLoading.value = true
    error.value = null
    try {
      const res = await adminService.getMedia(source)
      if (res.success) {
        media.value = res.data
      }
    } catch (err: any) {
      error.value = err.message || 'Медианы жүктөөдө ката кетти'
    } finally {
      isLoading.value = false
    }
  }

  // 10. iOS / Finder Style Media Explorer
  const mediaExplorer = ref<MediaExplorerData | null>(null)
  const activeMediaFolderId = ref<string>('root')

  async function fetchMediaExplorer(folderId: string = 'root') {
    isLoading.value = true
    error.value = null
    activeMediaFolderId.value = folderId
    try {
      const res = await adminService.getMediaExplorer(folderId)
      if (res.success) {
        mediaExplorer.value = res.data
      }
    } catch (err: any) {
      error.value = err.message || 'Папка мазмунун жүктөөдө ката кетти'
    } finally {
      isLoading.value = false
    }
  }

  async function createMediaFolder(name: string, parentId?: string | null, color?: string, icon?: string) {
    isActionLoading.value = true
    try {
      const res = await adminService.createMediaFolder(name, parentId || activeMediaFolderId.value, color, icon)
      await fetchMediaExplorer(activeMediaFolderId.value)
      return res
    } catch (err: any) {
      error.value = err.message || 'Папка түзүүдө ката кетти'
      throw err
    } finally {
      isActionLoading.value = false
    }
  }

  async function deleteMediaFolder(folderId: string) {
    isActionLoading.value = true
    try {
      const res = await adminService.deleteMediaFolder(folderId)
      await fetchMediaExplorer(activeMediaFolderId.value)
      return res
    } catch (err: any) {
      error.value = err.message || 'Папканы өчүрүүдө ката кетти'
      throw err
    } finally {
      isActionLoading.value = false
    }
  }

  async function deleteMediaFile(fileId: string) {
    isActionLoading.value = true
    try {
      const res = await adminService.deleteMediaFile(fileId)
      await fetchMediaExplorer(activeMediaFolderId.value)
      return res
    } catch (err: any) {
      error.value = err.message || 'Файлды өчүрүүдө ката кетти'
      throw err
    } finally {
      isActionLoading.value = false
    }
  }

  async function addMediaFile(data: { name: string; url: string; folderId: string; sizeBytes?: number; mimeType?: string; dimensions?: string }) {
    isActionLoading.value = true
    try {
      const res = await adminService.addMediaFile(data)
      await fetchMediaExplorer(activeMediaFolderId.value)
      return res
    } catch (err: any) {
      error.value = err.message || 'Файлды кошууда ката кетти'
      throw err
    } finally {
      isActionLoading.value = false
    }
  }

  // 11. Platform Settings
  const settings = ref<PlatformSettings | null>(null)

  async function fetchSettings() {
    isLoading.value = true
    error.value = null
    try {
      const res = await adminService.getSettings()
      if (res.success) {
        settings.value = res.data
      }
    } catch (err: any) {
      error.value = err.message || 'Жөндөөлөрдү жүктөөдө ката кетти'
    } finally {
      isLoading.value = false
    }
  }

  async function updateSettings(newSettings: Partial<PlatformSettings>) {
    isActionLoading.value = true
    try {
      const res = await adminService.updateSettings(newSettings)
      if (res.success) {
        settings.value = res.data
      }
      return res
    } catch (err: any) {
      error.value = err.message || 'Жөндөөлөрдү сактоодо ката кетти'
      throw err
    } finally {
      isActionLoading.value = false
    }
  }

  return {
    // State
    isLoading,
    isActionLoading,
    error,
    sidebarCollapsed,
    stats,
    users,
    usersMeta,
    selectedUser,
    userFilters,
    listings,
    listingsMeta,
    selectedListing,
    listingFilters,
    disputes,
    disputesMeta,
    selectedDispute,
    disputeFilters,
    kycRecords,
    kycMeta,
    selectedKyc,
    kycFilters,
    treasury,
    payouts,
    payoutFilters,
    liveAuctions,
    liveBids,
    isLiveMonitoringActive,
    analytics,
    analyticsTimeframe,
    notifications,
    media,
    mediaExplorer,
    activeMediaFolderId,
    settings,

    // Getters
    pendingKycCount,
    openDisputesCount,
    pendingPayoutsCount,
    unreadNotificationsCount,

    // Actions
    toggleSidebar,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    fetchOverview,
    fetchUsers,
    fetchUserDetail,
    updateUserStatus,
    updateUserRole,
    resetUserPassword,
    fetchListings,
    approveListing,
    rejectListing,
    toggleListingFeatured,
    fetchDisputes,
    resolveDispute,
    fetchKycRecords,
    reviewKyc,
    fetchFinancials,
    processPayout,
    fetchMonitoring,
    toggleAuctionPause,
    cancelSuspiciousBid,
    addLiveBid,
    fetchAnalytics,
    fetchMedia,
    fetchMediaExplorer,
    createMediaFolder,
    deleteMediaFolder,
    deleteMediaFile,
    addMediaFile,
    fetchSettings,
    updateSettings
  }
})

export default useAdminStore

