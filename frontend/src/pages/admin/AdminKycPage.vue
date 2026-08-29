<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UserCheck
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import type { AdminKycApplication } from '@/types/admin'
import KycReviewModal from '@/components/admin/KycReviewModal.vue'
import { useI18n } from '@/composables/useI18n'

const adminStore = useAdminStore()
const { t } = useI18n()

const showReviewModal = ref(false)
const targetApplication = ref<AdminKycApplication | null>(null)
const toastMessage = ref<string | null>(null)

onMounted(async () => {
  await adminStore.fetchKycRecords()
})

function showToast(msg: string) {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3500)
}

function handleReview(k: AdminKycApplication) {
  targetApplication.value = k
  showReviewModal.value = true
}

async function handleReviewSubmit(payload: {
  id: string
  status: 'approved' | 'rejected'
  rejectionReasonCode?: string
  rejectionNotes?: string
}) {
  const success = await adminStore.reviewKyc(payload.id, payload.status, {
    rejectionReasonCode: payload.rejectionReasonCode,
    rejectionNotes: payload.rejectionNotes
  })

  if (success) {
    showReviewModal.value = false
    showToast(payload.status === 'approved' ? t('admin.kyc.toast.approved') : t('admin.kyc.toast.rejected'))
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2.5">
          <ShieldCheck class="w-6 h-6 text-secondary" />
          <span>{{ t('admin.kyc.title') }}</span>
        </h1>
        <p class="text-xs text-text-muted mt-1">
          {{ t('admin.kyc.subtitle') }}
        </p>
      </div>

      <div class="text-xs font-semibold text-text-secondary bg-white px-3 py-1.5 rounded-lg border border-border shadow-xs">
        {{ t('admin.kyc.total', { count: adminStore.pendingKycCount }) }}
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="bg-white border border-border rounded-2xl p-4 shadow-xs sm:max-w-xs text-xs">
      <select
        v-model="adminStore.kycFilters.status"
        class="w-full px-3 py-2 bg-accent border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 text-text-primary font-medium"
        @change="adminStore.fetchKycRecords(1)"
      >
        <option value="all">{{ t('admin.kyc.filters.all') }}</option>
        <option value="pending">{{ t('admin.kyc.filters.pending') }}</option>
        <option value="approved">{{ t('admin.kyc.filters.approved') }}</option>
        <option value="rejected">{{ t('admin.kyc.filters.rejected') }}</option>
      </select>
    </div>

    <!-- KYC Table -->
    <div class="bg-white border border-border rounded-2xl overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-accent/60 text-text-muted font-bold uppercase tracking-wider border-b border-border text-[11px]">
            <tr>
              <th class="p-4">{{ t('admin.kyc.table.applicant') }}</th>
              <th class="p-4">{{ t('admin.kyc.table.inn') }}</th>
              <th class="p-4">{{ t('admin.kyc.table.submittedAt') }}</th>
              <th class="p-4">{{ t('admin.kyc.table.amlSanctionsPep') }}</th>
              <th class="p-4">{{ t('admin.kyc.table.status') }}</th>
              <th class="p-4 text-right">{{ t('admin.kyc.table.review') }}</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-border">
            <tr
              v-for="k in adminStore.kycRecords"
              :key="k.id"
              class="hover:bg-accent/60 transition-colors"
            >
              <!-- Applicant -->
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <img
                    :src="k.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'"
                    class="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                  <div>
                    <span class="font-bold text-text-primary block text-sm">{{ k.userName || t('admin.kyc.unknownUser') }}</span>
                    <span class="text-text-muted text-[11px]">{{ k.userCity }} • {{ k.userPhone }}</span>
                  </div>
                </div>
              </td>

              <!-- INN -->
              <td class="p-4">
                <span class="font-mono font-bold text-text-primary block">{{ k.inn }}</span>
                <span v-if="k.duplicateInnAccounts && k.duplicateInnAccounts.length > 0" class="text-error font-bold text-[10px] flex items-center gap-1">
                  <AlertTriangle class="w-3 h-3" />
                  <span>{{ t('admin.kyc.duplicateInnWarning') }}</span>
                </span>
                <span v-else class="text-success text-[10px] font-semibold">{{ t('admin.kyc.noDuplicates') }}</span>
              </td>

              <!-- Submission Date -->
              <td class="p-4">
                <span class="text-text-secondary block">{{ new Date(k.createdAt).toLocaleDateString('ru-RU') }}</span>
                <span class="text-text-muted text-[10px]">{{ new Date(k.createdAt).toLocaleTimeString('ru-RU') }}</span>
              </td>

              <!-- AML / Sanctions / PEP -->
              <td class="p-4">
                <div class="flex flex-wrap gap-1">
                  <span :class="['text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', k.amlStatus === 'clean' ? 'bg-success/15 text-success' : 'bg-error/15 text-error']">
                    {{ t('admin.kyc.amlLabel') }} {{ k.amlStatus === 'clean' ? t('admin.kyc.clean') : (k.amlStatus === 'flagged' ? t('admin.kyc.flagged') : t('admin.kyc.checking')) }}
                  </span>
                  <span :class="['text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', k.sanctionsStatus === 'clean' ? 'bg-success/15 text-success' : 'bg-error/15 text-error']">
                    {{ t('admin.kyc.sanctionsLabel') }} {{ k.sanctionsStatus === 'clean' ? t('admin.kyc.clean') : t('admin.kyc.sanctionsMatch') }}
                  </span>
                  <span :class="['text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', k.pepStatus === 'none' ? 'bg-success/15 text-success' : 'bg-warning/20 text-warning']">
                    {{ t('admin.kyc.pepLabel') }} {{ k.pepStatus === 'none' ? t('admin.kyc.pepNone') : t('admin.kyc.pepLinked') }}
                  </span>
                </div>
              </td>

              <!-- Status -->
              <td class="p-4">
                <span
                  :class="[
                    'text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize',
                    k.status === 'pending' ? 'bg-secondary/10 text-secondary animate-pulse' : '',
                    k.status === 'approved' ? 'bg-success/10 text-success' : '',
                    k.status === 'rejected' ? 'bg-error/10 text-error' : ''
                  ]"
                >
                  {{ k.status }}
                </span>
              </td>

              <!-- Actions -->
              <td class="p-4 text-right">
                <button
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary-hover text-white font-bold transition-all shadow-xs"
                  @click="handleReview(k)"
                >
                  <UserCheck class="w-3.5 h-3.5" />
                  <span>{{ t('admin.kyc.table.review') }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <KycReviewModal
      :is-open="showReviewModal"
      :application="targetApplication"
      @close="showReviewModal = false"
      @review="handleReviewSubmit"
    />

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
