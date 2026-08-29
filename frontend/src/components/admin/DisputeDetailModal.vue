<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  X,
  Scale,
  CheckCircle,
} from 'lucide-vue-next'
import type { AdminDispute } from '@/types/admin'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

function statusLabel(status: string) {
  return t(`admin.disputes.statusLabels.${status}`)
}

const props = defineProps<{
  dispute: AdminDispute | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'resolve', payload: {
    id: string
    decision: 'refund_buyer' | 'release_seller'
    refundAmount?: number
    reason: string
  }): void
}>()

const activeDecision = ref<'refund_buyer' | 'release_seller'>('refund_buyer')
const decisionReason = ref('')
const refundAmount = ref(0)

// Reset the form each time a different dispute is opened, so a half-filled
// decision from a previous case can't accidentally get applied to this one.
watch(() => props.dispute?.id, () => {
  activeDecision.value = 'refund_buyer'
  decisionReason.value = ''
  refundAmount.value = 0
})

function handleResolveSubmit() {
  if (!props.dispute) return
  emit('resolve', {
    id: props.dispute.id,
    decision: activeDecision.value,
    refundAmount: activeDecision.value === 'refund_buyer' ? refundAmount.value : undefined,
    reason: decisionReason.value || t('admin.disputes.detail.defaultReason')
  })
}
</script>

<template>
  <div
    v-if="isOpen && dispute"
    class="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
  >
    <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
      <!-- Header -->
      <div class="p-5 border-b border-black/[0.06] flex items-center justify-between bg-accent/40">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-error/10 text-error border border-error/20">
            <Scale class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-text-primary">
                {{ t('admin.disputes.detail.caseLabel') }} #{{ dispute.id }}
              </h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-warning/20 text-warning">
                {{ statusLabel(dispute.status) }}
              </span>
            </div>
            <span class="text-xs text-text-secondary">{{ t('admin.disputes.detail.lotLabel') }} {{ dispute.auctionTitle }}</span>
          </div>
        </div>
        <button @click="emit('close')" class="text-text-muted hover:text-text-primary">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Complainant -->
          <div class="p-4 rounded-xl bg-blue-50/30 border border-blue-200 space-y-2">
            <div class="flex items-center gap-2 pb-2 border-b border-blue-200/50">
              <div class="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                {{ dispute.complainantName.charAt(0) }}
              </div>
              <div>
                <span class="font-bold text-blue-950 block">{{ dispute.complainantName }}</span>
                <span class="text-[10px] text-blue-600 font-semibold uppercase">{{ t('admin.disputes.table.buyer') }}</span>
              </div>
            </div>
            <div>
              <span class="font-bold text-text-secondary block mb-1">{{ t('admin.disputes.detail.complaintContent') }}</span>
              <p class="p-3 bg-white rounded-lg border border-blue-100 text-text-primary leading-relaxed">
                {{ dispute.reason }}
              </p>
            </div>
          </div>

          <!-- Respondent -->
          <div class="p-4 rounded-xl bg-purple-50/30 border border-purple-200 space-y-2">
            <div class="flex items-center gap-2 pb-2 border-b border-purple-200/50">
              <div class="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold flex-shrink-0">
                {{ dispute.respondentName.charAt(0) }}
              </div>
              <div>
                <span class="font-bold text-purple-950 block">{{ dispute.respondentName }}</span>
                <span class="text-[10px] text-purple-600 font-semibold uppercase">{{ t('admin.disputes.table.seller') }}</span>
              </div>
            </div>
            <div>
              <span class="font-bold text-text-secondary block mb-1">{{ t('admin.disputes.detail.sellerResponseLabel') }}</span>
              <p class="p-3 bg-white rounded-lg border border-purple-100 text-text-primary leading-relaxed">
                {{ t('admin.disputes.detail.noSellerResponse') }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="dispute.resolution" class="p-4 rounded-xl bg-accent border border-border">
          <span class="font-bold text-text-secondary block mb-1">{{ t('admin.disputes.detail.previousResolution') }}</span>
          <p class="text-text-primary leading-relaxed">{{ dispute.resolution }}</p>
        </div>

        <!-- Arbitration Resolution Desk Form -->
        <div class="p-5 rounded-2xl bg-accent border border-border space-y-4">
          <h4 class="font-bold text-text-primary uppercase tracking-wider text-xs flex items-center gap-2">
            <Scale class="w-4 h-4 text-primary" />
            <span>{{ t('admin.disputes.detail.arbitrationHeading') }}</span>
          </h4>

          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="activeDecision = 'refund_buyer'"
              :class="[
                'p-3 rounded-xl border text-left transition-all',
                activeDecision === 'refund_buyer'
                  ? 'border-secondary bg-secondary/10 ring-2 ring-secondary/20'
                  : 'border-border bg-white hover:border-black/20'
              ]"
            >
              <span class="font-bold text-secondary block mb-0.5">{{ t('admin.disputes.actions.refundBuyer') }}</span>
              <span class="text-[11px] text-text-muted">{{ t('admin.disputes.detail.refundBuyerHint') }}</span>
            </button>

            <button
              type="button"
              @click="activeDecision = 'release_seller'"
              :class="[
                'p-3 rounded-xl border text-left transition-all',
                activeDecision === 'release_seller'
                  ? 'border-success bg-success/10 ring-2 ring-success/20'
                  : 'border-border bg-white hover:border-black/20'
              ]"
            >
              <span class="font-bold text-success block mb-0.5">{{ t('admin.disputes.detail.releaseSellerTitle') }}</span>
              <span class="text-[11px] text-text-muted">{{ t('admin.disputes.detail.releaseSellerHint') }}</span>
            </button>
          </div>

          <div v-if="activeDecision === 'refund_buyer'">
            <label class="block font-semibold mb-1 text-text-secondary">{{ t('admin.disputes.detail.refundAmountLabel') }}</label>
            <input
              v-model.number="refundAmount"
              type="number"
              min="0"
              class="w-full p-2.5 bg-white border border-border rounded-lg font-bold text-sm"
            />
          </div>

          <div>
            <label class="block font-semibold mb-1 text-text-secondary">{{ t('admin.disputes.detail.justificationLabel') }}</label>
            <textarea
              v-model="decisionReason"
              rows="2"
              required
              :placeholder="t('admin.disputes.detail.justificationPlaceholder')"
              class="w-full p-2.5 bg-white border border-border rounded-lg text-xs"
            ></textarea>
          </div>
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

        <button
          type="button"
          @click="handleResolveSubmit"
          class="px-5 py-2.5 rounded-xl font-bold text-text-primary bg-primary hover:bg-primary-hover shadow-md shadow-primary/30 transition-all flex items-center gap-2"
        >
          <CheckCircle class="w-4 h-4" />
          <span>{{ t('admin.disputes.detail.submitButton') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
