<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  AlertTriangle, ShieldAlert, ShieldCheck, Scale, CheckCircle2, 
  HelpCircle, Send, X, AlertCircle, ShoppingBag, Store, Clock
} from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/composables/useI18n'
import { auctionService } from '@/services/auctionService'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'

interface AuctionData {
  id: string
  title: string
  images?: string[]
  image?: string
  sellerId?: string
  currentPrice?: any
}

const props = defineProps<{
  modelValue: boolean
  auction: AuctionData | null
  isSeller?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submitted': [dispute: any]
  'close': []
}>()

const router = useRouter()
const uiStore = useUIStore()
const userStore = useUserStore()
const { t } = useI18n()

const role = ref<'buyer' | 'seller'>('buyer')
const selectedCategory = ref<string>('item_mismatch')
const details = ref<string>('')
const isSubmitting = ref<boolean>(false)
const errorMessage = ref<string | null>(null)

const buyerCategories = computed(() => [
  { id: 'item_mismatch', label: t('disputeModal.reasonsBuyer.item_mismatch') },
  { id: 'item_not_delivered', label: t('disputeModal.reasonsBuyer.item_not_delivered') },
  { id: 'counterfeit', label: t('disputeModal.reasonsBuyer.counterfeit') },
  { id: 'seller_unresponsive', label: t('disputeModal.reasonsBuyer.seller_unresponsive') },
  { id: 'other', label: t('disputeModal.reasonsBuyer.other') },
])

const sellerCategories = computed(() => [
  { id: 'buyer_unpaid', label: t('disputeModal.reasonsSeller.buyer_unpaid') },
  { id: 'fake_bidding', label: t('disputeModal.reasonsSeller.fake_bidding') },
  { id: 'buyer_unresponsive', label: t('disputeModal.reasonsSeller.buyer_unresponsive') },
  { id: 'delivery_unconfirmed', label: t('disputeModal.reasonsSeller.delivery_unconfirmed') },
  { id: 'other', label: t('disputeModal.reasonsSeller.other') },
])

const currentCategories = computed(() => {
  return role.value === 'seller' ? sellerCategories.value : buyerCategories.value
})

const auctionImage = computed(() => {
  if (!props.auction) return ''
  if (props.auction.images && props.auction.images.length > 0) return props.auction.images[0]
  if (props.auction.image) return props.auction.image
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80'
})

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    role.value = props.isSeller ? 'seller' : 'buyer'
    selectedCategory.value = props.isSeller ? 'buyer_unpaid' : 'item_mismatch'
    details.value = ''
    errorMessage.value = null
  }
})

function switchRole(newRole: 'buyer' | 'seller') {
  role.value = newRole
  selectedCategory.value = newRole === 'seller' ? 'buyer_unpaid' : 'item_mismatch'
  errorMessage.value = null
}

async function handleSubmit() {
  if (!userStore.isAuthenticated) {
    uiStore.toastWarning(t('common.loginRequired') || 'Giriş Yapmalısınız', t('disputeModal.loginRequired') || 'Şikayet bildirmek için giriş yapmanız gerekmektedir.')
    emit('update:modelValue', false)
    router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }

  if (!props.auction?.id) {
    errorMessage.value = 'Açık artırma bilgisi bulunamadı.'
    return
  }

  if (!details.value.trim() || details.value.trim().length < 8) {
    errorMessage.value = 'Lütfen durumu en az 8 karakter ile açıklayınız.'
    return
  }

  errorMessage.value = null
  isSubmitting.value = true

  try {
    const selectedCategoryObj = currentCategories.value.find(c => c.id === selectedCategory.value)
    const categoryLabel = selectedCategoryObj ? selectedCategoryObj.label : selectedCategory.value

    const res = await auctionService.reportAuction(props.auction.id, {
      reason: details.value.trim(),
      reasonCategory: categoryLabel,
      details: details.value.trim(),
      role: role.value,
    })

    if (res.success) {
      uiStore.toastSuccess(
        t('disputeModal.successTitle') || 'Şikayetiniz Alındı',
        t('disputeModal.successMessage') || 'Talebiniz moderatörlerimize iletildi. Durumu Profilinizden takip edebilirsiniz.'
      )
      emit('submitted', res.data)
      emit('update:modelValue', false)
      details.value = ''
    } else {
      errorMessage.value = res.message || 'Şikayet gönderilemedi. Lütfen tekrar deneyin.'
    }
  } catch (err: any) {
    errorMessage.value = err.response?.data?.error || err.message || 'Beklenmeyen bir hata oluştu.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="role === 'seller' ? t('disputeModal.titleSeller') : t('disputeModal.titleBuyer')"
    :description="t('disputeModal.subtitle')"
    size="lg"
    hide-footer
    @update:model-value="emit('update:modelValue', $event)"
    @close="emit('close')"
  >
    <div class="space-y-5">
      <!-- Target Auction Banner -->
      <div v-if="auction" class="flex items-center gap-3 p-3.5 rounded-2xl bg-black/[0.03] border border-black/[0.06]">
        <img
          :src="auctionImage"
          :alt="auction.title"
          class="w-14 h-14 rounded-xl object-cover border border-black/10 shrink-0"
        />
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold text-text-muted">Lot #{{ auction.id }}</p>
          <h4 class="text-sm font-bold text-text-primary truncate">{{ auction.title }}</h4>
          <span class="inline-flex items-center gap-1 text-[11px] font-medium text-primary mt-0.5">
            <Clock class="w-3 h-3" />
            <span>{{ t('disputeModal.escrowNoticeBadge') || '24/7 iTorgo Эскроу & Модерация' }}</span>
          </span>
        </div>
      </div>

      <!-- Role Selector Toggle -->
      <div class="space-y-1.5">
        <label class="text-xs font-bold uppercase tracking-wider text-text-muted">
          {{ t('common.role') || 'Başvuru Rolü' }}
        </label>
        <div class="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/[0.04] border border-black/[0.06]">
          <button
            type="button"
            class="py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
            :class="role === 'buyer' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-text-muted hover:text-text-primary'"
            @click="switchRole('buyer')"
          >
            <ShoppingBag class="w-3.5 h-3.5 text-blue-600" />
            <span>{{ t('disputeModal.roleBuyer') }}</span>
          </button>
          <button
            type="button"
            class="py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
            :class="role === 'seller' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-text-muted hover:text-text-primary'"
            @click="switchRole('seller')"
          >
            <Store class="w-3.5 h-3.5 text-amber-600" />
            <span>{{ t('disputeModal.roleSeller') }}</span>
          </button>
        </div>
      </div>

      <!-- Reason Category Selection -->
      <div class="space-y-2">
        <label class="text-xs font-bold uppercase tracking-wider text-text-muted">
          {{ t('disputeModal.selectReason') }}
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            v-for="cat in currentCategories"
            :key="cat.id"
            type="button"
            class="p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5"
            :class="selectedCategory === cat.id 
              ? 'border-primary bg-primary/5 text-gray-950 font-bold shadow-xs' 
              : 'border-border bg-white hover:bg-black/[0.02] text-text-secondary'"
            @click="selectedCategory = cat.id"
          >
            <div 
              class="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5"
              :class="selectedCategory === cat.id ? 'border-primary bg-primary text-white' : 'border-gray-300'"
            >
              <div v-if="selectedCategory === cat.id" class="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <span class="leading-relaxed">{{ cat.label }}</span>
          </button>
        </div>
      </div>

      <!-- Detail Input -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold uppercase tracking-wider text-text-muted">
            {{ t('disputeModal.detailsLabel') }}
          </label>
          <span class="text-[11px] text-text-muted">{{ details.length }} / 500</span>
        </div>
        <textarea
          v-model="details"
          maxlength="500"
          rows="4"
          class="w-full px-3.5 py-2.5 rounded-2xl border border-border bg-white text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-xs"
          :placeholder="t('disputeModal.detailsPlaceholder')"
        />
      </div>

      <!-- Escrow Guarantee Box -->
      <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-900">
        <Scale class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p class="leading-relaxed text-[11px] sm:text-xs">
          {{ t('disputeModal.escrowNotice') }}
        </p>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2">
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Modal Actions -->
      <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-black/[0.06]">
        <button
          type="button"
          class="px-4 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:bg-black/5 transition-colors"
          @click="emit('update:modelValue', false)"
        >
          {{ t('disputeModal.cancel') }}
        </button>

        <button
          type="button"
          :disabled="isSubmitting || details.trim().length < 8"
          class="px-5 py-2.5 rounded-xl bg-primary text-text-primary font-bold text-xs hover:bg-primary-hover shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          @click="handleSubmit"
        >
          <Send class="w-3.5 h-3.5" :class="{ 'animate-pulse': isSubmitting }" />
          <span v-if="isSubmitting">{{ t('disputeModal.submitting') }}</span>
          <span v-else>{{ t('disputeModal.submit') }}</span>
        </button>
      </div>
    </div>
  </Modal>
</template>
