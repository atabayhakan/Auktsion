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
  Sliders,
  Sparkles,
  Users,
  BellRing,
  GitCompare,
  Bot,
  Video,
  Layers,
  Activity,
  Check
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import { useUIStore } from '@/stores/ui'
import { useI18n } from '@/composables/useI18n'
import type { PlatformSettings, FeatureSettings } from '@/types/admin'

const adminStore = useAdminStore()
const uiStore = useUIStore()
const { t } = useI18n()

const activeTab = ref<'general' | 'auction' | 'security' | 'features'>('general')
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

const featuresForm = ref<FeatureSettings>({
  groupBuy: {
    enabled: true,
    defaultDurationHours: 24,
    minParticipants: 3,
    autoRefundOnFail: true,
    allowedCategories: []
  },
  aiValuation: {
    enabled: true,
    model: 'gemini-1.5-flash',
    priceMarginPct: 15,
    requireAdminModeration: false,
    dailyUserLimit: 5
  },
  priceDropAlert: {
    enabled: true,
    minDropPct: 5,
    channels: {
      inApp: true,
      email: true,
      push: true
    }
  },
  sellerComparison: {
    enabled: true,
    algorithm: 'best_value_weighted',
    minSellerCount: 2,
    autoMatchByTitle: true
  },
  aiAssistant: {
    enabled: true,
    maxResults: 4,
    systemPrompt: 'Сиз iTorgo платформасынын акылдуу жардамчысысыз. Кардарларга ылайыктуу товарларды тандап бериңиз.',
    showSuggestions: true
  },
  videoListing: {
    enabled: true,
    maxDurationSeconds: 30,
    maxFileSizeMb: 25,
    allowedCategories: [],
    moderationRequired: false
  }
})

onMounted(async () => {
  await Promise.all([loadSettings(), loadFeatureSettings()])
})

async function loadSettings() {
  await adminStore.fetchSettings()
  if (adminStore.settings) {
    form.value = { ...adminStore.settings }
  }
}

async function loadFeatureSettings() {
  await adminStore.fetchFeatureSettings()
  if (adminStore.featureSettings) {
    featuresForm.value = JSON.parse(JSON.stringify(adminStore.featureSettings))
  }
}

async function handleSave() {
  isSaving.value = true
  try {
    if (activeTab.value === 'features') {
      const res = await adminStore.updateFeatureSettings(featuresForm.value)
      if (res && res.success) {
        uiStore.toastSuccess('Ийгиликтүү сакталды', 'Инновациялык модулдардын жөндөөлөрү жаңыртылды')
      } else {
        uiStore.toastSuccess('Жөндөөлөр жаңыланды', 'Өзгөртүүлөр күчүнө кирди')
      }
    } else {
      const res = await adminStore.updateSettings(form.value)
      if (res && res.success) {
        uiStore.toastSuccess('Ийгиликтүү сакталды', 'Системанын жөндөөлөрү жаңыланды')
      } else {
        uiStore.toastSuccess('Жөндөөлөр жаңыланды', 'Өзгөртүүлөр күчүнө кирди')
      }
    }
  } catch (err: any) {
    uiStore.toastError('Ката кетти', err.message || 'Жөндөөлөрдү сактоо мүмкүн болгон жок')
  } finally {
    isSaving.value = false
  }
}

function handleReset() {
  if (activeTab.value === 'features') {
    if (adminStore.featureSettings) {
      featuresForm.value = JSON.parse(JSON.stringify(adminStore.featureSettings))
      uiStore.toastInfo('Калыбына келтирилди', 'Модулдар баштапкы абалына келтирилди')
    }
  } else {
    if (adminStore.settings) {
      form.value = { ...adminStore.settings }
      uiStore.toastInfo('Калыбына келтирилди', 'Жөндөөлөр баштапкы абалына келтирилди')
    }
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

      <button
        type="button"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer',
          activeTab === 'features'
            ? 'bg-primary text-text-primary shadow-xs'
            : 'text-text-secondary hover:text-text-primary hover:bg-black/5'
        ]"
        @click="activeTab = 'features'"
      >
        <Sparkles class="w-4 h-4 text-amber-500" />
        <span>{{ t('admin.settings.tabs.features') || 'Инновационные модули & ИИ (6 функций)' }}</span>
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

    <!-- TAB 4: Innovative Features & AI Control -->
    <div v-if="activeTab === 'features'" class="space-y-6">
      <!-- Status & KPI Strip -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl p-4 border border-border shadow-xs">
          <div class="flex items-center justify-between text-xs text-text-secondary font-medium">
            <span>Активные модули</span>
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl font-black text-text-primary">
              {{ [featuresForm.groupBuy.enabled, featuresForm.aiValuation.enabled, featuresForm.priceDropAlert.enabled, featuresForm.sellerComparison.enabled, featuresForm.aiAssistant.enabled, featuresForm.videoListing.enabled].filter(Boolean).length }} / 6
            </span>
            <span class="text-xs text-text-secondary">включено</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-4 border border-border shadow-xs">
          <div class="flex items-center justify-between text-xs text-text-secondary font-medium">
            <span>Групповые сборы</span>
            <Users class="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl font-black text-text-primary">
              {{ adminStore.featureStats?.activeGroups ?? 0 }}
            </span>
            <span class="text-xs text-text-secondary">активных групп</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-4 border border-border shadow-xs">
          <div class="flex items-center justify-between text-xs text-text-secondary font-medium">
            <span>Алерты снижения цен</span>
            <BellRing class="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl font-black text-text-primary">
              {{ adminStore.featureStats?.activeAlerts ?? 0 }}
            </span>
            <span class="text-xs text-text-secondary">подписок</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-4 border border-border shadow-xs">
          <div class="flex items-center justify-between text-xs text-text-secondary font-medium">
            <span>ИИ оценки и запросы</span>
            <Sparkles class="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl font-black text-text-primary">
              {{ (adminStore.featureStats?.aiEvaluationsCount ?? 0) + (adminStore.featureStats?.aiQueriesCount ?? 0) }}
            </span>
            <span class="text-xs text-text-secondary">запросов</span>
          </div>
        </div>
      </div>

      <!-- 6 Modules Control Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <!-- 1. Group Buy (Arkadaşlarınla Birlikte Satın Al) -->
        <div class="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4 relative overflow-hidden transition-all"
          :class="{ 'border-primary/50 shadow-md': featuresForm.groupBuy.enabled, 'opacity-70': !featuresForm.groupBuy.enabled }">
          <div class="flex items-start justify-between gap-4 pb-3 border-b border-border">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Users class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-text-primary">Совместные покупки</h3>
                  <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                    :class="featuresForm.groupBuy.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'">
                    {{ featuresForm.groupBuy.enabled ? 'АКТИВЕН' : 'ОТКЛЮЧЕН' }}
                  </span>
                </div>
                <p class="text-xs text-text-secondary mt-0.5">Arkadaşlarınla Birlikte Satın Al (Pinduoduo модель)</p>
              </div>
            </div>
            <!-- Master Toggle -->
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="featuresForm.groupBuy.enabled" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <p class="text-xs text-text-secondary">
            Позволяет покупателям объединяться в группы для получения оптовой скидки и делиться ссылкой в WhatsApp / Telegram.
          </p>

          <div class="space-y-3 pt-1">
            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1">
                Минимальное количество участников в группе
              </label>
              <input
                v-model.number="featuresForm.groupBuy.minParticipants"
                type="number"
                min="2"
                max="50"
                class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1">
                Длительность сбора группы (в часах)
              </label>
              <input
                v-model.number="featuresForm.groupBuy.defaultDurationHours"
                type="number"
                min="1"
                max="168"
                class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div class="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] border border-border">
              <span class="text-xs font-bold text-text-primary">
                Автовозврат средств при истечении времени сбора
              </span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="featuresForm.groupBuy.autoRefundOnFail" type="checkbox" class="sr-only peer" />
                <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- 2. AI Valuation (Ürünümü Değerlendir / Fiyatını Belirle) -->
        <div class="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4 relative overflow-hidden transition-all"
          :class="{ 'border-primary/50 shadow-md': featuresForm.aiValuation.enabled, 'opacity-70': !featuresForm.aiValuation.enabled }">
          <div class="flex items-start justify-between gap-4 pb-3 border-b border-border">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                <Sparkles class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-text-primary">ИИ Оценка стоимости товаров</h3>
                  <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                    :class="featuresForm.aiValuation.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'">
                    {{ featuresForm.aiValuation.enabled ? 'АКТИВЕН' : 'ОТКЛЮЧЕН' }}
                  </span>
                </div>
                <p class="text-xs text-text-secondary mt-0.5">Ürünümü Değerlendir & Быстрое создание лота за 30 сек</p>
              </div>
            </div>
            <!-- Master Toggle -->
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="featuresForm.aiValuation.enabled" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <p class="text-xs text-text-secondary">
            Анализирует фото товара с помощью Google Gemini Vision, определяет категорию, состояние, рыночный диапазон цен и автоматически заполняет форму продажи.
          </p>

          <div class="space-y-3 pt-1">
            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1">
                Модель ИИ
              </label>
              <select
                v-model="featuresForm.aiValuation.model"
                class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Рекомендуется)</option>
                <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                <option value="heuristic">Локальный эвристический анализ платформы</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1">
                  Маржа диапазона (± %)
                </label>
                <input
                  v-model.number="featuresForm.aiValuation.priceMarginPct"
                  type="number"
                  min="5"
                  max="50"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1">
                  Дневной лимит оценок/юзер
                </label>
                <input
                  v-model.number="featuresForm.aiValuation.dailyUserLimit"
                  type="number"
                  min="1"
                  max="100"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div class="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] border border-border">
              <span class="text-xs font-bold text-text-primary">
                Требовать ручную премодерацию лотов с ИИ
              </span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="featuresForm.aiValuation.requireAdminModeration" type="checkbox" class="sr-only peer" />
                <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- 3. Price Drop Alerts (Fiyat Takibi) -->
        <div class="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4 relative overflow-hidden transition-all"
          :class="{ 'border-primary/50 shadow-md': featuresForm.priceDropAlert.enabled, 'opacity-70': !featuresForm.priceDropAlert.enabled }">
          <div class="flex items-start justify-between gap-4 pb-3 border-b border-border">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <BellRing class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-text-primary">Отслеживание снижения цен</h3>
                  <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                    :class="featuresForm.priceDropAlert.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'">
                    {{ featuresForm.priceDropAlert.enabled ? 'АКТИВЕН' : 'ОТКЛЮЧЕН' }}
                  </span>
                </div>
                <p class="text-xs text-text-secondary mt-0.5">Fiyat Takibi / Fiyat Düştüğünde Bildirim</p>
              </div>
            </div>
            <!-- Master Toggle -->
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="featuresForm.priceDropAlert.enabled" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <p class="text-xs text-text-secondary">
            Покупатели могут подписаться на лот с желаемой ценой или получать мгновенный сигнал при любом снижении стоимости.
          </p>

          <div class="space-y-3 pt-1">
            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1">
                Минимальный процент снижения для уведомления (%)
              </label>
              <input
                v-model.number="featuresForm.priceDropAlert.minDropPct"
                type="number"
                min="1"
                max="50"
                class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1.5">
                Разрешенные каналы оповещения
              </label>
              <div class="grid grid-cols-3 gap-2">
                <label class="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-black/[0.02] cursor-pointer text-xs font-medium text-text-primary">
                  <input v-model="featuresForm.priceDropAlert.channels.inApp" type="checkbox" class="rounded text-primary focus:ring-0" />
                  <span>В приложении</span>
                </label>
                <label class="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-black/[0.02] cursor-pointer text-xs font-medium text-text-primary">
                  <input v-model="featuresForm.priceDropAlert.channels.email" type="checkbox" class="rounded text-primary focus:ring-0" />
                  <span>Email</span>
                </label>
                <label class="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-black/[0.02] cursor-pointer text-xs font-medium text-text-primary">
                  <input v-model="featuresForm.priceDropAlert.channels.push" type="checkbox" class="rounded text-primary focus:ring-0" />
                  <span>Web Push</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Seller Comparison (Birden Fazla Satıcıyı Karşılaştırma) -->
        <div class="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4 relative overflow-hidden transition-all"
          :class="{ 'border-primary/50 shadow-md': featuresForm.sellerComparison.enabled, 'opacity-70': !featuresForm.sellerComparison.enabled }">
          <div class="flex items-start justify-between gap-4 pb-3 border-b border-border">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
                <GitCompare class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-text-primary">Сравнение предложений продавцов</h3>
                  <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                    :class="featuresForm.sellerComparison.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'">
                    {{ featuresForm.sellerComparison.enabled ? 'АКТИВЕН' : 'ОТКЛЮЧЕН' }}
                  </span>
                </div>
                <p class="text-xs text-text-secondary mt-0.5">Birden Fazla Satıcıyı Karşılaştırma & Лучшее предложение</p>
              </div>
            </div>
            <!-- Master Toggle -->
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="featuresForm.sellerComparison.enabled" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <p class="text-xs text-text-secondary">
            Показывает таблицу с предложениями других продавцов одного и того же товара (цена, город, рейтинг, бейдж «Лучшая цена»).
          </p>

          <div class="space-y-3 pt-1">
            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1">
                Алгоритм определения «Лучшее предложение»
              </label>
              <select
                v-model="featuresForm.sellerComparison.algorithm"
                class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="lowest_price">Только наименьшая цена (Lowest Price)</option>
                <option value="best_value_weighted">Взвешенный баланс (Цена + Рейтинг + Доставка)</option>
                <option value="fastest_delivery">Близость к покупателю / Быстрая доставка</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1">
                Минимум продавцов для отображения блока сравнения
              </label>
              <input
                v-model.number="featuresForm.sellerComparison.minSellerCount"
                type="number"
                min="1"
                max="10"
                class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div class="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] border border-border">
              <span class="text-xs font-bold text-text-primary">
                Автоматически сопоставлять товары по схожим названиям
              </span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="featuresForm.sellerComparison.autoMatchByTitle" type="checkbox" class="sr-only peer" />
                <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- 5. AI Shopping Assistant (Akıllı Alışveriş Asistanı) -->
        <div class="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4 relative overflow-hidden transition-all"
          :class="{ 'border-primary/50 shadow-md': featuresForm.aiAssistant.enabled, 'opacity-70': !featuresForm.aiAssistant.enabled }">
          <div class="flex items-start justify-between gap-4 pb-3 border-b border-border">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <Bot class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-text-primary">Умный ассистент по покупкам</h3>
                  <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                    :class="featuresForm.aiAssistant.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'">
                    {{ featuresForm.aiAssistant.enabled ? 'АКТИВЕН' : 'ОТКЛЮЧЕН' }}
                  </span>
                </div>
                <p class="text-xs text-text-secondary mt-0.5">Akıllı Alışveriş Asistanı & Персональный шопинг-гид</p>
              </div>
            </div>
            <!-- Master Toggle -->
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="featuresForm.aiAssistant.enabled" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <p class="text-xs text-text-secondary">
            Диалоговый ИИ-консультант в правом нижнем углу сайта: понимает бюджет и пожелания покупателя, ищет реальные товары в БД и выдает интерактивные карточки.
          </p>

          <div class="space-y-3 pt-1">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1">
                  Макс. карточек товаров в ответе
                </label>
                <input
                  v-model.number="featuresForm.aiAssistant.maxResults"
                  type="number"
                  min="1"
                  max="10"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div class="flex flex-col justify-end">
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] border border-border">
                  <span class="text-xs font-bold text-text-primary">
                    Быстрые вопросы
                  </span>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input v-model="featuresForm.aiAssistant.showSuggestions" type="checkbox" class="sr-only peer" />
                    <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1">
                Системный промпт (Инструкция ассистента)
              </label>
              <textarea
                v-model="featuresForm.aiAssistant.systemPrompt"
                rows="3"
                class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none font-mono"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- 6. Video Listings (Video ile Ürün Satışı) -->
        <div class="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4 relative overflow-hidden transition-all"
          :class="{ 'border-primary/50 shadow-md': featuresForm.videoListing.enabled, 'opacity-70': !featuresForm.videoListing.enabled }">
          <div class="flex items-start justify-between gap-4 pb-3 border-b border-border">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                <Video class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-text-primary">Продажа товаров с видео</h3>
                  <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                    :class="featuresForm.videoListing.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'">
                    {{ featuresForm.videoListing.enabled ? 'АКТИВЕН' : 'ОТКЛЮЧЕН' }}
                  </span>
                </div>
                <p class="text-xs text-text-secondary mt-0.5">Video ile Ürün Satışı (15–30 сек ролики)</p>
              </div>
            </div>
            <!-- Master Toggle -->
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="featuresForm.videoListing.enabled" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <p class="text-xs text-text-secondary">
            Продавцы могут прикреплять короткие 15–30 сек видеоролики к лотам. В каталоге такие лоты получают бейдж «С видео» и встроенный плеер.
          </p>

          <div class="space-y-3 pt-1">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1">
                  Макс. длительность видео (сек)
                </label>
                <input
                  v-model.number="featuresForm.videoListing.maxDurationSeconds"
                  type="number"
                  min="5"
                  max="120"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1">
                  Макс. размер файла (МБ)
                </label>
                <input
                  v-model.number="featuresForm.videoListing.maxFileSizeMb"
                  type="number"
                  min="5"
                  max="100"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div class="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] border border-border">
              <span class="text-xs font-bold text-text-primary">
                Обязательная модерация видео перед публикацией
              </span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="featuresForm.videoListing.moderationRequired" type="checkbox" class="sr-only peer" />
                <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
