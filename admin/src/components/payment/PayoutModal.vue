<script setup lang="ts">
import { ref, computed } from 'vue'
import { AlertCircle, CheckCircle } from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'
import { useI18n } from '@/composables/useI18n'
import type { PayoutStatus } from '@/types'
import Button from '@/components/ui/Button.vue'
import Modal from '@/components/ui/Modal.vue'
import Input from '@/components/ui/Input.vue'
import Stepper from '@/components/ui/Stepper.vue'

defineOptions({ name: 'PayoutModal' })

const props = defineProps<{
  modelValue: boolean
  amount?: { amount: string; minorUnits: number; currency: string; formatted: string } | null
  auctionId?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: [payoutId: string]
  cancel: []
}>()

const uiStore = useUIStore()
const { t } = useI18n()

const payoutSteps = computed(() => [
  { id: 'select_bank', label: t('payoutModal.selectBank'), description: t('payoutModal.selectBankDesc') },
  { id: 'verify_inn', label: t('payoutModal.innStep') },
  { id: 'enter_account', label: t('payoutModal.accountStep') },
  { id: 'aml_check', label: t('payoutModal.amlStep') },
  { id: 'confirm', label: t('payoutModal.confirmStep') },
])

const currentStep = ref(0)
const selectedBank = ref<'mbank' | 'optima' | 'demirbank' | null>(null)
const inn = ref('')
const accountNumber = ref('')
const accountHolderName = ref('')
const innVerified = ref(false)
const innVerificationError = ref<string | null>(null)
const isProcessing = ref(false)
const payoutError = ref<string | null>(null)
const amlAcknowledged = ref(false)
const agreeTerms = ref(false)

const payoutAmount = computed(() => props.amount?.minorUnits || 0)

const isHighAmount = computed(() => payoutAmount.value >= 10_000_000)
const isAmlRequired = computed(() => payoutAmount.value >= 3_000_000)

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0: return !!selectedBank.value
    case 1: return inn.value.length === 14 && innVerified.value
    case 2: return accountNumber.value.length >= 10 && !!accountHolderName.value.trim()
    case 3: return amlAcknowledged.value
    case 4: return agreeTerms.value
    default: return true
  }
})

const banks = [
  { id: 'mbank', name: 'MBank', logo: 'MB', color: '#0052CC', features: ['P2P Instant', 'Mobile App', '24/7'] },
  { id: 'optima', name: 'Optima Bank', logo: 'OB', color: '#E60012', features: ['Visa / MC', 'IBAN', '3D Secure'] },
  { id: 'demirbank', name: 'DemirBank', logo: 'DB', color: '#00A651', features: ['Escrow IBAN', 'E-Commerce', 'Direct'] },
]

function closeModal() {
  if (isProcessing.value) return
  emit('update:modelValue', false)
  emit('cancel')
}

function nextStep() {
  if (!canProceed.value) {
    uiStore.toastError(t('common.error'), t('toasts.errorOccurred'))
    return
  }
  if (currentStep.value < 4) currentStep.value++
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

async function verifyInn() {
  if (!inn.value || inn.value.length !== 14) {
    innVerificationError.value = t('payoutModal.innPlaceholder')
    return
  }
  innVerified.value = true
  innVerificationError.value = null
  uiStore.toastSuccess(t('payoutModal.innVerified'), t('toasts.verified'))
}

async function submitPayout() {
  if (!agreeTerms.value) {
    uiStore.toastError(t('common.error'), t('payoutModal.amlAgree'))
    return
  }
  isProcessing.value = true
  payoutError.value = null
  try {
    const payoutId = 'PYT-' + Date.now().toString().slice(-8)
    uiStore.toastSuccess(t('toasts.payoutRequested'), `ID: ${payoutId}`)
    emit('success', payoutId)
    emit('update:modelValue', false)
  } catch (err: unknown) {
    payoutError.value = err instanceof Error ? err.message : t('toasts.errorOccurred')
    uiStore.toastError(t('common.error'), payoutError.value)
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    size="xl"
    :title="t('payoutModal.title')"
    :description="t('paymentModal.amount') + ' ' + (props.amount?.formatted || '185 000 ' + t('common.currency'))"
    hide-footer
    :close-on-escape="!isProcessing"
    :close-on-overlay-click="!isProcessing"
    @cancel="closeModal"
  >
    <Stepper
      :model-value="currentStep"
      :steps="payoutSteps"
      variant="vertical"
      class="mb-8"
    />

    <div class="space-y-6">
      <!-- Step 1: Bank Selection -->
      <div v-if="currentStep === 0" class="space-y-4">
        <h3 class="text-base font-bold text-text-primary">{{ t('payoutModal.selectBank') }}</h3>
        <p class="text-text-muted">{{ t('payoutModal.selectBank') }}</p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            v-for="bank in banks"
            :key="bank.id"
            class="p-4 rounded-2xl border text-left transition-all"
            :class="selectedBank === bank.id
              ? 'border-primary/60 bg-primary/10 ring-1 ring-primary/40'
              : 'border-border bg-white hover:border-primary/40'"
            @click="selectedBank = bank.id as 'mbank'"
          >
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white mb-3"
              :style="{ backgroundColor: bank.color }"
            >
              {{ bank.logo }}
            </div>
            <p class="font-semibold text-text-primary mb-1">{{ bank.name }}</p>
            <p class="text-xs text-text-muted">{{ bank.features.join(' · ') }}</p>
          </button>
        </div>
      </div>

      <!-- Step 2: INN -->
      <div v-if="currentStep === 1" class="space-y-4">
        <h3 class="text-base font-bold text-text-primary">{{ t('payoutModal.innStep') }}</h3>
        <p class="text-text-muted">{{ t('payoutModal.innPlaceholder') }}</p>

        <Input
          v-model="inn"
          :label="t('payoutModal.innStep') + ' (14)'"
          placeholder="12345678901234"
          :max-length="14"
          :error="innVerificationError"
        />

        <div class="flex gap-3">
          <Button variant="primary" :disabled="!inn || inn.length !== 14" @click="verifyInn">
            {{ t('payoutModal.verifyInn') }}
          </Button>
        </div>

        <div v-if="innVerificationError" class="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm">
          {{ innVerificationError }}
        </div>

        <div v-if="innVerified" class="p-4 rounded-xl bg-success/10 border border-success/30 text-success flex items-center gap-2">
          <CheckCircle class="w-5 h-5 text-success" />
          <span class="font-medium">{{ t('payoutModal.innVerified') }}</span>
        </div>
      </div>

      <!-- Step 3: Account -->
      <div v-if="currentStep === 2" class="space-y-4">
        <h3 class="text-base font-bold text-text-primary">{{ t('payoutModal.accountStep') }}</h3>
        <p class="text-text-muted">{{ t('payoutModal.accountNumber') }}</p>

        <Input
          v-model="accountHolderName"
          :label="t('payoutModal.accountHolder')"
          placeholder="Azamat Bakirov"
        />

        <Input
          v-model="accountNumber"
          :label="t('payoutModal.accountNumber')"
          placeholder="KG12 ABCD 1234 5678 9012 3456"
        />
      </div>

      <!-- Step 4: AML -->
      <div v-if="currentStep === 3" class="space-y-4">
        <h3 class="text-base font-bold text-text-primary">{{ t('payoutModal.amlStep') }}</h3>
        <div
          class="glass rounded-xl p-6 border-l-4"
          :class="isHighAmount ? 'border-error' : 'border-warning'"
        >
          <div class="flex items-start gap-4">
            <AlertCircle class="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h4 class="font-semibold text-text-primary mb-2">{{ t('payoutModal.amlNoticeTitle') }}</h4>
              <p class="text-text-secondary mb-4">
                {{ t('payoutModal.amlNotice') }}
              </p>
              <div class="bg-white/70 rounded-xl p-4">
                <p class="text-sm text-text-muted">
                  {{ t('paymentModal.amount') }}
                  <span class="font-semibold text-text-primary">{{ props.amount?.formatted }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <label class="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/30 cursor-pointer">
          <input v-model="amlAcknowledged" type="checkbox" class="w-4 h-4 rounded border-border bg-white text-primary focus:ring-primary/30" />
          <span class="text-sm text-text-secondary">{{ t('payoutModal.amlAgree') }}</span>
        </label>
      </div>

      <!-- Step 5: Confirm -->
      <div v-if="currentStep === 4" class="space-y-6">
        <h3 class="text-base font-bold text-text-primary">{{ t('payoutModal.confirmStep') }}</h3>
        <p class="text-text-muted">{{ t('payoutModal.confirmPayout') }}</p>

        <div class="glass rounded-2xl p-6 space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">{{ t('paymentModal.amount') }}</span>
            <span class="font-semibold text-text-primary">{{ props.amount?.formatted }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">{{ t('payoutModal.selectBank') }}</span>
            <span class="font-semibold text-text-primary">{{ selectedBank ? banks.find(b => b.id === selectedBank)?.name : '—' }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">{{ t('payoutModal.inn') }}</span>
            <span class="font-semibold text-text-primary">{{ inn || '—' }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">{{ t('payoutModal.accountHolder') }}</span>
            <span class="font-semibold text-text-primary">{{ accountHolderName || '—' }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">{{ t('payoutModal.accountNumber') }}</span>
            <span class="font-semibold text-text-primary">{{ accountNumber || '—' }}</span>
          </div>
        </div>

        <label class="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/30 cursor-pointer">
          <input v-model="agreeTerms" type="checkbox" class="w-4 h-4 rounded border-border bg-white text-primary focus:ring-primary/30" />
          <span class="text-sm text-text-secondary">{{ t('payoutModal.amlAgree') }}</span>
        </label>
      </div>

      <p v-if="payoutError" class="text-sm text-error">
        {{ payoutError }}
      </p>

      <div class="flex gap-3 pt-2">
        <Button v-if="currentStep > 0 && currentStep < 4" variant="outline" class="flex-1" @click="prevStep">
          {{ t('common.back') }}
        </Button>
        <Button v-if="currentStep < 4" variant="primary" class="flex-1" :disabled="!canProceed" @click="nextStep">
          {{ t('common.next') }}
        </Button>
        <Button v-else variant="primary" class="flex-1" :disabled="!canProceed || isProcessing" @click="submitPayout">
          {{ isProcessing ? t('payoutModal.processing') : t('payoutModal.confirmPayout') }}
        </Button>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
  opacity: 0;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>