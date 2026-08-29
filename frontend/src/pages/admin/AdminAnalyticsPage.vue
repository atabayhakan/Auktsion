<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Wallet, 
  PieChart, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  CheckCircle2, 
  MapPin 
} from 'lucide-vue-next'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'
import { useAdminStore } from '@/stores/admin'
import { useI18n } from '@/composables/useI18n'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler
)

const adminStore = useAdminStore()
const { t } = useI18n()
const timeframe = ref<'today' | '7d' | '30d' | '90d' | 'year'>('30d')
const toastMessage = ref<string | null>(null)

onMounted(async () => {
  await adminStore.fetchAnalytics(timeframe.value)
})

function handleTimeframeChange(tf: 'today' | '7d' | '30d' | '90d' | 'year') {
  timeframe.value = tf
  adminStore.fetchAnalytics(tf)
}

function showToast(msg: string) {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3500)
}

function handleExportCSV() {
  const rows = [
    ['Date', 'GMV (KGS)', 'Revenue 8% (KGS)', 'Bids Count'],
    ...(adminStore.analytics?.gmvTimeSeries || []).map(t => [t.date, t.gmv, t.revenue, t.bidsCount])
  ]
  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `itorgo_analytics_${timeframe.value}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  showToast(t('admin.analytics.exportToast'))
}

// 1. GMV & Revenue Line Chart Data
const lineChartData = computed(() => {
  const series = adminStore.analytics?.gmvTimeSeries || []
  return {
    labels: series.map(s => s.date),
    datasets: [
      {
        label: t('admin.analytics.datasets.gmv'),
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3B82F6',
        pointBackgroundColor: '#3B82F6',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        data: series.map(s => s.gmv)
      },
      {
        label: t('admin.analytics.datasets.revenue'),
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        borderColor: '#9333EA',
        pointBackgroundColor: '#9333EA',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        data: series.map(s => s.revenue)
      }
    ]
  }
})

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        font: { size: 11, family: 'Inter' }
      }
    },
    tooltip: {
      callbacks: {
        label: function (context: any) {
          return `${context.dataset.label}: ${context.raw.toLocaleString('ru-RU')} сом`
        }
      }
    }
  },
  scales: {
    y: {
      grid: { color: 'rgba(156, 163, 175, 0.15)' },
      ticks: {
        callback: function (val: any) {
          return (val / 1000).toLocaleString() + 'k'
        }
      }
    },
    x: {
      grid: { display: false }
    }
  }
}

// 2. Category Doughnut Chart Data
const doughnutChartData = computed(() => {
  const cats = adminStore.analytics?.categoryBreakdown || []
  return {
    labels: cats.map(c => c.nameKg),
    datasets: [
      {
        backgroundColor: cats.map(c => c.color),
        borderWidth: 0,
        data: cats.map(c => c.gmv)
      }
    ]
  }
})

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { boxWidth: 12, font: { size: 11 } }
    }
  }
}

// 3. Hourly Activity Bar Chart Data
const hourlyChartData = computed(() => {
  const hours = adminStore.analytics?.hourlyBiddingDistribution || []
  return {
    labels: hours.map(h => h.label),
    datasets: [
      {
        label: t('admin.analytics.datasets.bidsCount'),
        backgroundColor: '#10B981',
        borderRadius: 6,
        data: hours.map(h => h.bidsCount)
      }
    ]
  }
})

const hourlyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      grid: { color: 'rgba(156, 163, 175, 0.15)' }
    },
    x: {
      grid: { display: false }
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header & Timeframe Selector -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2.5">
          <BarChart3 class="w-6 h-6 text-primary" />
          <span>{{ t('admin.analytics.title') }}</span>
        </h1>
        <p class="text-xs text-text-muted mt-1">
          {{ t('admin.analytics.subtitle') }}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Timeframe pills -->
        <div class="flex bg-white border border-border rounded-xl p-1 text-xs font-semibold">
          <button
            v-for="tf in [
              { id: 'today', label: t('admin.analytics.timeframes.today') },
              { id: '7d', label: t('admin.analytics.timeframes.7d') },
              { id: '30d', label: t('admin.analytics.timeframes.30d') },
              { id: '90d', label: t('admin.analytics.timeframes.90d') },
              { id: 'year', label: t('admin.analytics.timeframes.year') }
            ]"
            :key="tf.id"
            @click="handleTimeframeChange(tf.id as any)"
            :class="[
              'px-3 py-1.5 rounded-lg transition-all',
              timeframe === tf.id
                ? 'bg-primary text-text-primary font-bold shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            ]"
          >
            {{ tf.label }}
          </button>
        </div>

        <!-- Export CSV Button -->
        <button
          @click="handleExportCSV"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-white font-bold text-xs shadow-xs hover:opacity-90 transition-opacity"
        >
          <Download class="w-3.5 h-3.5" />
          <span>{{ t('admin.analytics.exportCsv') }}</span>
        </button>
      </div>
    </div>

    <!-- Chart 1: GMV & Revenue Trendline -->
    <div class="bg-white border border-border rounded-2xl p-5 shadow-xs space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">
            {{ t('admin.analytics.charts.gmvRevenue') }}
          </h3>
          <p class="text-xs text-text-muted">{{ t('admin.analytics.charts.gmvRevenueSub') }}</p>
        </div>
      </div>

      <div class="h-80 w-full">
        <Line :data="lineChartData" :options="lineChartOptions" />
      </div>
    </div>

    <!-- Chart 2 & 3: Category Doughnut + Peak Hourly Activity Bar -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Category Donut (5 cols) -->
      <div class="lg:col-span-5 bg-white border border-border rounded-2xl p-5 shadow-xs flex flex-col">
        <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider mb-1">
          {{ t('admin.analytics.charts.categoryShare') }}
        </h3>
        <p class="text-xs text-text-muted mb-4">{{ t('admin.analytics.charts.categorySub') }}</p>

        <div class="h-64 flex-1">
          <Doughnut :data="doughnutChartData" :options="doughnutChartOptions" />
        </div>
      </div>

      <!-- Peak Hourly Bidding (7 cols) -->
      <div class="lg:col-span-7 bg-white border border-border rounded-2xl p-5 shadow-xs flex flex-col">
        <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider mb-1">
          {{ t('admin.analytics.charts.hourlyActivity') }}
        </h3>
        <p class="text-xs text-text-muted mb-4">{{ t('admin.analytics.charts.hourlySub') }}</p>

        <div class="h-64 flex-1">
          <Bar :data="hourlyChartData" :options="hourlyChartOptions" />
        </div>
      </div>
    </div>

    <!-- Funnel & Regional Distribution Section -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- KYC Conversion Funnel (5 cols) -->
      <div class="lg:col-span-5 bg-white border border-border rounded-2xl p-5 shadow-xs space-y-4">
        <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">
          {{ t('admin.analytics.charts.kycFunnel') }}
        </h3>
        <p class="text-xs text-text-muted">{{ t('admin.analytics.charts.kycFunnelSub') }}</p>

        <div class="space-y-3">
          <div 
            v-for="stage in adminStore.analytics?.kycConversionFunnel" 
            :key="stage.stage"
            class="space-y-1 text-xs"
          >
            <div class="flex items-center justify-between font-semibold">
              <span class="text-text-secondary">{{ stage.labelKg }}</span>
              <span class="font-bold text-text-primary">{{ stage.usersCount.toLocaleString() }} ({{ stage.conversionRate }}%)</span>
            </div>
            <div class="w-full h-2.5 rounded-full bg-accent overflow-hidden">
              <div 
                class="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                :style="{ width: `${stage.conversionRate}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Regional Distribution Table (7 cols) -->
      <div class="lg:col-span-7 bg-white border border-border rounded-2xl p-5 shadow-xs space-y-4">
        <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">
          {{ t('admin.analytics.charts.regionalTitle') }}
        </h3>
        <p class="text-xs text-text-muted">{{ t('admin.analytics.charts.regionalSub') }}</p>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-accent/60 text-text-muted font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-2.5 px-3">{{ t('admin.analytics.table.region') }}</th>
                <th class="py-2.5 px-3">{{ t('admin.analytics.table.totalGmv') }}</th>
                <th class="py-2.5 px-3">{{ t('admin.analytics.table.activeLots') }}</th>
                <th class="py-2.5 px-3">{{ t('admin.analytics.table.share') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="r in adminStore.analytics?.regionalMetrics" :key="r.region" class="hover:bg-accent/50">
                <td class="py-2.5 px-3 font-semibold text-text-primary">{{ r.nameKg }}</td>
                <td class="py-2.5 px-3 font-mono font-bold text-primary">{{ r.gmv.toLocaleString('ru-RU') }} сом</td>
                <td class="py-2.5 px-3 text-text-secondary">{{ r.activeLots }}</td>
                <td class="py-2.5 px-3 font-bold">{{ r.sharePct }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Global Toast Notification -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 bg-white border border-black/10 text-text-primary px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200"
    >
      <CheckCircle2 class="w-4 h-4 text-success" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
