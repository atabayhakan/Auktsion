<script setup lang="ts">
import { ref } from 'vue'
import {
  X,
  ShieldCheck,
  Ban,
  Key,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle2
} from 'lucide-vue-next'
import type { AdminUserDetail } from '@/types/admin'
import { useI18n } from '@/composables/useI18n'

const props = defineProps<{
  user: AdminUserDetail | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'ban', user: AdminUserDetail): void
  (e: 'change-role', user: AdminUserDetail): void
  (e: 'reset-password', user: AdminUserDetail): void
}>()

const { t } = useI18n()
const activeTab = ref<'profile' | 'activity' | 'financials' | 'kyc'>('profile')
</script>

<template>
  <div
    v-if="isOpen && user"
    class="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
  >
    <div
      class="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-300"
    >
      <!-- Drawer Header -->
      <div class="p-6 border-b border-border flex items-start justify-between gap-4 bg-accent/50">
        <div class="flex items-center gap-4">
          <img
            :src="user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'"
            :alt="user.fullName"
            class="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/20 shadow-sm"
          />
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-lg font-bold text-text-primary">
                {{ user.fullName }}
              </h3>
              <!-- Status badge -->
              <span
                :class="[
                  'text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize',
                  user.status === 'active' ? 'bg-success/15 text-success border border-success/30' : '',
                  user.status === 'suspended' ? 'bg-warning/15 text-amber-700 border border-warning/40' : '',
                  user.status === 'banned' ? 'bg-error/10 text-error border border-error/30' : ''
                ]"
              >
                {{ user.status === 'active' ? t('admin.users.statusOptions.active') : (user.status === 'suspended' ? t('admin.users.statusOptions.suspended') : t('admin.users.statusOptions.banned')) }}
              </span>
              <!-- Role badge -->
              <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                {{ user.role }}
              </span>
            </div>

            <div class="flex items-center gap-3 text-xs text-text-muted mt-1">
              <span>ID: {{ user.id }}</span>
              <span>•</span>
              <span>ИНН: {{ user.inn || t('admin.users.detail.innNotProvided') }}</span>
            </div>
          </div>
        </div>

        <button
          class="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-accent"
          @click="emit('close')"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Quick Action Buttons Bar -->
      <div class="px-6 py-3 border-b border-border bg-white flex items-center gap-2 overflow-x-auto">
        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors border border-error/30"
          @click="emit('ban', user)"
        >
          <Ban class="w-3.5 h-3.5" />
          <span>{{ user.status === 'banned' ? t('admin.actions.unban') : t('admin.actions.ban') }}</span>
        </button>

        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/30"
          @click="emit('change-role', user)"
        >
          <ShieldCheck class="w-3.5 h-3.5" />
          <span>{{ t('admin.actions.changeRole') }}</span>
        </button>

        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-black/5 text-text-secondary hover:bg-black/10 transition-colors"
          @click="emit('reset-password', user)"
        >
          <Key class="w-3.5 h-3.5" />
          <span>{{ t('admin.actions.resetPassword') }}</span>
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="px-6 border-b border-border flex gap-4 text-xs font-semibold">
        <button
          v-for="tab in [
            { id: 'profile', label: t('admin.users.detail.profileTab') },
            { id: 'activity', label: t('admin.users.detail.activityTab') },
            { id: 'financials', label: t('admin.users.detail.financialsTab') },
            { id: 'kyc', label: t('admin.users.detail.kycTab') }
          ]"
          :key="tab.id"
          :class="[
            'py-3 border-b-2 transition-colors',
            activeTab === tab.id
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          ]"
          @click="activeTab = tab.id as any"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Drawer Content Body -->
      <div class="flex-1 p-6 overflow-y-auto space-y-6 text-sm">
        <!-- Tab 1: Profile -->
        <div v-if="activeTab === 'profile'" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-accent p-3.5 rounded-xl border border-border">
              <span class="text-xs text-text-muted block mb-1">{{ t('admin.users.detail.email') }}</span>
              <div class="flex items-center gap-2 font-medium text-text-secondary">
                <Mail class="w-4 h-4 text-text-muted" />
                <span class="truncate">{{ user.email }}</span>
              </div>
            </div>

            <div class="bg-accent p-3.5 rounded-xl border border-border">
              <span class="text-xs text-text-muted block mb-1">{{ t('admin.users.detail.phone') }}</span>
              <div class="flex items-center gap-2 font-medium text-text-secondary">
                <Phone class="w-4 h-4 text-text-muted" />
                <span>{{ user.phone }}</span>
              </div>
            </div>

            <div class="bg-accent p-3.5 rounded-xl border border-border">
              <span class="text-xs text-text-muted block mb-1">{{ t('admin.users.detail.address') }}</span>
              <div class="flex items-center gap-2 font-medium text-text-secondary">
                <MapPin class="w-4 h-4 text-text-muted" />
                <span>{{ [user.district, user.city].filter(Boolean).join(', ') }}</span>
              </div>
            </div>

            <div class="bg-accent p-3.5 rounded-xl border border-border">
              <span class="text-xs text-text-muted block mb-1">{{ t('admin.users.detail.registeredAt') }}</span>
              <div class="flex items-center gap-2 font-medium text-text-secondary">
                <Calendar class="w-4 h-4 text-text-muted" />
                <span>{{ new Date(user.createdAt).toLocaleDateString('ru-RU') }}</span>
              </div>
            </div>
          </div>

          <!-- Activity at a glance -->
          <div class="p-4 rounded-xl border border-border bg-accent/70">
            <h4 class="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
              {{ t('admin.users.detail.activityAtGlance') }}
            </h4>
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span class="text-text-muted">{{ t('admin.users.detail.activeListings') }}</span>
                <span class="font-bold ml-1.5 text-text-primary">{{ user.activeListingsCount }}</span>
              </div>
              <div>
                <span class="text-text-muted">{{ t('admin.users.detail.activeBids') }}</span>
                <span class="font-bold ml-1.5 text-text-primary">{{ user.activeBidsCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Activity -->
        <div v-else-if="activeTab === 'activity'" class="space-y-4">
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">{{ t('admin.users.detail.recentBids') }}</h4>
            <div v-if="user.recentBids && user.recentBids.length > 0" class="space-y-2">
              <div
                v-for="b in user.recentBids"
                :key="b.id"
                class="p-3 bg-accent rounded-xl border border-border flex items-center justify-between text-xs"
              >
                <div>
                  <span class="font-semibold text-text-primary block">{{ b.auctionTitle }}</span>
                  <span class="text-text-muted">{{ new Date(b.placedAt).toLocaleString('ru-RU') }}</span>
                </div>
                <div class="text-right">
                  <span class="font-bold text-primary block">{{ b.amount.formatted }}</span>
                  <span class="text-success text-[10px] font-semibold uppercase">{{ b.status }}</span>
                </div>
              </div>
            </div>
            <p v-else class="text-xs text-text-muted italic">{{ t('admin.users.detail.noBids') }}</p>
          </div>

          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">{{ t('admin.users.detail.userListings') }}</h4>
            <div v-if="user.recentListings && user.recentListings.length > 0" class="space-y-2">
              <div
                v-for="l in user.recentListings"
                :key="l.id"
                class="p-3 bg-accent rounded-xl border border-border flex items-center justify-between text-xs"
              >
                <div>
                  <span class="font-semibold text-text-primary block">{{ l.title }}</span>
                  <span class="text-text-muted">{{ t('admin.users.detail.endsAt') }} {{ new Date(l.endsAt).toLocaleDateString('ru-RU') }}</span>
                </div>
                <div class="text-right">
                  <span class="font-bold text-text-primary block">{{ l.currentPrice.formatted }}</span>
                  <span class="text-secondary text-[10px] font-semibold uppercase">{{ l.status }}</span>
                </div>
              </div>
            </div>
            <p v-else class="text-xs text-text-muted italic">{{ t('admin.users.detail.noListings') }}</p>
          </div>
        </div>

        <!-- Tab 3: Financials -->
        <div v-else-if="activeTab === 'financials'" class="space-y-4">
          <div class="bg-success/10 p-4 rounded-xl border border-success/20">
            <span class="text-xs text-success font-semibold block mb-1">{{ t('admin.users.detail.accountBalance') }}</span>
            <span class="text-xl font-bold text-text-primary">{{ user.balance.formatted }}</span>
          </div>

          <div v-if="user.payoutMethods && user.payoutMethods.length > 0">
            <h4 class="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">{{ t('admin.users.detail.payoutMethods') }}</h4>
            <div class="space-y-2">
              <div
                v-for="pm in user.payoutMethods"
                :key="pm.id"
                class="p-3 bg-accent rounded-xl border border-border flex items-center justify-between text-xs"
              >
                <div>
                  <span class="font-semibold text-text-primary block">{{ pm.bankName }}</span>
                  <span class="text-text-muted font-mono">{{ pm.accountNumber }}</span>
                </div>
                <span v-if="pm.isVerified" class="text-success text-[10px] font-semibold uppercase">{{ t('admin.users.detail.verified') }}</span>
              </div>
            </div>
          </div>
          <p v-else class="text-xs text-text-muted italic">{{ t('admin.users.detail.noPayoutMethods') }}</p>
        </div>

        <!-- Tab 4: KYC Documents -->
        <div v-else-if="activeTab === 'kyc'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold uppercase tracking-wider text-text-muted">{{ t('admin.users.detail.kycDocuments') }}</h4>
            <span class="text-xs font-bold text-success flex items-center gap-1">
              <CheckCircle2 class="w-4 h-4" />
              <span>{{ t('admin.users.detail.kycConfirmed') }}</span>
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <span class="text-xs text-text-muted font-medium">{{ t('admin.users.detail.idFront') }}</span>
              <img
                :src="user.kycDocuments.idFront || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80'"
                class="w-full h-36 object-cover rounded-xl border border-border"
              />
            </div>
            <div class="space-y-1.5">
              <span class="text-xs text-text-muted font-medium">{{ t('admin.users.detail.selfie') }}</span>
              <img
                :src="user.kycDocuments.selfie || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'"
                class="w-full h-36 object-cover rounded-xl border border-border"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
