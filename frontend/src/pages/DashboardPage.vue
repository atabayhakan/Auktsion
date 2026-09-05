<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  LayoutDashboard, Store, CreditCard, Wallet, FileText, ShieldCheck, Settings, Heart, CheckCircle, Building2, Gauge,
  Lock, Clock, CheckCircle2, Smartphone, Sparkles, MapPin, Laptop, Camera, AlertTriangle, Bell, KeyRound, Mail,
  Gavel, Plus, TrendingUp, ArrowRight, ArrowUpRight, Flame, ShieldAlert, AlertCircle, Scale
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'
import { useI18n } from '@/composables/useI18n'
import { useFormatters } from '@/composables/useFormatters'
import { useAuctionStore } from '@/stores/auction'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import Input from '@/components/ui/Input.vue'
import Tabs from '@/components/ui/Tabs.vue'
import Stepper from '@/components/ui/Stepper.vue'

// Modal components
import PayoutModal from '@/components/payment/PayoutModal.vue'
import AddPayoutMethodModal from '@/components/payment/AddPayoutMethodModal.vue'
import DeleteProfileModal from '@/components/ui/DeleteProfileModal.vue'
import ChangePasswordModal from '@/components/ui/ChangePasswordModal.vue'
import DisputeModal from '@/components/auction/DisputeModal.vue'


// Auction & Dashboard components
import DashboardSidebar from '@/components/layout/DashboardSidebar.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import ActivityItem from '@/components/dashboard/ActivityItem.vue'
import ListingRow from '@/components/auction/ListingRow.vue'
import BidRow from '@/components/auction/BidRow.vue'
import AuctionCard from '@/components/auction/AuctionCard.vue'
import PaymentRow from '@/components/dashboard/PaymentRow.vue'
import PayoutRow from '@/components/dashboard/PayoutRow.vue'
import PayoutMethodCard from '@/components/dashboard/PayoutMethodCard.vue'
import DocumentUpload from '@/components/dashboard/DocumentUpload.vue'
import { userService } from '@/services/userService'
import { kyrgyzstanRegions } from '@/data/regions'

const router = useRouter()
const userStore = useUserStore()
const uiStore = useUIStore()
const auctionStore = useAuctionStore()
const { t, locale } = useI18n()
const { currency, date, status: statusLabels } = useFormatters()

const tabs = computed(() => [
  { id: 'overview', label: t('dashboard.overview'), icon: LayoutDashboard, path: '/dashboard/overview' },
  { id: 'listings', label: t('dashboard.myListings'), icon: Store, path: '/dashboard/listings' },
  { id: 'bids', label: t('dashboard.myBids'), icon: CreditCard, path: '/dashboard/bids' },
  { id: 'watchlist', label: t('dashboard.watchlist'), icon: Heart, path: '/dashboard/watchlist' },
  { id: 'payments', label: t('dashboard.payments'), icon: Wallet, path: '/dashboard/payments' },
  { id: 'payouts', label: t('dashboard.payouts'), icon: FileText, path: '/dashboard/payouts' },
  { id: 'payout-methods', label: t('dashboard.payoutMethods'), icon: Building2, path: '/dashboard/payout-methods' },
  { id: 'kyc', label: t('dashboard.kyc'), icon: ShieldCheck, path: '/dashboard/kyc' },
  { id: 'disputes', label: t('dashboard.disputes'), icon: AlertCircle, path: '/dashboard/disputes' },
  { id: 'settings', label: t('dashboard.settings'), icon: Settings, path: '/dashboard/settings' },
])


// Active tab synced with route (with validation)
const route = router.currentRoute.value
const validTabIds = new Set(tabs.value.map(t => t.id))
const initialTab = route.params.tab as string | undefined
const activeTab = ref(validTabIds.has(initialTab as string) ? (initialTab as string) : 'overview')
if (initialTab && !validTabIds.has(initialTab)) {
  router.replace('/dashboard/overview')
}

// Sync tab with route
watch(activeTab, (newTab) => {
  const tab = tabs.value.find(t => t.id === newTab)
  if (tab) {
    router.push(tab.path)
  }
})

watch(() => router.currentRoute.value.params.tab, (newTab) => {
  if (newTab && tabs.value.some(t => t.id === newTab)) {
    activeTab.value = newTab as string
  } else if (newTab && !validTabIds.has(newTab as string)) {
    router.replace('/dashboard/overview')
  }
})

// Modal state
const showPayoutModal = ref(false)
const showAddPayoutMethodModal = ref(false)
const showDeleteModal = ref(false)
const showChangePasswordModal = ref(false)

const selectedPayoutAmount = ref<{ amount: string; minorUnits: number; currency: string; formatted: string } | null>(null)
const selectedAuctionId = ref<string | null>(null)

// Modal handlers
function onPayoutSuccess(payoutId: string) {
  showPayoutModal.value = false
  selectedPayoutAmount.value = null
  selectedAuctionId.value = null
  uiStore.toastSuccess(t('toasts.payoutRequested'), `ID: ${payoutId}`)
}

function onAddPayoutMethod() {
  showAddPayoutMethodModal.value = false
  uiStore.toastSuccess(t('toasts.payoutMethodAdded'), t('payoutModal.successDescription'))
}

function confirmDeleteProfile() {
  showDeleteModal.value = false
  uiStore.toastWarning(t('toasts.warning'), t('dashboard.deleteAccountWarning'))
}

function onPasswordChanged() {
  showChangePasswordModal.value = false
  uiStore.toastSuccess(t('toasts.passwordChanged'), t('auth.passwordChangedDesc'))
}

async function updateProfile() {
  if (isSavingProfile.value) return
  isSavingProfile.value = true
  try {
    await userStore.updateProfile(profileForm.value as any)
    uiStore.toastSuccess(t('toasts.profileUpdated') || 'Профиль сохранен', t('toasts.profileSaved') || 'Изменения успешно сохранены')
  } catch (err: any) {
    const msg = err?.response?.data?.error || err?.data?.error || err?.message || t('common.error')
    uiStore.toastError(t('common.error') || 'Ошибка', msg)
  } finally {
    isSavingProfile.value = false
  }
}

function changePassword() {
  showChangePasswordModal.value = true
}

function submitKyc() {
  userStore.submitKyc()
  uiStore.toastSuccess(t('toasts.kycSubmitted'), t('toasts.kycSubmittedDesc'))
}

function openPayoutModal(auction?: { id: string; amount: { formatted: string; minorUnits: number; currency: string; amount: string } }) {
  if (auction) {
    selectedAuctionId.value = auction.id
    selectedPayoutAmount.value = auction.amount
  }
  showPayoutModal.value = true
}

// Bid tabs
const bidTab = ref('active')
const bidTabs = computed(() => [
  { id: 'active', label: t('status.auction.active') },
  { id: 'won', label: t('status.bid.won') },
  { id: 'outbid', label: t('status.bid.outbid') },
  { id: 'lost', label: t('status.bid.lost') },
])

const filteredBids = computed(() => {
  const bids = userStore.activeBids
  if (bidTab.value === 'active') return bids.filter(b => b.status === 'winning' || b.status === 'active')
  if (bidTab.value === 'won') return bids.filter(b => b.status === 'won')
  if (bidTab.value === 'outbid') return bids.filter(b => b.status === 'outbid')
  if (bidTab.value === 'lost') return bids.filter(b => b.status === 'lost')
  return bids
})

// KYC Steps
const kycSteps = computed(() => [
  { id: 'phone', label: t('dashboard.kycPhone'), description: t('dashboard.kycPhoneDesc'), icon: '📱' },
  { id: 'identity', label: t('dashboard.kycIdentity'), description: t('dashboard.kycIdentityDesc'), icon: '🪪' },
  { id: 'selfie', label: t('dashboard.kycSelfie'), description: t('dashboard.kycSelfieDesc'), icon: '🤳' },
  { id: 'address', label: t('dashboard.kycAddress'), description: t('dashboard.kycAddressDesc'), icon: '🏠' },
  { id: 'verified', label: t('dashboard.kycVerified'), description: t('dashboard.kycVerifiedDesc'), icon: '✅' },
])

const kycStepOrder = ['not_started', 'phone_verified', 'id_uploaded', 'ocr_passed', 'verified']
const currentKycStep = computed(() => {
  return Math.max(0, kycStepOrder.indexOf(userStore.kycStatus))
})


// Settings tab reactive state
const isSavingProfile = ref(false)
const twoFactorEnabled = ref(false)
const emailNotifEnabled = ref(true)
const pushNotifEnabled = ref(true)
const smsNotifEnabled = ref(true)
const avatarPreview = ref<string | null>(null)

function handleAvatarUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
      uiStore.toastSuccess(t('toasts.success') || 'Успешно', t('dashboard.avatarUpdated') || 'Фото профиля обновлено')
    }
    reader.readAsDataURL(file)
  }
}

// Profile form
const profileForm = ref({
  fullName: userStore.fullName || '',
  email: userStore.user?.email || '',
  phone: userStore.user?.phone || '',
  city: userStore.user?.city || '',
})

// Computed data from store
const myListings = ref<any[]>([])
const isLoadingListings = ref(false)

async function loadMyListings() {
  if (!userStore.isAuthenticated) return
  isLoadingListings.value = true
  try {
    const res = await userService.getListings('all')
    if (res && res.data) {
      myListings.value = res.data.map(l => ({
        ...l,
        image: l.image || (Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : '') || ''
      }))
    }
  } catch (err) {
    console.error('Failed to load listings:', err)
  } finally {
    isLoadingListings.value = false
  }
}

const payments = computed(() => userStore.paymentHistory)
const payouts = computed(() => userStore.payoutHistory)
const payoutMethods = computed(() => userStore.payoutMethods)
const activeBids = computed(() => userStore.activeBids)
const recommendedAuctions = computed(() => auctionStore.auctions.slice(0, 3))

const watchlist = ref<any[]>([])
const isLoadingWatchlist = ref(false)

async function loadWatchlist() {
  isLoadingWatchlist.value = true
  try {
    const response = await window.axios?.get('/api/user/watchlist')
    if (response?.data?.data) {
      watchlist.value = response.data.data
    }
  } catch {
    watchlist.value = []
  } finally {
    isLoadingWatchlist.value = false
  }
}

// Dispute and Complaints state
const userDisputes = ref<any[]>([])
const isLoadingDisputes = ref(false)
const disputeModalOpen = ref(false)
const disputeTargetAuction = ref<any>(null)
const disputeIsSeller = ref(false)

async function fetchDisputes() {
  isLoadingDisputes.value = true
  try {
    const res = await userService.getDisputes()
    if (res && res.success && res.data) {
      userDisputes.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch user disputes', err)
  } finally {
    isLoadingDisputes.value = false
  }
}

function openDisputeForBid(bid: any) {
  disputeTargetAuction.value = {
    id: bid.auctionId,
    title: bid.auctionTitle,
    image: bid.auctionImage,
    images: bid.auctionImage ? [bid.auctionImage] : []
  }
  disputeIsSeller.value = false
  disputeModalOpen.value = true
}

function openDisputeForListing(listing: any) {
  disputeTargetAuction.value = {
    id: listing.id,
    title: listing.title,
    image: listing.image,
    images: listing.images || (listing.image ? [listing.image] : [])
  }
  disputeIsSeller.value = true
  disputeModalOpen.value = true
}

function getDisputeStatusLabel(status: string): string {
  switch (status) {
    case 'open':
      return t('dashboard.disputeStatusOpen') || 'İnceleme Bekliyor'
    case 'under_review':
      return t('dashboard.disputeStatusUnderReview') || 'İnceleniyor'
    case 'resolved':
      return t('dashboard.disputeStatusResolved') || 'Çözümlendi'
    case 'rejected':
      return t('dashboard.disputeStatusRejected') || 'Reddedildi'
    default:
      return status
  }
}

function openNewDisputeModal() {
  if (myListings.value.length > 0) {
    disputeTargetAuction.value = {
      id: myListings.value[0].id,
      title: myListings.value[0].title,
      images: myListings.value[0].images || [myListings.value[0].image]
    }
    disputeIsSeller.value = true
    disputeModalOpen.value = true
  } else if (userStore.activeBids.length > 0) {
    disputeTargetAuction.value = {
      id: userStore.activeBids[0].auctionId,
      title: userStore.activeBids[0].auctionTitle,
      images: [userStore.activeBids[0].auctionImage]
    }
    disputeIsSeller.value = false
    disputeModalOpen.value = true
  } else {
    uiStore.toastInfo(
      t('dashboard.noActivity') || 'Aktif İşlem Yok',
      'Şikayet bildirmek için önce bir ilana teklif vermeli veya ilan açmalısınız.'
    )
  }
}

watch(() => userStore.user, (u) => {
  if (u && !isSavingProfile.value) {
    if (u.fullName !== undefined) profileForm.value.fullName = u.fullName
    if (u.email !== undefined) profileForm.value.email = u.email
    if (u.phone !== undefined) profileForm.value.phone = u.phone
    if (u.city !== undefined) profileForm.value.city = u.city
  }
}, { deep: true })

onMounted(async () => {
  if (userStore.isAuthenticated && !userStore.user) {
    await userStore.fetchUser()
  }
  if (userStore.user) {
    profileForm.value = {
      fullName: userStore.fullName || '',
      email: userStore.user.email || '',
      phone: userStore.user.phone || '',
      city: userStore.user.city || '',
    }
  }
  loadWatchlist()
  loadMyListings()
  fetchDisputes()
  auctionStore.fetchAuctions()
})

watch(() => userStore.isAuthenticated, (authed) => {
  if (authed) {
    loadMyListings()
    fetchDisputes()
  }
})

</script>

<template>
  <div class="min-h-screen bg-slate-50/60 text-gray-900 pt-24 sm:pt-28 pb-20 font-sans">
    <!-- Mobile Tabs (Inline with horizontal scroll) -->
    <div class="lg:hidden px-4 pt-4 pb-2 border-b border-black/[0.06] bg-white/80 backdrop-blur-md">
      <div class="flex items-center justify-between mb-2.5">
        <h1 class="text-lg font-extrabold text-gray-950">{{ t('nav.dashboard') || 'Личный кабинет' }}</h1>
        <span class="text-xs font-bold text-amber-900 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 truncate max-w-[160px]">
          {{ userStore.fullName }}
        </span>
      </div>
      <div class="overflow-x-auto pb-1.5 custom-scrollbar">
        <Tabs v-model="activeTab" :tabs="tabs.map(tb => ({ id: tb.id, label: tb.label, icon: tb.icon }))" variant="pills" class="text-xs min-w-max" />
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Left Sidebar (Desktop 3-Cols) -->
        <div class="hidden lg:block lg:col-span-3 sticky top-28">
          <DashboardSidebar />
        </div>

        <!-- Main Content (Desktop 9-Cols) -->
        <main class="lg:col-span-9 min-w-0">
          <div>
            <!-- Overview Tab -->
            <div v-if="activeTab === 'overview'" class="space-y-6 animate-fade-in-up">
              <!-- Executive Welcome Hero Header -->
              <div class="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-7 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/10 text-amber-900 border border-amber-500/20">
                      <Sparkles class="w-3 h-3 text-amber-600" />
                      {{ t('dashboard.overview') || 'Обзор' }}
                    </span>
                    <span class="text-gray-300">•</span>
                    <span class="text-xs font-semibold text-gray-500 flex items-center gap-1">
                      <MapPin class="w-3 h-3 text-gray-400" />
                      Бишкек, KG
                    </span>
                  </div>
                  <h1 class="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
                    {{ t('dashboard.welcomeUser', { name: userStore.fullName || 'Пользователь' }) }} 👋
                  </h1>
                  <p class="text-xs sm:text-sm text-gray-500 max-w-xl">
                    {{ t('dashboard.quickActions') || 'Управляйте своими лотами, участвуйте в торгах и проводите защищенные сделки через DemirBank Escrow.' }}
                  </p>
                </div>

                <div class="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                  <RouterLink
                    to="/sell"
                    class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-gray-950 font-black text-xs sm:text-sm shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Plus class="w-4 h-4 stroke-[3]" />
                    <span>{{ t('dashboard.createAuction') || 'Создать аукцион' }}</span>
                  </RouterLink>

                  <RouterLink
                    to="/auctions"
                    class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-gray-900 border border-black/[0.08] font-bold text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    <TrendingUp class="w-4 h-4 text-gray-600" />
                    <span>{{ t('dashboard.exploreAuctions') || 'Смотреть торги' }}</span>
                  </RouterLink>
                </div>
              </div>

              <!-- Stats Grid (4 Numeric & Financial Metrics) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <StatCard
                  :title="t('dashboard.myListings') || 'Мои аукционы'"
                  :value="myListings.length"
                  :subtitle="myListings.length > 0 ? 'Лотов в продаже' : 'Нет опубликованных'"
                  icon="Store"
                  color="gold"
                  link="/dashboard/listings"
                />
                <StatCard
                  :title="t('dashboard.myBids') || 'Мои ставки'"
                  :value="activeBids.length"
                  :subtitle="activeBids.length > 0 ? 'В торгах' : 'Ставок пока нет'"
                  icon="Gavel"
                  color="blue"
                  link="/dashboard/bids"
                />
                <StatCard
                  :title="t('dashboard.wonAuctions') || 'Выигранные лоты'"
                  :value="activeBids.filter(b => b.status === 'won').length"
                  :subtitle="activeBids.filter(b => b.status === 'won').length > 0 ? 'Готовы к получению' : '0 выиграно'"
                  icon="CheckCircle2"
                  color="green"
                  link="/dashboard/bids"
                />
                <StatCard
                  :title="t('dashboard.walletBalance') || 'Баланс & Escrow'"
                  :value="'0 сом'"
                  subtitle="DemirBank Escrow 100%"
                  icon="Wallet"
                  color="purple"
                  link="/dashboard/payments"
                />
              </div>

              <!-- Activity & Listings 2-Column Grid -->
              <div class="grid lg:grid-cols-2 gap-6">
                <!-- Recent Bids Card -->
                <div class="bg-white rounded-3xl border border-black/[0.08] shadow-2xs p-6 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between pb-4 border-b border-black/[0.06] mb-4">
                      <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center border border-blue-500/20">
                          <Gavel class="w-4 h-4" />
                        </div>
                        <h3 class="text-sm sm:text-base font-black text-gray-950">{{ t('dashboard.recentBids') || 'Последние ставки' }}</h3>
                      </div>
                      <button 
                        class="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer transition-colors" 
                        @click="activeTab = 'bids'"
                      >
                        <span>{{ t('dashboard.viewAll') || 'Все' }}</span>
                        <ArrowRight class="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div v-if="activeBids.length > 0" class="space-y-3">
                      <ActivityItem
                        v-for="bid in activeBids.slice(0, 5)"
                        :key="bid.id"
                        :title="bid.auctionTitle"
                        :subtitle="`${t('common.bids')}: ${currency.formatMoney(bid.amount)}`"
                        :time="date.formatRelative(bid.placedAt)"
                        :icon="bid.status === 'winning' ? 'CheckCircle' : bid.status === 'outbid' ? 'XCircle' : 'Gauge'"
                        :color="bid.status === 'winning' ? 'green' : bid.status === 'outbid' ? 'red' : 'blue'"
                        :status="bid.status === 'winning' ? t('status.bid.winning') : bid.status === 'outbid' ? t('status.bid.outbid') : t('status.bid.active')"
                        :status-color="bid.status === 'winning' ? 'green' : bid.status === 'outbid' ? 'red' : 'blue'"
                        :link="`/auctions/${bid.auctionId}`"
                      />
                    </div>

                    <div v-else class="text-center py-10 px-4 space-y-3">
                      <div class="w-14 h-14 rounded-2xl bg-slate-50 border border-black/[0.06] text-gray-400 flex items-center justify-center mx-auto">
                        <Gavel class="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <div>
                        <p class="text-sm font-bold text-gray-900">{{ t('dashboard.noBids') || 'Вы еще не делали ставок' }}</p>
                        <p class="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                          Выберите понравившийся лот и предложите свою цену в реальном времени.
                        </p>
                      </div>
                      <div class="pt-2">
                        <RouterLink
                          to="/auctions"
                          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-950 text-white hover:bg-black font-bold text-xs shadow-xs transition-all"
                        >
                          <TrendingUp class="w-3.5 h-3.5 text-amber-400" />
                          <span>{{ t('dashboard.exploreAuctions') || 'Смотреть аукционы' }}</span>
                        </RouterLink>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- My Listings Card -->
                <div class="bg-white rounded-3xl border border-black/[0.08] shadow-2xs p-6 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between pb-4 border-b border-black/[0.06] mb-4">
                      <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center border border-amber-500/20">
                          <Store class="w-4 h-4" />
                        </div>
                        <h3 class="text-sm sm:text-base font-black text-gray-950">{{ t('dashboard.myListings') || 'Мои аукционы' }}</h3>
                      </div>
                      <button 
                        class="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer transition-colors" 
                        @click="activeTab = 'listings'"
                      >
                        <span>{{ t('dashboard.viewAll') || 'Все' }}</span>
                        <ArrowRight class="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div v-if="myListings.length > 0" class="space-y-3">
                      <ListingRow
                        v-for="listing in myListings.slice(0, 5)"
                        :key="listing.id"
                        :listing="listing"
                      />
                    </div>

                    <div v-else class="text-center py-10 px-4 space-y-3">
                      <div class="w-14 h-14 rounded-2xl bg-slate-50 border border-black/[0.06] text-gray-400 flex items-center justify-center mx-auto">
                        <Store class="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <div>
                        <p class="text-sm font-bold text-gray-900">{{ t('dashboard.noListings') || 'У вас пока нет опубликованных лотов' }}</p>
                        <p class="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                          Продайте авто, технику, скот или недвижимость на открытом аукционе Кыргызстана.
                        </p>
                      </div>
                      <div class="pt-2">
                        <RouterLink
                          to="/sell"
                          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-gray-950 font-black text-xs shadow-xs hover:shadow-md transition-all"
                        >
                          <Plus class="w-3.5 h-3.5 stroke-[3]" />
                          <span>{{ t('dashboard.createAuction') || 'Создать аукцион' }}</span>
                        </RouterLink>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Hot Recommendations Strip (When user has no bids yet) -->
              <div v-if="activeBids.length === 0" class="bg-white rounded-3xl border border-black/[0.08] shadow-2xs p-6 space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                    <h3 class="text-base font-black text-gray-950">🔥 Горячие торги прямо сейчас в Бишкеке</h3>
                  </div>
                  <RouterLink to="/auctions" class="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1">
                    <span>Все аукционы</span>
                    <ArrowRight class="w-3.5 h-3.5" />
                  </RouterLink>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <AuctionCard v-for="lot in recommendedAuctions" :key="lot.id" :auction="lot" />
                </div>
              </div>

              <!-- KYC & Fintech Security Card -->
              <div 
                class="p-5 sm:p-6 rounded-3xl border transition-all shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
                :class="userStore.kycStatus === 'verified' 
                  ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border-emerald-500/25' 
                  : 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-yellow-500/10 border-amber-500/30'"
              >
                <div class="flex items-center gap-4">
                  <div 
                    class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs text-white"
                    :class="userStore.kycStatus === 'verified' ? 'bg-emerald-600' : 'bg-amber-600'"
                  >
                    <ShieldCheck v-if="userStore.kycStatus === 'verified'" class="w-6 h-6" />
                    <Clock v-else class="w-6 h-6" />
                  </div>
                  <div class="space-y-0.5">
                    <div class="flex items-center gap-2">
                      <h3 class="text-sm sm:text-base font-black text-gray-950">
                        {{ userStore.kycStatus === 'verified' ? ((t('dashboard.kycVerifiedBadge') || 'Верифицирован') + ': Полная защита аккаунта (Tier 2)') : (t('dashboard.kycBannerTitle') || 'Требуется подтверждение личности (KYC)') }}
                      </h3>
                      <span 
                        class="px-2 py-0.5 rounded-full text-[10px] font-mono font-black"
                        :class="userStore.kycStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'"
                      >
                        {{ statusLabels.kyc(userStore.kycStatus) }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-600 max-w-2xl leading-relaxed">
                      {{ userStore.kycStatus === 'verified' 
                        ? 'Ваш аккаунт полностью верифицирован. Доступны ставки до 5 000 000 сом, мгновенный вывод через MBank/Элкарт и безопасные Escrow-сделки.' 
                        : (t('dashboard.kycBannerDesc') || 'Пройдите быструю проверку по паспорту для участия в торгах и мгновенного вывода средств.') 
                      }}
                    </p>
                  </div>
                </div>

                <div class="shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    class="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    :class="userStore.kycStatus === 'verified'
                      ? 'bg-white hover:bg-slate-50 text-emerald-900 border border-emerald-300/80 shadow-2xs'
                      : 'bg-amber-500 hover:bg-amber-600 text-gray-950 shadow-xs'"
                    @click="activeTab = 'kyc'"
                  >
                    <span>{{ userStore.kycStatus === 'verified' ? 'Управление лимитами' : (t('dashboard.startKyc') || 'Пройти верификацию') }}</span>
                    <ArrowRight class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Listings Tab -->
            <div v-else-if="activeTab === 'listings'" class="animate-fade-in-up">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl sm:text-3xl font-extrabold text-text-primary">{{ t('dashboard.myListings') }}</h2>
                <Button icon="Plus" @click="$router.push('/sell')">
                  {{ t('dashboard.createAuction') }}
                </Button>
              </div>
              <div class="space-y-4">
                <ListingRow
                  v-for="listing in myListings"
                  :key="listing.id"
                  :listing="listing"
                  :show-actions="true"
                  @report="openDisputeForListing"
                />
              </div>
              <div v-if="myListings.length === 0" class="text-center py-20">
                <Card variant="glass" class="max-w-md mx-auto p-12">
                  <Store class="w-16 h-16 mx-auto text-text-muted mb-4" />
                  <h3 class="text-base font-bold text-text-primary mb-2">{{ t('dashboard.noListings') }}</h3>
                  <p class="text-text-muted mb-6">{{ t('dashboard.createAuction') }}</p>
                  <Button @click="$router.push('/sell')">{{ t('dashboard.createAuction') }}</Button>
                </Card>
              </div>
            </div>

            <!-- Bids Tab -->
            <div v-else-if="activeTab === 'bids'" class="animate-fade-in-up space-y-6">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                  <h2 class="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">{{ t('dashboard.myBids') }}</h2>
                  <p class="text-xs sm:text-sm text-gray-500 mt-0.5">{{ t('dashboard.bidHistoryDesc') || 'История ваших аукционов и ставок' }}</p>
                </div>
                <Tabs v-model="bidTab" :tabs="bidTabs" variant="pills" />
              </div>
              <div class="space-y-3">
                <BidRow
                  v-for="bid in filteredBids"
                  :key="bid.id"
                  :bid="bid"
                  @report="openDisputeForBid"
                />
              </div>

              <div v-if="filteredBids.length === 0" class="text-center py-12">
                <Gauge class="w-12 h-12 mx-auto text-text-muted mb-3" />
                <p class="text-text-muted">{{ t('dashboard.noBids') }}</p>
                <Button variant="outline" class="mt-3" @click="$router.push('/auctions')">{{ t('dashboard.exploreAuctions') }}</Button>
              </div>
            </div>

            <!-- Watchlist Tab -->
            <div v-else-if="activeTab === 'watchlist'" class="animate-fade-in-up">
              <h2 class="text-2xl sm:text-3xl font-extrabold text-text-primary mb-6">{{ t('dashboard.watchlist') }}</h2>

              <div v-if="watchlist.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <AuctionCard v-for="auction in watchlist" :key="auction.id" :auction="auction as any" />
              </div>
              <div v-else class="text-center py-20">
                <Heart class="w-16 h-16 mx-auto text-text-muted mb-4" />
                <h3 class="text-base font-bold text-text-primary mb-2">{{ t('dashboard.emptyWatchlist') }}</h3>
                <p class="text-text-muted mb-6">{{ t('dashboard.emptyWatchlistDesc') }}</p>
                <Button @click="$router.push('/auctions')">{{ t('dashboard.exploreAuctions') }}</Button>
              </div>
            </div>

            <!-- Payments Tab -->
            <div v-else-if="activeTab === 'payments'" class="animate-fade-in-up">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl sm:text-3xl font-extrabold text-text-primary">{{ t('dashboard.paymentsHistory') }}</h2>
              </div>
              <div class="space-y-3">
                <PaymentRow
                  v-for="payment in payments"
                  :key="payment.id"
                  :payment="payment"
                />
              </div>
              <div v-if="payments.length === 0" class="text-center py-12">
                <CreditCard class="w-12 h-12 mx-auto text-text-muted mb-3" />
                <p class="text-text-muted">{{ t('dashboard.noPayments') }}</p>
              </div>
            </div>

            <!-- Payouts Tab -->
            <div v-else-if="activeTab === 'payouts'" class="animate-fade-in-up">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl sm:text-3xl font-extrabold text-text-primary">{{ t('dashboard.payoutsTitle') }}</h2>
                <Button icon="Plus" @click="openPayoutModal">
                  {{ t('dashboard.requestPayout') }}
                </Button>
              </div>
              <div class="space-y-3">
                <PayoutRow
                  v-for="payout in payouts"
                  :key="payout.id"
                  :payout="payout"
                />
              </div>
              <div v-if="payouts.length === 0" class="text-center py-12">
                <FileText class="w-12 h-12 mx-auto text-text-muted mb-3" />
                <p class="text-text-muted">{{ t('dashboard.noPayouts') }}</p>
                <Button variant="outline" class="mt-3" @click="openPayoutModal">{{ t('dashboard.requestPayout') }}</Button>
              </div>
            </div>

            <!-- Payout Methods Tab -->
            <div v-else-if="activeTab === 'payout-methods'" class="animate-fade-in-up">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl sm:text-3xl font-extrabold text-text-primary">{{ t('dashboard.payoutMethods') }}</h2>
                <Button icon="Plus" @click="showAddPayoutMethodModal = true">
                  {{ t('dashboard.addPayoutMethod') }}
                </Button>
              </div>
              <div class="space-y-3">
                <PayoutMethodCard
                  v-for="method in payoutMethods"
                  :key="method.id"
                  :method="method"
                />
              </div>
              <div v-if="payoutMethods.length === 0" class="text-center py-12">
                <Building2 class="w-12 h-12 mx-auto text-text-muted mb-3" />
                <p class="text-text-muted">{{ t('dashboard.noPayoutMethods') }}</p>
                <Button variant="outline" class="mt-3" @click="showAddPayoutMethodModal = true">{{ t('dashboard.addPayoutMethod') }}</Button>
              </div>
            </div>

            <!-- KYC Tab -->
            <div v-else-if="activeTab === 'kyc'" class="animate-fade-in-up space-y-8 max-w-4xl">
              
              <!-- Header & Trust Shield Banner -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
                <div>
                  <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-900 border border-amber-500/20 text-xs font-black mb-2 shadow-2xs">
                    <ShieldCheck class="w-4 h-4 text-amber-600" />
                    <span>{{ t('dashboard.kycTrustBadge') || 'Соответствует требованиям ПОД/ФТ НБКР' }}</span>
                  </div>
                  <h2 class="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">{{ t('dashboard.kyc') }}</h2>
                  <p class="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl leading-relaxed">
                    {{ t('dashboard.kycSubtitle') || 'Верификация требуется для безопасных торгов. Ваши данные зашифрованы 256-битным SSL.' }}
                  </p>
                </div>

                <div class="shrink-0 flex items-center gap-2 self-start sm:self-center">
                  <span class="text-xs font-bold text-gray-400">{{ t('common.status') || 'Статус' }}:</span>
                  <div 
                    class="px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-2xs border"
                    :class="userStore.kycStatus === 'verified'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : userStore.kycStatus === 'pending'
                        ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                        : 'bg-slate-100 text-gray-700 border-slate-200'"
                  >
                    <CheckCircle2 v-if="userStore.kycStatus === 'verified'" class="w-3.5 h-3.5 text-emerald-600" />
                    <Clock v-else class="w-3.5 h-3.5 text-amber-600" />
                    <span>{{ statusLabels.kyc(userStore.kycStatus) }}</span>
                  </div>
                </div>
              </div>

              <!-- Verified Celebratory Banner (If verified) -->
              <div 
                v-if="userStore.kycStatus === 'verified'" 
                class="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/15 border border-emerald-500/30 flex items-center gap-4 text-emerald-950 shadow-2xs"
              >
                <div class="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldCheck class="w-7 h-7" />
                </div>
                <div>
                  <h4 class="font-extrabold text-sm sm:text-base text-emerald-900">
                    {{ t('dashboard.kycVerifiedBadge') || 'Личность подтверждена' }}
                  </h4>
                  <p class="text-xs text-emerald-800/80 mt-0.5 leading-relaxed">
                    {{ t('dashboard.kycVerifiedBanner') || 'Поздравляем! Ваша личность верифицирована на 100%. Все лимиты активны.' }}
                  </p>
                </div>
              </div>

              <!-- Stepper Card -->
              <div class="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-5">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-black text-gray-400 uppercase tracking-wider">
                    {{ t('dashboard.kycStages') || 'Этапы верификации' }}
                  </h3>
                  <span class="text-xs font-bold font-mono text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                    {{ t('dashboard.kycStageOf', { current: currentKycStep + 1, total: 5 }) || `Этап ${currentKycStep + 1} / 5` }}
                  </span>
                </div>

                <Stepper
                  :model-value="currentKycStep"
                  :steps="kycSteps.map(s => ({ id: s.id, label: s.label, description: s.description }))"
                  variant="default"
                  show-descriptions
                />
              </div>

              <!-- Required Documents Section -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-base font-extrabold text-gray-950">{{ t('dashboard.kycRequiredDocs') }}</h3>
                    <p class="text-xs text-gray-500">{{ t('dashboard.kycUploadHint') || 'Загрузите четкие и действительные документы' }}</p>
                  </div>
                  <div class="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                    <Lock class="w-3.5 h-3.5 text-emerald-600" />
                    <span>{{ t('dashboard.sslProtected') || 'Защита 256-бит SSL' }}</span>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <DocumentUpload
                    :title="t('dashboard.kycPassport')"
                    :description="t('dashboard.passportDesc') || 'Лицевая и обратная сторона'"
                    accepted="image/*,.pdf"
                    max-size="10MB"
                    document-type="idFront"
                    :uploaded="userStore.kycDocuments.idFront"
                  />
                  <DocumentUpload
                    :title="t('dashboard.kycSelfieDoc')"
                    :description="t('dashboard.selfieDesc') || 'Четкое селфи лица'"
                    accepted="image/*"
                    max-size="10MB"
                    document-type="selfie"
                    :uploaded="userStore.kycDocuments.selfie"
                  />
                  <DocumentUpload
                    :title="t('dashboard.kycProofAddress')"
                    :description="t('dashboard.addressDesc') || 'Квитанция / Прописка'"
                    accepted="image/*,.pdf"
                    max-size="10MB"
                    document-type="proofOfAddress"
                    :uploaded="userStore.kycDocuments.proofOfAddress"
                  />
                </div>

                <!-- Action & Submit Card -->
                <div class="p-6 rounded-3xl bg-slate-50 border border-black/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                  <div class="flex items-center gap-3 text-xs text-gray-600">
                    <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <Clock class="w-4 h-4" />
                    </div>
                    <div>
                      <p class="font-extrabold text-gray-900">{{ t('dashboard.kycReviewTime') || 'Среднее время проверки: 5 - 15 минут' }}</p>
                      <p class="text-gray-500 text-[11px]">{{ t('dashboard.kycSecurityForward') || 'После загрузки документы сразу поступают в службу безопасности.' }}</p>
                    </div>
                  </div>

                  <Button 
                    variant="primary" 
                    class="w-full sm:w-auto px-8 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-md hover:bg-primary-hover transition-all cursor-pointer"
                    :disabled="userStore.kycStatus === 'verified'" 
                    @click="submitKyc"
                  >
                    {{ userStore.kycStatus === 'verified' ? (t('dashboard.verifiedCheck') || 'Подтверждено ✓') : (t('dashboard.submitKyc') || 'Отправить на проверку') }}
                  </Button>
                </div>
              </div>

              <!-- AML & Compliance Security Ribbon -->
              <div class="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-4">
                <div class="flex items-center gap-2">
                  <ShieldCheck class="w-5 h-5 text-emerald-600" />
                  <h3 class="text-sm font-black text-gray-950 uppercase tracking-wider">
                    {{ t('dashboard.amlComplianceTitle') || 'Статус ПОД/ФТ и соответствие AML' }}
                  </h3>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div class="p-4 rounded-2xl bg-slate-50 border border-black/[0.04] space-y-1">
                    <p class="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{{ t('dashboard.amlLimit') }}</p>
                    <p class="text-sm font-black text-gray-900 font-mono">50.000 KGS</p>
                    <p class="text-[10px] text-emerald-600 font-semibold">{{ t('dashboard.kycLimitVerified') || 'После верификации: 5 000 000 сом' }}</p>
                  </div>

                  <div class="p-4 rounded-2xl bg-slate-50 border border-black/[0.04] space-y-1">
                    <p class="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{{ t('dashboard.sanctionsCheck') }}</p>
                    <div class="flex items-center gap-1.5 text-sm font-black text-emerald-700">
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>{{ t('dashboard.cleanOfac') || 'Чисто (OFAC/UN)' }}</span>
                    </div>
                    <p class="text-[10px] text-gray-400">{{ t('dashboard.noSanctionsRisk') || 'Санкционных рисков нет' }}</p>
                  </div>

                  <div class="p-4 rounded-2xl bg-slate-50 border border-black/[0.04] space-y-1">
                    <p class="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{{ t('dashboard.pepStatus') }}</p>
                    <div class="flex items-center gap-1.5 text-sm font-black text-gray-900">
                      <span>{{ t('dashboard.none') || 'Нет' }}</span>
                    </div>
                    <p class="text-[10px] text-gray-400">{{ t('dashboard.notPep') || 'Не является ПДЛ' }}</p>
                  </div>

                  <div class="p-4 rounded-2xl bg-slate-50 border border-black/[0.04] space-y-1">
                    <p class="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{{ t('dashboard.kycDataSecurity') || 'Безопасность данных' }}</p>
                    <p class="text-sm font-black text-amber-700 font-mono">256-Bit SSL</p>
                    <p class="text-[10px] text-gray-400">{{ t('dashboard.endToEndEncrypted') || 'Сквозное шифрование' }}</p>
                  </div>
                </div>
              </div>

            </div>

            <!-- Disputes & Complaints Tab -->
            <div v-else-if="activeTab === 'disputes'" class="animate-fade-in-up space-y-6">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                  <h2 class="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight flex items-center gap-2.5">
                    <Scale class="w-7 h-7 text-primary" />
                    <span>{{ t('dashboard.disputesTitle') || 'Şikayet ve Uyuşmazlıklarım' }}</span>
                  </h2>
                  <p class="text-xs sm:text-sm text-gray-500 mt-1">
                    {{ t('dashboard.disputesDesc') || 'Alıcı ve satıcı olarak bildirdiğiniz tüm şikayetler ve DemirBank Escrow arabuluculuk süreçleri.' }}
                  </p>
                </div>
                <Button
                  variant="primary"
                  class="shrink-0 flex items-center gap-1.5"
                  @click="openNewDisputeModal"
                >
                  <Plus class="w-4 h-4" />
                  <span>{{ t('dashboard.reportDispute') || 'Yeni Şikayet / İtiraz' }}</span>
                </Button>
              </div>

              <!-- Loading State -->
              <div v-if="isLoadingDisputes" class="text-center py-16">
                <Clock class="w-8 h-8 mx-auto text-primary animate-spin mb-3" />
                <p class="text-xs text-text-muted">{{ t('common.loading') || 'Yükleniyor...' }}</p>
              </div>

              <!-- Disputes List -->
              <div v-else-if="userDisputes.length > 0" class="space-y-4">
                <div
                  v-for="disp in userDisputes"
                  :key="disp.id"
                  class="bg-white rounded-3xl border border-black/[0.08] shadow-2xs p-5 sm:p-6 space-y-4 transition-all hover:border-primary/20"
                >
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/[0.06]">
                    <div class="flex items-center gap-2.5 flex-wrap">
                      <span class="font-mono text-xs font-bold text-gray-900 px-2.5 py-1 rounded-lg bg-black/[0.04] border border-black/[0.06]">
                        #{{ disp.id }}
                      </span>
                      <span class="text-xs text-text-muted">
                        {{ date.formatDateTime(disp.createdAt) }}
                      </span>
                    </div>

                    <div>
                      <Badge
                        :variant="disp.status === 'resolved' ? 'success' : (disp.status === 'rejected' ? 'danger' : (disp.status === 'under_review' ? 'info' : 'warning'))"
                        class="text-xs capitalize"
                      >
                        {{ getDisputeStatusLabel(disp.status) }}
                      </Badge>
                    </div>
                  </div>

                  <!-- Dispute Details -->
                  <div class="space-y-2.5 text-xs">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <RouterLink
                        :to="`/auctions/${disp.auctionId}`"
                        class="font-bold text-sm text-gray-950 hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <span>{{ disp.auctionTitle || `Lot #${disp.auctionId}` }}</span>
                        <ArrowUpRight class="w-3.5 h-3.5 text-gray-400" />
                      </RouterLink>

                      <div class="flex items-center gap-3 text-text-secondary text-[11px]">
                        <span>{{ t('dashboard.complainant') || 'Şikayetçi' }}: <strong>{{ disp.complainantName }}</strong></span>
                        <span>•</span>
                        <span>{{ t('dashboard.respondent') || 'Karşı Taraf' }}: <strong>{{ disp.respondentName }}</strong></span>
                      </div>
                    </div>

                    <!-- Complaint reason -->
                    <div class="p-3.5 rounded-2xl bg-black/[0.02] border border-black/[0.04]">
                      <p class="text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                        {{ t('disputeModal.detailsLabel') || 'Şikayet Detayı' }}
                      </p>
                      <p class="text-gray-800 leading-relaxed">{{ disp.reason }}</p>
                    </div>

                    <!-- Resolution (if available) -->
                    <div v-if="disp.resolution" class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                      <div class="flex items-center justify-between">
                        <p class="font-bold uppercase tracking-wider text-[10px] text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 class="w-3.5 h-3.5" />
                          <span>{{ t('dashboard.resolution') || 'Hakem / Moderasyon Kararı' }}</span>
                        </p>
                        <span v-if="disp.refundAmount && disp.refundAmount.minorUnits > 0" class="font-mono font-bold text-xs text-emerald-700">
                          {{ t('dashboard.refund') || 'İade' }}: {{ disp.refundAmount.formatted }}
                        </span>
                      </div>
                      <p class="text-xs leading-relaxed text-emerald-900">{{ disp.resolution }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="text-center py-20 bg-white rounded-3xl border border-black/[0.08] shadow-2xs p-8">
                <Scale class="w-16 h-16 mx-auto text-text-muted mb-4 opacity-40" />
                <h3 class="text-base font-bold text-text-primary mb-2">
                  {{ t('dashboard.noDisputes') || 'Kayıtlı bir şikayet veya uyuşmazlığınız bulunmuyor' }}
                </h3>
                <p class="text-text-muted max-w-md mx-auto text-xs mb-6 leading-relaxed">
                  {{ t('disputeModal.escrowNotice') }}
                </p>
                <div class="flex items-center justify-center gap-3">
                  <Button variant="outline" @click="$router.push('/dashboard/bids')">
                    {{ t('dashboard.myBids') || 'Tekliflerime Git' }}
                  </Button>
                  <Button variant="outline" @click="$router.push('/dashboard/listings')">
                    {{ t('dashboard.myListings') || 'İlanlarıma Git' }}
                  </Button>
                </div>
              </div>
            </div>

            <!-- Settings Tab -->
            <div v-else-if="activeTab === 'settings'" class="animate-fade-in-up space-y-8 max-w-4xl">

              
              <!-- Header -->
              <div class="pb-6 border-b border-black/[0.06]">
                <h2 class="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight flex items-center gap-2.5">
                  <Settings class="w-7 h-7 text-primary" />
                  <span>{{ t('dashboard.settings') || 'Настройки и управление аккаунтом' }}</span>
                </h2>
                <p class="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
                  {{ t('dashboard.settingsSubtitle') || 'Управляйте данными профиля, контактами, безопасностью и уведомлениями.' }}
                </p>
              </div>

              <!-- Card 1: Profil Bilgileri & Avatar -->
              <div class="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-6">
                <div class="flex items-center justify-between pb-4 border-b border-black/[0.06]">
                  <div class="flex items-center gap-2">
                    <User class="w-5 h-5 text-amber-600" />
                    <h3 class="text-base font-black text-gray-950">{{ t('dashboard.profileInfo') || 'Данные профиля' }}</h3>
                  </div>
                  <span class="text-xs font-bold text-gray-400 font-mono">ID: #{{ userStore.user?.id ? userStore.user.id.slice(0, 8) : 'KG-9482' }}</span>
                </div>

                <!-- Avatar & Identity Bar -->
                <div class="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-black/[0.04]">
                  <div class="relative group">
                    <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-gray-950 font-black text-2xl flex items-center justify-center shadow-md overflow-hidden border-2 border-white">
                      <img v-if="avatarPreview || userStore.user?.avatar" :src="avatarPreview || userStore.user?.avatar" alt="Avatar" class="w-full h-full object-cover" />
                      <span v-else>{{ (userStore.fullName || 'HA').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() }}</span>
                    </div>
                    <label class="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-gray-900 hover:bg-black text-white flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-110">
                      <Camera class="w-3.5 h-3.5" />
                      <input type="file" accept="image/*" class="sr-only" @change="handleAvatarUpload" />
                    </label>
                  </div>

                  <div class="space-y-1 text-center sm:text-left">
                    <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h4 class="text-base font-black text-gray-950">{{ userStore.fullName || 'Hakan Atabay' }}</h4>
                      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 class="w-3 h-3 text-emerald-600" />
                        <span>{{ t('dashboard.registeredUser') || 'Зарегистрированный участник' }}</span>
                      </span>
                    </div>
                    <p class="text-xs text-gray-500">{{ userStore.user?.email || 'atabayhakan007@gmail.com' }}</p>
                    <p class="text-[11px] text-gray-400 font-medium">{{ t('dashboard.photoUploadHint') || 'Нажмите на иконку камеры для обновления фото.' }}</p>
                  </div>
                </div>

                <!-- Form Fields -->
                <form class="space-y-6" @submit.prevent="updateProfile">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    <!-- Full Name -->
                    <div class="space-y-1.5">
                      <label class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <User class="w-3.5 h-3.5 text-gray-400" />
                        <span>{{ t('auth.fullName') || 'Имя и Фамилия' }}</span>
                      </label>
                      <input
                        v-model="profileForm.fullName"
                        type="text"
                        class="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                      />
                    </div>

                    <!-- Email -->
                    <div class="space-y-1.5">
                      <label class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <Mail class="w-3.5 h-3.5 text-gray-400" />
                        <span>{{ t('auth.email') || 'Электронная почта' }}</span>
                      </label>
                      <input
                        v-model="profileForm.email"
                        type="email"
                        class="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                      />
                    </div>

                    <!-- Phone -->
                    <div class="space-y-1.5">
                      <label class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <Phone class="w-3.5 h-3.5 text-gray-400" />
                        <span>{{ t('auth.phone') || 'Номер телефона' }}</span>
                      </label>
                      <input
                        v-model="profileForm.phone"
                        type="tel"
                        placeholder="+996 555 774468"
                        class="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-mono"
                      />
                    </div>

                    <!-- City / Region -->
                    <div class="space-y-1.5">
                      <label class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <MapPin class="w-3.5 h-3.5 text-gray-400" />
                        <span>{{ t('sell.city') || 'Город / Регион' }}</span>
                      </label>
                      <select
                        v-model="profileForm.city"
                        class="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all cursor-pointer"
                      >
                        <option 
                          v-for="region in kyrgyzstanRegions" 
                          :key="region.id" 
                          :value="region.name.ru"
                        >
                          {{ region.name[locale as 'ru'|'ky'|'tr'] || region.name.ru }}
                        </option>
                      </select>
                    </div>

                  </div>

                  <div class="flex items-center justify-end pt-2">
                    <button
                      type="submit"
                      :disabled="isSavingProfile"
                      class="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span v-if="isSavingProfile" class="w-3.5 h-3.5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                      <CheckCircle2 v-else class="w-4 h-4" />
                      <span>{{ isSavingProfile ? (t('dashboard.saving') || 'Сохранение...') : (t('common.save') || 'Сохранить изменения') }}</span>
                    </button>
                  </div>
                </form>
              </div>

              <!-- Card 2: Безопасность и пароль -->
              <div class="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-6">
                <div class="flex items-center gap-2 pb-4 border-b border-black/[0.06]">
                  <ShieldCheck class="w-5 h-5 text-emerald-600" />
                  <h3 class="text-base font-black text-gray-950">{{ t('dashboard.security') || 'Безопасность аккаунта' }}</h3>
                </div>

                <div class="space-y-4">
                  
                  <!-- 2FA Switch -->
                  <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-black/[0.04] transition-all">
                    <div class="space-y-0.5">
                      <p class="font-black text-xs sm:text-sm text-gray-950">{{ t('dashboard.twoFactorAuth') || '2FA (Двухфакторная аутентификация)' }}</p>
                      <p class="text-xs text-gray-500">{{ t('dashboard.twoFactorDesc') || 'Дополнительная защита через SMS или Google Authenticator при каждом входе.' }}</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input v-model="twoFactorEnabled" type="checkbox" class="sr-only peer" />
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <!-- Password Management -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-black/[0.04]">
                    <div class="space-y-0.5">
                      <p class="font-black text-xs sm:text-sm text-gray-950">{{ t('dashboard.loginPasswordTitle') || 'Пароль для входа' }}</p>
                      <p class="text-xs text-gray-500">{{ t('dashboard.loginPasswordHint') || 'Рекомендуется использовать надежный пароль из букв, цифр и символов.' }}</p>
                    </div>
                    <button
                      type="button"
                      class="px-4 py-2 rounded-xl bg-white border border-black/10 hover:bg-slate-100 text-gray-900 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
                      @click="changePassword"
                    >
                      <KeyRound class="w-3.5 h-3.5 text-gray-500" />
                      <span>{{ t('auth.changePassword') || 'Сменить пароль' }}</span>
                    </button>
                  </div>

                  <!-- Active Session Info -->
                  <div class="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-xs">
                    <Laptop class="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <p class="font-bold text-emerald-950">{{ t('dashboard.activeSessionTitle') || 'Активная сессия: Windows (Chrome) • Бишкек, KG' }}</p>
                      <p class="text-emerald-800/80 text-[11px]">{{ t('dashboard.activeSessionDesc') || 'В настоящее время вы вошли в систему с этого устройства.' }}</p>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Card 3: Настройки уведомлений -->
              <div class="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-6">
                <div class="flex items-center gap-2 pb-4 border-b border-black/[0.06]">
                  <Bell class="w-5 h-5 text-blue-600" />
                  <h3 class="text-base font-black text-gray-950">{{ t('dashboard.notifications') || 'Настройки уведомлений' }}</h3>
                </div>

                <div class="space-y-4">
                  
                  <!-- Email Notifications -->
                  <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-black/[0.04]">
                    <div class="space-y-0.5">
                      <p class="font-black text-xs sm:text-sm text-gray-950">{{ t('dashboard.emailNotifications') || 'Email-уведомления' }}</p>
                      <p class="text-xs text-gray-500">{{ t('dashboard.emailNotificationsDesc') || 'Получать важные новости, подтверждения ставок и статус доставки на почту.' }}</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input v-model="emailNotifEnabled" type="checkbox" class="sr-only peer" />
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <!-- Push Notifications -->
                  <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-black/[0.04]">
                    <div class="space-y-0.5">
                      <p class="font-black text-xs sm:text-sm text-gray-950">{{ t('dashboard.pushNotifications') || 'Push-уведомления в браузере' }}</p>
                      <p class="text-xs text-gray-500">{{ t('dashboard.pushNotificationsDesc') || 'Мгновенные оповещения при перебитии ставки и за 15 минут до окончания аукциона.' }}</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input v-model="pushNotifEnabled" type="checkbox" class="sr-only peer" />
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <!-- SMS Notifications -->
                  <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-black/[0.04]">
                    <div class="space-y-0.5">
                      <p class="font-black text-xs sm:text-sm text-gray-950">{{ t('dashboard.smsAlertsTitle') || 'SMS-оповещения' }}</p>
                      <p class="text-xs text-gray-500">{{ t('dashboard.smsAlertsDesc') || 'Критические уведомления безопасности и банковские переводы Escrow.' }}</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input v-model="smsNotifEnabled" type="checkbox" class="sr-only peer" />
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                </div>
              </div>

              <!-- Card 4: Опасная зона -->
              <div class="bg-rose-50/50 p-6 sm:p-8 rounded-3xl border border-rose-200 shadow-2xs space-y-4">
                <div class="flex items-center gap-2">
                  <AlertTriangle class="w-5 h-5 text-rose-600" />
                  <h3 class="text-base font-black text-rose-950">{{ t('dashboard.dangerZone') || 'Опасная зона' }}</h3>
                </div>

                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-rose-200/80 shadow-2xs">
                  <div class="space-y-0.5">
                    <p class="font-black text-xs sm:text-sm text-rose-950">{{ t('dashboard.deleteAccount') || 'Удалить аккаунт' }}</p>
                    <p class="text-xs text-gray-500 max-w-lg">{{ t('dashboard.deleteAccountWarning') || 'При удалении аккаунта все ваши лоты, ставки и история операций будут безвозвратно удалены.' }}</p>
                  </div>
                  <button
                    type="button"
                    class="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    @click="showDeleteModal = true"
                  >
                    <span>{{ t('dashboard.deleteAccount') || 'Удалить аккаунт' }}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- Modals -->
    <PayoutModal
      v-if="showPayoutModal"
      :model-value="showPayoutModal"
      :auction-id="selectedAuctionId"
      :amount="selectedPayoutAmount"
      @success="onPayoutSuccess"
      @update:model-value="showPayoutModal = $event"
      @cancel="showPayoutModal = false"
    />

    <AddPayoutMethodModal
      v-if="showAddPayoutMethodModal"
      :model-value="showAddPayoutMethodModal"
      @success="onAddPayoutMethod"
      @update:model-value="showAddPayoutMethodModal = $event"
    />

    <DeleteProfileModal
      v-if="showDeleteModal"
      :model-value="showDeleteModal"
      @confirm="confirmDeleteProfile"
      @update:model-value="showDeleteModal = $event"
    />

    <ChangePasswordModal
      v-if="showChangePasswordModal"
      :model-value="showChangePasswordModal"
      @success="onPasswordChanged"
      @update:model-value="showChangePasswordModal = $event"
    />

    <DisputeModal
      v-model="disputeModalOpen"
      :auction="disputeTargetAuction"
      :is-seller="disputeIsSeller"
      @submitted="fetchDisputes"
    />
  </div>
</template>

