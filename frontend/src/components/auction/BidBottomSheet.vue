<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  X, ShieldCheck, Clock, TrendingUp
} from 'lucide-vue-next'
import type { Auction } from '@/types'
import { useFormatters } from '@/composables/useFormatters'
import { useAuctionStore } from '@/stores/auction'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'
import { useI18n } from '@/composables/useI18n'

interface Props {
  modelValue: boolean
  auction: Auction | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'bidPlaced': [amount: number]
}>()

const router = useRouter()
const { currency } = useFormatters()
const { formatMoney } = currency
const { t } = useI18n()
const auctionStore = useAuctionStore()
const userStore = useUserStore()
const uiStore = useUIStore()

const isSubmitting = ref(false)
const customAmount = ref<number | null>(null)

const currentPriceNum = computed(() => {
  if (!props.auction) return 0
  return Number(props.auction.currentPrice.amount) || 0
})

const incrementStep = computed(() => {
  if (!props.auction) return 500
  const step = Number(props.auction.bidIncrement?.amount) || 500
  return step > 0 ? step : 500
})

const minNextBid = computed(() => {
  return currentPriceNum.value + incrementStep.value
})

const incrementOptions = computed(() => {
  const step = incrementStep.value
  return [
    { label: `+${step.toLocaleString('ru-RU')} с`, val: step },
    { label: `+${(step * 2).toLocaleString('ru-RU')} с`, val: step * 2 },
    { label: `+${(step * 5).toLocaleString('ru-RU')} с`, val: step * 5 },
    { label: `+${(step * 10).toLocaleString('ru-RU')} с`, val: step * 10 },
  ]
})

const selectedAmount = computed(() => {
  if (customAmount.value && customAmount.value >= minNextBid.value) {
    return customAmount.value
  }
  return minNextBid.value
})

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    customAmount.value = minNextBid.value
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

function close() {
  emit('update:modelValue', false)
}

function addIncrement(extra: number) {
  customAmount.value = currentPriceNum.value + extra
}

async function handleConfirmBid() {
  if (!props.auction) return
  if (!userStore.isAuthenticated) {
    close()
    router.push({ path: '/login', query: { redirect: `/auctions/${props.auction.id}` } })
    return
  }

  const bidAmount = selectedAmount.value
  if (bidAmount < minNextBid.value) {
    uiStore.toastError(t('bidSheet.bidErrorTitle') || 'Ошибка ставки', t('bidSheet.bidErrorMin', { min: minNextBid.value.toLocaleString('ru-RU') }) || `Минимальная ставка: ${minNextBid.value.toLocaleString('ru-RU')} сом`)
    return
  }

  isSubmitting.value = true
  try {
    const res = await auctionStore.placeBid(props.auction.id, { amount: String(bidAmount) })
    if (res.success) {
      uiStore.toastSuccess(t('bidSheet.bidSuccessTitle') || 'Ставка принята', t('bidSheet.bidSuccessMsg', { amount: bidAmount.toLocaleString('ru-RU') }) || `Ставка ${bidAmount.toLocaleString('ru-RU')} сом принята! Вы лидируете.`)
      emit('bidPlaced', bidAmount)
      close()
    } else {
      uiStore.toastError(t('bidSheet.bidErrorTitle') || 'Не удалось сделать ставку', res.error || t('common.error'))
    }
  } catch (err: any) {
    uiStore.toastError(t('bidSheet.bidErrorTitle') || 'Ошибка размещения ставки', err?.message || t('common.error'))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue && auction"
        class="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-slide-up"
        >
          <!-- Drag Handle for Mobile -->
          <div class="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2.5 shrink-0" />

          <!-- Header -->
          <div class="p-4 sm:p-5 border-b border-black/[0.06] flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-600 border border-rose-200">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                {{ t('bidSheet.liveBidding') || 'ЖИВЫЕ ТОРГИ' }}
              </span>
              <h3 class="text-base sm:text-lg font-black text-gray-950">
                {{ t('bidSheet.placeBid') || 'Сделать ставку' }}
              </h3>
            </div>
            <button
              type="button"
              class="p-1.5 rounded-full text-gray-400 hover:text-gray-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              @click="close"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="p-4 sm:p-6 space-y-5 overflow-y-auto">
            <!-- Mini Item Preview -->
            <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-black/5">
              <img
                :src="auction.images[0]"
                :alt="auction.title"
                class="w-16 h-16 rounded-xl object-cover shrink-0 border border-black/5"
              />
              <div class="min-w-0 flex-1">
                <h4 class="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1 leading-snug">
                  {{ auction.title }}
                </h4>
                <div class="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span class="font-medium">{{ t('bidSheet.currentPrice') || 'Текущая:' }} <b class="text-gray-900">{{ formatMoney(auction.currentPrice) }}</b></span>
                  <span class="font-medium text-amber-700">{{ auction.bidCount }} {{ t('bidSheet.bids') || 'ставок' }}</span>
                </div>
              </div>
            </div>

            <!-- Price Setting Display -->
            <div class="bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.04] border border-amber-500/20 rounded-2xl p-4 text-center space-y-2">
              <div class="text-xs font-bold text-amber-900 uppercase tracking-wider">
                {{ t('bidSheet.yourBid') || 'Ваша ставка' }}
              </div>
              <div class="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight font-mono">
                {{ selectedAmount.toLocaleString('ru-RU') }} <span class="text-2xl text-amber-600">{{ t('common.currency') || 'сом' }}</span>
              </div>
              <div class="text-[11px] text-gray-500">
                {{ t('bidSheet.minStep', { step: incrementStep.toLocaleString('ru-RU'), min: minNextBid.toLocaleString('ru-RU') }) || `Минимальный шаг: +${incrementStep.toLocaleString('ru-RU')} сом (следующая мин. ${minNextBid.toLocaleString('ru-RU')} с)` }}
              </div>
            </div>

            <!-- Quick Increment Buttons -->
            <div>
              <div class="text-xs font-bold text-gray-600 mb-2">
                {{ t('bidSheet.quickOptions') || 'Быстрые варианты:' }}
              </div>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="opt in incrementOptions"
                  :key="opt.label"
                  type="button"
                  class="py-2.5 px-1 rounded-xl text-xs font-black transition-all border cursor-pointer text-center"
                  :class="selectedAmount === (currentPriceNum + opt.val)
                    ? 'bg-amber-400 border-amber-500 text-gray-950 shadow-xs'
                    : 'bg-white border-black/10 text-gray-800 hover:bg-slate-50'"
                  @click="addIncrement(opt.val)"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- Custom Amount Input -->
            <div>
              <label class="block text-xs font-bold text-gray-600 mb-1.5">
                {{ t('bidSheet.orEnterMaxBid') || 'Или введите свою максимальную ставку:' }}
              </label>
              <div class="relative flex items-center">
                <input
                  v-model.number="customAmount"
                  type="number"
                  :min="minNextBid"
                  :step="incrementStep"
                  :placeholder="t('bidSheet.bidPlaceholder') || 'Например 45 000'"
                  class="w-full bg-slate-50 border border-black/10 focus:border-primary focus:bg-white rounded-xl px-4 py-3 text-base font-bold text-gray-950 outline-none transition-all font-mono"
                />
                <span class="absolute right-4 text-xs font-bold text-gray-400">{{ t('common.currency') || 'сом' }}</span>
              </div>
            </div>

            <!-- Trust Guarantees -->
            <div class="space-y-2 pt-1">
              <div class="flex items-start gap-2 text-xs text-gray-600">
                <ShieldCheck class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{{ t('bidSheet.escrowGuaranteed') || '100% Защита Escrow: Средства не списываются сразу. Если ваша ставка будет перебита, вы не платите ничего.' }}</span>
              </div>
              <div class="flex items-start gap-2 text-xs text-gray-600">
                <Clock class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{{ t('bidSheet.antiSnipingGuaranteed') || 'Антиснайпинг: Ставка на последних секундах автоматически продлевает таймер на 2 минуты, гарантируя честность.' }}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Action -->
          <div class="p-4 sm:p-5 bg-slate-50 border-t border-black/[0.06] space-y-2">
            <button
              type="button"
              :disabled="isSubmitting"
              class="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-gray-950 font-black text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-98"
              @click="handleConfirmBid"
            >
              <TrendingUp class="w-5 h-5" />
              <span>{{ t('bidSheet.confirmBidBtn', { amount: selectedAmount.toLocaleString('ru-RU') }) || `Подтвердить ставку · ${selectedAmount.toLocaleString('ru-RU')} сом` }}</span>
            </button>
            <div class="text-center text-[11px] text-gray-400">
              {{ t('bidSheet.termsAgreeNotice') || 'Нажимая кнопку, вы соглашаетесь с правилами проведения аукционов iTorgo' }}
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
