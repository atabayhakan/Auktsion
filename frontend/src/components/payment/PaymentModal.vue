<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  CreditCard, Smartphone, QrCode, Building2, 
  CheckCircle, XCircle, AlertCircle, ArrowRight, 
  Clock, ShieldCheck, Copy, Check, RefreshCw, Lock,
  MessageCircle, Send, PhoneCall
} from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'
import { useFeatureStore } from '@/stores/feature'
import { useI18n } from '@/composables/useI18n'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'

const uiStore = useUIStore()
const featureStore = useFeatureStore()
const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
  amount?: { amount: string; minorUnits: number; currency: string; formatted: string } | number
  auctionId?: string
  auctionTitle?: string
  orderId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: [txnId: string]
  'payment-success': [txnId: string]
  cancel: []
}>()

type GatewayType = string

const selectedGateway = ref<GatewayType>('')
const paymentStep = ref<'select' | 'qr_scan' | '3ds' | 'success' | 'failed'>('select')
const isProcessing = ref(false)
const countdownSeconds = ref(15 * 60)
const copied = ref(false)
const transactionId = ref('TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase())

const formattedAmount = computed(() => {
  if (typeof props.amount === 'object' && props.amount?.formatted) {
    return props.amount.formatted
  }
  if (typeof props.amount === 'number') {
    return `${props.amount.toLocaleString()} ${t('common.currency')}`
  }
  return `185 000 ${t('common.currency')}`
})

const gateways = computed(() => {
  return featureStore.activeBanks.map(b => ({
    id: b.id as GatewayType,
    name: b.name,
    subtitle: b.shortName,
    color: b.color || '#10B981',
    badge: b.badge || 'Активен',
    desc: b.desc,
    instant: b.type === 'qr' || b.type === 'wallet',
    instructions: b.instructions
  }))
})

function handleSelectGateway(gateway: GatewayType) {
  selectedGateway.value = gateway
}

function proceedToPayment() {
  isProcessing.value = true
  setTimeout(() => {
    isProcessing.value = false
    if (selectedGateway.value === 'mbank') {
      paymentStep.value = 'qr_scan'
      startCountdown()
    } else if (selectedGateway.value === 'optima' || selectedGateway.value === 'card') {
      paymentStep.value = '3ds'
    } else {
      // DemirBank
      paymentStep.value = 'qr_scan'
      startCountdown()
    }
  }, 600)
}

function startCountdown() {
  countdownSeconds.value = 15 * 60
  const interval = setInterval(() => {
    countdownSeconds.value--
    if (countdownSeconds.value <= 0) {
      clearInterval(interval)
      paymentStep.value = 'failed'
    }
  }, 1000)
  ;(window as any).__paymentInterval = interval
}

function simulateSimulatedApproval() {
  isProcessing.value = true
  setTimeout(() => {
    isProcessing.value = false
    paymentStep.value = 'success'
    emit('success', transactionId.value)
    emit('payment-success', transactionId.value)
    uiStore.toastSuccess(t('toasts.paymentCompleted'), t('paymentModal.successDescription'))
  }, 1200)
}

watch(gateways, (newVal) => {
  if (newVal.length > 0 && (!selectedGateway.value || !newVal.some(g => g.id === selectedGateway.value))) {
    selectedGateway.value = newVal[0].id
  }
}, { immediate: true })

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

function closeModal() {
  clearInterval((window as any).__paymentInterval)
  paymentStep.value = 'select'
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (val) => {
  if (!val) {
    clearInterval((window as any).__paymentInterval)
    paymentStep.value = 'select'
    isProcessing.value = false
  }
})
</script>

<template>
  <Modal 
    :model-value="modelValue" 
    size="lg" 
    :title="paymentStep === 'success' ? t('paymentModal.successTitle') : t('paymentModal.title')"
    :description="paymentStep === 'success' ? t('paymentModal.successDescription') : (gateways.length > 0 ? t('paymentModal.selectGateway') : (featureStore.banksConfig?.defaultNotice || t('paymentModal.title')))"
    :hide-footer="true"
    @update:model-value="emit('update:modelValue', $event)"
    @close="closeModal"
    @cancel="closeModal"
  >
    <div class="space-y-6">
      
      <!-- STEP 1: Select Payment Method -->
      <div v-if="paymentStep === 'select'" class="space-y-5">

        <!-- Summary Amount Card -->
        <div class="glass p-4 sm:p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span class="text-xs text-text-muted block">{{ t('paymentModal.amount') }}</span>
            <span class="text-xl sm:text-2xl font-bold text-primary">
              {{ formattedAmount }}
            </span>
          </div>
          <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-success/15 text-success border border-success/30 flex items-center gap-1">
            <ShieldCheck class="w-3.5 h-3.5" />
            {{ t('paymentModal.escrowSecured') }}
          </span>
        </div>

        <!-- Bank Gateways Grid (when banks are active) -->
        <div v-if="gateways.length > 0" class="space-y-3">
          <label class="block text-xs font-bold text-text-secondary">{{ t('paymentModal.selectGateway') }}</label>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="gw in gateways"
              :key="gw.id"
              class="p-4 rounded-2xl border transition-all cursor-pointer space-y-2"
              :class="selectedGateway === gw.id
                ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20'
                : 'border-border hover:border-black/20 bg-white'"
              @click="handleSelectGateway(gw.id)"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm text-white" :style="{ backgroundColor: gw.color }">
                    {{ gw.name.charAt(0) }}
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-text-primary">{{ gw.name }}</h4>
                    <p class="text-[11px] text-text-muted">{{ gw.subtitle }}</p>
                  </div>
                </div>

                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-black/5 text-text-secondary">
                  {{ gw.badge }}
                </span>
              </div>

              <p class="text-[11px] text-text-secondary leading-normal">{{ gw.desc }}</p>
            </div>
          </div>

          <!-- Action Button -->
          <div class="pt-2">
            <Button
              size="lg"
              class="w-full font-bold"
              :disabled="!selectedGateway"
              :loading="isProcessing"
              @click="proceedToPayment"
            >
              <span>{{ t('paymentModal.proceed') }}</span>
              <ArrowRight class="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>

        <!-- Inactive Banks Notice Card (when 0 banks active) -->
        <div v-else class="p-6 rounded-2xl border border-amber-200/60 bg-gradient-to-b from-amber-50/70 to-amber-50/20 text-center space-y-4">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
            <Building2 class="w-6 h-6" />
          </div>
          <div class="space-y-1.5">
            <h4 class="text-base font-bold text-text-primary">
              {{ featureStore.banksConfig?.defaultNotice || t('paymentModal.gatewaysUnderMaintenanceTitle') }}
            </h4>
            <p class="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
              {{ t('paymentModal.gatewaysUnderMaintenanceDesc') }}
            </p>
          </div>

          <div class="pt-2 border-t border-amber-100/80 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <a 
              href="https://wa.me/996555123456?text=Здравствуйте,%20хочу%20уточнить%20статус%20оплаты%20по%20сделке%20iTorgo" 
              target="_blank" 
              rel="noopener noreferrer"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:brightness-95 transition-all shadow-xs"
            >
              <MessageCircle class="w-4 h-4" />
              <span>WhatsApp Эскроу</span>
            </a>
            <a 
              href="https://t.me/itorgo_support" 
              target="_blank" 
              rel="noopener noreferrer"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#229ED9] text-white text-xs font-bold hover:brightness-95 transition-all shadow-xs"
            >
              <Send class="w-4 h-4" />
              <span>Telegram Поддержка</span>
            </a>
          </div>

          <div class="pt-1">
            <Button variant="ghost" size="sm" class="text-xs text-text-muted" @click="closeModal">
              {{ t('common.close') }}
            </Button>
          </div>
        </div>
      </div>

      <!-- STEP 2: MBank QR Scan -->
      <div v-else-if="paymentStep === 'qr_scan'" class="text-center space-y-6 py-2">
        <div class="space-y-1">
          <span class="text-xs font-bold text-success uppercase tracking-wider">MBank QR</span>
          <h3 class="text-xl font-bold text-text-primary">{{ t('paymentModal.scanQr') }}</h3>
          <p class="text-xs text-text-muted">{{ t('paymentModal.scanQrDesc') }}</p>
        </div>

        <!-- QR Box -->
        <div class="inline-block p-4 rounded-3xl bg-white shadow-md relative border border-border">
          <svg class="w-48 h-48 mx-auto text-text-primary" viewBox="0 0 100 100" fill="currentColor">
            <path d="M0 0h30v30H0zm5 5h20v20H5zM10 10h10v10H10zM70 0h30v30H70zm5 5h20v20H75zM80 10h10v10H80zM0 70h30v30H0zm5 5h20v20H5zM10 80h10v10H10zM35 10h10v10H35zM50 10h10v10H50zM35 25h10v10H35zM20 35h10v10H20zM35 35h30v10H35zM70 35h10v10H70zM10 50h15v10H10zM35 50h10v20H35zM50 50h20v10H50zM75 50h25v10H75zM10 65h10v10H10zM50 65h10v10H50zM65 65h20v10H65zM35 75h10v25H35zM50 80h15v20H50zM70 75h10v10H70zM85 75h15v25H85z" />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="w-10 h-10 rounded-xl bg-[#00C389] text-white flex items-center justify-center font-black text-sm shadow-md">
              M
            </div>
          </div>
        </div>

        <!-- Timer & Invoice Code -->
        <div class="space-y-3 max-w-sm mx-auto">
          <div class="flex items-center justify-between text-xs text-text-muted bg-black/[0.03] px-4 py-2 rounded-xl border border-black/5">
            <span class="flex items-center gap-1.5 text-primary font-mono">
              <Clock class="w-3.5 h-3.5" />
              {{ Math.floor(countdownSeconds / 60) }}:{{ (countdownSeconds % 60).toString().padStart(2, '0') }}
            </span>
            <span>{{ t('paymentModal.invoiceNumber') }} <strong class="text-text-primary font-mono">AUK-{{ auctionId || '8924' }}</strong></span>
          </div>

          <div class="pt-2 flex gap-3">
            <Button variant="outline" size="sm" class="flex-1 text-xs" @click="paymentStep = 'select'">
              {{ t('paymentModal.otherMethod') }}
            </Button>
            <Button size="sm" class="flex-1 font-bold text-xs" :loading="isProcessing" @click="simulateSimulatedApproval">
              <span>{{ t('paymentModal.paidConfirm') }}</span>
            </Button>
          </div>
        </div>
      </div>

      <!-- STEP 3: 3D Secure Step -->
      <div v-else-if="paymentStep === '3ds'" class="space-y-6 py-2">
        <div class="glass p-6 rounded-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-black/10 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-error/15 flex items-center justify-center font-black text-error text-sm">
                3DS
              </div>
              <div>
                <h4 class="text-sm font-bold text-text-primary">Optima24 / 3D Secure 2.0</h4>
                <p class="text-xs text-text-muted">{{ t('paymentModal.smsSent') }}</p>
              </div>
            </div>
            <Lock class="w-5 h-5 text-success" />
          </div>

          <div class="space-y-3 text-xs text-text-secondary">
            <div class="flex justify-between">
              <span>{{ t('paymentModal.amount') }}</span>
              <strong class="text-primary text-sm">{{ formattedAmount }}</strong>
            </div>
            <div class="flex justify-between">
              <span>{{ t('paymentModal.card') }}</span>
              <span class="font-mono text-text-primary">•••• 4892</span>
            </div>
          </div>

          <div class="space-y-2 pt-2">
            <label class="text-xs font-semibold text-text-secondary">{{ t('paymentModal.enterCode') }}:</label>
            <input
              type="text"
              maxlength="6"
              placeholder="123456"
              class="w-full text-center text-xl font-mono tracking-widest py-3 rounded-xl bg-white border border-border text-text-primary focus:border-secondary focus:outline-none"
            />
          </div>

          <Button class="w-full font-bold mt-4" :loading="isProcessing" @click="simulateSimulatedApproval">
            {{ t('paymentModal.confirmPayment') }}
          </Button>
        </div>
      </div>

      <!-- STEP 4: Success Receipt -->
      <div v-else-if="paymentStep === 'success'" class="text-center space-y-6 py-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-success/15 border border-success/40 flex items-center justify-center text-success shadow-md">
          <CheckCircle class="w-8 h-8" />
        </div>

        <div class="space-y-1">
          <h3 class="text-2xl font-bold text-text-primary">{{ t('paymentModal.successTitle') }}</h3>
          <p class="text-xs text-text-muted max-w-xs mx-auto">
            {{ t('paymentModal.successDescription') }}
          </p>
        </div>

        <div class="glass p-4 rounded-2xl text-left space-y-2 text-xs max-w-sm mx-auto bg-white">
          <div class="flex justify-between text-text-muted">
            <span>{{ t('paymentModal.transactionId') }}:</span>
            <span class="font-mono text-text-primary font-semibold">{{ transactionId }}</span>
          </div>
          <div class="flex justify-between text-text-muted">
            <span>{{ t('paymentModal.amount') }}</span>
            <span class="font-bold text-primary">{{ formattedAmount }}</span>
          </div>
          <div class="flex justify-between text-text-muted">
            <span>{{ t('paymentModal.status') }}</span>
            <span class="text-success font-bold">{{ t('paymentModal.escrowSecured') }}</span>
          </div>
        </div>

        <Button class="w-full max-w-sm mx-auto font-bold" @click="closeModal">
          {{ t('paymentModal.backToAuction') }}
        </Button>
      </div>

      <!-- STEP 5: Failed -->
      <div v-else-if="paymentStep === 'failed'" class="text-center space-y-6 py-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-error/15 border border-error/40 flex items-center justify-center text-error shadow-md">
          <XCircle class="w-8 h-8" />
        </div>

        <div class="space-y-1">
          <h3 class="text-2xl font-bold text-text-primary">{{ t('common.error') }}</h3>
          <p class="text-xs text-text-muted max-w-xs mx-auto">
            {{ t('paymentModal.failedDesc') }}
          </p>
        </div>

        <div class="flex gap-3 max-w-sm mx-auto">
          <Button variant="outline" class="flex-1 font-bold" @click="paymentStep = 'select'">
            {{ t('paymentModal.otherMethod') }}
          </Button>
          <Button class="flex-1 font-bold" @click="proceedToPayment">
            {{ t('paymentModal.proceed') }}
          </Button>
        </div>
      </div>

    </div>
  </Modal>
</template>