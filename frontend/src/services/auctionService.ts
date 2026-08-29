// src/services/auctionService.ts
import apiClient from './api'
import type { Auction, AuctionFilters, Bid, Category, PaginatedResponse } from '@/types'

export const auctionService = {
  async getAuctions(filters: AuctionFilters = {}): Promise<PaginatedResponse<Auction>> {
    const res = await apiClient.get<PaginatedResponse<Auction>>('/api/auctions', filters)
    return res.data
  },

  async getAuctionById(id: string): Promise<{ success: boolean; data: Auction }> {
    const res = await apiClient.get<{ success: boolean; data: Auction }>(`/api/auctions/${id}`)
    return res.data
  },

  async createAuction(data: any): Promise<{ success: boolean; data: Auction }> {
    const res = await apiClient.post<{ success: boolean; data: Auction }>('/api/auctions', data)
    return res.data
  },

  async updateAuction(id: string, data: any): Promise<{ success: boolean; data: Auction }> {
    const res = await apiClient.put<{ success: boolean; data: Auction }>(`/api/auctions/${id}`, data)
    return res.data
  },

  async deleteAuction(id: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete<{ success: boolean }>(`/api/auctions/${id}`)
    return res.data
  },

  async placeBid(auctionId: string, amount: number): Promise<{ success: boolean; data: Bid; auction: Auction }> {
    const res = await apiClient.post<{ success: boolean; data: Bid; auction: Auction }>(`/api/auctions/${auctionId}/bids`, {
      amount,
    })
    return res.data
  },

  async getAuctionBids(auctionId: string): Promise<{ success: boolean; data: Bid[] }> {
    const res = await apiClient.get<{ success: boolean; data: Bid[] }>(`/api/auctions/${auctionId}/bids`)
    return res.data
  },

  async buyNow(auctionId: string): Promise<{ success: boolean; data: Auction; paymentId: string }> {
    const res = await apiClient.post<{ success: boolean; data: Auction; paymentId: string }>(`/api/auctions/${auctionId}/buy-now`)
    return res.data
  },

  async getCategories(): Promise<{ success: boolean; data: Category[] }> {
    const res = await apiClient.get<{ success: boolean; data: Category[] }>('/api/categories')
    return res.data
  },

  async getRegions(): Promise<{ success: boolean; data: any[] }> {
    const res = await apiClient.get<{ success: boolean; data: any[] }>('/api/regions')
    return res.data
  },
}

export default auctionService
