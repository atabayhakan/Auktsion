// src/composables/useFormatters.ts
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import type { Money, KycStatus, AuctionStatus, PaymentStatus, PaymentGateway, BidStatus, PayoutStatus } from '@/types'

const LOCALE_MAP: Record<string, string> = {
  ky: 'ky-KG',
  ru: 'ru-RU',
  tr: 'tr-TR',
}

// Currency formatting
export function useCurrencyFormatter(defaultCurrency: string = 'KGS') {
  const { locale, t } = useI18n()

  const getCurrencySymbol = (currency: string): string => {
    if (currency === 'KGS') {
      const sym = t('common.currency')
      return sym !== 'common.currency' ? sym : 'сом'
    }
    if (currency === 'USD') return '$'
    if (currency === 'RUB') return '₽'
    return currency
  }


  const formatMoney = (money: Money | null | undefined, options?: {
    showCurrency?: boolean
    compact?: boolean
    locale?: string
  }): string => {
    if (!money) return '-'
    
    const { showCurrency = true, compact = false, locale: customLocale } = options || {}
    const currLocale = customLocale || LOCALE_MAP[locale.value] || 'ky-KG'
    
    try {
      const amount = parseFloat(money.amount)
      if (isNaN(amount)) return money.formatted || '-'
      
      const symbol = getCurrencySymbol(money.currency)
      if (compact && amount >= 1000000) {
        const val = (amount / 1000000).toFixed(1) + 'M'
        return showCurrency ? (val + ' ' + symbol).trim() : val
      }
      if (compact && amount >= 1000) {
        const val = (amount / 1000).toFixed(1) + 'K'
        return showCurrency ? (val + ' ' + symbol).trim() : val
      }
      
      const formatted = new Intl.NumberFormat(currLocale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount)
      
      if (!showCurrency) return formatted
      
      if (money.currency === 'USD') {
        return symbol + formatted
      }
      return formatted + ' ' + symbol
    } catch {
      return money.formatted || (money.amount + ' ' + getCurrencySymbol(money.currency))
    }
  }

  const formatMinorUnits = (minorUnits: number, currency: string = defaultCurrency, options?: {
    showCurrency?: boolean
    compact?: boolean
  }): string => {
    const major = minorUnits / 100
    return formatMoney({
      amount: major.toFixed(2),
      minorUnits,
      currency,
      formatted: '',
    }, options)
  }

  const parseAmount = (input: string): number => {
    const cleaned = input.replace(/[^\d.,\-]/g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  const toMinorUnits = (amount: string | number, _currency: string = defaultCurrency): number => {
    const num = typeof amount === 'string' ? parseAmount(amount) : amount
    return Math.round(num * 100)
  }


  const getCurrencyInfo = (currency: string) => {
    return {
      code: currency,
      symbol: getCurrencySymbol(currency),
      locale: LOCALE_MAP[locale.value] || 'ky-KG',
      name: currency === 'KGS' ? 'KGS' : currency === 'USD' ? 'USD' : 'RUB',
    }
  }


  return {
    formatMoney,
    formatMinorUnits,
    parseAmount,
    toMinorUnits,
    getCurrencySymbol,
    getCurrencyInfo,
  }
}

// Date formatting
export function useDateFormatter(customLocale?: string) {
  const { locale, t } = useI18n()
  const activeLocale = computed(() => customLocale || LOCALE_MAP[locale.value] || 'ky-KG')

  const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    if (!date) return '-'
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return '-'
      return new Intl.DateTimeFormat(activeLocale.value, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...options,
      }).format(d)
    } catch {
      return '-'
    }
  }

  const formatDateTime = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    if (!date) return '-'
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return '-'
      return new Intl.DateTimeFormat(activeLocale.value, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options,
      }).format(d)
    } catch {
      return '-'
    }
  }

  const formatRelative = (date: string | Date): string => {
    if (!date) return '-'
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return '-'
      
      const now = new Date()
      const diff = now.getTime() - d.getTime()
      const absDiff = Math.abs(diff)
      
      const minutes = Math.floor(absDiff / 60000)
      const hours = Math.floor(absDiff / 3600000)
      const days = Math.floor(absDiff / 86400000)
      
      if (minutes < 1) return t('time.justNow')
      if (minutes < 60) return t('time.minutesAgo', { n: minutes })
      if (hours < 24) return t('time.hoursAgo', { n: hours })
      if (days < 7) return t('time.daysAgo', { n: days })
      if (days < 30) return t('time.weeksAgo', { n: Math.floor(days / 7) })
      if (days < 365) return t('time.monthsAgo', { n: Math.floor(days / 30) })
      return t('time.yearsAgo', { n: Math.floor(days / 365) })
    } catch {
      return '-'
    }
  }

  const formatTimeAgo = (date: string | Date): string => {
    return formatRelative(date)
  }

  return {
    formatDate,
    formatDateTime,
    formatRelative,
    formatTimeAgo,
  }
}

// Number formatting
export function useNumberFormatter(customLocale?: string) {
  const { locale } = useI18n()
  const activeLocale = computed(() => customLocale || LOCALE_MAP[locale.value] || 'ky-KG')

  const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
    if (isNaN(num)) return '-'
    try {
      return new Intl.NumberFormat(activeLocale.value, options).format(num)
    } catch {
      return num.toString()
    }
  }

  const formatCompact = (num: number): string => {
    return formatNumber(num, { notation: 'compact', maximumFractionDigits: 1 })
  }

  const formatPercent = (value: number, decimals = 1): string => {
    return formatNumber(value, { style: 'percent', minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  return {
    formatNumber,
    formatCompact,
    formatPercent,
  }
}

// Status label formatters
export function useStatusLabels() {
  const { t } = useI18n()

  const KYC_COLORS: Record<string, string> = {
    not_started: 'gray',
    phone_verified: 'blue',
    id_uploaded: 'yellow',
    ocr_passed: 'orange',
    verified: 'green',
    rejected: 'red',
    on_hold: 'purple',
    pending: 'yellow',
  }

  const KYC_ICONS: Record<string, string> = {
    not_started: 'circle',
    phone_verified: 'check-circle',
    id_uploaded: 'upload',
    ocr_passed: 'scan',
    verified: 'shield-check',
    rejected: 'x-circle',
    on_hold: 'clock',
    pending: 'clock',
  }

  const AUCTION_COLORS: Record<string, string> = {
    draft: 'gray',
    pending_approval: 'yellow',
    active: 'green',
    ended_sold: 'green',
    ended_unsold: 'gray',
    ended_reserve_not_met: 'orange',
    cancelled: 'red',
    disputed: 'purple',
  }

  const PAYMENT_COLORS: Record<string, string> = {
    initial: 'gray',
    pending: 'yellow',
    processing: 'blue',
    success: 'green',
    failed: 'red',
    refunded: 'blue',
    cancelled: 'gray',
    disputed: 'purple',
  }

  const BID_COLORS: Record<string, string> = {
    pending: 'yellow',
    active: 'green',
    outbid: 'orange',
    winning: 'green',
    won: 'green',
    lost: 'gray',
    cancelled: 'red',
  }

  const PAYOUT_COLORS: Record<string, string> = {
    pending: 'yellow',
    processing: 'blue',
    completed: 'green',
    failed: 'red',
    cancelled: 'gray',
    aml_review: 'purple',
  }

  const PAYMENT_GATEWAY_INFO: Record<PaymentGateway, { name: string; color: string; features: string[] }> = {
    mbank: { name: 'MBank', color: '#0052CC', features: ['QR код', 'P2P', 'Мобилдик'] },
    optima: { name: 'Optima Bank', color: '#E60012', features: ['3D Secure', 'Карта токенизациясы'] },
    demirbank: { name: 'DemirBank', color: '#00A651', features: ['IBAN', 'E-Commerce'] },
    elqr: { name: 'ELQR', color: '#6366F1', features: ['QR төлөө', 'Бир учуру'] },
    o_nom: { name: 'O!Nom', color: '#F97316', features: ['Мобилдик кошелек', 'Beeline'] },
    stripe: { name: 'Stripe', color: '#635BFF', features: ['Улуттук карталар', 'Apple/Google Pay'] },
  }

  const getKycLabel = (status: KycStatus | string) => {
    const key = 'status.kyc.' + status
    const label = t(key) !== key ? t(key) : status
    return {
      label,
      color: KYC_COLORS[status] || 'gray',
      icon: KYC_ICONS[status] || 'help-circle',
    }
  }

  const getAuctionLabel = (status: AuctionStatus | string) => {
    const key = 'status.auction.' + status
    const label = t(key) !== key ? t(key) : status
    return {
      label,
      color: AUCTION_COLORS[status] || 'gray',
    }
  }

  const getPaymentLabel = (status: PaymentStatus | string) => {
    const key = 'status.payment.' + status
    const label = t(key) !== key ? t(key) : status
    return {
      label,
      color: PAYMENT_COLORS[status] || 'gray',
    }
  }

  const getBidLabel = (status: BidStatus | string) => {
    const key = 'status.bid.' + status
    const label = t(key) !== key ? t(key) : status
    return {
      label,
      color: BID_COLORS[status] || 'gray',
    }
  }

  const getPayoutLabel = (status: PayoutStatus | string) => {
    const key = 'status.payout.' + status
    const label = t(key) !== key ? t(key) : status
    return {
      label,
      color: PAYOUT_COLORS[status] || 'gray',
    }
  }

  const getGatewayInfo = (gateway: PaymentGateway) => PAYMENT_GATEWAY_INFO[gateway] || { name: gateway, color: 'gray', features: [] }

  return {
    getKycLabel,
    getAuctionLabel,
    getPaymentLabel,
    getBidLabel,
    getPayoutLabel,
    getGatewayInfo,
    kyc: (s: KycStatus | string) => getKycLabel(s).label,
    auction: (s: AuctionStatus | string) => getAuctionLabel(s).label,
    payment: (s: PaymentStatus | string) => getPaymentLabel(s).label,
    bid: (s: BidStatus | string) => getBidLabel(s).label,
    payout: (s: PayoutStatus | string) => getPayoutLabel(s).label,
  }
}

// Combined formatter composable
export function useFormatters(customLocale?: string, defaultCurrency: string = 'KGS') {

  const currency = useCurrencyFormatter(defaultCurrency)
  const date = useDateFormatter(customLocale)
  const number = useNumberFormatter(customLocale)
  const status = useStatusLabels()

  return {
    currency,
    date,
    number,
    status,
    formatCurrency: currency.formatMoney,
    formatDate: date.formatDate,
    formatRelativeTime: date.formatRelative,
    formatKycStatus: (s: string) => status.getKycLabel(s).label,
    formatAuctionStatus: (s: string) => status.getAuctionLabel(s).label,
    formatPaymentStatus: (s: string) => status.getPaymentLabel(s).label,
    formatBidStatus: (s: string) => status.getBidLabel(s).label,
    formatPayoutStatus: (s: string) => status.getPayoutLabel(s).label,
  }
}

// Global default instances for direct imports
export const currency = {
  formatMoney: (m: any, opt?: any) => useCurrencyFormatter().formatMoney(m, opt),
  formatMinorUnits: (u: any, c?: any, opt?: any) => useCurrencyFormatter().formatMinorUnits(u, c, opt),
  getCurrencySymbol: (c: any) => useCurrencyFormatter().getCurrencySymbol(c),
}
export const date = {
  formatDate: (d: any, opt?: any) => useDateFormatter().formatDate(d, opt),
  formatDateTime: (d: any, opt?: any) => useDateFormatter().formatDateTime(d, opt),
  formatRelative: (d: any) => useDateFormatter().formatRelative(d),
  formatTimeAgo: (d: any) => useDateFormatter().formatTimeAgo(d),
}
export const number = {
  formatNumber: (n: any, opt?: any) => useNumberFormatter().formatNumber(n, opt),
  formatCompact: (n: any) => useNumberFormatter().formatCompact(n),
  formatPercent: (n: any, d?: any) => useNumberFormatter().formatPercent(n, d),
}
export const status = {
  getKycLabel: (s: any) => useStatusLabels().getKycLabel(s),
  getAuctionLabel: (s: any) => useStatusLabels().getAuctionLabel(s),
  getPaymentLabel: (s: any) => useStatusLabels().getPaymentLabel(s),
  getBidLabel: (s: any) => useStatusLabels().getBidLabel(s),
  getPayoutLabel: (s: any) => useStatusLabels().getPayoutLabel(s),
  getGatewayInfo: (g: any) => useStatusLabels().getGatewayInfo(g),
  kyc: (s: any) => useStatusLabels().getKycLabel(s).label,
  auction: (s: any) => useStatusLabels().getAuctionLabel(s).label,
  payment: (s: any) => useStatusLabels().getPaymentLabel(s).label,
  bid: (s: any) => useStatusLabels().getBidLabel(s).label,
  payout: (s: any) => useStatusLabels().getPayoutLabel(s).label,
}
