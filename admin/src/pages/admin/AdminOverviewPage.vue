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
  CheckCircle2,
  Zap,
  Clock,
  Landmark,
  CreditCard,
  QrCode
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
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
          {{ t('admin.overview.title') || 'iTorgo Yönetim Paneli' }}
        </h1>
        <p class="text-xs sm:text-sm text-gray-500 mt-1">
          {{ t('admin.overview.subtitle') || 'Kırgızistan genelinde çevrimiçi açık artırma pazarının gerçek zamanlı durumu ve izlenmesi' }}
        </p>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center gap-2.5">
        <router-link
          to="/admin/monitoring"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-text-primary text-xs font-extrabold shadow-sm transition-all"
        >
          <Radio class="w-4 h-4 animate-pulse" />
          <span>{{ t('admin.nav.monitoring') || 'Canlı İzleme (War Room)' }}</span>
        </router-link>

        <router-link
          to="/admin/analytics"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-black/[0.08] hover:bg-slate-50 text-gray-800 text-xs font-bold shadow-2xs transition-colors"
        >
          <span>{{ t('admin.nav.analytics') || 'Analitik & Raporlar' }}</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </router-link>
      </div>
    </div>

    <!-- 4 Primary KPI Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        :title="t('admin.overview.gmv') || 'TOPLAM İŞLEM HACMİ (GMV)'"
        :value="adminStore.stats?.totalGmv?.formatted || '0 сом'"
        :icon="DollarSign"
        icon-bg="bg-emerald-50 border-emerald-100"
        icon-color="text-emerald-600"
      />

      <MetricCard
        :title="t('admin.overview.platformRevenue') || 'PLATFORM GELİRİ (KOMİSYON)'"
        :value="adminStore.stats?.platformRevenue?.formatted || '0 сом'"
        :icon="Wallet"
        icon-bg="bg-purple-50 border-purple-100"
        icon-color="text-purple-600"
      />

      <MetricCard
        :title="t('admin.overview.activeAuctions') || 'AKTİF İLANLAR (GERÇEK ZAMANLI)'"
        :value="adminStore.stats?.activeAuctionsCount ?? 0"
        :sub-value="t('admin.overview.lotsOnAuction') || 'açık artırmadaki ilanlar'"
        :icon="Gavel"
        icon-bg="bg-blue-50 border-blue-100"
        icon-color="text-blue-600"
      />

      <MetricCard
        :title="t('admin.overview.totalUsers') || 'KAYITLI KULLANICILAR'"
        :value="(adminStore.stats?.totalUsersCount ?? 0).toLocaleString()"
        :sub-value="t('admin.overview.users') || 'kullanıcı'"
        :icon="Users"
        icon-bg="bg-amber-50 border-amber-100"
        icon-color="text-amber-600"
      />
    </div>

    <!-- Middle Row: Priority Moderation Action Banners -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- KYC Approval Pending Card -->
      <router-link
        to="/admin/kyc"
        class="bg-white rounded-2xl p-4 sm:p-5 border border-blue-100/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex items-center justify-between group"
      >
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
            <ShieldCheck class="w-6 h-6" />
          </div>
          <div>
            <span class="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">
              {{ t('admin.overview.kycQueue') || 'KYC Onay Kuyruğu' }}
            </span>
            <span class="text-base font-extrabold text-gray-900 mt-0.5 block">
              {{ adminStore.pendingKycCount || 0 }} {{ t('admin.overview.newApplications') || 'yeni başvuru' }}
            </span>
          </div>
        </div>
        <div class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <ArrowRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </router-link>

      <!-- Disputes Pending Card -->
      <router-link
        to="/admin/disputes"
        class="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100/80 shadow-xs hover:border-rose-400 hover:shadow-md transition-all flex items-center justify-between group"
      >
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 group-hover:scale-105 transition-transform">
            <Scale class="w-6 h-6" />
          </div>
          <div>
            <span class="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">
              {{ t('admin.overview.unresolvedDisputes') || 'Çözülmemiş Uyuşmazlıklar' }}
            </span>
            <span class="text-base font-extrabold text-gray-900 mt-0.5 block">
              {{ adminStore.openDisputesCount || 0 }} {{ t('admin.overview.openCases') || 'açık dosya' }}
            </span>
          </div>
        </div>
        <div class="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
          <ArrowRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </router-link>

      <!-- Payout Requests Pending Card -->
      <router-link
        to="/admin/financials"
        class="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100/80 shadow-xs hover:border-purple-400 hover:shadow-md transition-all flex items-center justify-between group"
      >
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform">
            <Wallet class="w-6 h-6" />
          </div>
          <div>
            <span class="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">
              {{ t('admin.overview.payoutRequests') || 'Para Çekim Talepleri' }}
            </span>
            <span class="text-base font-extrabold text-gray-900 mt-0.5 block">
              {{ adminStore.pendingPayoutsCount || 0 }} {{ t('admin.overview.requestsMbOptima') || 'talep (MBank / Optima)' }}
            </span>
          </div>
        </div>
        <div class="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
          <ArrowRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
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
    <div class="bg-white rounded-3xl p-6 border border-black/[0.08] shadow-xs space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.05] pb-3">
        <div>
          <h4 class="text-xs font-extrabold uppercase tracking-wider text-gray-800 flex items-center gap-2">
            <Zap class="w-4 h-4 text-amber-500" />
            <span>{{ t('admin.overview.gatewayHealth') || 'ÖDEME AĞ GEÇİDİ SAĞLIĞI (FINTECH GATEWAYS)' }}</span>
          </h4>
        </div>
        <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full w-fit">
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span>{{ t('admin.overview.allGatewaysActive') || 'TÜM AĞ GEÇİTLERİ AKTİF' }}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div class="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-black/[0.06] flex items-center justify-between transition-colors">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center font-black text-xs border border-blue-100">
              MB
            </div>
            <div>
              <span class="font-extrabold text-[#0052CC] block">MBank P2P & QR</span>
              <span class="text-[10px] text-gray-400 font-mono">Ping: 14ms • 99.9%</span>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            {{ t('admin.overview.online') || 'Çevrimiçi' }}
          </span>
        </div>

        <div class="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-black/[0.06] flex items-center justify-between transition-colors">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-rose-50 text-[#E60012] flex items-center justify-center font-black text-xs border border-rose-100">
              OP
            </div>
            <div>
              <span class="font-extrabold text-[#E60012] block">Optima Bank API</span>
              <span class="text-[10px] text-gray-400 font-mono">Ping: 22ms • 99.8%</span>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            {{ t('admin.overview.online') || 'Çevrimiçi' }}
          </span>
        </div>

        <div class="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-black/[0.06] flex items-center justify-between transition-colors">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-emerald-50 text-[#00A651] flex items-center justify-center font-black text-xs border border-emerald-100">
              DB
            </div>
            <div>
              <span class="font-extrabold text-[#00A651] block">DemirBank IBAN</span>
              <span class="text-[10px] text-gray-400 font-mono">Emanet Hesabı</span>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            {{ t('admin.overview.online') || 'Çevrimiçi' }}
          </span>
        </div>

        <div class="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-black/[0.06] flex items-center justify-between transition-colors">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-xs border border-amber-100">
              <QrCode class="w-4 h-4" />
            </div>
            <div>
              <span class="font-extrabold text-gray-900 block">ELQR National</span>
              <span class="text-[10px] text-gray-400 font-mono">NBKR Standart</span>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            {{ t('admin.overview.online') || 'Çevrimiçi' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>