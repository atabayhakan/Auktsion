<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  Bell,
  X,
  CheckCircle2,
  Sparkles,
  TrendingDown,
  Mail,
  Smartphone,
  Check,
  Loader2
} from 'lucide-vue-next'
import { useFeatureStore } from '@/stores/feature'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'
import { useI18n } from '@/composables/useI18n'
import type { Auction } from '@/types'

const props = defineProps<{
  modelValue: boolean
  auction: Auction | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const featureStore = useFeatureStore()
const userStore = useUserStore()
const uiStore = useUIStore()
const { t } = useI18n()

const targetPrice = ref<number>(0)
const channels = ref({
  inApp: true,
  email: true,
  push: false
})
const isSubmitting = ref(false)
const isSuccess = ref(false)

const currentPriceNum = computed(() => {
  if (!props.auction) return 0
  return Number(props.auction.currentPrice?.amount || props.auction.startingPrice?.amount || 0)
})

watch(() => props.modelValue, (open) => {
  if (open && props.auction) {
    // Default target price to 10% below current price
    targetPrice.value = Math.round(currentPriceNum.value * 0.9)
    isSuccess.value = false
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

function setDiscount(pct: number) {
  targetPrice.value = Math.round(currentPriceNum.value * (1 - pct / 100))
}

function close() {
  emit('update:modelValue', false)
}

async function handleSubmit() {
  if (!props.auction) return
  if (!userStore.isAuthenticated) {
    uiStore.toastWarning('Кирүү керек', 'Баа түшкөндө кабарлоо үчүн системага кириңиз')
    return
  }

  isSubmitting.value = true
  try {
    const res = await featureStore.createPriceAlert(props.auction.id, targetPrice.value, channels.value)
    isSuccess.value = true
    uiStore.toastSuccess('Кабарлоо активдештирилди!', 'Баа сиз белгилеген чекке жеткенде дароо билдирүү жөнөтүлөт')
    setTimeout(() => {
      close()
    }, 1500)
  } catch (err: any) {
    uiStore.toastError('Ката', err.message || 'Кабарлоо жөндөөсүндө ката кетти')
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
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="close"
      >
        <div class="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden animate-scale-in">
          <!-- Header -->
          <div class="p-6 bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white relative">
            <button
              type="button"
              class="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              @click="close"
            >
              <X class="w-4 h-4" />
            </button>

            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner text-white">
                <Bell class="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div class="flex items-center gap-1.5">
                  <h3 class="text-lg font-black tracking-tight">Fiyat Takibi & Bildirim</h3>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-amber-800">SMART</span>
                </div>
                <p class="text-xs text-amber-100 mt-0.5">Баа сиз каалаган деңгээлге түшкөндө кабар беребиз</p>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-5">
            <!-- Lot Snippet -->
            <div class="flex items-center gap-3 p-3 rounded-2xl bg-black/[0.02] border border-black/5">
              <img
                :src="auction.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'"
                :alt="auction.title"
                class="w-12 h-12 rounded-xl object-cover"
              />
              <div class="min-w-0 flex-1">
                <h4 class="text-xs font-bold text-text-primary truncate">{{ auction.title }}</h4>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[11px] text-text-muted">Учурдагы баа:</span>
                  <span class="text-xs font-black text-primary font-mono">{{ currentPriceNum.toLocaleString() }} сом</span>
                </div>
              </div>
            </div>

            <!-- Target Price Selector -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-text-primary">
                Кайсы баага жеткенде кабарлайлы? (Максаттуу баа):
              </label>

              <div class="relative flex items-center">
                <input
                  v-model.number="targetPrice"
                  type="number"
                  step="100"
                  class="w-full px-4 py-3 rounded-2xl border-2 border-amber-400/50 bg-amber-500/[0.03] text-lg font-mono font-black text-text-primary focus:border-amber-500 focus:outline-none pr-16 transition-all"
                />
                <span class="absolute right-4 text-xs font-bold text-text-muted uppercase">СОМ</span>
              </div>

              <!-- Quick % Buttons -->
              <div class="grid grid-cols-4 gap-2 pt-1">
                <button
                  type="button"
                  class="py-1.5 px-2 rounded-xl border border-black/5 hover:border-amber-400 bg-white text-xs font-bold text-text-secondary hover:text-amber-800 transition-all cursor-pointer"
                  @click="setDiscount(5)"
                >
                  -5%
                </button>
                <button
                  type="button"
                  class="py-1.5 px-2 rounded-xl border border-black/5 hover:border-amber-400 bg-white text-xs font-bold text-text-secondary hover:text-amber-800 transition-all cursor-pointer"
                  @click="setDiscount(10)"
                >
                  -10%
                </button>
                <button
                  type="button"
                  class="py-1.5 px-2 rounded-xl border border-black/5 hover:border-amber-400 bg-white text-xs font-bold text-text-secondary hover:text-amber-800 transition-all cursor-pointer"
                  @click="setDiscount(15)"
                >
                  -15%
                </button>
                <button
                  type="button"
                  class="py-1.5 px-2 rounded-xl border border-black/5 hover:border-amber-400 bg-white text-xs font-bold text-text-secondary hover:text-amber-800 transition-all cursor-pointer"
                  @click="setDiscount(20)"
                >
                  -20%
                </button>
              </div>
            </div>

            <!-- Channels Selector -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-text-secondary">
                Кабарлоо каналдары:
              </label>
              <div class="grid grid-cols-3 gap-2">
                <label class="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-black/[0.02] cursor-pointer text-xs font-medium text-text-primary">
                  <input v-model="channels.inApp" type="checkbox" class="rounded text-amber-500 focus:ring-0" />
                  <span>Колокольчик</span>
                </label>
                <label class="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-black/[0.02] cursor-pointer text-xs font-medium text-text-primary">
                  <input v-model="channels.email" type="checkbox" class="rounded text-amber-500 focus:ring-0" />
                  <span>Email</span>
                </label>
                <label class="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-black/[0.02] cursor-pointer text-xs font-medium text-text-primary">
                  <input v-model="channels.push" type="checkbox" class="rounded text-amber-500 focus:ring-0" />
                  <span>Push</span>
                </label>
              </div>
            </div>

            <!-- Success State or Submit Button -->
            <div v-if="isSuccess" class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center gap-2 text-xs font-bold">
              <CheckCircle2 class="w-4 h-4 text-emerald-600" />
              <span>Кабарлоо ийгиликтүү кошулду!</span>
            </div>

            <button
              v-else
              type="button"
              :disabled="isSubmitting || targetPrice <= 0"
              class="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-gray-950 font-extrabold text-sm hover:from-amber-400 hover:to-amber-300 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              @click="handleSubmit"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <Bell v-else class="w-4 h-4" />
              <span>Баа түшкөндө кабарла / Fiyat Takibini Başlat</span>
            </button>
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

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-scale-in {
  animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
