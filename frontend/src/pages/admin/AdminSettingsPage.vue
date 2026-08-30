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
import type { PlatformSettings } from '@/types/admin'

const adminStore = useAdminStore()
const uiStore = useUIStore()

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
          <span>Site Genel Ayarları (Системалык Жөндөөлөр)</span>
        </h1>
        <p class="text-xs text-text-secondary mt-1">
          Platform komisyonu, anti-sniping kuralları, teminat oranları, iletişim bilgileri ve sistem parametreleri
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary bg-white hover:bg-accent border border-border shadow-xs flex items-center gap-1.5 transition-all"
          @click="handleReset"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>Sıfırla</span>
        </button>

        <button
          type="button"
          :disabled="isSaving"
          class="px-5 py-2 rounded-xl text-xs font-bold text-text-primary bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
          @click="handleSave"
        >
          <Save class="w-3.5 h-3.5" />
          <span>{{ isSaving ? 'Сакталууда...' : 'Değişiklikleri Kaydet' }}</span>
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
      <button
        type="button"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
          activeTab === 'general'
            ? 'bg-primary text-text-primary shadow-xs'
            : 'text-text-secondary hover:text-text-primary hover:bg-black/5'
        ]"
        @click="activeTab = 'general'"
      >
        <Globe class="w-4 h-4" />
        <span>Platform & İletişim</span>
      </button>

      <button
        type="button"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
          activeTab === 'auction'
            ? 'bg-primary text-text-primary shadow-xs'
            : 'text-text-secondary hover:text-text-primary hover:bg-black/5'
        ]"
        @click="activeTab = 'auction'"
      >
        <Sliders class="w-4 h-4" />
        <span>Açık Artırma & Finans Kuralları</span>
      </button>

      <button
        type="button"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
          activeTab === 'security'
            ? 'bg-primary text-text-primary shadow-xs'
            : 'text-text-secondary hover:text-text-primary hover:bg-black/5'
        ]"
        @click="activeTab = 'security'"
      >
        <Shield class="w-4 h-4" />
        <span>Güvenlik, KYC & Bakım Modu</span>
      </button>
    </div>

    <!-- TAB 1: Platform & İletişim -->
    <div v-if="activeTab === 'general'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
        <h2 class="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
          <Building class="w-4 h-4 text-primary" />
          <span>Platform Bilgileri</span>
        </h2>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">Site Adı</label>
          <input
            v-model="form.siteName"
            type="text"
            class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">Site Başlığı (SEO Title)</label>
          <input
            v-model="form.siteTitle"
            type="text"
            class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">Site Açıklaması (Meta Description)</label>
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
          <span>Müşteri Hizmetleri & İletişim</span>
        </h2>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1 flex items-center gap-1.5">
            <Mail class="w-3.5 h-3.5 text-primary" />
            <span>Destek E-posta Adresi</span>
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
            <span>WhatsApp Destek Hattı</span>
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
            <span>Resmi Çağrı Merkezi Telefonu</span>
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
            <span>Şirket / Ofis Adresi</span>
          </label>
          <input
            v-model="form.address"
            type="text"
            class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>
    </div>

    <!-- TAB 2: Açık Artırma & Finans Kuralları -->
    <div v-if="activeTab === 'auction'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
        <h2 class="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
          <Percent class="w-4 h-4 text-primary" />
          <span>Platform Komisyon Oranı & Para Birimi</span>
        </h2>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">
            Platform Komisyonu (%) — Satış başına kesilen tutar
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
          <p class="text-[11px] text-text-muted mt-1">Örn: %8 komisyon ile 100.000 KGS satıştan 8.000 KGS platform geliri elde edilir.</p>
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">Varsayılan Para Birimi</label>
          <select
            v-model="form.currency"
            class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="KGS">KGS (Кыргыз сому - Kırgız Somu)</option>
            <option value="USD">USD ($ ABD Doları)</option>
            <option value="RUB">RUB (₽ Rus Rublesi)</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">Minimum Teklif Teminat Tutarı (KGS)</label>
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
          <p class="text-[11px] text-text-muted mt-1">Kullanıcının teklif vermesi için cüzdanında bulunması gereken asgari teminat bakiyesi.</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
        <h2 class="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
          <Clock class="w-4 h-4 text-primary" />
          <span>Anti-Sniping (Son Dakika Teklif Uzatması)</span>
        </h2>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">Tetiklenme Süresi (Son kaç dakika kala?)</label>
          <div class="relative">
            <input
              v-model.number="form.antiSnipingTriggerMinutes"
              type="number"
              min="1"
              max="30"
              class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <span class="absolute right-3.5 top-2.5 text-xs font-bold text-text-muted">Dakika</span>
          </div>
          <p class="text-[11px] text-text-muted mt-1">Açık artırmanın bitimine bu süreden az kaldığında teklif gelirse süre otomatik uzar.</p>
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">Eklenecek İlave Süre</label>
          <div class="relative">
            <input
              v-model.number="form.antiSnipingMinutes"
              type="number"
              min="1"
              max="60"
              class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-text-primary text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <span class="absolute right-3.5 top-2.5 text-xs font-bold text-text-muted">Dakika</span>
          </div>
          <p class="text-[11px] text-text-muted mt-1">Her son dakika teklifinde sayaç bu kadar dakika ileri alınır (Adil rekabet).</p>
        </div>
      </div>
    </div>

    <!-- TAB 3: Güvenlik, KYC & Bakım Modu -->
    <div v-if="activeTab === 'security'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-5">
        <h2 class="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
          <Lock class="w-4 h-4 text-primary" />
          <span>Güvenlik & Doğrulama Politikaları</span>
        </h2>

        <div class="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.02] border border-border">
          <div>
            <span class="text-sm font-bold text-text-primary block">Teklif Vermek İçin KYC Zorunluluğu</span>
            <span class="text-[11px] text-text-secondary block mt-0.5">Sadece pasaportu/İNN'i onaylanmış üyeler teklif verebilsin</span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="form.kycRequiredToBid" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div class="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.02] border border-border">
          <div>
            <span class="text-sm font-bold text-text-primary block">İlanların Otomatik Onaylanması</span>
            <span class="text-[11px] text-text-secondary block mt-0.5">Kapalıyken tüm yeni ilanlar admin moderasyonundan geçer</span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="form.autoApproveAuctions" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div class="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.02] border border-border">
          <div>
            <span class="text-sm font-bold text-text-primary block">İki Adımlı Doğrulama (2FA) Zorunluluğu</span>
            <span class="text-[11px] text-text-secondary block mt-0.5">Tüm satıcılar ve moderatörler için 2FA mecburi olsun</span>
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
          <span>Sistem Bakım Modu (Maintenance Mode)</span>
        </h2>

        <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 space-y-2">
          <span class="font-bold block">⚠️ Dikkat: Bakım Modu Açıldığında</span>
          <p>
            Normal kullanıcılar siteye girdiğinde "Sistem Güncelleniyor" bakım sayfası ile karşılaşır. Yalnızca Admin ve Moderatörler panele erişebilir.
          </p>
        </div>

        <div class="flex items-center justify-between p-4 rounded-xl bg-black/[0.02] border border-border">
          <div>
            <span class="text-sm font-bold text-text-primary block">Bakım Modunu Aktifleştir</span>
            <span class="text-[11px] text-text-secondary block mt-0.5">Platform genelinde erişimi geçici olarak durdur</span>
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
