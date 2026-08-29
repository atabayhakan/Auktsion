<script setup lang="ts">
import { ref } from 'vue'
import {
  X,
  Gavel,
  CheckCircle2,
  XCircle,
  Star,
  Zap,
  Eye,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  FileText,
  DollarSign
} from 'lucide-vue-next'
import type { AdminListing } from '@/types/admin'
import { useI18n } from '@/composables/useI18n'

const props = defineProps<{
  listing: AdminListing | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'approve', id: string): void
  (e: 'reject', payload: { id: string; reason: string }): void
  (e: 'toggle-featured', id: string): void
}>()

const { t } = useI18n()
const activeImageIdx = ref(0)
const rejectReason = ref('')
const showRejectPrompt = ref(false)

function handleApprove() {
  if (!props.listing) return
  emit('approve', props.listing.id)
}

function handleReject() {
  if (!props.listing) return
  emit('reject', {
    id: props.listing.id,
    reason: rejectReason.value || t('admin.listings.detail.defaultRejectReason')
  })
  showRejectPrompt.value = false
}
</script>

<template>
  <div
    v-if="isOpen && listing"
    class="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
  >
    <div class="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
      <!-- Header -->
      <div class="p-5 border-b border-black/[0.06] flex items-center justify-between bg-accent/40">
        <div class="flex items-center gap-2">
          <Gavel class="w-5 h-5 text-primary" />
          <h3 class="text-base font-bold text-text-primary truncate">
            Лот #{{ listing.id }}: {{ listing.title }}
          </h3>
        </div>
        <button class="text-text-muted hover:text-text-primary" @click="emit('close')">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
        <!-- Top: Gallery & Key Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Image Gallery -->
          <div class="space-y-3">
            <div class="aspect-video w-full rounded-xl overflow-hidden bg-accent border border-border relative">
              <img
                :src="listing.images[activeImageIdx] || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80'"
                :alt="listing.title"
                class="w-full h-full object-cover"
              />
              <span
                :class="[
                  'absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                  listing.status === 'active' ? 'bg-emerald-500 text-white' : '',
                  listing.status === 'pending_approval' ? 'bg-amber-500 text-white' : '',
                  listing.status === 'flagged' ? 'bg-rose-500 text-white' : '',
                  listing.status === 'draft' ? 'bg-gray-500 text-white' : ''
                ]"
              >
                {{ listing.status }}
              </span>
            </div>

            <!-- Thumbnails -->
            <div v-if="listing.images.length > 1" class="flex gap-2 overflow-x-auto pb-1">
              <button
                v-for="(img, idx) in listing.images"
                :key="idx"
                :class="[
                  'w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all',
                  activeImageIdx === idx ? 'border-primary scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                ]"
                @click="activeImageIdx = idx"
              >
                <img :src="img" class="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          <!-- Key Financials & Details -->
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-accent p-3 rounded-xl border border-border">
                <span class="text-text-muted block mb-1">{{ t('admin.listings.detail.startingPrice') }}</span>
                <span class="font-bold text-text-primary text-sm">{{ listing.startingPrice.formatted }}</span>
              </div>
              <div class="bg-primary/10 p-3 rounded-xl border border-primary/20">
                <span class="text-primary font-semibold block mb-1">{{ t('admin.listings.detail.currentPrice') }}</span>
                <span class="font-bold text-primary text-sm">{{ listing.currentPrice.formatted }}</span>
              </div>
            </div>

            <!-- Reserve Price Box (Admin exclusive insight) -->
            <div class="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
              <div class="flex items-center justify-between">
                <span class="font-bold text-amber-900 flex items-center gap-1.5">
                  <DollarSign class="w-4 h-4 text-amber-600" />
                  <span>{{ t('admin.listings.detail.hiddenReservePrice') }}</span>
                </span>
                <span class="font-bold text-amber-900 text-sm">{{ listing.reservePrice.formatted }}</span>
              </div>
              <p class="text-[11px] text-amber-800 mt-1">
                {{ t('admin.listings.detail.reserveHint') }}
              </p>
            </div>

            <!-- Seller Info -->
            <div class="p-3 bg-accent rounded-xl border border-border flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <img
                  :src="listing.seller.avatar || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80'"
                  class="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <span class="font-bold text-text-primary block">{{ listing.seller.fullName }}</span>
                  <span class="text-text-muted">★ {{ listing.seller.rating }} • {{ listing.city }}</span>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                {{ listing.seller.kycStatus === 'verified' ? t('admin.listings.detail.kycVerified') : t('admin.listings.detail.kycPending') }}
              </span>
            </div>

            <!-- Toggles for Featured and Blitz -->
            <div class="flex gap-2">
              <button
                :class="[
                  'flex-1 py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors border',
                  listing.isFeatured
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-accent text-text-secondary border-border hover:bg-accent-hover'
                ]"
                @click="emit('toggle-featured', listing.id)"
              >
                <Star class="w-3.5 h-3.5" />
                <span>{{ listing.isFeatured ? t('admin.listings.detail.onHomepage') : t('admin.listings.detail.showOnHomepage') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div>
          <h4 class="font-bold text-text-primary mb-1.5 uppercase tracking-wider text-[11px]">{{ t('admin.listings.detail.description') }}</h4>
          <div class="p-3.5 bg-accent rounded-xl border border-border text-text-secondary leading-relaxed">
            {{ listing.description }}
          </div>
        </div>

        <!-- Specialized Category Attributes -->
        <div v-if="listing.livestock" class="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200">
          <h4 class="font-bold text-emerald-900 mb-2 uppercase tracking-wider text-[11px]">{{ t('admin.listings.detail.livestockAttrs') }}</h4>
          <div class="grid grid-cols-3 gap-3">
            <div><span class="text-text-muted block">{{ t('admin.listings.detail.animalType') }}</span> <strong class="text-text-primary">{{ listing.livestock.animalType }}</strong></div>
            <div><span class="text-text-muted block">{{ t('admin.listings.detail.breed') }}</span> <strong class="text-text-primary">{{ listing.livestock.breed || t('admin.listings.detail.localBreed') }}</strong></div>
            <div><span class="text-text-muted block">{{ t('admin.listings.detail.age') }}</span> <strong class="text-text-primary">{{ listing.livestock.ageYears }} {{ t('admin.listings.detail.yearsUnit') }}</strong></div>
            <div><span class="text-text-muted block">{{ t('admin.listings.detail.weight') }}</span> <strong class="text-text-primary">{{ listing.livestock.weightKg }} {{ t('admin.listings.detail.kgUnit') }}</strong></div>
            <div><span class="text-text-muted block">{{ t('admin.listings.detail.vetPassport') }}</span> <strong class="text-emerald-600">{{ listing.livestock.hasVetPassport ? t('admin.listings.detail.yes') : t('admin.listings.detail.no') }}</strong></div>
            <div><span class="text-text-muted block">{{ t('admin.listings.detail.vaccinations') }}</span> <strong class="text-emerald-600">{{ listing.livestock.isVaccinated ? t('admin.listings.detail.passed') : t('admin.listings.detail.no') }}</strong></div>
          </div>
        </div>

        <div v-else-if="listing.vehicle" class="p-4 rounded-xl bg-blue-50/40 border border-blue-200">
          <h4 class="font-bold text-blue-900 mb-2 uppercase tracking-wider text-[11px]">{{ t('admin.listings.detail.vehicleAttrs') }}</h4>
          <div class="grid grid-cols-3 gap-3">
            <div><span class="text-text-muted block">{{ t('admin.listings.detail.brandModel') }}</span> <strong class="text-text-primary">{{ listing.vehicle.brand }} {{ listing.vehicle.model }}</strong></div>
            <div><span class="text-text-muted block">{{ t('admin.listings.detail.year') }}</span> <strong class="text-text-primary">{{ listing.vehicle.year }}</strong></div>
            <div><span class="text-text-muted block">{{ t('admin.listings.detail.mileage') }}</span> <strong class="text-text-primary">{{ listing.vehicle.mileageKm }} {{ t('admin.listings.detail.kmUnit') }}</strong></div>
            <div><span class="text-text-muted block">{{ t('admin.listings.detail.steering') }}</span> <strong class="text-text-primary">{{ listing.vehicle.steering === 'left' ? t('admin.listings.detail.steeringLeft') : t('admin.listings.detail.steeringRight') }}</strong></div>
            <div><span class="text-text-muted block">{{ t('admin.listings.detail.customs') }}</span> <strong class="text-emerald-600">{{ listing.vehicle.isCustomsCleared ? t('admin.listings.detail.customsCleared') : t('admin.listings.detail.customsNotCleared') }}</strong></div>
            <div><span class="text-text-muted block">{{ t('admin.listings.detail.condition') }}</span> <strong class="text-text-primary">{{ listing.vehicle.condition }}</strong></div>
          </div>
        </div>

        <!-- Rejection Prompt -->
        <div v-if="showRejectPrompt" class="p-4 bg-error/10 rounded-xl border border-error/20 space-y-2">
          <label class="block font-bold text-error">{{ t('admin.listings.detail.rejectReasonLabel') }}</label>
          <textarea
            v-model="rejectReason"
            rows="2"
            :placeholder="t('admin.listings.detail.rejectReasonPlaceholder')"
            class="w-full p-2.5 bg-white border border-border rounded-lg text-xs"
          ></textarea>
          <div class="flex justify-end gap-2">
            <button class="px-3 py-1.5 rounded-lg bg-accent-hover text-text-primary font-semibold" @click="showRejectPrompt = false">{{ t('admin.actions.cancel') }}</button>
            <button class="px-3 py-1.5 rounded-lg bg-error text-white font-semibold hover:bg-error/90" @click="handleReject">{{ t('admin.listings.detail.confirmReject') }}</button>
          </div>
        </div>
      </div>

      <!-- Modal Footer / Moderation Actions -->
      <div class="p-5 border-t border-black/[0.06] flex items-center justify-between bg-accent/40">
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-accent text-text-secondary font-semibold hover:bg-accent-hover"
          @click="emit('close')"
        >
          {{ t('admin.actions.close') }}
        </button>

        <div class="flex items-center gap-2">
          <button
            v-if="listing.status === 'pending_approval' || listing.status === 'flagged'"
            type="button"
            class="px-4 py-2 rounded-lg font-semibold bg-error/10 text-error hover:bg-error/20 border border-error/30"
            @click="showRejectPrompt = true"
          >
            {{ t('admin.actions.reject') }}
          </button>

          <button
            v-if="listing.status === 'pending_approval' || listing.status === 'flagged'"
            type="button"
            class="px-4 py-2 rounded-lg font-semibold text-white bg-success hover:bg-success/90 shadow-sm"
            @click="handleApprove"
          >
            {{ t('admin.actions.approve') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
