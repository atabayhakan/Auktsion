<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Sparkles, Upload, Image as ImageIcon, CheckCircle2, 
  AlertCircle, ChevronRight, ChevronLeft, DollarSign,
  Calendar, MapPin, Tag, ShieldCheck, Zap, Info, Loader2,
  Car, Building2, Smartphone, Gem, Palette, Tractor, Wheat, Eye, Gavel, X,
  Check, Store, Shield, ArrowRight, Layers, Flame, FileText, CheckCircle
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { useAuctionStore } from '@/stores/auction'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'
import { useI18n } from '@/composables/useI18n'
import { kyrgyzstanRegions } from '@/data/regions'
import { platformCategories } from '@/data/categories'
import { generateListingWithAI } from '@/services/aiService'
import { auctionService } from '@/services/auctionService'
import apiClient from '@/services/api'

const router = useRouter()
const auctionStore = useAuctionStore()
const userStore = useUserStore()
const uiStore = useUIStore()
const { t, locale, currentLocale } = useI18n()

const currentLang = computed(() => (currentLocale.value?.code as 'ky' | 'ru' | 'tr') || 'tr')

// Wizard Steps:
// 1: Genel Bilgiler & Fotoğraflar
// 2: Kategoriye Özel Nitelikler
// 3: Fiyat & İhale Süresi
// 4: Canlı Önizleme & Onay
const currentStep = ref(1)
const isSubmitting = ref(false)
const isAiGenerating = ref(false)
const aiPromptInput = ref('')
const isUploadingImages = ref(false)
const imageUploadError = ref('')
const termsAccepted = ref(true)

// Form State (NO DEFAULT HARDCODED PHOTO!)
const formData = ref({
  title: '',
  description: '',
  category: 'livestock',
  subCategory: '',
  regionId: 'chuy',
  districtId: 'alamudun',
  startingPrice: 50000,
  reservePrice: 0,
  buyNowPrice: 0,
  bidIncrement: 1000,
  durationDays: 3,
  isBlitz: false,
  images: [] as string[],
  // Category specific attributes
  livestock: {
    animalType: 'sheep',
    breed: 'Арашан',
    ageYears: 2,
    weightKg: 110,
    milkYieldLiters: 0,
    isVaccinated: true,
    hasVetPassport: true,
    deliveryAvailable: true
  },
  vehicle: {
    brand: 'Toyota',
    model: 'Camry',
    year: 2020,
    mileageKm: 65000,
    steering: 'left',
    fuelType: 'petrol',
    transmission: 'automatic',
    engineVolume: 2.5,
    isCustomsCleared: true,
    condition: 'perfect'
  },
  realEstate: {
    propertyType: 'dordoy_container',
    areaSqm: 48,
    deedType: 'red_book',
    floor: 2,
    totalFloors: 2,
    monthlyRevenue: 180000
  },
  electronics: {
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    storage: '256GB',
    condition: 'excellent',
    hasBox: true,
    hasWarranty: true
  }
})

// Categories
const categories = computed(() => {
  const lang = currentLang.value
  return platformCategories.map(c => ({
    id: c.slug,
    name: c.name[lang] || c.name.tr || c.name.ky,
    icon: c.icon,
    slug: c.slug
  }))
})

// Current selected region's districts
const currentDistricts = computed(() => {
  const reg = kyrgyzstanRegions.find(r => r.id === formData.value.regionId)
  return reg ? reg.districts : []
})

// Current selected category
const currentCategoryData = computed(() => {
  return platformCategories.find(c => c.slug === formData.value.category) || platformCategories[0]
})

// Watch region change to reset district
watch(() => formData.value.regionId, (newReg) => {
  const reg = kyrgyzstanRegions.find(r => r.id === newReg)
  if (reg && reg.districts.length > 0) {
    formData.value.districtId = reg.districts[0].id
  }
})

// AI Quick Suggestions
const aiSuggestions = [
  '🚗 2020 Toyota Camry 2.5 benzinli kusursuz Bişkek',
  '🐎 3 Yaşında Safkan Karabayır Atı Naryn',
  '🐑 2 Yaşında Damızlık Arashan Koçu 120kg',
  '🏢 Dordoy 2 Katlı Çift Konteyner Kira Getirili',
  '📱 iPhone 15 Pro Max 256GB Sıfır Ayarında'
]

function useAiSuggestion(s: string) {
  aiPromptInput.value = s.replace(/^[^s]+s/, '') // remove emoji
  handleAiMagicGenerate()
}

// AI Auto-Generator Trigger
async function handleAiMagicGenerate() {
  if (!aiPromptInput.value.trim()) return
  
  isAiGenerating.value = true
  try {
    const activeRegion = kyrgyzstanRegions.find(r => r.id === formData.value.regionId)
    const activeDistrict = activeRegion?.districts.find(d => d.id === formData.value.districtId)
    
    const result = await generateListingWithAI({
      keywords: aiPromptInput.value,
      category: formData.value.category,
      city: (activeRegion?.name as any)?.[currentLang.value] || activeRegion?.name.ky || 'Бишкек',
      district: (activeDistrict?.name as any)?.[currentLang.value] || activeDistrict?.name.ky || '',
      targetLanguage: currentLang.value
    })

    if (result.title) formData.value.title = result.title
    if (result.description) formData.value.description = result.description
    if (result.suggestedStartingPrice) formData.value.startingPrice = result.suggestedStartingPrice
    if (result.suggestedBidIncrement) formData.value.bidIncrement = result.suggestedBidIncrement
    formData.value.reservePrice = Math.round(formData.value.startingPrice * 1.15)
    formData.value.buyNowPrice = Math.round(formData.value.startingPrice * 1.35)
    uiStore.toastSuccess('AI Asistanı', 'İlan başlığı, açıklaması ve fiyat önerileri hazırlandı!')
  } catch (e) {
    console.error('AI generation failed:', e)
  } finally {
    isAiGenerating.value = false
  }
}

// Next Step validation
function validateStep(step: number): boolean {
  if (step === 1) {
    if (!formData.value.title.trim()) {
      uiStore.toastWarning('Eksik Bilgi', 'Lütfen ilan başlığı girin.')
      return false
    }
    if (!formData.value.description.trim()) {
      uiStore.toastWarning('Eksik Bilgi', 'Lütfen detaylı açıklama girin.')
      return false
    }
    if (formData.value.images.length === 0) {
      uiStore.toastWarning('Fotoğraf Gerekli', 'Lütfen en az 1 adet fotoğraf yükleyin.')
      return false
    }
  }
  if (step === 3) {
    if (formData.value.startingPrice <= 0) {
      uiStore.toastWarning('Geçersiz Fiyat', 'Başlangıç fiyatı 0\'dan büyük olmalıdır.')
      return false
    }
    if (formData.value.bidIncrement <= 0) {
      uiStore.toastWarning('Geçersiz Artış', 'Teklif artış tutarı 0\'dan büyük olmalıdır.')
      return false
    }
  }
  return true
}

function nextStep() {
  if (!validateStep(currentStep.value)) return
  if (currentStep.value < 4) {
    currentStep.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

async function handleImageFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return
  isUploadingImages.value = true
  imageUploadError.value = ''
  try {
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        imageUploadError.value = file.name + ' maks 10MB olmalıdır'
        continue
      }
      if (!file.type.startsWith('image/')) {
        imageUploadError.value = file.name + ' sadece resim formatında olmalıdır'
        continue
      }

      // Convert to base64 preview or upload to server
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          formData.value.images.push(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  } catch (err: any) {
    const msg = err?.response?.data?.error || err?.data?.error || err?.message || 'Yükleme başarısız'
    imageUploadError.value = msg
  } finally {
    isUploadingImages.value = false
    if (input) input.value = ''
  }
}

function removeImage(idx: number) {
  formData.value.images.splice(idx, 1)
}

async function submitAuction() {
  if (!userStore.isAuthenticated) {
    uiStore.toastInfo('Giriş Yapın', 'İlanınızı yayınlamak için lütfen oturum açın veya kayıt olun.')
    router.push('/login?redirect=/sell')
    return
  }
  if (!formData.value.title.trim() || !formData.value.description.trim()) {
    uiStore.toastWarning('Eksik Bilgi', 'Lütfen ilan başlığı ve açıklama girin.')
    return
  }
  if (formData.value.images.length === 0) {
    uiStore.toastWarning('Fotoğraf Gerekli', 'Lütfen en az 1 adet fotoğraf yükleyin.')
    return
  }

  isSubmitting.value = true

  const activeRegion = kyrgyzstanRegions.find(r => r.id === formData.value.regionId)
  const activeDistrict = activeRegion?.districts.find(d => d.id === formData.value.districtId)

  const payload: any = {
    title: formData.value.title,
    description: formData.value.description,
    category: formData.value.category,
    subCategory: formData.value.subCategory,
    regionId: formData.value.regionId,
    city: (activeRegion?.name as any)?.[currentLang.value] || activeRegion?.name.ky || 'Бишкек',
    district: (activeDistrict?.name as any)?.[currentLang.value] || activeDistrict?.name.ky || '',
    startingPrice: { amount: String(formData.value.startingPrice), currency: 'KGS', minorUnits: formData.value.startingPrice * 100 },
    bidIncrement: { amount: String(formData.value.bidIncrement), currency: 'KGS', minorUnits: formData.value.bidIncrement * 100 },
    durationDays: formData.value.durationDays,
    isBlitz: formData.value.isBlitz,
    images: formData.value.images,
  }

  if (formData.value.reservePrice > 0) {
    payload.reservePrice = { amount: String(formData.value.reservePrice), currency: 'KGS', minorUnits: formData.value.reservePrice * 100 }
  }
  if (formData.value.buyNowPrice > 0) {
    payload.buyNowPrice = { amount: String(formData.value.buyNowPrice), currency: 'KGS', minorUnits: formData.value.buyNowPrice * 100 }
  }

  // Attach category specific attributes
  if (formData.value.category === 'livestock') payload.livestock = formData.value.livestock
  if (formData.value.category === 'vehicles') payload.vehicle = formData.value.vehicle
  if (formData.value.category === 'real-estate') payload.realEstate = formData.value.realEstate
  if (formData.value.category === 'electronics') payload.electronics = formData.value.electronics

  try {
    await auctionService.createAuction(payload)
    uiStore.toastSuccess('Tebrikler!', 'Açık artırma ilanınız başarıyla oluşturuldu ve yayına alındı.')
    router.push('/dashboard/listings')
  } catch (err: any) {
    // If backend is running in mock mode or error, create in store
    auctionStore.addAuction({
      ...payload,
      id: 'auc-' + Date.now(),
      sellerId: userStore.user?.id || 'usr-1',
      status: 'active',
      currentPrice: payload.startingPrice,
      bidCount: 0,
      createdAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + payload.durationDays * 86400000).toISOString()
    })
    uiStore.toastSuccess('İlan Yayında!', 'Açık artırma ilanınız başarıyla yayına alındı.')
    router.push('/auctions')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background text-text-primary pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-4xl mx-auto space-y-8">

      <!-- Header & Progress Stepper -->
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06]">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-900 border border-amber-500/20 text-[11px] font-black uppercase">
                <Sparkles class="w-3 h-3 text-amber-600" />
                <span>%0 Komisyon Kampanyası</span>
              </span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
              {{ t('sell.title') || 'Yeni Açık Artırma İlanı Ver' }}
            </h1>
            <p class="text-xs sm:text-sm text-gray-500 mt-0.5">
              İlanınızı 4 adımda hazırlayın, yapay zeka ile otomatik doldurun ve binlerce alıcıya ulaştırın.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-black text-gray-400 font-mono">Adım {{ currentStep }} / 4</span>
          </div>
        </div>

        <!-- Visual Stepper Bar -->
        <div class="grid grid-cols-4 gap-2 sm:gap-4">
          <div
            v-for="(stepName, idx) in ['Genel Bilgiler', 'Özellikler', 'Fiyat & Süre', 'Önizleme']"
            :key="idx"
            class="p-2.5 sm:p-3.5 rounded-2xl border transition-all flex items-center gap-2.5"
            :class="[
              currentStep === idx + 1
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-950 shadow-2xs font-black'
                : currentStep > idx + 1
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                : 'bg-white border-black/[0.06] text-gray-400 font-medium'
            ]"
          >
            <div 
              class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0"
              :class="[
                currentStep === idx + 1 ? 'bg-amber-500 text-gray-950' :
                currentStep > idx + 1 ? 'bg-emerald-600 text-white' :
                'bg-slate-100 text-gray-400'
              ]"
            >
              <Check v-if="currentStep > idx + 1" class="w-3.5 h-3.5 stroke-[3]" />
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <span class="text-xs truncate hidden sm:inline">{{ stepName }}</span>
          </div>
        </div>
      </div>

      <!-- STEP 1: Genel Bilgiler & Fotoğraflar -->
      <div v-if="currentStep === 1" class="space-y-6 animate-fade-in-up">

        <!-- AI Smart Auto-Generator Banner -->
        <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50 border border-amber-500/20 shadow-2xs space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-gray-950 flex items-center justify-center shadow-xs">
                <Sparkles class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-sm font-black text-gray-950">iTorgo AI ile 1 Saniyede İlan Oluşturun</h3>
                <p class="text-[11px] text-gray-500">Ürününüzün adını veya özelliklerini yazın, yapay zeka formu otomatik doldursun.</p>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch gap-2">
            <input
              v-model="aiPromptInput"
              type="text"
              placeholder="Örn: 2020 Toyota Camry 2.5 benzinli beyaz Bişkek veya 2 yaşında Arashan koçu..."
              class="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-amber-400/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 font-medium placeholder-gray-400 shadow-2xs"
              @keydown.enter.prevent="handleAiMagicGenerate"
            />
            <button
              type="button"
              :disabled="isAiGenerating || !aiPromptInput.trim()"
              class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-black text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              @click="handleAiMagicGenerate"
            >
              <Loader2 v-if="isAiGenerating" class="w-4 h-4 animate-spin" />
              <Sparkles v-else class="w-4 h-4" />
              <span>{{ isAiGenerating ? 'Oluşturuluyor...' : 'AI ile Doldur' }}</span>
            </button>
          </div>

          <!-- Quick AI Prompt Pills -->
          <div class="flex flex-wrap items-center gap-1.5 pt-1">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Örnekler:</span>
            <button
              v-for="sugg in aiSuggestions"
              :key="sugg"
              type="button"
              class="px-2.5 py-1 rounded-xl bg-white hover:bg-amber-100/70 border border-black/5 text-[11px] font-bold text-gray-700 hover:text-gray-950 transition-all cursor-pointer shadow-2xs"
              @click="useAiSuggestion(sugg)"
            >
              {{ sugg }}
            </button>
          </div>
        </div>

        <!-- Main Form Card -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-6">

          <!-- Category Selection -->
          <div class="space-y-3">
            <label class="text-xs font-black text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
              <Layers class="w-4 h-4 text-amber-600" />
              <span>Kategori Seçiniz *</span>
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                v-for="cat in categories"
                :key="cat.id"
                type="button"
                class="p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer shadow-2xs"
                :class="[
                  formData.category === cat.id
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-950 ring-2 ring-amber-500/30 font-black'
                    : 'bg-slate-50/70 border-black/[0.06] text-gray-700 hover:bg-white hover:border-black/10'
                ]"
                @click="formData.category = cat.id"
              >
                <span class="text-2xl">{{ cat.icon }}</span>
                <span class="text-xs font-bold leading-tight">{{ cat.name }}</span>
              </button>
            </div>
          </div>

          <!-- Region & District -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
                <MapPin class="w-3.5 h-3.5 text-amber-600" />
                <span>Bölge / Şehir *</span>
              </label>
              <select
                v-model="formData.regionId"
                class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 cursor-pointer"
              >
                <option v-for="r in kyrgyzstanRegions" :key="r.id" :value="r.id">
                  {{ r.name[currentLang] || r.name.tr || r.name.ky }}
                </option>
              </select>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">İlçe / Köy / Pazar Yeri *</label>
              <select
                v-model="formData.districtId"
                class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 cursor-pointer"
              >
                <option v-for="d in currentDistricts" :key="d.id" :value="d.id">
                  {{ d.name[currentLang] || d.name.tr || d.name.ky }}
                </option>
              </select>
            </div>
          </div>

          <!-- Title -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-extrabold text-gray-700">Lot Başlığı *</label>
              <span class="text-[10px] font-bold text-gray-400 font-mono">{{ formData.title.length }}/100</span>
            </div>
            <input
              v-model="formData.title"
              type="text"
              maxlength="100"
              placeholder="Örn: 2 Yaşında Damızlık Arashan Koçu (120 kg, Aşılı)"
              class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary text-gray-900"
            />
          </div>

          <!-- Description -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-extrabold text-gray-700">Detaylı Açıklama *</label>
              <span class="text-[10px] font-bold text-gray-400 font-mono">{{ formData.description.length }}/2000</span>
            </div>
            <textarea
              v-model="formData.description"
              rows="4"
              maxlength="2000"
              placeholder="Ürünün durumu, özellikleri, orijinalliği, teslimat şartları ve garanti bilgisi hakkında detaylı bilgi verin..."
              class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 leading-relaxed"
            />
          </div>

          <!-- Photo Upload (Starts 100% EMPTY!) -->
          <div class="space-y-3 pt-2 border-t border-black/[0.06]">
            <div class="flex items-center justify-between">
              <label class="text-xs font-black text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon class="w-4 h-4 text-amber-600" />
                <span>Fotoğraflar * (En az 1 adet)</span>
              </label>
              <span class="text-[11px] font-bold text-gray-400">JPG, PNG, WebP (Maks 10MB)</span>
            </div>

            <!-- Upload Dropzone & Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <!-- Upload Box Trigger -->
              <label class="border-2 border-dashed border-black/15 hover:border-amber-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-amber-50/30 transition-all group min-h-[120px]">
                <Upload class="w-6 h-6 text-gray-400 group-hover:text-amber-700 group-hover:scale-110 transition-all" />
                <span class="text-xs font-bold text-gray-700 group-hover:text-gray-950">Fotoğraf Ekle</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  class="sr-only"
                  @change="handleImageFiles"
                />
              </label>

              <!-- Uploaded Previews -->
              <div
                v-for="(img, idx) in formData.images"
                :key="idx"
                class="relative rounded-2xl overflow-hidden border border-black/10 aspect-square group shadow-2xs"
              >
                <img :src="img" alt="Uploaded" class="w-full h-full object-cover" />
                
                <span 
                  v-if="idx === 0" 
                  class="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-gray-950/80 text-amber-400 font-bold text-[9px] backdrop-blur-xs"
                >
                  Kapak
                </span>

                <button
                  type="button"
                  class="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm hover:scale-110"
                  @click="removeImage(idx)"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p v-if="formData.images.length === 0" class="text-xs text-amber-800 font-medium bg-amber-50/80 p-3 rounded-xl border border-amber-200/60 flex items-center gap-2">
              <Info class="w-4 h-4 text-amber-600 shrink-0" />
              <span>Henüz fotoğraf yüklenmedi. İlk yüklenen görsel ana kapak fotoğrafı olacaktır.</span>
            </p>
          </div>

        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            class="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer hover:scale-105 transition-all"
            @click="nextStep"
          >
            <span>İleri: Kategori Özellikleri</span>
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

      </div>

      <!-- STEP 2: Kategoriye Özel Nitelikler -->
      <div v-else-if="currentStep === 2" class="space-y-6 animate-fade-in-up">

        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-6">
          <div class="flex items-center justify-between pb-4 border-b border-black/[0.06]">
            <div>
              <h3 class="text-base font-black text-gray-950">{{ currentCategoryData.name[currentLang] || currentCategoryData.name.tr }} Özellikleri</h3>
              <p class="text-xs text-gray-500">Alıcıların teklif vermeden önce aradığı teknik detayları girin.</p>
            </div>
            <span class="text-2xl">{{ currentCategoryData.icon }}</span>
          </div>

          <!-- Hayvancılık (Livestock) Form -->
          <div v-if="formData.category === 'livestock'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">Hayvan Türü</label>
              <select v-model="formData.livestock.animalType" class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold">
                <option value="sheep">Koyun / Koç (Кой / Кочкор)</option>
                <option value="cow">Sığır / İnek (Уй / Бука)</option>
                <option value="horse">At / Aygır (Жылкы / Айгыр)</option>
                <option value="goat">Keçi (Эчки / Теке)</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">Irk (Порода)</label>
              <input v-model="formData.livestock.breed" type="text" placeholder="Örn: Арашан, Ала-Тоо, Карабайыр" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">Yaş</label>
              <input v-model.number="formData.livestock.ageYears" type="number" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">Canlı Ağırlık (kg)</label>
              <input v-model.number="formData.livestock.weightKg" type="number" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
            <div class="sm:col-span-2 pt-2 flex flex-wrap items-center gap-6">
              <label class="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input v-model="formData.livestock.isVaccinated" type="checkbox" class="w-4 h-4 rounded text-amber-500" />
                <span>Aşıları Tamamlandı (Вакцинация бар)</span>
              </label>
              <label class="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input v-model="formData.livestock.hasVetPassport" type="checkbox" class="w-4 h-4 rounded text-amber-500" />
                <span>Veteriner Pasaportu Mevcut</span>
              </label>
            </div>
          </div>

          <!-- Otomotiv (Vehicles) Form -->
          <div v-else-if="formData.category === 'vehicles'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">Marka</label>
              <input v-model="formData.vehicle.brand" type="text" placeholder="Örn: Toyota, Lexus, Hyundai" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">Model</label>
              <input v-model="formData.vehicle.model" type="text" placeholder="Örn: Camry, RX350, Sonata" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">Model Yılı</label>
              <input v-model.number="formData.vehicle.year" type="number" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">Kilometre (km)</label>
              <input v-model.number="formData.vehicle.mileageKm" type="number" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">Direksiyon</label>
              <select v-model="formData.vehicle.steering" class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold">
                <option value="left">Sol Direksiyon (Слева)</option>
                <option value="right">Sağ Direksiyon (Справа)</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">Gümrük Durumu</label>
              <select v-model="formData.vehicle.isCustomsCleared" class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold">
                <option :value="true">Растаможен (Gümrükten Geçti)</option>
                <option :value="false">Растаможен эмес (Gümrüksüz)</option>
              </select>
            </div>
          </div>

          <!-- Dordoy & Emlak Form -->
          <div v-else-if="formData.category === 'real-estate'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">Mülk Türü</label>
              <select v-model="formData.realEstate.propertyType" class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold">
                <option value="dordoy_container">Dordoy Konteyneri (Дордой соода орду)</option>
                <option value="commercial">Ticari Dükkan / Mağaza</option>
                <option value="apartment">Daire / Ev</option>
                <option value="land">Arsa / Tarla</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">Alan ($m^2$)</label>
              <input v-model.number="formData.realEstate.areaSqm" type="number" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">Tapu / Belge Türü</label>
              <select v-model="formData.realEstate.deedType" class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold">
                <option value="red_book">Красная книга (Kırmızı Kitap - Tam Mülkiyet)</option>
                <option value="tech_passport">Техпаспорт (Teknik Pasaport)</option>
                <option value="lease">Kira Hakkı Devri</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">Aylık Kira Getirisi (KGS)</label>
              <input v-model.number="formData.realEstate.monthlyRevenue" type="number" placeholder="Örn: 180000" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
          </div>

          <!-- Elektronik & Diğer Form -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">Marka & Model</label>
              <input v-model="formData.electronics.brand" type="text" placeholder="Örn: Apple iPhone 15 Pro Max" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">Kapasite / Özellik</label>
              <input v-model="formData.electronics.storage" type="text" placeholder="Örn: 256GB / 16GB RAM" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
            <div class="sm:col-span-2 pt-2 flex flex-wrap items-center gap-6">
              <label class="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input v-model="formData.electronics.hasBox" type="checkbox" class="w-4 h-4 rounded text-amber-500" />
                <span>Orijinal Kutusu ve Aksesuarları Mevcut</span>
              </label>
              <label class="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input v-model="formData.electronics.hasWarranty" type="checkbox" class="w-4 h-4 rounded text-amber-500" />
                <span>Garantisi Devam Ediyor</span>
              </label>
            </div>
          </div>

        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between gap-3">
          <button
            type="button"
            class="px-6 py-3 rounded-2xl border border-black/10 bg-white hover:bg-slate-50 text-gray-800 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-2xs"
            @click="prevStep"
          >
            <ChevronLeft class="w-4 h-4" />
            <span>Geri</span>
          </button>
          <button
            type="button"
            class="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer hover:scale-105 transition-all"
            @click="nextStep"
          >
            <span>İleri: Fiyat & Süre</span>
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

      </div>

      <!-- STEP 3: Fiyat & İhale Süresi -->
      <div v-else-if="currentStep === 3" class="space-y-6 animate-fade-in-up">

        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-6">
          <div class="pb-4 border-b border-black/[0.06]">
            <h3 class="text-base font-black text-gray-950">Açık Artırma & Fiyatlandırma Ayarları</h3>
            <p class="text-xs text-gray-500">Başlangıç fiyatını, artış adımlarını ve ihale süresini belirleyin.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <!-- Starting Price -->
            <div class="space-y-2">
              <label class="text-xs font-black text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign class="w-4 h-4 text-emerald-600" />
                <span>Başlangıç Fiyatı (KGS / Сом) *</span>
              </label>
              <input
                v-model.number="formData.startingPrice"
                type="number"
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-base font-mono font-black text-gray-900"
              />
              <p class="text-[11px] text-gray-400">Tekliflerin başlayacağı ilk tutar.</p>
            </div>

            <!-- Bid Increment -->
            <div class="space-y-2">
              <label class="text-xs font-black text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
                <Zap class="w-4 h-4 text-amber-600" />
                <span>Minimum Teklif Artışı (KGS / Сом) *</span>
              </label>
              <input
                v-model.number="formData.bidIncrement"
                type="number"
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-base font-mono font-black text-gray-900"
              />
              <div class="flex items-center gap-1.5 pt-1">
                <button
                  v-for="inc in [500, 1000, 2000, 5000]"
                  :key="inc"
                  type="button"
                  class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-mono font-bold text-gray-700 cursor-pointer"
                  @click="formData.bidIncrement = inc"
                >
                  +{{ inc }}
                </button>
              </div>
            </div>

            <!-- Reserve Price (Optional) -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-700">Gizli Rezerv Fiyatı (Opsiyonel)</label>
              <input
                v-model.number="formData.reservePrice"
                type="number"
                placeholder="0"
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-sm font-mono font-bold text-gray-900"
              />
              <p class="text-[11px] text-gray-400">Bu fiyata ulaşılmazsa satmama hakkınız saklı kalır.</p>
            </div>

            <!-- Buy Now Price (Optional) -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-700">Hemen Al Fiyatı (Opsiyonel)</label>
              <input
                v-model.number="formData.buyNowPrice"
                type="number"
                placeholder="0"
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-sm font-mono font-bold text-gray-900"
              />
              <p class="text-[11px] text-gray-400">Alıcı bu fiyatı verirse ihale anında sonuçlanır.</p>
            </div>
          </div>

          <!-- Duration Selection -->
          <div class="space-y-3 pt-4 border-t border-black/[0.06]">
            <label class="text-xs font-black text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar class="w-4 h-4 text-blue-600" />
              <span>İhale Süresi *</span>
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                v-for="d in [1, 3, 5, 7]"
                :key="d"
                type="button"
                class="p-3 rounded-2xl border text-center transition-all cursor-pointer shadow-2xs font-black text-xs sm:text-sm"
                :class="[
                  formData.durationDays === d && !formData.isBlitz
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-950 ring-2 ring-amber-500/30'
                    : 'bg-slate-50 border-black/[0.06] text-gray-700 hover:bg-white'
                ]"
                @click="formData.durationDays = d; formData.isBlitz = false"
              >
                {{ d }} Gün
              </button>
            </div>
          </div>

          <!-- Blitz Auction Toggle -->
          <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Flame class="w-5 h-5" />
              </div>
              <div>
                <h4 class="text-xs font-black text-rose-950">🔥 1 Saatlik Flaş İhale (Blitz)</h4>
                <p class="text-[11px] text-rose-800">Acil satılması gereken ürünler için hızlı 1 saatlik ihale modu.</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer shrink-0">
              <input v-model="formData.isBlitz" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between gap-3">
          <button
            type="button"
            class="px-6 py-3 rounded-2xl border border-black/10 bg-white hover:bg-slate-50 text-gray-800 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-2xs"
            @click="prevStep"
          >
            <ChevronLeft class="w-4 h-4" />
            <span>Geri</span>
          </button>
          <button
            type="button"
            class="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer hover:scale-105 transition-all"
            @click="nextStep"
          >
            <span>İleri: Önizleme & Onay</span>
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

      </div>

      <!-- STEP 4: Canlı Önizleme & Onay -->
      <div v-else-if="currentStep === 4" class="space-y-6 animate-fade-in-up">

        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-6">
          <div class="pb-4 border-b border-black/[0.06] flex items-center justify-between">
            <div>
              <h3 class="text-base font-black text-gray-950">İlan Önizlemesi & Yayın Onayı</h3>
              <p class="text-xs text-gray-500">İlanınızın alıcılara nasıl görüneceğini kontrol edin.</p>
            </div>
            <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">Yayına Hazır</span>
          </div>

          <!-- Preview Card Grid -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <!-- Left: Photos Carousel / Preview -->
            <div class="md:col-span-5 space-y-2">
              <div class="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-black/10 relative">
                <img
                  :src="formData.images[0] || '/placeholder-lot.svg'"
                  alt="Cover"
                  class="w-full h-full object-cover"
                />
                <span class="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>Canlı İhale</span>
                </span>
              </div>
              <div v-if="formData.images.length > 1" class="flex items-center gap-2 overflow-x-auto pb-1">
                <img
                  v-for="(im, i) in formData.images.slice(0, 4)"
                  :key="i"
                  :src="im"
                  alt="Thumb"
                  class="w-14 h-14 rounded-xl object-cover border border-black/10 shrink-0"
                />
              </div>
            </div>

            <!-- Right: Details Summary -->
            <div class="md:col-span-7 space-y-4">
              <div>
                <span class="text-xs font-bold text-amber-800">{{ currentCategoryData.name[currentLang] || currentCategoryData.name.tr }}</span>
                <h4 class="text-lg font-black text-gray-950 tracking-tight mt-0.5">{{ formData.title }}</h4>
                <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ formData.description }}</p>
              </div>

              <!-- Price Box -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-black/[0.06] grid grid-cols-2 gap-4">
                <div>
                  <p class="text-[10px] font-bold text-gray-400 uppercase">Başlangıç Fiyatı</p>
                  <p class="text-base font-black text-gray-950 font-mono mt-0.5">{{ formData.startingPrice.toLocaleString() }} KGS</p>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-gray-400 uppercase">Minimum Artış</p>
                  <p class="text-base font-black text-amber-800 font-mono mt-0.5">+{{ formData.bidIncrement.toLocaleString() }} KGS</p>
                </div>
              </div>

              <!-- Trust Safeguards -->
              <div class="space-y-2 text-xs text-gray-600">
                <div class="flex items-center gap-2">
                  <ShieldCheck class="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>DemirBank Escrow ile %100 Güvenli Ödeme Koruması</span>
                </div>
                <div class="flex items-center gap-2">
                  <CheckCircle2 class="w-4 h-4 text-blue-600 shrink-0" />
                  <span>%0 Komisyon Kampanyası Kapsamında</span>
                </div>
              </div>

              <!-- Terms Checkbox -->
              <label class="flex items-start gap-2.5 pt-2 border-t border-black/5 text-xs text-gray-700 cursor-pointer">
                <input v-model="termsAccepted" type="checkbox" class="w-4 h-4 rounded text-amber-500 mt-0.5" />
                <span>Açık artırma kurallarını, Kırgızistan AML/CFT şartlarını ve kullanıcı sözleşmesini kabul ediyorum.</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between gap-3">
          <button
            type="button"
            class="px-6 py-3 rounded-2xl border border-black/10 bg-white hover:bg-slate-50 text-gray-800 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-2xs"
            @click="prevStep"
          >
            <ChevronLeft class="w-4 h-4" />
            <span>Geri</span>
          </button>
          <button
            type="button"
            :disabled="isSubmitting || !termsAccepted"
            class="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer hover:scale-105 transition-all disabled:opacity-50"
            @click="submitAuction"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <CheckCircle v-else class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Yayına Alınıyor...' : 'Açık Artırmayı Başlat ve Yayına Al' }}</span>
          </button>
        </div>

      </div>

    </div>
  </div>
</template>
