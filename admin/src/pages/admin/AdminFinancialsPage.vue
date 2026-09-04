<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Wallet,
  ShieldCheck,
  CheckCircle,
  Clock,
  Percent
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import type { AdminPayoutRequest } from '@/types/admin'
import MetricCard from '@/components/admin/MetricCard.vue'
import PayoutProcessModal from '@/components/admin/PayoutProcessModal.vue'
import { useI18n } from '@/composables/useI18n'

const adminStore = useAdminStore()
const { t } = useI18n()

const showProcessModal = ref(false)
const targetPayout = ref<AdminPayoutRequest | null>(null)
const toastMessage = ref<string | null>(null)

const filteredPayouts = computed(() => {
  let list = adminStore.payouts
  const g = adminStore.payoutFilters.gateway
  const s = adminStore.payoutFilters.status
  if (g !== 'all') list = list.filter(p => p.bankCode === g)
  if (s !== 'all') list = list.filter(p => p.status === s)
  return list
})

onMounted(async () => {
  await adminStore.fetchFinancials()
})

function showToast(msg: string) {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3500)
}

function handleOpenPayoutModal(p: AdminPayoutRequest) {
  targetPayout.value = p
  showProcessModal.value = true
}

async function handlePayoutProcess(payload: {
  id: string
  action: 'approve' | 'reject'
  reason?: string
  transactionReference?: string
}) {
  const success = await adminStore.processPayout(payload.id, payload.action, {
    reason: payload.reason,
    transactionReference: payload.transactionReference
  })

  if (success) {
    showProcessModal.value = false
    showToast(payload.action === 'approve' ? t('admin.financials.toast.approved') : t('admin.financials.toast.rejected'))
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2.5">
          <Wallet class="w-6 h-6 text-purple-600" />
          <span>{{ t('admin.financials.title') }}</span>
        </h1>
        <p class="text-xs text-text-muted mt-1">
          {{ t('admin.financials.subtitle') }}
        </p>
      </div>

      <div class="text-xs font-semibold text-text-secondary bg-white px-3 py-1.5 rounded-lg border border-border shadow-xs">
        {{ t('admin.financials.pendingPayouts', { count: adminStore.pendingPayoutsCount }) }}
      </div>
    </div>

    <!-- Treasury Overview Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MetricCard
        :title="t('admin.financials.treasury.gmv')"
        :value="adminStore.treasury?.gmv.formatted || '—'"
        :sub-value="t('admin.financials.gmvSubValue')"
        :icon="ShieldCheck"
        icon-bg="bg-blue-50"
        icon-color="text-blue-600"
      />

      <MetricCard
        :title="t('admin.financials.treasury.commissionRevenue')"
        :value="adminStore.treasury?.commissionRevenue.formatted || '—'"
        :trend-label="t('admin.financials.commissionLabel')"
        :icon="Percent"
        icon-bg="bg-purple-50"
        icon-color="text-purple-600"
      />

      <MetricCard
        :title="t('admin.financials.treasury.pendingPayouts')"
        :value="adminStore.treasury?.pendingPayouts.formatted || '—'"
        :sub-value="t('admin.financials.requestsCount', { count: adminStore.treasury?.pendingPayouts.count ?? 0 })"
        :icon="Clock"
        icon-bg="bg-amber-50"
        icon-color="text-amber-600"
      />
    </div>

    <!-- Error Banner -->
    <div v-if="adminStore.error" class="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      <span>{{ adminStore.error }}</span>
      <button class="ml-auto text-red-600 hover:underline font-medium" @click="adminStore.error = null">{{ t('common.close') }}</button>
    </div>

    <!-- Filters Bar -->
    <div class="bg-white border border-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 text-xs">
      <select v-model="adminStore.payoutFilters.gateway" class="flex-1 px-3 py-2 bg-accent border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-text-primary font-medium">
        <option value="all">All gateways</option>
        <option value="mbank">MBank</option>
        <option value="optima">Optima</option>
        <option value="demirbank">DemirBank</option>
      </select>
      <select v-model="adminStore.payoutFilters.status" class="flex-1 px-3 py-2 bg-accent border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-text-primary font-medium">
        <option value="all">All statuses</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
      </select>
    </div>

    <!-- Payouts Queue Table -->
    <div class="bg-white border border-border rounded-2xl overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-accent/60 text-text-muted font-bold uppercase tracking-wider border-b border-border text-[11px]">
            <tr>
              <th class="p-4">{{ t('admin.financials.table.requestId') }}</th>
              <th class="p-4">{{ t('admin.financials.table.sellerInn') }}</th>
              <th class="p-4">{{ t('admin.financials.table.amount') }}</th>
              <th class="p-4">{{ t('admin.financials.table.bankAccount') }}</th>
              <th class="p-4">{{ t('admin.financials.table.status') }}</th>
              <th class="p-4 text-right">{{ t('admin.financials.table.action') }}</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-border">
            <tr
              v-for="p in filteredPayouts"
              :key="p.id"
              class="hover:bg-accent/60 transition-colors"
            >
              <!-- Payout ID -->
              <td class="p-4">
                <span class="font-mono font-bold text-text-primary block">#{{ p.id }}</span>
                <span class="text-[10px] text-text-muted">{{ new Date(p.requestedAt).toLocaleString('ru-RU') }}</span>
              </td>

              <!-- Seller -->
              <td class="p-4">
                <span class="font-bold text-text-primary block">{{ p.userName || t('admin.financials.unknownSeller') }}</span>
                <span class="font-mono text-text-muted text-[11px]">ИНН: {{ p.inn }}</span>
              </td>

              <!-- Amount -->
              <td class="p-4">
                <span class="font-extrabold text-purple-600 block text-sm">{{ p.amount.formatted }}</span>
              </td>

              <!-- Bank / Account -->
              <td class="p-4">
                <span
                  :class="[
                    'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                    p.bankCode === 'mbank' ? 'bg-blue-100 text-[#0052CC]' : '',
                    p.bankCode === 'optima' ? 'bg-red-100 text-[#E60012]' : '',
                    p.bankCode === 'demirbank' ? 'bg-green-100 text-[#00A651]' : ''
                  ]"
                >
                  {{ p.bankCode }}
                </span>
                <span class="text-text-muted block text-[10px] mt-0.5">{{ p.bankName }} • {{ p.accountNumber }}</span>
              </td>

              <!-- Status -->
              <td class="p-4">
                <span
                  :class="[
                    'text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize',
                    p.status === 'pending' ? 'bg-warning/20 text-warning animate-pulse' : '',
                    p.status === 'processing' ? 'bg-secondary/15 text-secondary' : '',
                    p.status === 'completed' ? 'bg-success/10 text-success' : '',
                    (p.status === 'failed' || p.status === 'cancelled') ? 'bg-error/10 text-error' : ''
                  ]"
                >
                  {{ p.status }}
                </span>
              </td>

              <!-- Action -->
              <td class="p-4 text-right">
                <button
                  v-if="p.status === 'pending'"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-xs"
                  @click="handleOpenPayoutModal(p)"
                >
                  <Wallet class="w-3.5 h-3.5" />
                  <span>{{ t('admin.financials.process') }}</span>
                </button>
                <span v-else class="text-[10px] text-text-muted italic">{{ t('admin.financials.completed') }}</span>
              </td>
            </tr>
            <tr v-if="!adminStore.isLoading && filteredPayouts.length === 0">
              <td colspan="6" class="p-12 text-center text-text-muted">
                <Wallet class="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p class="text-sm font-medium">No payout requests</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <PayoutProcessModal
      :is-open="showProcessModal"
      :payout="targetPayout"
      @close="showProcessModal = false"
      @process="handlePayoutProcess"
    />

    <!-- Global Toast Notification -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 bg-white border border-black/10 text-text-primary px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200"
    >
      <CheckCircle class="w-4 h-4 text-success" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
