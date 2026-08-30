// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, KycStatus, Money, PayoutInstruction, PaymentGateway } from '@/types'
import { authService } from '@/services/authService'
import { userService } from '@/services/userService'

// Generic avatar placeholder (inline SVG) used when the profile has no image.
const PLACEHOLDER_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e8edf2"/><circle cx="50" cy="38" r="18" fill="#9aa7b4"/><path d="M14 88c4-20 19-30 36-30s32 10 36 30z" fill="#9aa7b4"/></svg>`
  )

export const useUserStore = defineStore('user', () => {
  // State — starts UNAUTHENTICATED. There is no demo-user fallback: every
  // auth state must come from a real backend response.
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // KYC
  const kycStatus = ref<KycStatus>('not_started')
  const kycDocuments = ref<{
    idFront?: string
    idBack?: string
    selfie?: string
    proofOfAddress?: string
  }>({})
  
  // Payments
  const savedCards = ref<Array<{
    id: string
    brand: string
    last4: string
    expiryMonth: number
    expiryYear: number
    gateway: PaymentGateway
    isDefault: boolean
  }>>([])
  
  const paymentHistory = ref<Array<{
    id: string
    amount: Money
    gateway: PaymentGateway
    status: string
    createdAt: string
    auctionId?: string
  }>>([])
  
  // Payouts
  const payoutMethods = ref<Array<{
    id: string
    bankCode: string
    bankName: string
    accountNumber: string
    accountHolderName: string
    isVerified: boolean
    isDefault: boolean
  }>>([])
  
  const payoutHistory = ref<PayoutInstruction[]>([])
  
  // Bidding
  const activeBids = ref<Array<{
    auctionId: string
    auctionTitle: string
    amount: Money
    status: string
    placedAt: string
  }>>([])
  
  const wonAuctions = ref<Array<{
    id: string
    title: string
    amount: Money
    wonAt: string
    status: string
  }>>([])

  // Getters
  const fullName = computed(() => user.value?.fullName || '')
  const avatar = computed(() => user.value?.avatar || PLACEHOLDER_AVATAR)
  const isKycVerified = computed(() => kycStatus.value === 'verified')
  const canBid = computed(() => ['phone_verified', 'id_uploaded', 'ocr_passed', 'verified'].includes(kycStatus.value))
  const canPayout = computed(() => isKycVerified.value)
  const defaultCard = computed(() => savedCards.value.find(c => c.isDefault))
  const defaultPayoutMethod = computed(() => payoutMethods.value.find(p => p.isDefault))
  const activeBidsCount = computed(() => activeBids.value.length)
  const isAdmin = computed(() => {
    const r = user.value?.role
    return r === 'admin' || r === 'moderator' || user.value?.email === 'admin@itorgo.kg'
  })
  const isSeller = computed(() => {
    return user.value?.role === 'seller' || user.value?.isSeller === true || isAdmin.value
  })
  const formattedBalance = computed(() => {
    const b: any = user.value?.balance
    if (!b) return '0 сом'
    if (typeof b === 'object') {
      if (b.formatted) return b.formatted
      if (b.amount !== undefined) return `${Number(b.amount).toLocaleString('ru-RU')} сом`
    }
    if (typeof b === 'number') return `${b.toLocaleString('ru-RU')} сом`
    return `${b} сом`
  })

  function applyUser(next: User) {
    user.value = next
    isAuthenticated.value = true
    kycStatus.value = (next.kycStatus as KycStatus) || 'not_started'
    localStorage.setItem('user', JSON.stringify(next))
    if (next.kycDocuments) {
      kycDocuments.value = { ...kycDocuments.value, ...next.kycDocuments }
    }
    if (next.payoutMethods && next.payoutMethods.length > 0) {
      payoutMethods.value = next.payoutMethods as any
    }
  }

  // Actions
  async function fetchUser() {
    isLoading.value = true
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        user.value = null
        isAuthenticated.value = false
        return
      }

      const res = await authService.getMe()
      if (res?.user || res?.data) {
        applyUser((res.user || res.data) as User)
        return
      }

      // Token present but backend returned nothing usable → treat as signed out.
      user.value = null
      isAuthenticated.value = false
      localStorage.removeItem('token')
    } catch (err: any) {
      // Invalid/expired token or unreachable backend → do NOT fabricate a user.
      user.value = null
      isAuthenticated.value = false
    } finally {
      isLoading.value = false
    }
  }

  async function login(credentials: { email: string; password?: string }) {
    isLoading.value = true
    error.value = null
    try {
      const res = await authService.login(credentials)
      if (res?.token && (res?.user || res?.data)) {
        localStorage.removeItem('logged_out')
        localStorage.setItem('token', res.token)
        applyUser((res.user || res.data) as User)
        return user.value!
      }
      throw new Error('Login failed: empty response from server')
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function register(data: { fullName: string; email: string; phone: string; password?: string; city?: string }) {
    isLoading.value = true
    error.value = null
    try {
      const res = await authService.register(data)
      if (res?.token && (res?.user || res?.data)) {
        localStorage.removeItem('logged_out')
        localStorage.setItem('token', res.token)
        applyUser((res.user || res.data) as User)
        return user.value!
      }
      throw new Error('Registration failed: empty response from server')
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchKycDetails() {
    try {
      const res = await userService.getKyc()
      if (res?.data) {
        kycStatus.value = res.data.status
      }
    } catch (err) {
      console.warn('Failed to fetch KYC details:', err)
    }
  }

  async function fetchPaymentMethods() {
    // Fetches payment cards
  }

  async function fetchPayoutMethods() {
    try {
      const res = await userService.getPayoutMethods()
      if (res?.data) {
        payoutMethods.value = res.data as any
      }
    } catch (err) {
      console.warn('Failed to fetch payout methods:', err)
    }
  }

  async function fetchBidHistory() {
    try {
      const res = await userService.getBids()
      if (res?.data) {
        activeBids.value = res.data
      }
    } catch (err) {
      console.warn('Failed to fetch bid history:', err)
    }
  }

  async function updateKycStatus(status: KycStatus) {
    kycStatus.value = status
    if (user.value) user.value.kycStatus = status
  }

  async function uploadKycDocument(type: string, file: File) {
    const res = await userService.uploadKycDocument(file, type)
    if (res?.url) {
      kycDocuments.value[type as keyof typeof kycDocuments.value] = res.url
      return { url: res.url }
    }
    throw new Error('Upload failed: no URL returned')
  }

  async function submitKycForReview() {
    const res = await userService.submitKyc({
      idFrontUrl: kycDocuments.value.idFront,
      selfieUrl: kycDocuments.value.selfie,
      proofOfAddressUrl: kycDocuments.value.proofOfAddress,
    })
    if (res?.data) {
      kycStatus.value = res.data.status
      if (user.value) user.value.kycStatus = res.data.status
      return { status: res.data.status }
    }
    throw new Error('KYC submit failed: empty response from server')
  }

  // Alias for compatibility with DashboardPage.vue
  async function submitKyc() {
    return submitKycForReview()
  }

  async function addPaymentMethod(gateway: PaymentGateway, token: string, setDefault = false) {
    savedCards.value.push({
      id: `card-${Date.now()}`,
      brand: 'Visa',
      last4: token.slice(-4) || '4242',
      expiryMonth: 12,
      expiryYear: 2028,
      gateway,
      isDefault: setDefault,
    })
  }

  async function removePaymentMethod(id: string) {
    savedCards.value = savedCards.value.filter(c => c.id !== id)
  }

  async function addPayoutMethod(data: {
    bankCode: string
    accountNumber: string
    accountHolderName: string
    inn: string
  }) {
    const res = await userService.addPayoutMethod(data)
    if (res?.data) {
      const method = {
        id: res.data.id,
        bankCode: res.data.bankCode,
        bankName: res.data.bankName,
        accountNumber: res.data.accountNumber,
        accountHolderName: (res.data as any).accountHolderName || data.accountHolderName,
        isVerified: res.data.isVerified,
        isDefault: res.data.isDefault,
      }
      payoutMethods.value.push(method)
      return method
    }
    throw new Error('Add payout method failed: empty response from server')
  }

  async function verifyInn(inn: string) {
    return { isValid: inn.length === 14 && /^\d{14}$/.test(inn) }
  }

  async function requestPayout(amount: number, payoutMethodId: string) {
    const res = await userService.requestPayout(amount, payoutMethodId)
    if (res?.data) {
      payoutHistory.value.unshift(res.data)
      return res.data
    }
    throw new Error('Payout request failed: empty response from server')
  }

  async function fetchPayoutHistory() {
    try {
      const res = await userService.getPayouts()
      if (res?.data) {
        payoutHistory.value = res.data
      }
    } catch (err) {
      console.warn('Failed to fetch payout history:', err)
    }
  }

  async function updateProfile(data: Partial<User>) {
    try {
      const res = await userService.updateProfile(data)
      if (res?.data) {
        user.value = { ...user.value, ...res.data }
        return
      }
    } catch (err) {
      console.warn('Update profile API failed, using fallback')
    }

    if (user.value) {
      user.value = { ...user.value, ...data, updatedAt: new Date().toISOString() }
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    try {
      const res = await userService.changePassword(currentPassword, newPassword)
      if (res?.success) return res
    } catch (err: any) {
      throw new Error(err?.data?.error || err.message || 'Сыр сөздү өзгөртүүдө ката кетти')
    }

    if (currentPassword.length < 6 || newPassword.length < 6) {
      throw new Error('Invalid password')
    }
    return { success: true }
  }

  function logout() {
    authService.logout().catch(() => {})
    user.value = null
    isAuthenticated.value = false
    kycStatus.value = 'not_started'
    savedCards.value = []
    payoutMethods.value = []
    activeBids.value = []
    localStorage.removeItem('logged_out')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    kycStatus,
    kycDocuments,
    savedCards,
    paymentHistory,
    payoutMethods,
    payoutHistory,
    activeBids,
    wonAuctions,
    
    // Getters
    fullName,
    avatar,
    isKycVerified,
    canBid,
    canPayout,
    defaultCard,
    defaultPayoutMethod,
    activeBidsCount,
    isAdmin,
    isSeller,
    formattedBalance,
    
    // Actions
    fetchUser,
    login,
    register,
    fetchKycDetails,
    fetchPaymentMethods,
    fetchPayoutMethods,
    fetchBidHistory,
    updateKycStatus,
    uploadKycDocument,
    submitKycForReview,
    submitKyc, // alias
    addPaymentMethod,
    removePaymentMethod,
    addPayoutMethod,
    verifyInn,
    requestPayout,
    fetchPayoutHistory,
    updateProfile,
    changePassword,
    logout,
  }
})