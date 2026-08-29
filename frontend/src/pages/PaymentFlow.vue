<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CreditCard, Banknote, CheckCircle, Shield,
  Clock, AlertCircle, Loader2, ArrowRight,
  ChevronRight, Lock, Smartphone, QrCode
} from 'lucide-vue-next'
import LiquidButton from '@/components/ui/LiquidButton.vue'
import LiquidInput from '@/components/ui/LiquidInput.vue'
import { useI18n } from '@/composables/useI18n'
import { useCurrencyFormatter, useDateFormatter } from '@/composables/useFormatters'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { formatMinorUnits } = useCurrencyFormatter('KGS')
const { formatDateTime } = useDateFormatter()

const paymentType = ref(route.query.type || 'add-funds')
const auctionId = ref(route.query.auctionId || '')
const currentStep = ref(1)
const totalSteps = 4

const paymentMethods = [
  { id: 'card', label: 'paymentFlow.methodCard', icon: CreditCard, desc: 'paymentFlow.methodCardDesc', recommended: true },
  { id: 'bank', label: 'paymentFlow.methodBank', icon: Banknote, desc: 'paymentFlow.methodBankDesc', recommended: false },
  { id: 'qr', label: 'paymentFlow.methodQr', icon: QrCode, desc: 'paymentFlow.methodQrDesc', recommended: false },
  { id: 'wallet', label: 'paymentFlow.methodWallet', icon: Smartphone, desc: 'paymentFlow.methodWalletDesc', recommended: false },
]

const selectedMethod = ref('card')
const cardForm = ref({
  number: '',
  expiry: '',
  cvc: '',
  name: '',
})
const bankForm = ref({
  bank: '',
  iban: '',
  name: '',
})
const amount = ref(route.query.amount || '1000')
const saveCard = ref(false)

const steps = [
  { id: 1, icon: CreditCard },
  { id: 2, icon: Shield },
  { id: 3, icon: CheckCircle },
  { id: 4, icon: Lock },
]

function formatPrice(price: number): string {
  return formatMinorUnits(Math.round(price * 100))
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '')
  const groups = digits.match(/.{1,4}/g) || []
  return groups.join(' ')
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length >= 2) {
    return digits.slice(0, 2) + '/' + digits.slice(2, 4)
  }
  return digits
}

function nextStep() {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

function goToStep(step: number) {
  if (step <= currentStep.value || step === currentStep.value + 1) {
    currentStep.value = step
  }
}

function selectMethod(methodId: string) {
  selectedMethod.value = methodId
  nextStep()
}

function processPayment() {
  currentStep.value = 3
  // Simulate processing
  setTimeout(() => {
    currentStep.value = 4
  }, 2000)
}

function goToDashboard() {
  router.push({ name: 'Dashboard' })
}

function goToAuctions() {
  router.push({ name: 'LiveAuctions' })
}
</script>

<template>
  <div class="min-h-screen bg-[rgb(var(--color-background))]">
    <!-- Progress Header -->
    <header class="bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))/0.3] sticky top-20 z-40">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Step Indicator -->
        <div class="relative">
          <div class="absolute top-1/2 left-0 right-0 h-1 bg-[rgb(var(--color-border))] -translate-y-1/2" />
          <div
class="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))]"
               :style="{ width: ((currentStep - 1) / (totalSteps - 1)) * 100 + '%' }" />
          
          <div class="flex items-center justify-between relative z-10">
            <div v-for="step in steps" :key="step.id" class="flex flex-col items-center">
              <div
class="relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
                   :class="
                     step.id < currentStep ? 'bg-green-500 text-white' :
                     step.id === currentStep ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--color-text-primary))] shadow-[0_0_0_4px_rgb(var(--color-primary))/0.3]' :
                     'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-text-muted))]'
                   ">
                <component :is="step.icon" v-if="step.id < currentStep" class="w-6 h-6" />
                <span v-else class="font-bold text-lg">{{ step.id }}</span>
              </div>
              <p
class="text-xs text-center mt-2 font-medium"
                 :class="step.id <= currentStep ? 'text-[rgb(var(--color-text-primary))]' : 'text-[rgb(var(--color-text-muted))]'">
                {{ t(`paymentFlow.step${step.id}`) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Step 1: Payment Method Selection -->
      <div v-if="currentStep === 1" class="animate-slide-up">
        <div class="text-center mb-10">
          <h1 class="text-3xl font-extrabold text-[rgb(var(--color-text-primary))] mb-3">
            {{ paymentType === 'buy-now' ? t('paymentFlow.buyNowTitle') : t('paymentFlow.addFundsTitle') }}
          </h1>
          <p class="text-[rgb(var(--color-text-secondary))]">
            {{ paymentType === 'buy-now' ? t('paymentFlow.buyNowDesc', { amount: formatPrice(parseInt(amount)) }) : t('paymentFlow.addFundsDesc') }}
          </p>
        </div>

        <!-- Amount Display (for buy-now) -->
        <div v-if="paymentType === 'buy-now'" class="card-liquid-glow mb-8 text-center p-8">
          <p class="text-sm text-[rgb(var(--color-text-muted))] mb-2">{{ t('paymentFlow.amountToPay') }}</p>
          <p class="text-4xl lg:text-5xl font-extrabold text-[rgb(var(--color-text-primary))]">{{ formatPrice(parseInt(amount)) }}</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            v-for="method in paymentMethods"
            :key="method.id"
            :class="[
              'card-liquid-glow p-6 text-left h-full flex flex-col',
              selectedMethod === method.id
                ? 'border-2 border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))/0.05]'
                : ''
            ]"
            @click="selectMethod(method.id)"
          >
            <div class="flex items-center gap-4 mb-4">
              <div
class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                   :class="selectedMethod === method.id ? 'bg-[rgb(var(--color-primary))] text-white' : 'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-text-secondary))]'">
                <component :is="method.icon" class="w-7 h-7" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-[rgb(var(--color-text-primary))]">{{ t(method.label) }}</h3>
                  <span v-if="method.recommended" class="badge-primary text-xs">
                    {{ t('paymentFlow.recommended') }}
                  </span>
                </div>
                <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ t(method.desc) }}</p>
              </div>
            </div>
            <div class="mt-auto">
              <LiquidButton
                variant="primary"
                class="w-full"
                :disabled="currentStep > 1"
              >
                {{ t('paymentFlow.select') }}
              </LiquidButton>
            </div>
          </button>
        </div>
      </div>

      <!-- Step 2: Payment Details -->
      <div v-else-if="currentStep === 2" class="animate-slide-up">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-[rgb(var(--color-text-primary))] mb-2">
            {{ t('paymentFlow.step2Title') }}
          </h1>
          <p class="text-[rgb(var(--color-text-secondary))]">{{ t('paymentFlow.step2Desc') }}</p>
        </div>

        <div class="card-liquid p-6">
          <!-- Card Payment Form -->
          <div v-if="selectedMethod === 'card'" class="space-y-6">
            <LiquidInput
              v-model="cardForm.name"
              :label="t('paymentFlow.cardholderName')"
              :placeholder="t('paymentFlow.cardholderPlaceholder')"
              glass
            />
            <LiquidInput
              v-model="cardForm.number"
              :label="t('paymentFlow.cardNumber')"
              :placeholder="t('paymentFlow.cardNumberPlaceholder')"
              :max-length="19"
              glass
              @input="cardForm.number = formatCardNumber($event.target.value)"
            />
            <div class="grid grid-cols-2 gap-4">
              <LiquidInput
                v-model="cardForm.expiry"
                :label="t('paymentFlow.expiryDate')"
                placeholder="MM/YY"
                :max-length="5"
                glass
                @input="cardForm.expiry = formatExpiry($event.target.value)"
              />
              <LiquidInput
                v-model="cardForm.cvc"
                :label="t('paymentFlow.cvc')"
                placeholder="CVC"
                type="password"
                :max-length="4"
                glass
              />
            </div>
            <label class="flex items-center gap-3 cursor-pointer">
              <input v-model="saveCard" type="checkbox" class="w-5 h-5 rounded border-[rgb(var(--color-border))] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))]" />
              <span class="text-sm text-[rgb(var(--color-text-secondary))]">{{ t('paymentFlow.saveCard') }}</span>
            </label>
          </div>

          <!-- Bank Transfer Form -->
          <div v-else-if="selectedMethod === 'bank'" class="space-y-6">
            <div class="glass rounded-xl p-4 mb-4">
              <p class="text-sm text-[rgb(var(--color-text-secondary))]">{{ t('paymentFlow.bankTransferInfo') }}</p>
              <div class="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div class="p-3 bg-[rgb(var(--color-background))] rounded-lg">
                  <p class="text-[rgb(var(--color-text-muted))]">{{ t('paymentFlow.accountNumber') }}</p>
                  <p class="font-mono font-medium text-[rgb(var(--color-text-primary))]">1180 0000 1234 5678</p>
                </div>
                <div class="p-3 bg-[rgb(var(--color-background))] rounded-lg">
                  <p class="text-[rgb(var(--color-text-muted))]">{{ t('paymentFlow.accountHolder') }}</p>
                  <p class="font-medium text-[rgb(var(--color-text-primary))]">iTorgo ЖЧК</p>
                </div>
              </div>
            </div>
            <LiquidInput
              v-model="bankForm.name"
              :label="t('paymentFlow.senderName')"
              :placeholder="t('paymentFlow.senderNamePlaceholder')"
              glass
            />
            <LiquidInput
              v-model="bankForm.iban"
              :label="t('paymentFlow.yourAccountNumber')"
              placeholder="1180 XXXX XXXX XXXX"
              glass
            />
            <LiquidInput
              v-model="bankForm.bank"
              :label="t('paymentFlow.bankName')"
              :placeholder="t('paymentFlow.bankNamePlaceholder')"
              glass
            />
          </div>

          <!-- Other Methods Placeholder -->
          <div v-else class="card-liquid text-center py-12">
            <component :is="paymentMethods.find(m => m.id === selectedMethod)?.icon" class="w-16 h-16 mx-auto text-[rgb(var(--color-text-muted))] mb-4" />
            <h3 class="text-xl font-semibold text-[rgb(var(--color-text-primary))] mb-2">{{ t('paymentFlow.redirecting') }}</h3>
            <p class="text-[rgb(var(--color-text-muted))] mb-6">{{ t('paymentFlow.redirectDesc') }}</p>
            <LiquidButton variant="primary" icon="ArrowRight" @click="nextStep">
              {{ t('paymentFlow.continue') }}
            </LiquidButton>
          </div>

          <!-- Navigation -->
          <div class="flex justify-between mt-8 pt-6 border-t border-[rgb(var(--color-border))/0.3]">
            <LiquidButton variant="ghost" icon="ChevronRight" class="rotate-180" @click="prevStep">
              {{ t('paymentFlow.back') }}
            </LiquidButton>
            <LiquidButton variant="primary" icon="ArrowRight" @click="nextStep">
              {{ t('paymentFlow.continue') }}
            </LiquidButton>
          </div>
        </div>
      </div>

      <!-- Step 3: Confirmation -->
      <div v-else-if="currentStep === 3" class="animate-slide-up">
        <div class="text-center mb-8">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] flex items-center justify-center mx-auto mb-4 animate-bounce-in">
            <Loader2 class="w-10 h-10 text-white animate-spin" />
          </div>
          <h1 class="text-2xl font-bold text-[rgb(var(--color-text-primary))] mb-2">{{ t('paymentFlow.processing') }}</h1>
          <p class="text-[rgb(var(--color-text-secondary))]">{{ t('paymentFlow.processingDesc') }}</p>
        </div>

        <div class="card-liquid p-6 space-y-4">
          <div class="flex items-center justify-between p-4 glass rounded-xl">
            <div class="flex items-center gap-3">
              <component :is="paymentMethods.find(m => m.id === selectedMethod)?.icon" class="w-6 h-6 text-[rgb(var(--color-secondary))]" />
              <div>
                <p class="font-medium text-[rgb(var(--color-text-primary))]">{{ t(paymentMethods.find(m => m.id === selectedMethod)?.label || '') }}</p>
                <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ t('paymentFlow.securePayment') }}</p>
              </div>
            </div>
            <Lock class="w-6 h-6 text-green-500" />
          </div>

          <div class="flex items-center justify-between p-4 glass rounded-xl">
            <div>
              <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ t('paymentFlow.amount') }}</p>
              <p class="font-bold text-[rgb(var(--color-text-primary))]">{{ formatPrice(parseInt(amount)) }}</p>
            </div>
            <Shield class="w-6 h-6 text-[rgb(var(--color-secondary))]" />
          </div>
        </div>
      </div>

      <!-- Step 4: Success -->
      <div v-else-if="currentStep === 4" class="animate-slide-up">
        <div class="text-center mb-10">
          <div class="w-24 h-24 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <CheckCircle class="w-12 h-12 text-green-500" />
          </div>
          <h1 class="text-3xl font-extrabold text-[rgb(var(--color-text-primary))] mb-3">{{ t('paymentFlow.success') }}</h1>
          <p class="text-[rgb(var(--color-text-secondary))] mb-6">{{ t('paymentFlow.successDesc') }}</p>
          
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full glass">
            <Lock class="w-5 h-5 text-green-500" />
            <span class="text-sm font-medium text-green-600">{{ t('paymentFlow.transactionSecured') }}</span>
          </div>
        </div>

        <div class="card-liquid p-6 space-y-4 mb-8">
          <div class="flex items-center justify-between p-4 glass rounded-xl">
            <div>
              <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ t('paymentFlow.transactionId') }}</p>
              <p class="font-mono font-medium text-[rgb(var(--color-text-primary))]">TXN-{{ Date.now().toString(36).toUpperCase() }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ t('paymentFlow.amount') }}</p>
              <p class="text-xl font-bold text-[rgb(var(--color-primary))]">{{ formatPrice(parseInt(amount)) }}</p>
            </div>
          </div>
          
          <div class="flex items-center justify-between p-4 glass rounded-xl">
            <div>
              <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ t('paymentFlow.method') }}</p>
              <p class="font-medium text-[rgb(var(--color-text-primary))]">{{ t(paymentMethods.find(m => m.id === selectedMethod)?.label || '') }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ t('paymentFlow.status') }}</p>
              <span class="badge-success">{{ t('paymentFlow.completed') }}</span>
            </div>
          </div>

          <div class="flex items-center justify-between p-4 glass rounded-xl">
            <div>
              <p class="text-sm text-[rgb(var(--color-text-muted))]">{{ t('paymentFlow.date') }}</p>
              <p class="font-medium text-[rgb(var(--color-text-primary))]">{{ formatDateTime(new Date()) }}</p>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-4">
          <LiquidButton
            v-if="paymentType === 'buy-now'"
            variant="primary"
            class="flex-1"
            icon="ArrowRight"
            @click="goToAuctions"
          >
            {{ t('paymentFlow.viewAuctions') }}
          </LiquidButton>
          <LiquidButton
            variant="primary"
            class="flex-1"
            icon="ArrowRight"
            @click="goToDashboard"
          >
            {{ t('paymentFlow.goToProfile') }}
          </LiquidButton>
          <LiquidButton
            v-if="paymentType === 'add-funds'"
            variant="outline"
            class="flex-1"
            icon="Plus"
            @click="currentStep = 1"
          >
            {{ t('paymentFlow.addMoreFunds') }}
          </LiquidButton>
        </div>
      </div>
    </main>
  </div>
</template>