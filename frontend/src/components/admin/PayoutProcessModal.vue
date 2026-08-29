<script setup lang="ts">
import { ref } from 'vue'
import {
  X,
  Wallet,
  CheckCircle
} from 'lucide-vue-next'
import type { AdminPayoutRequest } from '@/types/admin'
import { useI18n } from '@/composables/useI18n'

const props = defineProps<{
  payout: AdminPayoutRequest | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'process', payload: {
    id: string
    action: 'approve' | 'reject'
    reason?: string
    transactionReference?: string
  }): void
}>()

const { t } = useI18n()
const transactionRef = ref('')
const rejectReason = ref('')
const isRejecting = ref(false)

function handleApprove() {
  if (!props.payout) return
  emit('process', {
    id: props.payout.id,
    action: 'approve',
    transactionReference: transactionRef.value || `KG-BANK-${Date.now()}`
  })
}

function handleReject() {
  if (!props.payout) return
  emit('process', {
    id: props.payout.id,
    action: 'reject',
    reason: rejectReason.value || t('admin.financials.modal.defaultRejectReason')
  })
}
</script>

<template>
  <div 
    v-if="isOpen && payout"
    class="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
  >
    <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-black/10 overflow-hidden animate-in zoom-in-95 duration-200">
      <!-- Header -->
      <div class="p-5 border-b border-black/[0.06] flex items-center justify-between bg-accent/40">
        <div class="flex items-center gap-2 text-purple-600 font-bold">
          <Wallet class="w-5 h-5" />
          <h3 class="text-base font-bold text-text-primary">
            {{ t('admin.financials.modal.title') }}
          </h3>
        </div>
        <button @click="emit('close')" class="text-text-muted hover:text-text-primary">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-5 text-xs">
        <!-- Amount Summary Box -->
        <div class="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
          <div class="flex items-center justify-between text-sm">
            <span class="font-bold text-text-primary">{{ t('admin.financials.modal.amountToTransfer') }}</span>
            <span class="font-extrabold text-purple-600 text-base">{{ payout.amount.formatted }}</span>
          </div>
        </div>

        <!-- Seller & Bank Info -->
        <div class="p-4 rounded-xl bg-accent/50 border border-border space-y-2.5">
          <h4 class="font-bold text-text-primary uppercase tracking-wider text-[11px]">{{ t('admin.financials.modal.sellerDetails') }}</h4>
          <div class="space-y-1.5">
            <div class="flex justify-between"><span class="text-text-muted">{{ t('admin.financials.modal.seller') }}</span> <strong class="text-text-primary">{{ payout.userName || t('admin.financials.unknownSeller') }}</strong></div>
            <div class="flex justify-between"><span class="text-text-muted">{{ t('admin.financials.modal.inn') }}</span> <strong class="font-mono text-text-primary">{{ payout.inn }}</strong></div>
            <div class="flex justify-between"><span class="text-text-muted">{{ t('admin.financials.modal.bank') }}</span> <strong class="uppercase text-purple-600">{{ payout.bankCode }} ({{ payout.bankName }})</strong></div>
            <div class="flex justify-between"><span class="text-text-muted">{{ t('admin.financials.modal.accountCard') }}</span> <strong class="font-mono text-text-primary">{{ payout.accountNumber }}</strong></div>
            <div class="flex justify-between"><span class="text-text-muted">{{ t('admin.financials.modal.recipient') }}</span> <strong class="text-text-primary">{{ payout.accountHolderName }}</strong></div>
          </div>
        </div>

        <!-- Transfer Reference Input -->
        <div v-if="!isRejecting">
          <label class="block font-semibold text-text-secondary mb-1.5">{{ t('admin.financials.modal.txRefLabel') }}</label>
          <input
            v-model="transactionRef"
            type="text"
            :placeholder="t('admin.financials.modal.txRefPlaceholder')"
            class="w-full p-2.5 bg-white border border-border rounded-lg font-mono text-xs text-text-primary"
          />
        </div>

        <div v-else>
          <label class="block font-semibold text-text-secondary mb-1.5">{{ t('admin.financials.modal.rejectReasonLabel') }}</label>
          <textarea
            v-model="rejectReason"
            rows="2"
            :placeholder="t('admin.financials.modal.rejectReasonPlaceholder')"
            class="w-full p-2.5 bg-white border border-border rounded-lg text-xs text-text-primary"
          ></textarea>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-5 border-t border-black/[0.06] flex items-center justify-between bg-accent/40">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-lg bg-accent text-text-secondary font-semibold hover:bg-accent-hover"
        >
          {{ t('admin.actions.close') }}
        </button>

        <div class="flex items-center gap-2">
          <button
            v-if="!isRejecting"
            @click="isRejecting = true"
            type="button"
            class="px-4 py-2 rounded-lg font-semibold bg-error/10 text-error hover:bg-error/20 border border-error/30"
          >
            {{ t('admin.actions.reject') }}
          </button>
          <button
            v-else
            @click="handleReject"
            type="button"
            class="px-4 py-2 rounded-lg font-semibold text-white bg-error hover:bg-error/90"
          >
            {{ t('admin.financials.modal.confirmReject') }}
          </button>

          <button
            v-if="!isRejecting"
            @click="handleApprove"
            type="button"
            class="px-5 py-2 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/30 flex items-center gap-1.5"
          >
            <CheckCircle class="w-4 h-4" />
            <span>{{ t('admin.financials.modal.markPaid') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
