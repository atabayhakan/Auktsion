<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ZoomIn,
  RotateCw,
  UserCheck
} from 'lucide-vue-next'
import type { AdminKycApplication } from '@/types/admin'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

const props = defineProps<{
  application: AdminKycApplication | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'review', payload: {
    id: string
    status: 'approved' | 'rejected'
    rejectionReasonCode?: string
    rejectionNotes?: string
  }): void
}>()

const selectedDoc = ref<'idFront' | 'idBack' | 'selfie'>('idFront')
const zoomLevel = ref(1)
const rotation = ref(0)
const rejectionReason = ref('blurry_image')
const rejectionNotes = ref('')
const showRejectForm = ref(false)

const docUrls = computed(() => ({
  idFront: props.application?.idFrontUrl,
  idBack: props.application?.idBackUrl,
  selfie: props.application?.selfieUrl
}))

function rotateImage() {
  rotation.value = (rotation.value + 90) % 360
}

function zoomImage() {
  zoomLevel.value = zoomLevel.value === 1 ? 1.75 : 1
}

function handleApprove() {
  if (!props.application) return
  emit('review', {
    id: props.application.id,
    status: 'approved'
  })
}

function handleRejectSubmit() {
  if (!props.application) return
  emit('review', {
    id: props.application.id,
    status: 'rejected',
    rejectionReasonCode: rejectionReason.value,
    rejectionNotes: rejectionNotes.value
  })
  showRejectForm.value = false
}
</script>

<template>
  <div 
    v-if="isOpen && application"
    class="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
  >
    <div class="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
      <!-- Header -->
      <div class="p-5 border-b border-black/[0.06] flex items-center justify-between bg-accent/40">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-secondary/10 text-secondary border border-secondary/20">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-text-primary">
                {{ t('admin.kyc.modal.titlePrefix') }} #{{ application.id }}: {{ application.userName || t('admin.kyc.unknownUser') }}
              </h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-warning/20 text-warning">
                {{ application.status }}
              </span>
            </div>
            <span class="text-xs text-text-muted">{{ t('admin.kyc.modal.innLabel') }} <strong class="font-mono text-text-primary">{{ application.inn }}</strong></span>
          </div>
        </div>
        <button @click="emit('close')" class="text-text-muted hover:text-text-primary">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body: Dual-Pane Workbench -->
      <div class="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left 7 cols: Document High-Res Inspection Workbench -->
          <div class="lg:col-span-7 space-y-3">
            <div class="flex items-center justify-between">
              <!-- Document selector tabs -->
              <div class="flex gap-2">
                <button
                  type="button"
                  @click="selectedDoc = 'idFront'"
                  :class="[
                    'px-3 py-1.5 rounded-lg font-semibold border text-xs transition-colors',
                    selectedDoc === 'idFront' ? 'bg-primary text-text-primary border-primary' : 'bg-accent text-text-secondary border-border'
                  ]"
                >
                  {{ t('admin.kyc.modal.idFrontTab') }}
                </button>
                <button
                  v-if="application.idBackUrl"
                  type="button"
                  @click="selectedDoc = 'idBack'"
                  :class="[
                    'px-3 py-1.5 rounded-lg font-semibold border text-xs transition-colors',
                    selectedDoc === 'idBack' ? 'bg-primary text-text-primary border-primary' : 'bg-accent text-text-secondary border-border'
                  ]"
                >
                  {{ t('admin.kyc.modal.idBackTab') }}
                </button>
                <button
                  type="button"
                  @click="selectedDoc = 'selfie'"
                  :class="[
                    'px-3 py-1.5 rounded-lg font-semibold border text-xs transition-colors',
                    selectedDoc === 'selfie' ? 'bg-primary text-text-primary border-primary' : 'bg-accent text-text-secondary border-border'
                  ]"
                >
                  {{ t('admin.kyc.modal.selfieTab') }}
                </button>
              </div>

              <!-- Controls -->
              <div class="flex gap-1.5">
                <button
                  @click="zoomImage"
                  class="p-1.5 rounded-lg bg-accent text-text-secondary hover:bg-accent-hover"
                  :title="t('admin.kyc.modal.zoomTitle')"
                >
                  <ZoomIn class="w-4 h-4" />
                </button>
                <button
                  @click="rotateImage"
                  class="p-1.5 rounded-lg bg-accent text-text-secondary hover:bg-accent-hover"
                  :title="t('admin.kyc.modal.rotateTitle')"
                >
                  <RotateCw class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Image Canvas -->
            <div class="h-96 rounded-2xl bg-accent border border-border flex items-center justify-center overflow-hidden relative p-4">
              <img
                :src="docUrls[selectedDoc] || application.idFrontUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'"
                class="max-h-full max-w-full object-contain transition-transform duration-200 select-none shadow-2xl"
                :style="{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
                }"
              />
            </div>
          </div>

          <!-- Right 5 cols: Verification Checklist & Automated Regulatory Checks -->
          <div class="lg:col-span-5 space-y-4">
            <!-- Automated Compliance Checks Board -->
            <div class="p-4 rounded-xl bg-accent/50 border border-border space-y-3">
              <h4 class="font-bold text-text-primary uppercase tracking-wider text-[11px]">
                {{ t('admin.kyc.modal.automatedChecksHeading') }}
              </h4>

              <div class="space-y-2">
                <div class="flex items-center justify-between p-2 rounded-lg bg-white border border-border">
                  <span class="text-text-secondary">{{ t('admin.kyc.modal.amlCheckLabel') }}</span>
                  <span :class="['flex items-center gap-1 font-bold', application.amlStatus === 'clean' ? 'text-success' : 'text-error']">
                    <CheckCircle2 v-if="application.amlStatus === 'clean'" class="w-3.5 h-3.5" />
                    <XCircle v-else class="w-3.5 h-3.5" />
                    <span>{{ application.amlStatus === 'clean' ? t('admin.kyc.clean') : (application.amlStatus === 'flagged' ? t('admin.kyc.flagged') : t('admin.kyc.modal.amlNeedsReview')) }}</span>
                  </span>
                </div>

                <div class="flex items-center justify-between p-2 rounded-lg bg-white border border-border">
                  <span class="text-text-secondary">{{ t('admin.kyc.modal.sanctionsCheckLabel') }}</span>
                  <span :class="['flex items-center gap-1 font-bold', application.sanctionsStatus === 'clean' ? 'text-success' : 'text-error']">
                    <CheckCircle2 v-if="application.sanctionsStatus === 'clean'" class="w-3.5 h-3.5" />
                    <XCircle v-else class="w-3.5 h-3.5" />
                    <span>{{ application.sanctionsStatus === 'clean' ? t('admin.kyc.clean') : t('admin.kyc.modal.sanctionsMatchFound') }}</span>
                  </span>
                </div>

                <div class="flex items-center justify-between p-2 rounded-lg bg-white border border-border">
                  <span class="text-text-secondary">{{ t('admin.kyc.modal.pepCheckLabel') }}</span>
                  <span :class="['flex items-center gap-1 font-bold', application.pepStatus === 'none' ? 'text-success' : 'text-warning']">
                    <CheckCircle2 v-if="application.pepStatus === 'none'" class="w-3.5 h-3.5" />
                    <AlertTriangle v-else class="w-3.5 h-3.5" />
                    <span>{{ application.pepStatus === 'none' ? t('admin.kyc.modal.pepNotDetected') : t('admin.kyc.modal.pepLinkFound') }}</span>
                  </span>
                </div>

                <!-- Duplicate INN Alert -->
                <div
                  v-if="application.duplicateInnAccounts && application.duplicateInnAccounts.length > 0"
                  class="p-2.5 rounded-lg bg-error/10 border border-error/30 text-error"
                >
                  <div class="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle class="w-4 h-4 text-error" />
                    <span>{{ t('admin.kyc.modal.duplicateInnHeading') }}</span>
                  </div>
                  <p class="text-[11px]">{{ t('admin.kyc.modal.duplicateInnBody', { accounts: application.duplicateInnAccounts.join(', ') }) }}</p>
                </div>
              </div>
            </div>

            <!-- Form Data Extract -->
            <div class="p-4 rounded-xl bg-accent/50 border border-border space-y-2.5">
              <h4 class="font-bold text-text-primary uppercase tracking-wider text-[11px]">
                {{ t('admin.kyc.modal.formDataHeading') }}
              </h4>

              <div class="grid grid-cols-2 gap-2 text-[11px]">
                <div><span class="text-text-muted block">{{ t('admin.kyc.modal.fullNameLabel') }}</span> <strong class="text-text-primary">{{ application.userName || t('admin.kyc.modal.unknownValue') }}</strong></div>
                <div><span class="text-text-muted block">{{ t('admin.kyc.modal.phoneLabel') }}</span> <strong class="text-text-primary">{{ application.userPhone }}</strong></div>
                <div><span class="text-text-muted block">{{ t('admin.kyc.modal.emailLabel') }}</span> <strong class="text-text-primary">{{ application.userEmail }}</strong></div>
                <div><span class="text-text-muted block">{{ t('admin.kyc.modal.cityLabel') }}</span> <strong class="text-text-primary">{{ application.userCity }}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Rejection Form -->
        <div v-if="showRejectForm" class="p-4 bg-error/10 rounded-xl border border-error/30 space-y-3">
          <h4 class="font-bold text-error">{{ t('admin.kyc.modal.rejectReasonHeading') }}</h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold mb-1 text-text-secondary">{{ t('admin.kyc.modal.errorTypeLabel') }}</label>
              <select v-model="rejectionReason" class="w-full p-2 bg-white border border-border rounded-lg text-text-primary">
                <option value="blurry_image">{{ t('admin.kyc.modal.reasonBlurryImage') }}</option>
                <option value="expired_document">{{ t('admin.kyc.modal.reasonExpiredDocument') }}</option>
                <option value="name_mismatch">{{ t('admin.kyc.modal.reasonNameMismatch') }}</option>
                <option value="selfie_mismatch">{{ t('admin.kyc.modal.reasonSelfieMismatch') }}</option>
                <option value="fake_document">{{ t('admin.kyc.modal.reasonFakeDocument') }}</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold mb-1 text-text-secondary">{{ t('admin.kyc.modal.notesLabel') }}</label>
              <input v-model="rejectionNotes" :placeholder="t('admin.kyc.modal.notesPlaceholder')" class="w-full p-2 bg-white border border-border rounded-lg text-text-primary" />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button @click="showRejectForm = false" class="px-3 py-1.5 rounded-lg bg-accent text-text-secondary font-semibold hover:bg-accent-hover">{{ t('admin.actions.cancel') }}</button>
            <button @click="handleRejectSubmit" class="px-3 py-1.5 rounded-lg bg-error text-white font-semibold hover:bg-error/90">{{ t('admin.kyc.modal.confirmReject') }}</button>
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

        <div class="flex items-center gap-2">
          <button
            v-if="application.status === 'pending'"
            @click="showRejectForm = true"
            type="button"
            class="px-4 py-2 rounded-lg font-semibold bg-error/10 text-error hover:bg-error/20 border border-error/30"
          >
            {{ t('admin.actions.reject') }}
          </button>

          <button
            v-if="application.status === 'pending'"
            @click="handleApprove"
            type="button"
            class="px-5 py-2 rounded-xl font-bold text-white bg-success hover:bg-success/90 shadow-md shadow-success/30 flex items-center gap-2"
          >
            <UserCheck class="w-4 h-4" />
            <span>{{ t('admin.kyc.modal.confirmApprove') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
