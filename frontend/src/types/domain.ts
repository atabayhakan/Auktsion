// src/types/domain.ts
// Domain types for iTorgo

export interface Money {
  amount: string
  minorUnits: number
  currency: string
  formatted: string
}

export interface Currency {
  code: string
  symbol: string
  locale: string
  minorUnit: number
}

export interface MoneyInput {
  amount: number | string
  currency?: string
}

export type AuctionStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'active' 
  | 'ended_sold' 
  | 'ended_unsold' 
  | 'ended_reserve_not_met'
  | 'cancelled'
  | 'flagged'

export type BidStatus = 
  | 'pending'
  | 'active' 
  | 'winning' 
  | 'outbid' 
  | 'won' 
  | 'lost' 
  | 'cancelled'

export interface BidFormData {
  amount: string
  auctionId?: string
  confirmTerms?: boolean
}

export type PaymentStatus = 
  | 'initial' 
  | 'pending' 
  | 'processing' 
  | 'success' 
  | 'failed' 
  | 'refunded' 
  | 'cancelled'

export type PayoutStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled'

export type KycStatus = 
  | 'not_started' 
  | 'phone_verified' 
  | 'id_uploaded' 
  | 'ocr_passed' 
  | 'pending'
  | 'verified' 
  | 'rejected'
  | 'on_hold'


export type PaymentGateway = 
  | 'mbank' 
  | 'optima' 
  | 'demirbank' 
  | 'elqr' 
  | 'o_nom' 
  | 'stripe'

export type PersonalIdType = 
  | 'passport' 
  | 'id_card' 
  | 'driving_license'

export const CURRENCY_SYMBOLS = {
  KGS: 'сом',
  USD: '$',
  EUR: '€',
  RUB: '₽',
} as const

export const CURRENCY_LOCALES = {
  KGS: 'ky-KG',
  USD: 'en-US',
  EUR: 'de-DE',
  RUB: 'ru-RU',
} as const

export const KYC_STATUS_LABELS: Record<string, { label: string; description: string; color: string }> = {
  not_started: { label: 'Башталган жок', description: 'KYC процесси башталбаган', color: 'gray' },
  phone_verified: { label: 'Телефон тастыкталды', description: 'SMS код менен тастыкталды', color: 'blue' },
  id_uploaded: { label: 'Өздүк документ жүктөлдү', description: 'Паспорт же ID картасы жүктөлдү', color: 'yellow' },
  ocr_passed: { label: 'OCR өттү', description: 'Автоматтык тааныштыруу ийгиликтүү аяктады', color: 'purple' },
  verified: { label: 'Толук тастыкталды', description: 'NBKR тарабынан расталган', color: 'green' },
  rejected: { label: 'Четке кагылды', description: 'Маалыматтар жетишсиз же ката', color: 'red' },
}

export const AUCTION_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Черновик', color: 'gray' },
  pending_approval: { label: 'Модерацияда', color: 'yellow' },
  active: { label: 'Активдүү', color: 'green' },
  ended_sold: { label: 'Сатылды', color: 'green' },
  ended_unsold: { label: 'Сатылган жок', color: 'gray' },
  ended_reserve_not_met: { label: 'Резерв жетпеди', color: 'red' },
  cancelled: { label: 'Жокко чыгарылды', color: 'red' },
}

export const BID_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Активдүү', color: 'blue' },
  winning: { label: 'Алдыда', color: 'green' },
  outbid: { label: 'Текеп берилген', color: 'orange' },
  won: { label: 'Утту', color: 'green' },
  lost: { label: 'Жеңилди', color: 'red' },
  cancelled: { label: 'Жокко чыгарылды', color: 'gray' },
}

export const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  initial: { label: 'Башталган', color: 'gray' },
  pending: { label: 'Күтүп жатат', color: 'yellow' },
  processing: { label: 'Иштелип жатат', color: 'blue' },
  success: { label: 'Ийгилик', color: 'green' },
  failed: { label: 'Ката', color: 'red' },
  refunded: { label: 'Кайтарылды', color: 'blue' },
  cancelled: { label: 'Жокко чыгарылды', color: 'gray' },
}

export const PAYOUT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Күтүп жатат', color: 'yellow' },
  processing: { label: 'Иштелип жатат', color: 'blue' },
  completed: { label: 'Аяктады', color: 'green' },
  failed: { label: 'Ката', color: 'red' },
  cancelled: { label: 'Жокко чыгарылды', color: 'gray' },
}

export const PAYMENT_GATEWAY_INFO: Record<string, { name: string; logo: string; color: string }> = {
  mbank: { name: 'MBank', logo: 'MB', color: '#0052CC' },
  optima: { name: 'Optima Bank', logo: 'OB', color: '#E60012' },
  demirbank: { name: 'DemirBank', logo: 'DB', color: '#00A651' },
  elqr: { name: 'ELQR', logo: 'EQ', color: '#000000' },
  o_nom: { name: 'O!Nom', logo: 'ON', color: '#FF6B00' },
  stripe: { name: 'Stripe', logo: 'ST', color: '#635BFF' },
}

export const AML_THRESHOLD_KGS_MINOR = 3_000_000 // 30,000 KGS in tiyyn

export interface KyzgyzstanPersonalId {
  value: string
  type: PersonalIdType
  isValid: boolean
}