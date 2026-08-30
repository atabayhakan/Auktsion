<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  LayoutDashboard, Store, CreditCard, Wallet, FileText, ShieldCheck, Settings, Heart, CheckCircle, Building2, Gauge
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
  <div class="min-h-screen bg-background text-text-primary pt-16 lg:pt-20 font-sans">
    <!-- Mobile Header -->
    <header class="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-black/[0.08]">
      <div class="max-w-7xl mx-auto px-4 py-3 space-y-2">
        <h1 class="text-lg font-bold text-text-primary">{{ t('nav.dashboard') }}</h1>
        <div class="overflow-x-auto">
          <Tabs v-model="activeTab" :tabs="tabs.map(tb => ({ id: tb.id, label: tb.label, icon: tb.icon }))" variant="pills" class="text-xs" />
        </div>
      </div>
    </header>

    <div class="lg:hidden h-36" />

    <div class="flex">
      <!-- Sidebar -->
      <DashboardSidebar />

      <!-- Main Content -->
      <main class="flex-1 min-w-0 min-h-screen" style="margin-top: 0;">
        <div class="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 lg:pt-6">
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
            <div v-else-if="activeTab === 'kyc'" class="animate-fade-in-up">
              <div class="max-w-3xl">
                <div class="flex items-center justify-between mb-8">
                  <h2 class="text-2xl sm:text-3xl font-extrabold text-text-primary">{{ t('dashboard.kyc') }}</h2>
                  <Badge :variant="userStore.kycStatus === 'verified' ? 'success' : 'warning'">
                    {{ statusLabels.kyc(userStore.kycStatus) }}
                  </Badge>
                </div>

                <!-- Stepper -->
                <Stepper
                  :model-value="currentKycStep"
                  :steps="kycSteps.map(s => ({ id: s.id, label: s.label, description: s.description }))"
                  variant="vertical"
                  show-descriptions
                >
                </Stepper>

                <div class="mt-8 space-y-6">
                  <Card variant="glass">
                    <h3 class="text-base font-bold text-text-primary mb-4">{{ t('dashboard.kycRequiredDocs') }}</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DocumentUpload
                        :title="t('dashboard.kycPassport')"
                        description="JPEG, PNG or PDF"
                        accepted="image/*,.pdf"
                        max-size="10MB"
                        document-type="idFront"
                        :uploaded="userStore.kycDocuments.idFront"
                      />
                      <DocumentUpload
                        :title="t('dashboard.kycSelfieDoc')"
                        description="JPEG or PNG"
                        accepted="image/*"
                        max-size="10MB"
                        document-type="selfie"
                        :uploaded="userStore.kycDocuments.selfie"
                      />
                      <DocumentUpload
                        :title="t('dashboard.kycProofAddress')"
                        description="JPEG, PNG or PDF"
                        accepted="image/*,.pdf"
                        max-size="10MB"
                        document-type="proofOfAddress"
                        :uploaded="userStore.kycDocuments.proofOfAddress"
                      />
                    </div>
                    <div class="mt-6 pt-6 border-t border-black/10">
                      <Button variant="primary" :disabled="userStore.kycStatus === 'verified'" @click="submitKyc">
                        {{ t('dashboard.submitKyc') }}
                      </Button>
                    </div>
                  </Card>

                  <Card variant="glass">
                    <h3 class="text-base font-bold text-text-primary mb-4">{{ t('dashboard.amlLimit') }}</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div class="p-4 rounded-xl bg-black/[0.03]">
                        <p class="text-text-muted">{{ t('dashboard.amlLimit') }}</p>
                        <p class="text-text-primary font-medium mt-1">50 000 {{ t('common.currency') }}</p>
                      </div>
                      <div class="p-4 rounded-xl bg-black/[0.03]">
                        <p class="text-text-muted">{{ t('dashboard.sanctionsCheck') }}</p>
                        <p class="text-success font-medium mt-1">{{ t('dashboard.clean') }}</p>
                      </div>
                      <div class="p-4 rounded-xl bg-black/[0.03]">
                        <p class="text-text-muted">{{ t('dashboard.pepStatus') }}</p>
                        <p class="text-success font-medium mt-1">{{ t('dashboard.none') }}</p>
                      </div>
                    </div>
                  </Card>
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
