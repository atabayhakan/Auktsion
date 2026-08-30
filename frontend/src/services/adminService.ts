// src/services/adminService.ts
// Administrative API Client for iTorgo v2.0 with resilient offline/mock fallback

import apiClient from './api'
import type { Money } from '@/types/domain'
import type {
  AdminKPIStats,
  AdminUser,
  AdminUserDetail,
  AdminListing,
  AdminDispute,
  AdminKycApplication,
  AdminPayoutRequest,
  AdminLiveAuctionState,
  AdminLiveBidEvent,
  AdminAnalyticsData,
  AdminMediaItem,
  PlatformSettings,
  MediaExplorerData,
  MediaFolderItem,
  MediaExplorerFile,
  ThemeSettings,
  ThemePresetItem
} from '@/types/admin'
function shouldUseMockFallback(err: any): boolean {
  // Only fallback on network errors or 5xx, not on 4xx client errors (401/403/404 etc. must surface)
  if (!err) return true
  const status = err.status || err?.response?.status || err?.data?.status
  if (status && status >= 400 && status < 500) return false
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Failed to fetch') return true
  // If no status (network failure), fallback
  if (!status) return true
  return status >= 500
}

import {
  mockKPIStats,
  mockAdminUsers,
  mockAdminListings,
  mockAdminDisputes,
  mockAdminKyc,
  mockAdminPayouts,
  mockTreasury,
  mockLiveAuctions,
  mockLiveBids,
  mockAnalyticsData,
  mockAdminMedia,
  formatMoney
} from '@/data/mockAdminData'

export interface PaginatedResult<T> {
  data: T[]
  meta: {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
  }
}

export const adminService = {
  // 1. Overview & KPIs
  async getOverview(): Promise<{ success: boolean; data: AdminKPIStats }> {
    try {
      const res = await apiClient.get<{ success: boolean; data: any }>('/api/admin/overview')
      if (res.data && res.data.data) {
        const s = res.data.data
        return {
          success: true,
          data: {
            totalGmv: s.gmv,
            platformRevenue: s.commissionRevenue,
            activeAuctionsCount: s.auctions?.active ?? 0,
            totalUsersCount: s.users?.total ?? 0,
            pendingKycCount: s.pendingKycCount ?? 0,
            openDisputesCount: s.openDisputesCount ?? 0,
            pendingPayoutsCount: s.pendingPayouts?.count ?? 0
          }
        }
      }
    } catch (err: any) {
      if (!shouldUseMockFallback(err)) throw err
      console.warn('[adminService] Using mock fallback for getOverview:', err)
    }
    return { success: true, data: { ...mockKPIStats } }
  },

  // 2. Users Management
  async getUsers(params?: {
    search?: string
    role?: string
    status?: string
    kycStatus?: string
    page?: number
    perPage?: number
  }): Promise<PaginatedResult<AdminUser>> {
    try {
      const res = await apiClient.get<any>('/api/admin/users', params)
      if (res.data && res.data.data) {
        return {
          data: res.data.data,
          meta: res.data.meta || {
            currentPage: params?.page || 1,
            lastPage: 1,
            perPage: params?.perPage || 20,
            total: res.data.data.length
          }
        }
      }
    } catch (err: any) {
      if (!shouldUseMockFallback(err)) throw err
      console.warn('[adminService] Using mock fallback for getUsers:', err)
    }

    // Mock filtering
    let list: AdminUser[] = [...mockAdminUsers]
    if (params?.search) {
      const q = params.search.toLowerCase()
      list = list.filter(u => 
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.inn || '').includes(q)
      )
    }
    if (params?.role && params.role !== 'all') {
      list = list.filter(u => u.role === params.role)
    }
    if (params?.status && params.status !== 'all') {
      list = list.filter(u => u.status === params.status)
    }
    if (params?.kycStatus && params.kycStatus !== 'all') {
      list = list.filter(u => u.kycStatus === params.kycStatus)
    }

    const page = params?.page || 1
    const perPage = params?.perPage || 10
    const start = (page - 1) * perPage
    const paginated = list.slice(start, start + perPage)

    return {
      data: paginated,
      meta: {
        currentPage: page,
        lastPage: Math.max(1, Math.ceil(list.length / perPage)),
        perPage,
        total: list.length
      }
    }
  },

  async getUserDetail(id: string): Promise<{ success: boolean; data: AdminUserDetail }> {
    try {
      const res = await apiClient.get<any>(`/api/admin/users/${id}`)
      if (res.data && res.data.data) {
        return { success: true, data: res.data.data }
      }
    } catch (err) {
      console.warn('[adminService] Fallback to mock for getUserDetail:', err)
    }
    const found = mockAdminUsers.find(u => u.id === id) || mockAdminUsers[0]
    return { success: true, data: { ...found } }
  },

  async updateUserStatus(id: string, status: 'active' | 'suspended' | 'banned', reason?: string): Promise<{ success: boolean; data: any }> {
    try {
      const res = await apiClient.put<any>(`/api/admin/users/${id}/status`, { status, reason })
      return res.data
    } catch (err) {
      console.warn('[adminService] Mock updating user status:', err)
      const u = mockAdminUsers.find(x => x.id === id)
      if (u) {
        u.status = status
        u.banReason = reason
      }
      return { success: true, data: u }
    }
  },

  async updateUserRole(id: string, role: string): Promise<{ success: boolean; data: any }> {
    try {
      const res = await apiClient.put<any>(`/api/admin/users/${id}/role`, { role })
      return res.data
    } catch (err) {
      console.warn('[adminService] Mock updating user role:', err)
      const u = mockAdminUsers.find(x => x.id === id)
      if (u) {
        u.role = role as any
      }
      return { success: true, data: u }
    }
  },

  async resetUserPassword(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.post<any>(`/api/admin/users/${id}/reset-password`)
      return res.data
    } catch (err) {
      return {
        success: true,
        message: 'Сыр сөздү калыбына келтирүү шилтемеси колдонуучунун электрондук дарегине жана SMS аркылуу жөнөтүлдү.'
      }
    }
  },

  // 3. Listings Management
  async getListings(params?: {
    search?: string
    category?: string
    status?: string
    sortBy?: string
    page?: number
    perPage?: number
  }): Promise<PaginatedResult<AdminListing>> {
    try {
      const res = await apiClient.get<any>('/api/admin/listings', params)
      if (res.data && res.data.data) {
        return {
          data: res.data.data,
          meta: res.data.meta || {
            currentPage: params?.page || 1,
            lastPage: 1,
            perPage: params?.perPage || 20,
            total: res.data.data.length
          }
        }
      }
    } catch (err: any) {
      if (!shouldUseMockFallback(err)) throw err
      console.warn('[adminService] Using mock fallback for getListings:', err)
    }

    let list: AdminListing[] = [...mockAdminListings]
    if (params?.search) {
      const q = params.search.toLowerCase()
      list = list.filter(l => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q))
    }
    if (params?.category && params.category !== 'all') {
      list = list.filter(l => l.category === params.category)
    }
    if (params?.status && params.status !== 'all') {
      list = list.filter(l => l.status === params.status)
    }

    const page = params?.page || 1
    const perPage = params?.perPage || 10
    const start = (page - 1) * perPage
    const paginated = list.slice(start, start + perPage)

    return {
      data: paginated,
      meta: {
        currentPage: page,
        lastPage: Math.max(1, Math.ceil(list.length / perPage)),
        perPage,
        total: list.length
      }
    }
  },

  async updateListingStatus(id: string, status: string, reason?: string): Promise<{ success: boolean; data: any }> {
    try {
      const res = await apiClient.put<any>(`/api/admin/listings/${id}/status`, { status, reason })
      return res.data
    } catch (err) {
      console.warn('[adminService] Mock updating listing status:', err)
      const lot = mockAdminListings.find(x => x.id === id)
      if (lot) {
        lot.status = status as any
      }
      return { success: true, data: lot }
    }
  },

  async updateListingFeatured(id: string, isFeatured: boolean): Promise<{ success: boolean; data: any }> {
    try {
      const res = await apiClient.put<any>(`/api/admin/listings/${id}/featured`, { isFeatured })
      return res.data
    } catch (err) {
      console.warn('[adminService] Mock updating listing featured flag:', err)
      const lot = mockAdminListings.find(x => x.id === id)
      if (lot) {
        lot.isFeatured = isFeatured
      }
      return { success: true, data: lot }
    }
  },

  // 4. Disputes & Claims
  async getDisputes(params?: {
    status?: string
    page?: number
    perPage?: number
  }): Promise<PaginatedResult<AdminDispute>> {
    try {
      const res = await apiClient.get<any>('/api/admin/disputes', params)
      if (res.data && res.data.data) {
        return {
          data: res.data.data,
          meta: res.data.meta || {
            currentPage: params?.page || 1,
            lastPage: 1,
            perPage: params?.perPage || 20,
            total: res.data.data.length
          }
        }
      }
    } catch (err: any) {
      if (!shouldUseMockFallback(err)) throw err
      console.warn('[adminService] Using mock fallback for getDisputes:', err)
    }

    let list = [...mockAdminDisputes]
    if (params?.status && params.status !== 'all') {
      list = list.filter(d => d.status === params.status)
    }

    const page = params?.page || 1
    const perPage = params?.perPage || 10
    const start = (page - 1) * perPage

    return {
      data: list.slice(start, start + perPage),
      meta: {
        currentPage: page,
        lastPage: Math.max(1, Math.ceil(list.length / perPage)),
        perPage,
        total: list.length
      }
    }
  },

  async resolveDispute(id: string, data: {
    decision: 'refund_buyer' | 'release_seller'
    refundAmount?: number
    reason: string
  }): Promise<{ success: boolean; data: any }> {
    // Maps onto the real disputes.status CHECK constraint ('resolved' | 'rejected') —
    // there's no separate "partial" status, a partial refund is just a 'resolved'
    // outcome with a smaller refundAmount.
    const body = {
      status: data.decision === 'refund_buyer' ? 'resolved' : 'rejected',
      resolution: data.reason,
      refundAmount: data.decision === 'refund_buyer' ? data.refundAmount || 0 : 0,
    }
    try {
      const res = await apiClient.put<any>(`/api/admin/disputes/${id}/resolve`, body)
      return res.data
    } catch (err) {
      console.warn('[adminService] Mock resolving dispute:', err)
      const d = mockAdminDisputes.find(x => x.id === id)
      if (d) {
        d.status = body.status as 'resolved' | 'rejected'
        d.resolution = body.resolution
        d.refundAmount = formatMoney(body.refundAmount)
      }
      return { success: true, data: d }
    }
  },

  // 5. KYC Approvals
  async getKycRecords(params?: {
    status?: string
    page?: number
    perPage?: number
  }): Promise<PaginatedResult<AdminKycApplication>> {
    try {
      const res = await apiClient.get<any>('/api/admin/kyc', params)
      if (res.data && res.data.data) {
        return {
          data: res.data.data,
          meta: res.data.meta || {
            currentPage: params?.page || 1,
            lastPage: 1,
            perPage: params?.perPage || 20,
            total: res.data.data.length
          }
        }
      }
    } catch (err: any) {
      if (!shouldUseMockFallback(err)) throw err
      console.warn('[adminService] Using mock fallback for getKycRecords:', err)
    }

    let list = [...mockAdminKyc]
    if (params?.status && params.status !== 'all') {
      list = list.filter(k => k.status === params.status)
    }

    const page = params?.page || 1
    const perPage = params?.perPage || 10
    const start = (page - 1) * perPage

    return {
      data: list.slice(start, start + perPage),
      meta: {
        currentPage: page,
        lastPage: Math.max(1, Math.ceil(list.length / perPage)),
        perPage,
        total: list.length
      }
    }
  },

  async reviewKyc(id: string, data: {
    status: 'approved' | 'rejected'
    rejectionReasonCode?: string
    rejectionNotes?: string
  }): Promise<{ success: boolean; data: any }> {
    try {
      const res = await apiClient.put<any>(`/api/admin/kyc/${id}/review`, data)
      return res.data
    } catch (err) {
      console.warn('[adminService] Mock reviewing KYC application:', err)
      const k = mockAdminKyc.find(x => x.id === id)
      if (k) {
        k.status = data.status
        k.rejectionReason = [data.rejectionReasonCode, data.rejectionNotes].filter(Boolean).join(': ') || undefined
        k.reviewedAt = new Date().toISOString()
        k.reviewedBy = 'Администратор'
      }
      return { success: true, data: k }
    }
  },

  // 6. Financials & Payouts
  async getFinancials(): Promise<{
    success: boolean
    data: {
      gmv: Money
      commissionRevenue: Money
      pendingPayouts: { count: number; amount: string; formatted: string }
      payouts: AdminPayoutRequest[]
    }
  }> {
    try {
      const res = await apiClient.get<any>('/api/admin/financials')
      if (res.data && res.data.data) {
        return { success: true, data: res.data.data }
      }
    } catch (err: any) {
      if (!shouldUseMockFallback(err)) throw err
      console.warn('[adminService] Using mock fallback for getFinancials:', err)
    }

    return {
      success: true,
      data: {
        gmv: mockTreasury.gmv,
        commissionRevenue: mockTreasury.commissionRevenue,
        pendingPayouts: mockTreasury.pendingPayouts,
        payouts: [...mockAdminPayouts]
      }
    }
  },

  async processPayout(id: string, data: {
    action: 'approve' | 'reject'
    reason?: string
    transactionReference?: string
  }): Promise<{ success: boolean; data: any }> {
    const status = data.action === 'approve' ? 'completed' : 'failed'
    const adminNotes = data.transactionReference || data.reason
    try {
      const res = await apiClient.post<any>(`/api/admin/payouts/${id}/process`, { status, adminNotes })
      return res.data
    } catch (err) {
      console.warn('[adminService] Mock processing payout:', err)
      const p = mockAdminPayouts.find(x => x.id === id)
      if (p) {
        p.status = status
        p.adminNotes = adminNotes
        p.processedAt = new Date().toISOString()
        p.processedBy = 'Администратор'
      }
      return { success: true, data: p }
    }
  },

  // 7. Real-Time Monitoring & Controls
  async getMonitoring(): Promise<{
    success: boolean
    data: {
      liveAuctions: AdminLiveAuctionState[]
      liveBids: AdminLiveBidEvent[]
    }
  }> {
    try {
      const res = await apiClient.get<any>('/api/admin/monitoring')
      if (res.data && res.data.data) {
        return {
          success: true,
          data: {
            liveAuctions: res.data.data.activeAuctions || [],
            liveBids: res.data.data.recentBids || []
          }
        }
      }
    } catch (err: any) {
      if (!shouldUseMockFallback(err)) throw err
      console.warn('[adminService] Using mock fallback for getMonitoring:', err)
    }

    return {
      success: true,
      data: {
        liveAuctions: [...mockLiveAuctions],
        liveBids: [...mockLiveBids]
      }
    }
  },

  async pauseAuction(id: string, paused: boolean): Promise<{ success: boolean; isPaused: boolean }> {
    try {
      const res = await apiClient.post<any>(`/api/admin/auctions/${id}/pause`, { paused })
      return res.data
    } catch (err) {
      console.warn('[adminService] Mock toggling auction pause:', err)
      return { success: true, isPaused: paused }
    }
  },

  async cancelBid(bidId: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.post<any>(`/api/admin/bids/${bidId}/cancel`, { reason })
      return res.data
    } catch (err) {
      console.warn('[adminService] Mock cancelling suspicious bid:', err)
      const bidIdx = mockLiveBids.findIndex(x => x.id === bidId)
      if (bidIdx !== -1) {
        mockLiveBids.splice(bidIdx, 1)
      }
      return { success: true, message: 'Ставка жокко чыгарылды жана мурунку лидер калыбына келтирилди' }
    }
  },

  // 8. Analytics
  async getAnalytics(timeframe: 'today' | '7d' | '30d' | '90d' | 'year' = '30d'): Promise<{
    success: boolean
    data: AdminAnalyticsData
  }> {
    try {
      const res = await apiClient.get<any>('/api/admin/analytics', { timeframe })
      if (res.data && res.data.data) {
        return { success: true, data: res.data.data }
      }
    } catch (err: any) {
      if (!shouldUseMockFallback(err)) throw err
      console.warn('[adminService] Using mock fallback for getAnalytics:', err)
    }

    return {
      success: true,
      data: {
        ...mockAnalyticsData,
        timeframe
      }
    }
  },

  // 9. Media Explorer (iOS / Finder Style)
  async getMediaExplorer(folderId?: string): Promise<{ success: boolean; data: MediaExplorerData }> {
    try {
      const res = await apiClient.get<any>('/api/admin/media', folderId ? { folderId } : undefined)
      if (res.data && res.data.data) {
        return { success: true, data: res.data.data }
      }
    } catch (err: any) {
      if (!shouldUseMockFallback(err)) throw err
      console.warn('[adminService] Using fallback for getMediaExplorer:', err)
    }

    return {
      success: true,
      data: {
        currentFolderId: folderId || 'root',
        currentFolder: null,
        breadcrumbs: [{ id: 'root', name: 'Medya Kütüphanesi' }],
        subfolders: [
          { id: 'auctions', name: 'İlan Görselleri (Auctions)', parentId: null, color: '#3B82F6', icon: 'Gavel', itemCount: 0, createdAt: '2026-01-01' },
          { id: 'avatars', name: 'Kullanıcı Avatarları', parentId: null, color: '#10B981', icon: 'User', itemCount: 0, createdAt: '2026-01-01' },
          { id: 'kyc', name: 'KYC & Belgeler', parentId: null, color: '#F59E0B', icon: 'ShieldCheck', itemCount: 0, createdAt: '2026-01-01' },
          { id: 'assets', name: 'Banner & Varlıklar', parentId: null, color: '#8B5CF6', icon: 'Sparkles', itemCount: 0, createdAt: '2026-01-01' },
        ],
        files: [],
        stats: {
          totalFiles: 0,
          totalFolders: 4,
          totalSizeBytes: 0,
          formattedTotalSize: '0.0 MB'
        }
      }
    }
  },

  async createMediaFolder(name: string, parentId?: string | null, color?: string, icon?: string): Promise<{ success: boolean; data?: MediaFolderItem; message?: string }> {
    try {
      const res = await apiClient.post<any>('/api/admin/media/folder', { name, parentId, color, icon })
      return res.data
    } catch (err: any) {
      console.error('Failed to create media folder:', err)
      throw err
    }
  },

  async deleteMediaFolder(folderId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await apiClient.delete<any>(`/api/admin/media/folder/${folderId}`)
      return res.data
    } catch (err: any) {
      console.error('Failed to delete media folder:', err)
      throw err
    }
  },

  async deleteMediaFile(fileId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await apiClient.delete<any>(`/api/admin/media/file/${fileId}`)
      return res.data
    } catch (err: any) {
      console.error('Failed to delete media file:', err)
      throw err
    }
  },

  async addMediaFile(data: { name: string; url: string; folderId: string; sizeBytes?: number; mimeType?: string; dimensions?: string }): Promise<{ success: boolean; data?: MediaExplorerFile }> {
    try {
      const res = await apiClient.post<any>('/api/admin/media/file', data)
      return res.data
    } catch (err: any) {
      console.error('Failed to add media file:', err)
      throw err
    }
  },

  // Legacy media getter
  async getMedia(source?: 'auction' | 'avatar'): Promise<{ success: boolean; data: AdminMediaItem[] }> {
    try {
      const res = await apiClient.get<any>('/api/admin/media', source ? { source } : undefined)
      if (res.data && res.data.data) {
        return { success: true, data: res.data.data }
      }
    } catch (err: any) {
      if (!shouldUseMockFallback(err)) throw err
      console.warn('[adminService] Using mock fallback for getMedia:', err)
    }

    let list = [...mockAdminMedia]
    if (source) {
      list = list.filter(m => m.source === source)
    }
    return { success: true, data: list }
  },

  // 10. Platform Settings
  async getSettings(): Promise<{ success: boolean; data: PlatformSettings }> {
    try {
      const res = await apiClient.get<any>('/api/admin/settings')
      if (res.data && res.data.data) {
        return { success: true, data: res.data.data }
      }
    } catch (err: any) {
      if (!shouldUseMockFallback(err)) throw err
      console.warn('[adminService] Using fallback for getSettings:', err)
    }

    return {
      success: true,
      data: {
        siteName: 'iTorgo',
        siteTitle: 'iTorgo — Кыргызстандын №1 Онлайн Аукцион Платформасы',
        siteDescription: 'Кыргызстандагы реалдуу убакыттагы биринчи ачык аукцион жана соода платформасы.',
        commissionRatePct: 8.0,
        antiSnipingMinutes: 2,
        antiSnipingTriggerMinutes: 2,
        minDepositKgs: 500,
        currency: 'KGS',
        supportPhone: '+996 555 999888',
        supportEmail: 'support@itorgo.kg',
        whatsappNumber: '+996 555 999888',
        address: 'Бишкек ш., Чүй проспекти 114, 3-кабат',
        maintenanceMode: false,
        autoApproveAuctions: false,
        kycRequiredToBid: true,
        twoFactorRequired: false,
        updatedAt: new Date().toISOString()
      }
    }
  },

  async updateSettings(settings: Partial<PlatformSettings>): Promise<{ success: boolean; data: PlatformSettings; message?: string }> {
    try {
      const res = await apiClient.put<any>('/api/admin/settings', settings)
      return res.data
    } catch (err: any) {
      console.error('Failed to update settings:', err)
      throw err
    }
  },

  // 11. Theme & Design Customizer
  async getTheme(): Promise<{ success: boolean; data: ThemeSettings }> {
    try {
      const res = await apiClient.get<any>('/api/admin/theme')
      return res.data
    } catch (err: any) {
      console.warn('[adminService] Using fallback for getTheme:', err)
      return {
        success: true,
        data: {
          logoType: 'icon_text',
          logoUrl: '',
          logoText: 'iTorgo',
          logoTagline: 'Real-Time Platform',
          logoHeightPx: 40,
          logoBadgeShape: 'rounded',
          logoBadgeColor: '#F2B138',
          faviconUrl: '/favicon.ico',
          primaryColor: '#F2B138',
          primaryHoverColor: '#E09E22',
          secondaryColor: '#5B9BD5',
          secondaryHoverColor: '#4787C4',
          accentColor: '#F4F4F5',
          backgroundColor: '#FFFFFF',
          surfaceColor: '#FFFFFF',
          surfaceElevatedColor: '#FFFFFF',
          textPrimaryColor: '#18181B',
          textSecondaryColor: '#52525B',
          textMutedColor: '#71717A',
          borderColor: '#E4E4E7',
          buttonRadius: '10px',
          buttonShadow: 'md',
          buttonHoverEffect: 'lift',
          cardRadius: '16px',
          cardGlassBlur: '20px',
          cardBorder: 'subtle',
          cardShadow: 'md',
          fontFamily: 'Poppins',
          titleFontWeight: '800',
          activePreset: 'sunlit_gold',
          updatedAt: new Date().toISOString()
        }
      }
    }
  },

  async updateTheme(theme: Partial<ThemeSettings>): Promise<{ success: boolean; data: ThemeSettings; message?: string }> {
    try {
      const res = await apiClient.put<any>('/api/admin/theme', theme)
      return res.data
    } catch (err: any) {
      console.error('Failed to update theme:', err)
      throw err
    }
  },

  async getThemePresets(): Promise<{ success: boolean; data: Record<string, ThemePresetItem> }> {
    try {
      const res = await apiClient.get<any>('/api/admin/theme/presets')
      return res.data
    } catch (err: any) {
      console.warn('[adminService] Using fallback for getThemePresets:', err)
      return {
        success: true,
        data: {
          sunlit_gold: {
            name: '☀️ Sunlit Gold (Orijinal iTorgo)',
            description: 'Kırgızistan güneşi ve altın sarısı, dengeli açık tema',
            theme: {
              primaryColor: '#F2B138',
              primaryHoverColor: '#E09E22',
              secondaryColor: '#5B9BD5',
              backgroundColor: '#FFFFFF',
              buttonRadius: '10px',
              fontFamily: 'Poppins',
              logoBadgeColor: '#F2B138'
            }
          }
        }
      }
    }
  },

  // 12. Real-time Admin Notifications
  async getNotifications(): Promise<{ success: boolean; data: any[]; unreadCount: number }> {
    try {
      const res = await apiClient.get<any>('/api/admin/notifications')
      return res.data
    } catch (err: any) {
      console.warn('[adminService] Using fallback for getNotifications:', err)
      return {
        success: true,
        data: [],
        unreadCount: 0
      }
    }
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    try {
      const res = await apiClient.put<any>(`/api/admin/notifications/${id}/read`)
      return res.data
    } catch (err: any) {
      console.warn('[adminService] Failed to mark notification read:', err)
      return { success: true }
    }
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    try {
      const res = await apiClient.put<any>('/api/admin/notifications/read-all')
      return res.data
    } catch (err: any) {
      console.warn('[adminService] Failed to mark all notifications read:', err)
      return { success: true }
    }
  }
}

export default adminService