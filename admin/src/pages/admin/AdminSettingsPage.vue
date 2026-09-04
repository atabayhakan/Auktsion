<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Settings,
  Shield,
  Percent,
  Clock,
  Wallet,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Building,
  Lock,
  Globe,
  Sliders
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import { useUIStore } from '@/stores/ui'
import { useI18n } from '@/composables/useI18n'
import type { PlatformSettings } from '@/types/admin'

const adminStore = useAdminStore()
const uiStore = useUIStore()
const { t } = useI18n()

const activeTab = ref<'general' | 'auction' | 'security'>('general')
const isSaving = ref(false)

const form = ref<PlatformSettings>({
  siteName: 'iTorgo',
  siteTitle: 'iTorgo — Кыргызстандын №1 Онлайн Аукцион Платформасы',
  siteDescription: 'Кыргызстандагы реалдуу убакыттагы биринчи ачык аукцион жана соода платформасы.',
  commissionRatePct: 8.0,
  antiSnipingMinutes: 2,
  antiSnipingTriggerMinutes: 2,
  minDepositKgs: 500,
  currency: 'KGS',
  supportPhone: '+996 555 999888',
  supportEmail: 'support@itorgo.kg',
  whatsappNumber: '+996 555 999888',
  address: 'Бишкек ш., Чүй проспекти 114, 3-кабат',
  maintenanceMode: false,
  autoApproveAuctions: false,
  kycRequiredToBid: true,
  twoFactorRequired: false,
  updatedAt: new Date().toISOString()
})

onMounted(async () => {
  await loadSettings()
})

async function loadSettings() {
  await adminStore.fetchSettings()
  if (adminStore.settings) {
    form.value = { ...adminStore.settings }
  }
}

async function handleSave() {
  isSaving.value = true
  try {
    const res = await adminStore.updateSettings(form.value)
    if (res && res.success) {
      uiStore.toastSuccess('Ийгиликтүү сакталды', 'Системанын жөндөөлөрү жаңыланды (Ayarlar kaydedildi)')
    } else {
      uiStore.toastSuccess('Жөндөөлөр жаңыланды', 'Өзгөртүүлөр күчүнө кирди')
    }
  } catch (err: any) {
    uiStore.toastError('Ката кетти', err.message || 'Жөндөөлөрдү сактоо мүмкүн болгон жок')
  } finally {
    isSaving.value = false
  }
}

function handleReset() {
  if (adminStore.settings) {
    form.value = { ...adminStore.settings }
    uiStore.toastInfo('Калыбына келтирилди', 'Жөндөөлөр баштапкы абалына келтирилди')
  }
}
</script>

<template>
  <div class="space-y-6 max-w-6xl pb-16">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2.5">
          <Settings class="w-6 h-6 text-primary" />
          <span>{{ t('admin.settings.title') || 'Общие настройки сайта' }}</span>
        </h1>
        <p class="text-xs text-text-secondary mt-1">
          {{ t('admin.settings.subtitle') || 'Комиссия платформы, правила anti-sniping, ставки депозитов и параметры системы' }}
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary bg-white hover:bg-accent border border-border shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          @click="handleReset"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>{{ t('admin.settings.reset') || 'Сбросить' }}</span>
        </button>

        <button
          type="button"
          :disabled="isSaving"
          class="px-5 py-2 rounded-xl text-xs font-bold text-text-primary bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
          @click="handleSave"
        >
          <Save class="w-3.5 h-3.5" />
          <span>{{ isSaving ? (t('admin.settings.saving') || 'Сохранение...') : (t('admin.settings.save') || 'Сохранить изменения') }}</span>
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
      <button
        type="button"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer',
          activeTab === 'general'
            ? 'bg-primary text-text-primary shadow-xs'
            : 'text-text-secondary hover:text-text-primary hover:bg-black/5'
        ]"
        @click="activeTab = 'general'"
      >
        <Globe class="w-4 h-4" />
        <span>{{ t('admin.settings.tabs.general') || 'Платформа и контакты' }}</span>
      </button>

      <button
        type="button"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer',
          activeTab === 'auction'
            ? 'bg-primary text-text-primary shadow-xs'
            : 'text-text-secondary hover:text-text-primary hover:bg-black/5'
        ]"
        @click="activeTab = 'auction'"
      >
        <Sliders class="w-4 h-4" />
        <span>{{ t('admin.settings.tabs.auction') || 'Правила аукционов и финансов' }}</span>
      </button>

      <button
        type="button"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer',
          activeTab === 'security'
            ? 'bg-primary text-text-primary shadow-xs'
            : 'text-text-secondary hover:text-text-primary hover:bg-black/5'
        ]"
        @click="activeTab = 'security'"
      >
        <Shield class="w-4 h-4" />
        <span>{{ t('admin.settings.tabs.security') || 'Безопасность, KYC и режим техработ' }}</span>
      </button>
    </div>

    <!-- TAB 1: Platform & Contact -->
    <div v-if="activeTab === 'general'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
        <h2 class="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
          <Building class="w-4 h-4 text-primary" />
          <span>{{ t('admin.settings.general.platformInfo') || 'Информация о платформе' }}</span>
        </h2>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">
            {{ t('admin.settings.general.siteName') || 'Название сайта' }}
          </label>
          <input
            v-model="form.siteName"
            type="text"
            class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">
            {{ t('admin.settings.general.siteTitle') || 'Заголовок сайта (SEO Title)' }}
          </label>
          <input
            v-model="form.siteTitle"
            type="text"
            class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">
            {{ t('admin.settings.general.siteDescription') || 'Описание сайта (Meta Description)' }}
          </label>
          <textarea
            v-model="form.siteDescription"
            rows="3"
            class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          ></textarea>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
        <h2 class="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
          <Phone class="w-4 h-4 text-primary" />
          <span>{{ t('admin.settings.general.contactInfo') || 'Служба поддержки и контакты' }}</span>
        </h2>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1 flex items-center gap-1.5">
            <Mail class="w-3.5 h-3.5 text-primary" />
            <span>{{ t('admin.settings.general.supportEmail') || 'Email службы поддержки' }}</span>
          </label>
          <input
            v-model="form.supportEmail"
            type="email"
            class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1 flex items-center gap-1.5">
            <MessageCircle class="w-3.5 h-3.5 text-emerald-500" />
            <span>{{ t('admin.settings.general.whatsappNumber') || 'WhatsApp горячая линия' }}</span>
          </label>
          <input
            v-model="form.whatsappNumber"
            type="text"
            class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1 flex items-center gap-1.5">
            <Phone class="w-3.5 h-3.5 text-blue-500" />
            <span>{{ t('admin.settings.general.supportPhone') || 'Официальный телефон колл-центра' }}</span>
          </label>
          <input
            v-model="form.supportPhone"
            type="text"
            class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1 flex items-center gap-1.5">
            <MapPin class="w-3.5 h-3.5 text-rose-500" />
            <span>{{ t('admin.settings.general.address') || 'Юридический адрес компании / офиса' }}</span>
          </label>
          <input
            v-model="form.address"
            type="text"
            class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>
    </div>

    <!-- TAB 2: Auction & Finance Rules -->
    <div v-if="activeTab === 'auction'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
        <h2 class="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
          <Percent class="w-4 h-4 text-primary" />
          <span>{{ t('admin.settings.auction.rulesTitle') || 'Правила торгов и комиссии' }}</span>
        </h2>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">
            {{ t('admin.settings.auction.commissionRate') || 'Комиссия платформы по умолчанию (%)' }}
          </label>
          <div class="relative">
            <input
              v-model.number="form.commissionRatePct"
              type="number"
              step="0.1"
              min="0"
              max="50"
              class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <span class="absolute right-3.5 top-2.5 text-sm font-bold text-text-muted">%</span>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">
            {{ t('admin.settings.auction.currency') || 'Базовая валюта платформы' }}
          </label>
          <select
            v-model="form.currency"
            class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="KGS">KGS (Кыргыз сому / сом)</option>
            <option value="USD">USD ($ US Dollar)</option>
            <option value="RUB">RUB (₽ Российский рубль)</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">
            {{ t('admin.settings.auction.minDeposit') || 'Минимальный гарантийный депозит (KGS)' }}
          </label>
          <div class="relative">
            <input
              v-model.number="form.minDepositKgs"
              type="number"
              min="0"
              step="100"
              class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <span class="absolute right-3.5 top-2.5 text-xs font-bold text-text-muted">KGS</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
        <h2 class="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
          <Clock class="w-4 h-4 text-primary" />
          <span>Anti-Sniping</span>
        </h2>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">
            {{ t('admin.settings.auction.antiSnipingTrigger') || 'Порог срабатывания Anti-Sniping (минуты)' }}
          </label>
          <div class="relative">
            <input
              v-model.number="form.antiSnipingTriggerMinutes"
              type="number"
              min="1"
              max="30"
              class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <span class="absolute right-3.5 top-2.5 text-xs font-bold text-text-muted">min</span>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">
            {{ t('admin.settings.auction.antiSnipingMinutes') || 'Продление Anti-Sniping (минуты)' }}
          </label>
          <div class="relative">
            <input
              v-model.number="form.antiSnipingMinutes"
              type="number"
              min="1"
              max="60"
              class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <span class="absolute right-3.5 top-2.5 text-xs font-bold text-text-muted">min</span>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: Security, KYC & Maintenance -->
    <div v-if="activeTab === 'security'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-5">
        <h2 class="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
          <Lock class="w-4 h-4 text-primary" />
          <span>{{ t('admin.settings.security.systemSecurity') || 'Системные переключатели и безопасность' }}</span>
        </h2>

        <div class="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.02] border border-border">
          <div>
            <span class="text-sm font-bold text-text-primary block">
              {{ t('admin.settings.security.kycRequired') || 'Обязательная верификация KYC для ставок' }}
            </span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="form.kycRequiredToBid" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div class="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.02] border border-border">
          <div>
            <span class="text-sm font-bold text-text-primary block">
              {{ t('admin.settings.security.autoApprove') || 'Автоматическое одобрение новых лотов' }}
            </span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="form.autoApproveAuctions" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div class="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.02] border border-border">
          <div>
            <span class="text-sm font-bold text-text-primary block">
              {{ t('admin.settings.security.twoFactor') || 'Двухфакторная аутентификация (2FA)' }}
            </span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="form.twoFactorRequired" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-5">
        <h2 class="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
          <AlertTriangle class="w-4 h-4 text-amber-500" />
          <span>{{ t('admin.settings.security.maintenanceMode') || 'Режим технического обслуживания' }}</span>
        </h2>

        <div class="flex items-center justify-between p-4 rounded-xl bg-black/[0.02] border border-border">
          <div>
            <span class="text-sm font-bold text-text-primary block">
              {{ t('admin.settings.security.maintenanceMode') || 'Режим технического обслуживания' }}
            </span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="form.maintenanceMode" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
