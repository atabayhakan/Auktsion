<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Scale,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Truck,
  ArrowRightLeft
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import type { AdminDispute } from '@/types/admin'
import DisputeDetailModal from '@/components/admin/DisputeDetailModal.vue'
import { useI18n } from '@/composables/useI18n'

const adminStore = useAdminStore()
const { t } = useI18n()

const showDetailModal = ref(false)
const targetDispute = ref<AdminDispute | null>(null)
const toastMessage = ref<string | null>(null)

onMounted(async () => {
  await adminStore.fetchDisputes()
})

function statusLabel(status: string) {
  return t(`admin.disputes.statusLabels.${status}`)
}

function showToast(msg: string) {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3500)
}

function handleViewDispute(d: AdminDispute) {
  targetDispute.value = d
  showDetailModal.value = true
}

async function handleResolve(payload: {
  id: string
  decision: 'refund_buyer' | 'release_seller'
  refundAmount?: number
  reason: string
}) {
  const success = await adminStore.resolveDispute(payload.id, payload.decision, {
    refundAmount: payload.refundAmount,
    reason: payload.reason
  })

  if (success) {
    showDetailModal.value = false
    showToast(t('admin.disputes.toast.resolved', { id: payload.id }))
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2.5">
          <Scale class="w-6 h-6 text-error" />
          <span>{{ t('admin.disputes.title') }}</span>
        </h1>
        <p class="text-xs text-text-secondary mt-1">
          {{ t('admin.disputes.subtitle') }}
        </p>
      </div>

      <div class="text-xs font-semibold text-text-secondary bg-white px-3 py-1.5 rounded-lg border border-border shadow-xs">
        {{ t('admin.disputes.total', { count: adminStore.openDisputesCount }) }}
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="bg-white border border-border rounded-2xl p-4 shadow-xs text-xs">
      <div class="sm:max-w-xs">
        <select
          v-model="adminStore.disputeFilters.status"
          @change="adminStore.fetchDisputes(1)"
          class="w-full px-3 py-2 bg-accent border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-primary font-medium"
        >
          <option value="all">{{ t('admin.disputes.filterAll') }}</option>
          <option value="open">{{ t('admin.disputes.statusLabels.open') }}</option>
          <option value="under_review">{{ t('admin.disputes.statusLabels.under_review') }}</option>
          <option value="resolved">{{ t('admin.disputes.statusLabels.resolved') }}</option>
          <option value="rejected">{{ t('admin.disputes.statusLabels.rejected') }}</option>
        </select>
      </div>
    </div>

    <!-- Disputes Table -->
    <div class="bg-white border border-border rounded-2xl overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-accent/80 text-text-muted font-bold uppercase tracking-wider border-b border-border text-[11px]">
            <tr>
              <th class="p-4">{{ t('admin.disputes.table.caseId') }}</th>
              <th class="p-4">{{ t('admin.disputes.table.lotAndAmount') }}</th>
              <th class="p-4">{{ t('admin.disputes.table.buyer') }}</th>
              <th class="p-4">{{ t('admin.disputes.table.seller') }}</th>
              <th class="p-4">{{ t('admin.disputes.table.reason') }}</th>
              <th class="p-4">{{ t('admin.disputes.table.status') }}</th>
              <th class="p-4 text-right">{{ t('admin.disputes.table.arbitration') }}</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-border">
            <tr
              v-for="d in adminStore.disputes"
              :key="d.id"
              class="hover:bg-accent/60 transition-colors"
            >
              <!-- Dispute Number -->
              <td class="p-4">
                <span class="font-bold text-error font-mono block text-sm">#{{ d.id }}</span>
                <span class="text-text-muted text-[10px]">{{ new Date(d.createdAt).toLocaleDateString('ru-RU') }}</span>
              </td>

              <!-- Lot Title & Amount -->
              <td class="p-4">
                <span class="font-bold text-text-primary block truncate max-w-xs">{{ d.auctionTitle }}</span>
                <span class="text-primary font-bold font-mono">{{ d.refundAmount.formatted }}</span>
              </td>

              <!-- Buyer -->
              <td class="p-4">
                <span class="font-semibold text-text-primary block">{{ d.complainantName }}</span>
              </td>

              <!-- Seller -->
              <td class="p-4">
                <span class="font-semibold text-text-primary block">{{ d.respondentName }}</span>
              </td>

              <!-- Reason -->
              <td class="p-4">
                <span class="text-text-secondary block truncate max-w-xs" :title="d.reason">
                  {{ d.reason }}
                </span>
              </td>

              <!-- Status -->
              <td class="p-4">
                <span
                  :class="[
                    'text-[10px] font-bold px-2 py-0.5 rounded-full block w-max',
                    ['open', 'under_review'].includes(d.status) ? 'bg-warning/20 text-warning animate-pulse' : (d.status === 'resolved' ? 'bg-success/20 text-success' : 'bg-error/20 text-error')
                  ]"
                >
                  {{ statusLabel(d.status) }}
                </span>
              </td>

              <!-- Actions -->
              <td class="p-4 text-right">
                <button
                  @click="handleViewDispute(d)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error text-white hover:bg-error/90 font-bold transition-all shadow-xs"
                >
                  <Scale class="w-3.5 h-3.5" />
                  <span>{{ t('admin.disputes.table.arbitration') }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <DisputeDetailModal
      :is-open="showDetailModal"
      :dispute="targetDispute"
      @close="showDetailModal = false"
      @resolve="handleResolve"
    />

    <!-- Global Toast Notification -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 bg-white border border-border text-text-primary px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200"
    >
      <CheckCircle class="w-4 h-4 text-success" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
