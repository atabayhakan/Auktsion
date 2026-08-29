// src/services/userService.ts
import apiClient from './api'
import type { User, PayoutMethod, PayoutInstruction } from '@/types'

export const userService = {
  async getProfile(): Promise<{ success: boolean; data: User }> {
    const res = await apiClient.get<{ success: boolean; data: User }>('/api/user/profile')
    return res.data
  },

  async updateProfile(data: Partial<User>): Promise<{ success: boolean; data: User }> {
    const res = await apiClient.put<{ success: boolean; data: User }>('/api/user/profile', data)
    return res.data
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    const res = await apiClient.put<{ success: boolean; message?: string }>('/api/user/password', {
      currentPassword,
      newPassword,
    })
    return res.data
  },

  async getListings(status?: string): Promise<{ success: boolean; data: any[] }> {
    const res = await apiClient.get<{ success: boolean; data: any[] }>('/api/user/listings', { status })
    return res.data
  },

  async getBids(): Promise<{ success: boolean; data: any[] }> {
    const res = await apiClient.get<{ success: boolean; data: any[] }>('/api/user/bids')
    return res.data
  },

  async getWatchlist(): Promise<{ success: boolean; data: any[] }> {
    const res = await apiClient.get<{ success: boolean; data: any[] }>('/api/user/watchlist')
    return res.data
  },

  async toggleWatchlist(auctionId: string): Promise<{ success: boolean; isWatching: boolean }> {
    const res = await apiClient.post<{ success: boolean; isWatching: boolean }>(`/api/user/watchlist/${auctionId}`)
    return res.data
  },

  async getKyc(): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.get<{ success: boolean; data: any }>('/api/user/kyc')
    return res.data
  },

  async submitKyc(data: {
    inn?: string
    idFrontUrl?: string
    idBackUrl?: string
    selfieUrl?: string
    proofOfAddressUrl?: string
  }): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.post<{ success: boolean; data: any }>('/api/user/kyc', data)
    return res.data
  },

  async uploadKycDocument(file: File, type: string): Promise<{ success: boolean; url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    const res = await apiClient.post<{ success: boolean; url: string }>('/api/upload', formData)
    return res.data
  },

  async getPayoutMethods(): Promise<{ success: boolean; data: PayoutMethod[] }> {
    const res = await apiClient.get<{ success: boolean; data: PayoutMethod[] }>('/api/user/payout-methods')
    return res.data
  },

  async addPayoutMethod(data: {
    bankCode: string
    accountNumber: string
    accountHolderName: string
    inn?: string
    isDefault?: boolean
  }): Promise<{ success: boolean; data: PayoutMethod }> {
    const res = await apiClient.post<{ success: boolean; data: PayoutMethod }>('/api/user/payout-methods', data)
    return res.data
  },

  async deletePayoutMethod(id: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete<{ success: boolean }>(`/api/user/payout-methods/${id}`)
    return res.data
  },

  async getPayouts(): Promise<{ success: boolean; data: PayoutInstruction[] }> {
    const res = await apiClient.get<{ success: boolean; data: PayoutInstruction[] }>('/api/user/payouts')
    return res.data
  },

  async requestPayout(amount: number, payoutMethodId?: string): Promise<{ success: boolean; data: PayoutInstruction }> {
    const res = await apiClient.post<{ success: boolean; data: PayoutInstruction }>('/api/user/payouts', {
      amount,
      payoutMethodId,
    })
    return res.data
  },

  async getSettings(): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.get<{ success: boolean; data: any }>('/api/user/settings')
    return res.data
  },

  async updateSettings(settings: any): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.put<{ success: boolean; data: any }>('/api/user/settings', settings)
    return res.data
  },
}

export default userService
