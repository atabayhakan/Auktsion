// src/types/admin.ts
// Administrative TypeScript Domain & API interfaces for iTorgo v2.0

import type { Money, KycStatus, PaymentGateway, AuctionStatus } from './domain'
import type { LivestockAttributes, VehicleAttributes, RealEstateAttributes } from './api'

export type AdminRole = 'buyer' | 'seller' | 'moderator' | 'admin' | 'superadmin'
export type UserAccountStatus = 'active' | 'suspended' | 'banned'

export interface AdminUser {
  id: string
  username: string | null
  fullName: string
  email: string
  phone: string
  inn: string | null
  role: AdminRole
  status: UserAccountStatus
  kycStatus: KycStatus
  avatar?: string
  city: string
  district?: string | null
  balance: Money
  banReason?: string
  createdAt: string
  updatedAt: string
}

export interface AdminUserDetail extends AdminUser {
  kycDocuments: {
    idFront?: string
    selfie?: string
    proofOfAddress?: string
  }
  payoutMethods: Array<{
    id: string
    bankName: string
    bankCode: string
    accountNumber: string
    isVerified: boolean
    isDefault: boolean
    createdAt: string
  }>
  activeListingsCount: number
  activeBidsCount: number
  recentBids: Array<{
    id: string
    auctionId: string
    auctionTitle: string
    amount: Money
    status: string
    placedAt: string
  }>
  recentListings: Array<{
    id: string
    title: string
    currentPrice: Money
    status: string
    endsAt: string
  }>
}

export interface AdminListing {
  id: string
  title: string
  description: string
  category: string
  subCategory?: string
  images: string[]
  startingPrice: Money
  currentPrice: Money
  reservePrice: Money // Visible to admin
  buyNowPrice?: Money
  bidIncrement: Money
  bidCount: number
  status: AuctionStatus
  sellerId: string
  seller: {
    id: string
    fullName: string
    rating: number
    kycStatus: KycStatus
    avatar?: string
    phone?: string
  }
  city: string
  startAt: string
  endsAt: string
  createdAt: string
  isFeatured: boolean
  isBlitz: boolean
  reserveWaived?: boolean
  reportsCount: number
  viewsCount: number
  watchersCount: number
  livestock?: LivestockAttributes
  vehicle?: VehicleAttributes
  realEstate?: RealEstateAttributes
}

// Matches the real `disputes.status` CHECK constraint (server/src/database/schema.ts) —
// this admin UI has no evidence-upload/messaging backend, so it only tracks
// the 4 states the database actually supports.
export type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'resolved'
  | 'rejected'

// Matches the real /api/admin/disputes response shape (server/src/models/disputeModel.ts
// formatDispute) — there's no evidence-upload, messaging, or shipment-tracking backend,
// so this only carries what the database and dispute-resolution endpoint actually support.
export interface AdminDispute {
  id: string
  auctionId: string
  auctionTitle: string
  complainantId: string
  complainantName: string
  respondentId: string
  respondentName: string
  reason: string
  status: DisputeStatus
  resolution?: string
  refundAmount: Money
  createdAt: string
  updatedAt: string
}

export interface AdminKycApplication {
  id: string
  userId: string
  userName?: string
  userEmail?: string
  userAvatar?: string
  userCity?: string
  userPhone?: string
  inn: string | null
  idFrontUrl?: string
  idBackUrl?: string
  selfieUrl?: string
  proofOfAddressUrl?: string
  amlStatus: 'clean' | 'flagged' | 'review'
  sanctionsStatus: 'clean' | 'match'
  pepStatus: 'none' | 'pep_associated'
  duplicateInnAccounts: string[]
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
}

export interface AdminPayoutRequest {
  id: string
  userId: string
  userName?: string
  userEmail?: string
  amount: Money
  bankCode: string
  bankName: string
  accountNumber: string
  accountHolderName: string
  inn?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  adminNotes?: string
  processedBy?: string
  processedAt?: string
  requestedAt: string
}

export interface AdminTreasuryOverview {
  gmv: Money
  commissionRevenue: Money
  pendingPayouts: {
    count: number
    amount: string
    formatted: string
  }
}

export interface AdminLiveAuctionState {
  id: string
  title: string
  category: string
  images: string[]
  currentPrice: Money
  startingPrice: Money
  bidCount: number
  endsAt: string
  isBlitz: boolean
  city: string
}

export interface AdminLiveBidEvent {
  id: string
  auctionId: string
  auctionTitle: string
  bidderId: string
  bidderName: string
  bidderAvatar?: string
  amount: Money
  status: string
  placedAt: string
}

export interface AdminKPIStats {
  totalGmv: Money
  platformRevenue: Money
  activeAuctionsCount: number
  totalUsersCount: number
  pendingKycCount: number
  openDisputesCount: number
  pendingPayoutsCount: number
}

export interface AdminAnalyticsData {
  timeframe: 'today' | '7d' | '30d' | '90d' | 'year'
  gmvTimeSeries: Array<{
    date: string
    gmv: number
    revenue: number
    bidsCount: number
  }>
  categoryBreakdown: Array<{
    category: string
    nameKg: string
    gmv: number
    lotCount: number
    percentage: number
    color: string
  }>
  kycConversionFunnel: Array<{
    stage: string
    labelKg: string
    usersCount: number
    conversionRate: number
  }>
  gatewayMarketShare: Array<{
    gateway: PaymentGateway
    name: string
    volumeKgs: number
    sharePct: number
    txCount: number
    color: string
  }>
  regionalMetrics: Array<{
    region: string
    nameKg: string
    gmv: number
    activeLots: number
    userCount: number
    sharePct: number
  }>
  hourlyBiddingDistribution: Array<{
    hour: number
    label: string
    bidsCount: number
    volume: number
  }>
}

export interface AdminMediaItem {
  id: string
  url: string
  source: 'auction' | 'avatar'
  title: string
  ownerId: string
  ownerLabel: string
  createdAt: string
}
