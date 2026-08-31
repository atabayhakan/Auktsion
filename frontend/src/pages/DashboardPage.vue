<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  LayoutDashboard, Store, CreditCard, Wallet, FileText, ShieldCheck, Settings, Heart, CheckCircle, Building2, Gauge,
  Lock, Clock, CheckCircle2
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'
import { useI18n } from '@/composables/useI18n'
import { useFormatters } from '@/composables/useFormatters'
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

const router = useRouter()
const userStore = useUserStore()
const uiStore = useUIStore()
const { t } = useI18n()
const { currency, date, status: statusLabels } = useFormatters()

const tabs = computed(() => [
  ...(userStore.isAdmin ? [{ id: 'admin', label: '👑 Admin Paneli', icon: Gauge, path: '/admin' }] : []),
  { id: 'overview', label: t('dashboard.overview'), icon: LayoutDashboard, path: '/dashboard/overview' },
  { id: 'listings', label: t('dashboard.myListings'), icon: Store, path: '/dashboard/listings' },
  { id: 'bids', label: t('dashboard.myBids'), icon: CreditCard, path: '/dashboard/bids' },
  { id: 'watchlist', label: t('dashboard.watchlist'), icon: Heart, path: '/dashboard/watchlist' },
  { id: 'payments', label: t('dashboard.payments'), icon: Wallet, path: '/dashboard/payments' },
  { id: 'payouts', label: t('dashboard.payouts'), icon: FileText, path: '/dashboard/payouts' },
  { id: 'payout-methods', label: t('dashboard.payoutMethods'), icon: Building2, path: '/dashboard/payout-methods' },
  { id: 'kyc', label: t('dashboard.kyc'), icon: ShieldCheck, path: '/dashboard/kyc' },
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
  try {
    await userStore.updateProfile(profileForm.value as any)
    uiStore.toastSuccess(t('toasts.profileUpdated'), t('toasts.profileSaved'))
  } catch (err: any) {
    const msg = err?.response?.data?.error || err?.data?.error || err?.message || t('common.error')
    uiStore.toastError(t('common.error'), msg)
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

// Profile form
const profileForm = ref({
  fullName: userStore.fullName || '',
  email: userStore.user?.email || '',
  phone: userStore.user?.phone || '',
  city: userStore.user?.city || '',
})

// Computed data from store
const myListings = computed(() => userStore.user?.listings || [])
const payments = computed(() => userStore.paymentHistory)
const payouts = computed(() => userStore.payoutHistory)
const payoutMethods = computed(() => userStore.payoutMethods)
const activeBids = computed(() => userStore.activeBids)

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

onMounted(async () => {
  if (userStore.isAuthenticated && !userStore.user) {
    await userStore.fetchUser()
  }
  loadWatchlist()
})
</script>

<template>
  <div class="min-h-screen bg-background text-text-primary pt-16 sm:pt-20 font-sans">
    <!-- Mobile Tabs (Inline with horizontal scroll) -->
    <div class="lg:hidden px-4 pt-4 pb-2 border-b border-black/[0.06] bg-white/60 backdrop-blur-md">
      <div class="flex items-center justify-between mb-2.5">
        <h1 class="text-lg font-extrabold text-text-primary">{{ t('nav.dashboard') }}</h1>
        <span class="text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 truncate max-w-[160px]">
          {{ userStore.fullName }}
        </span>
      </div>
      <div class="overflow-x-auto pb-1.5 custom-scrollbar">
        <Tabs v-model="activeTab" :tabs="tabs.map(tb => ({ id: tb.id, label: tb.label, icon: tb.icon }))" variant="pills" class="text-xs min-w-max" />
      </div>
    </div>

    <div class="flex">
      <!-- Sidebar -->
      <DashboardSidebar />

      <!-- Main Content -->
      <main class="flex-1 min-w-0 min-h-screen" style="margin-top: 0;">
        <div class="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:pt-6">
          <!-- Desktop Tabs -->
          <div class="hidden lg:block mb-8">
            <Tabs v-model="activeTab" :tabs="tabs.map(tb => ({ id: tb.id, label: tb.label, icon: tb.icon }))" variant="gold" full-width />
          </div>

          <!-- Tab Content - single root for v-if/v-else-if chain -->
          <div>
            <!-- Overview Tab -->
            <div v-if="activeTab === 'overview'" class="space-y-6 animate-fade-in-up">
              <!-- Stats Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  :title="t('dashboard.activeAuctions')"
                  :value="userStore.activeBids.filter(b => b.status === 'winning' || b.status === 'active').length"
                  icon="Store"
                  color="gold"
                  link="/dashboard/listings"
                />
                <StatCard
                  :title="t('dashboard.totalBids')"
                  :value="userStore.activeBids.length"
                  icon="CreditCard"
                  color="blue"
                  link="/dashboard/bids"
                />
                <StatCard
                  :title="t('dashboard.wonAuctions')"
                  :value="userStore.activeBids.filter(b => b.status === 'won').length"
                  icon="CheckCircle"
                  color="green"
                  link="/dashboard/bids"
                />
                <StatCard
                  :title="t('dashboard.kycStatus')"
                  :value="statusLabels.kyc(userStore.kycStatus)"
                  :icon="userStore.kycStatus === 'verified' ? 'CheckCircle' : 'Clock'"
                  :color="userStore.kycStatus === 'verified' ? 'green' : 'yellow'"
                  link="/dashboard/kyc"
                />
              </div>

              <!-- Recent Activity -->
              <div class="grid lg:grid-cols-2 gap-6">
                <Card variant="glass">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-base font-bold text-text-primary">{{ t('dashboard.recentBids') }}</h3>
                    <button class="text-sm text-primary hover:underline" @click="activeTab = 'bids'">{{ t('dashboard.viewAll') }}</button>
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
                  <div v-else class="text-center py-8 text-text-muted">
                    <Gauge class="w-12 h-12 mx-auto text-text-muted mb-3" />
                    <p>{{ t('dashboard.noBids') }}</p>
                    <Button variant="outline" class="mt-3" @click="$router.push('/auctions')">{{ t('dashboard.exploreAuctions') }}</Button>
                  </div>
                </Card>

                <Card variant="glass">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-base font-bold text-text-primary">{{ t('dashboard.myListings') }}</h3>
                    <button class="text-sm text-primary hover:underline" @click="activeTab = 'listings'">{{ t('dashboard.viewAll') }}</button>
                  </div>
                  <div v-if="myListings.length > 0" class="space-y-3">
                    <ListingRow
                      v-for="listing in myListings.slice(0, 5)"
                      :key="listing.id"
                      :listing="listing"
                    />
                  </div>
                  <div v-else class="text-center py-8 text-text-muted">
                    <Store class="w-12 h-12 mx-auto text-text-muted mb-3" />
                    <p>{{ t('dashboard.noListings') }}</p>
                    <Button class="mt-3" @click="$router.push('/sell')">{{ t('dashboard.createAuction') }}</Button>
                  </div>
                </Card>
              </div>

              <!-- KYC Status Card -->
              <Card :variant="userStore.kycStatus === 'verified' ? 'gold' : 'glass'">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div class="flex items-center gap-4">
                    <div :class="['w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl', userStore.kycStatus === 'verified' ? 'bg-success' : 'bg-warning']">
                      <component :is="userStore.kycStatus === 'verified' ? CheckCircle : ShieldCheck" class="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 class="text-base font-bold text-text-primary">{{ t('dashboard.kycStatus') }}: {{ statusLabels.kyc(userStore.kycStatus) }}</h3>
                      <p class="text-text-muted text-sm">{{ statusLabels.kyc(userStore.kycStatus) }}</p>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <Button v-if="userStore.kycStatus !== 'verified'" variant="primary" @click="activeTab = 'kyc'">
                      {{ t('dashboard.kyc') }}
                    </Button>
                    <Button v-else variant="ghost">{{ t('status.kyc.verified') }}</Button>
                  </div>
                </div>
              </Card>
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
            <div v-else-if="activeTab === 'bids'" class="animate-fade-in-up">
              <Tabs v-model="bidTab" :tabs="bidTabs" variant="pills" class="mb-6" />
              <div class="space-y-3">
                <BidRow
                  v-for="bid in filteredBids"
                  :key="bid.id"
                  :bid="bid"
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
                    <span>{{ t('dashboard.kycTrustBadge') || 'Kırgızistan Ulusal Bankası AML/CFT Mevzuatına Uygun' }}</span>
                  </div>
                  <h2 class="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">{{ t('dashboard.kyc') }}</h2>
                  <p class="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl leading-relaxed">
                    {{ t('dashboard.kycSubtitle') || 'Güvenli ve şeffaf açık artırma işlemleri için kimlik doğrulaması gerekmektedir. Bilgileriniz 256-bit SSL ile şifrelenir.' }}
                  </p>
                </div>

                <div class="shrink-0 flex items-center gap-2 self-start sm:self-center">
                  <span class="text-xs font-bold text-gray-400">Durum:</span>
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
                    {{ t('dashboard.kycVerifiedBadge') || 'Kimliğiniz Doğrulandı' }}
                  </h4>
                  <p class="text-xs text-emerald-800/80 mt-0.5 leading-relaxed">
                    {{ t('dashboard.kycVerifiedBanner') || 'Tebrikler! Kimliğiniz %100 doğrulandı. Tüm açık artırma, para yatırma ve çekme limitleriniz aktif.' }}
                  </p>
                </div>
              </div>

              <!-- Stepper Card -->
              <div class="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-5">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-black text-gray-400 uppercase tracking-wider">
                    Doğrulama Aşamaları
                  </h3>
                  <span class="text-xs font-bold font-mono text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                    Aşama {{ currentKycStep + 1 }} / 5
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
                    <p class="text-xs text-gray-500">Lütfen geçerli ve okunabilir belgelerinizi yükleyin</p>
                  </div>
                  <div class="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                    <Lock class="w-3.5 h-3.5 text-emerald-600" />
                    <span>256-Bit SSL Korumalı</span>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <DocumentUpload
                    :title="t('dashboard.kycPassport')"
                    description="Ön & Arka Yüz"
                    accepted="image/*,.pdf"
                    max-size="10MB"
                    document-type="idFront"
                    :uploaded="userStore.kycDocuments.idFront"
                  />
                  <DocumentUpload
                    :title="t('dashboard.kycSelfieDoc')"
                    description="Net Yüz Fotoğrafı"
                    accepted="image/*"
                    max-size="10MB"
                    document-type="selfie"
                    :uploaded="userStore.kycDocuments.selfie"
                  />
                  <DocumentUpload
                    :title="t('dashboard.kycProofAddress')"
                    description="Fatura / İkametgah"
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
                      <p class="font-extrabold text-gray-900">{{ t('dashboard.kycReviewTime') || 'Ortalama inceleme süresi: 5 - 15 dakika' }}</p>
                      <p class="text-gray-500 text-[11px]">Belgeler yüklendikten sonra doğrudan güvenlik ekibimize iletilir.</p>
                    </div>
                  </div>

                  <Button 
                    variant="primary" 
                    class="w-full sm:w-auto px-8 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-md hover:bg-primary-hover transition-all cursor-pointer"
                    :disabled="userStore.kycStatus === 'verified'" 
                    @click="submitKyc"
                  >
                    {{ userStore.kycStatus === 'verified' ? 'Doğrulandı ✓' : (t('dashboard.submitKyc') || 'Onaya Gönder') }}
                  </Button>
                </div>
              </div>

              <!-- AML & Compliance Security Ribbon -->
              <div class="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-4">
                <div class="flex items-center gap-2">
                  <ShieldCheck class="w-5 h-5 text-emerald-600" />
                  <h3 class="text-sm font-black text-gray-950 uppercase tracking-wider">
                    AML & Yasal Uyumluluk Durumu
                  </h3>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div class="p-4 rounded-2xl bg-slate-50 border border-black/[0.04] space-y-1">
                    <p class="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{{ t('dashboard.amlLimit') }}</p>
                    <p class="text-sm font-black text-gray-900 font-mono">50.000 KGS</p>
                    <p class="text-[10px] text-emerald-600 font-semibold">{{ t('dashboard.kycLimitVerified') || 'Doğrulama Sonrası: 5.000.000 KGS' }}</p>
                  </div>

                  <div class="p-4 rounded-2xl bg-slate-50 border border-black/[0.04] space-y-1">
                    <p class="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{{ t('dashboard.sanctionsCheck') }}</p>
                    <div class="flex items-center gap-1.5 text-sm font-black text-emerald-700">
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>{{ t('dashboard.clean') || 'Temiz (OFAC/UN)' }}</span>
                    </div>
                    <p class="text-[10px] text-gray-400">Yaptırım riski bulunmuyor</p>
                  </div>

                  <div class="p-4 rounded-2xl bg-slate-50 border border-black/[0.04] space-y-1">
                    <p class="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{{ t('dashboard.pepStatus') }}</p>
                    <div class="flex items-center gap-1.5 text-sm font-black text-gray-900">
                      <span>{{ t('dashboard.none') || 'Yok' }}</span>
                    </div>
                    <p class="text-[10px] text-gray-400">Siyasi nüfuz sahibi değil</p>
                  </div>

                  <div class="p-4 rounded-2xl bg-slate-50 border border-black/[0.04] space-y-1">
                    <p class="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{{ t('dashboard.kycDataSecurity') || 'Veri Güvenliği' }}</p>
                    <p class="text-sm font-black text-amber-700 font-mono">256-Bit SSL</p>
                    <p class="text-[10px] text-gray-400">Uçtan uca şifreli</p>
                  </div>
                </div>
              </div>

            </div>

            <!-- Settings Tab -->
            <div v-else-if="activeTab === 'settings'" class="animate-fade-in-up">
              <div class="max-w-3xl space-y-8">
                <Card variant="glass">
                  <h3 class="text-base font-bold text-text-primary mb-6">{{ t('dashboard.profileInfo') }}</h3>
                  <form class="space-y-6" @submit.prevent="updateProfile">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input v-model="profileForm.fullName" :label="t('auth.fullName')" />
                      <Input v-model="profileForm.email" :label="t('auth.email')" type="email" />
                      <Input v-model="profileForm.phone" :label="t('auth.phone')" placeholder="+996 XXX XXXXXXX" />
                      <Input v-model="profileForm.city" :label="t('sell.city')" />
                    </div>
                    <Button type="submit" variant="primary">{{ t('common.save') }}</Button>
                  </form>
                </Card>

                <Card variant="glass">
                  <h3 class="text-base font-bold text-text-primary mb-6">{{ t('dashboard.security') }}</h3>
                  <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 rounded-xl bg-black/[0.03]">
                      <div>
                        <p class="font-medium text-text-primary">{{ t('dashboard.twoFactorAuth') }}</p>
                        <p class="text-text-muted text-sm">{{ t('dashboard.twoFactorDesc') }}</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" />
                        <div class="w-11 h-6 bg-black/15 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-black/15 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    <div class="flex gap-3">
                      <Button variant="outline" @click="changePassword">{{ t('auth.changePassword') }}</Button>
                      <Button variant="danger" @click="showDeleteModal = true">{{ t('dashboard.deleteAccount') }}</Button>
                    </div>
                  </div>
                </Card>

                <Card variant="glass">
                  <h3 class="text-base font-bold text-text-primary mb-6">{{ t('dashboard.notifications') }}</h3>
                  <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 rounded-xl bg-black/[0.03]">
                      <div>
                        <p class="font-medium text-text-primary">{{ t('dashboard.emailNotifications') }}</p>
                        <p class="text-text-muted text-sm">{{ t('dashboard.emailNotificationsDesc') }}</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked class="sr-only peer" />
                        <div class="w-11 h-6 bg-black/15 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-black/15 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    <div class="flex items-center justify-between p-4 rounded-xl bg-black/[0.03]">
                      <div>
                        <p class="font-medium text-text-primary">{{ t('dashboard.pushNotifications') }}</p>
                        <p class="text-text-muted text-sm">{{ t('dashboard.pushNotificationsDesc') }}</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked class="sr-only peer" />
                        <div class="w-11 h-6 bg-black/15 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-black/15 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </Card>

                <Card variant="glass" class="!border-error/30">
                  <h3 class="text-base font-bold text-text-primary mb-6">{{ t('dashboard.dangerZone') }}</h3>
                  <div class="flex items-center justify-between p-4 rounded-xl bg-error/10 border border-error/20">
                    <div>
                      <p class="font-medium text-error">{{ t('dashboard.deleteAccount') }}</p>
                      <p class="text-text-muted text-sm">{{ t('dashboard.deleteAccountWarning') }}</p>
                    </div>
                    <Button variant="danger" @click="showDeleteModal = true">{{ t('dashboard.deleteAccount') }}</Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
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
  </div>
</template>
