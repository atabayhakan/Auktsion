<script setup lang="ts">
import { onMounted } from 'vue'
import {
  TrendingUp,
  Wallet,
  Gavel,
  Users,
  ShieldCheck,
  AlertCircle,
  Activity,
  ArrowRight,
  Scale,
  DollarSign,
  Radio,
  CheckCircle2
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import { useI18n } from '@/composables/useI18n'
import MetricCard from '@/components/admin/MetricCard.vue'
import LiveFeedTicker from '@/components/admin/LiveFeedTicker.vue'

const adminStore = useAdminStore()
const { t } = useI18n()

onMounted(async () => {
  await Promise.allSettled([
    adminStore.fetchOverview(),
    adminStore.fetchMonitoring(),
    adminStore.fetchDisputes(),
    adminStore.fetchKycRecords()
  ])
})
</script>

<template>
  <div class="space-y-6">
    <!-- Top Welcome & Quick Date Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-text-primary tracking-tight">
          {{ t('admin.overview.title') }}
        </h1>
        <p class="text-xs text-text-muted mt-1">
          {{ t('admin.overview.subtitle') }}
        </p>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center gap-2">
        <router-link
          to="/admin/monitoring"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-text-primary text-xs font-bold shadow-md shadow-primary/20 transition-all"
        >
          <Radio class="w-4 h-4 animate-pulse" />
          <span>{{ t('admin.nav.monitoring') }} (War Room)</span>
        </router-link>

        <router-link
          to="/admin/analytics"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-border hover:bg-accent text-text-primary text-xs font-semibold shadow-xs transition-colors"
        >
          <span>{{ t('admin.nav.analytics') }}</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </router-link>
      </div>
    </div>

    <!-- 4 Primary KPI Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        :title="t('admin.overview.gmv')"
        :value="adminStore.stats?.totalGmv.formatted || '—'"
        :icon="DollarSign"
        icon-bg="bg-emerald-50"
        icon-color="text-emerald-600"
      />

      <MetricCard
        :title="t('admin.overview.platformRevenue')"
        :value="adminStore.stats?.platformRevenue.formatted || '—'"
        :icon="Wallet"
        icon-bg="bg-purple-50"
        icon-color="text-purple-600"
      />

      <MetricCard
        :title="t('admin.overview.activeAuctions')"
        :value="adminStore.stats?.activeAuctionsCount ?? '—'"
        :sub-value="t('admin.overview.lotsOnAuction')"
        :icon="Gavel"
        icon-bg="bg-blue-50"
        icon-color="text-blue-600"
      />

      <MetricCard
        :title="t('admin.overview.totalUsers')"
        :value="(adminStore.stats?.totalUsersCount ?? 0).toLocaleString()"
        :sub-value="t('admin.overview.users')"
        :icon="Users"
        icon-bg="bg-amber-50"
        icon-color="text-amber-600"
      />
    </div>

    <!-- Middle Row: Priority Moderation Action Banners -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- KYC Approval Pending Card -->
      <router-link
        to="/admin/kyc"
        class="glass rounded-2xl p-4 hover:border-blue-400 transition-all flex items-center justify-between group"
      >
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck class="w-6 h-6" />
          </div>
          <div>
            <span class="text-xs text-text-muted font-medium block">{{ t('admin.overview.kycQueue') }}</span>
            <span class="text-lg font-bold text-text-primary">
              {{ adminStore.pendingKycCount }} {{ t('admin.overview.newApplications') }}
            </span>
          </div>
        </div>
        <ArrowRight class="w-5 h-5 text-text-muted group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
      </router-link>

      <!-- Disputes Pending Card -->
      <router-link
        to="/admin/disputes"
        class="glass rounded-2xl p-4 hover:border-rose-400 transition-all flex items-center justify-between group"
      >
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Scale class="w-6 h-6" />
          </div>
          <div>
            <span class="text-xs text-text-muted font-medium block">{{ t('admin.overview.unresolvedDisputes') }}</span>
            <span class="text-lg font-bold text-text-primary">
              {{ adminStore.openDisputesCount }} {{ t('admin.overview.openCases') }}
            </span>
          </div>
        </div>
        <ArrowRight class="w-5 h-5 text-text-muted group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
      </router-link>

      <!-- Payout Requests Pending Card -->
      <router-link
        to="/admin/financials"
        class="glass rounded-2xl p-4 hover:border-purple-400 transition-all flex items-center justify-between group"
      >
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Wallet class="w-6 h-6" />
          </div>
          <div>
            <span class="text-xs text-text-muted font-medium block">{{ t('admin.overview.payoutRequests') }}</span>
            <span class="text-lg font-bold text-text-primary">
              {{ adminStore.pendingPayoutsCount }} {{ t('admin.overview.requestsMbOptima') }}
            </span>
          </div>
        </div>
        <ArrowRight class="w-5 h-5 text-text-muted group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
      </router-link>
    </div>

    <!-- Live Bid Feed -->
    <div class="grid grid-cols-1 gap-6">
      <LiveFeedTicker
        :bids="adminStore.liveBids"
        @cancel-bid="(bidId) => adminStore.cancelSuspiciousBid(bidId, t('admin.monitoring.cancelledByAdmin'))"
      />
    </div>

    <!-- Banking Gateways Health Status Bar -->
    <div class="glass rounded-2xl p-5 space-y-3">
      <h4 class="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
        <span>{{ t('admin.overview.gatewayHealth') }}</span>
        <span class="text-emerald-500 font-semibold flex items-center gap-1">
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span>{{ t('admin.overview.allGatewaysActive') }}</span>
        </span>
      </h4>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div class="p-3 bg-accent rounded-xl border border-border flex items-center justify-between">
          <span class="font-bold text-[#0052CC]">MBank P2P & QR</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{{ t('admin.overview.online') }}</span>
        </div>
        <div class="p-3 bg-accent rounded-xl border border-border flex items-center justify-between">
          <span class="font-bold text-[#E60012]">Optima Bank API</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{{ t('admin.overview.online') }}</span>
        </div>
        <div class="p-3 bg-accent rounded-xl border border-border flex items-center justify-between">
          <span class="font-bold text-[#00A651]">DemirBank IBAN</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{{ t('admin.overview.online') }}</span>
        </div>
        <div class="p-3 bg-accent rounded-xl border border-border flex items-center justify-between">
          <span class="font-bold text-text-primary">ELQR National</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{{ t('admin.overview.online') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
