// src/types/api.ts
// API response types

import type { 
  Money, 
  AuctionStatus, 
  BidStatus, 
  PaymentStatus, 
  PayoutStatus, 
  KycStatus, 
  PaymentGateway 
} from './domain'

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
  }
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}

export interface AuctionFilters {
  search?: string
  category?: string
  subCategory?: string
  city?: string
  status?: string
  minPrice?: number
  maxPrice?: number
  priceMin?: number
  priceMax?: number
  endsAtFrom?: string
  endsAtTo?: string
  sortBy?: 'newest' | 'ending_soon' | 'price_asc' | 'price_desc' | 'most_bids'
  page?: number
  perPage?: number
}

export interface LivestockAttributes {
  animalType?: 'cow' | 'bull' | 'horse' | 'foal' | 'sheep' | 'ram' | 'goat' | 'other' | string
  breed?: string // Ала-Тоо, Гиссар, Аргымак ж.б.
  ageYears?: number
  ageMonths?: number
  weightKg?: number
  milkYieldLiters?: number
  isVaccinated?: boolean
  vaccinated?: boolean
  hasVetPassport?: boolean
  deliveryAvailable?: boolean
}

export interface VehicleAttributes {
  brand?: string
  make?: string
  model: string
  year: number
  mileage?: number
  mileageKm?: number
  steering?: 'left' | 'right' | string // Сол / Оң руль
  fuelType?: 'petrol' | 'gas' | 'diesel' | 'hybrid' | 'electric' | string
  transmission?: 'automatic' | 'manual' | 'variator' | 'robot' | string
  engineVolume?: number // e.g. 2.5
  isCustomsCleared?: boolean // Бажы төлөнгөн (Растаможен)
  condition?: 'perfect' | 'good' | 'needs_repair' | 'damaged' | string
}

export interface RealEstateAttributes {
  propertyType?: 'commercial_shop' | 'dordoy_container' | 'apartment' | 'house' | 'land' | string
  type?: string
  areaSqm: number
  rooms?: number
  deedType?: 'red_book' | 'yellow_book' | 'tech_passport' | string // Кызыл китеп / Сары китеп / Техпаспорт
  floor?: number
  totalFloors?: number
  monthlyRevenue?: number
}

export interface Auction {
  id: string
  title: string
  description: string
  category: string
  subCategory?: string
  images: string[]
  startingPrice: Money
  currentPrice: Money
  reservePrice?: Money
  buyNowPrice?: Money // Дароо сатып алуу (Buy It Now)
  bidIncrement?: Money
  bidCount: number
  status: AuctionStatus
  sellerId: string
  seller?: UserSummary
  city: string
  regionId?: string
  district?: string
  startAt?: string
  endsAt: string
  createdAt: string
  updatedAt?: string
  views?: number
  isWatching?: boolean
  isWatchlisted?: boolean
  isBlitz?: boolean // Flaş аукцион
  isFeatured?: boolean
  livestock?: LivestockAttributes
  vehicle?: VehicleAttributes
  realEstate?: RealEstateAttributes
}


export interface Category {
  id: string
  name: string
  icon: string
  count: number
  subCategories: string[]
}

export interface City {
  id: string
  name: string
  slug: string
}

export interface Bid {
  id: string
  auctionId: string
  auctionTitle?: string
  auctionImage?: string
  bidderId: string
  bidderName?: string
  bidder?: any
  bidder_id?: string | number
  amount: Money
  status: BidStatus
  placedAt: string
  placed_at?: string
  isWinning: boolean
  sequence?: number
}

export interface User {
  id: string
  uuid?: string
  email: string
  phone: string
  fullName: string
  avatar?: string
  role?: string
  status?: 'active' | 'banned' | 'suspended' | string
  kycStatus: KycStatus
  kycDocuments: {
    idFront?: string
    idBack?: string
    selfie?: string
    proofOfAddress?: string
  }
  city: string
  rating?: number
  reviewCount?: number
  isSeller?: boolean
  balance?: Money | number | { amount: number; formatted?: string }
  createdAt: string
  updatedAt: string
  payoutMethods: PayoutMethod[]
}


export interface UserSummary {
  id: string
  fullName: string
  avatar?: string
  city: string
  rating?: number
  totalSales?: number
}

export interface PaymentIntent {
  id: string
  amount: Money
  gateway: PaymentGateway
  auctionId?: string
  returnUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export interface PaymentResult {
  id: string
  intentId: string
  amount: Money
  gateway: PaymentGateway
  status: PaymentStatus
  gatewayTransactionId?: string
  paidAt?: string
  errorMessage?: string
}

export interface PayoutInstruction {
  id: string
  userId: string
  amount: Money
  bankCode: PaymentGateway
  accountNumber: string
  accountHolderName: string
  inn: string
  status: PayoutStatus
  requestedAt: string
  completedAt?: string
  errorMessage?: string
}

export interface PayoutMethod {
  id: string
  bankName: string
  bankCode: PaymentGateway
  accountNumber: string
  isVerified: boolean
  isDefault: boolean
  createdAt: string
}

export interface KycProfile {
  userId: string
  status: KycStatus
  phoneVerified: boolean
  phoneVerifiedAt?: string
  identityVerified: boolean
  identityVerifiedAt?: string
  selfieVerified: boolean
  selfieVerifiedAt?: string
  addressVerified: boolean
  addressVerifiedAt?: string
  documents: {
    idFront?: string
    selfie?: string
    proofOfAddress?: string
  }
  inn?: string
  amlCheck: {
    status: 'passed' | 'failed' | 'pending'
    checkedAt?: string
  }
  sanctionCheck: {
    status: 'passed' | 'failed' | 'pending'
    checkedAt?: string
  }
  pepCheck: {
    status: 'passed' | 'failed' | 'pending'
    checkedAt?: string
  }
}

export interface BidPlacedEvent {
  auctionId?: string
  auction_id?: string | number
  bid: Bid
  bidSequence?: number
  auctionState?: {
    currentPrice: Money
    bidCount: number
    endsAt: string
  }
  auction_state?: {
    current_price?: Money
    bid_count?: number
    ends_at?: string
  }
  timestamp: string
}


export interface AuctionEndedEvent {
  auctionId: string
  finalPrice: Money
  winnerId?: string
  status: AuctionStatus
  timestamp: string
}

export interface EchoChannel {
  name?: string
  channel?: string
  event?: string
  data?: any
  joined?: boolean
  subscribed?: boolean
}


export interface AuctionChannelEvents {
  'bid.placed': BidPlacedEvent
  'auction.ended': AuctionEndedEvent
}

export interface BidGraphPoint {
  time: string
  price: number
  bidCount: number
  bidderId: string
}

export interface KafkaBidStream {
  auctionId: string
  points: BidGraphPoint[]
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'