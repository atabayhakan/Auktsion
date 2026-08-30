<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Sparkles, Upload, Image as ImageIcon, CheckCircle2, 
  AlertCircle, ChevronRight, ChevronLeft, DollarSign,
  Calendar, MapPin, Tag, ShieldCheck, Zap, Info, Loader2,
  Car, Building2, Smartphone, Gem, Palette, Tractor, Wheat, Eye, Gavel, X,
  Check, Store, Shield
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { useAuctionStore } from '@/stores/auction'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/composables/useI18n'
import { kyrgyzstanRegions } from '@/data/regions'
import { platformCategories } from '@/data/categories'
import { generateListingWithAI } from '@/services/aiService'
import { auctionService } from '@/services/auctionService'
import apiClient from '@/services/api'

const router = useRouter()
const auctionStore = useAuctionStore()
const userStore = useUserStore()
const { t, locale } = useI18n()

// Current Wizard Step (1: Details & AI, 2: Specific Attributes, 3: Pricing & Timing, 4: Preview)
const currentStep = ref(1)
const isSubmitting = ref(false)
const isAiGenerating = ref(false)
const aiPromptInput = ref('')
const isUploadingImages = ref(false)
const imageUploadError = ref('')

// Form State
const formData = ref({
  title: '',
  description: '',
  category: 'livestock',
  subCategory: '',
  regionId: 'naryn',
  districtId: 'kochkor',
  startingPrice: 50000,
  reservePrice: 60000,
  buyNowPrice: 75000,
  bidIncrement: 2000,
  durationDays: 3,
  isBlitz: false,
  images: [
    'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=1200&q=80'
  ],
  // Category specific attributes
  livestock: {
    animalType: 'cow',
    breed: 'Ала-Тоо',
    ageYears: 4,
    weightKg: 520,
    milkYieldLiters: 22,
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
  }
})

// Current selected region's districts
const currentDistricts = computed(() => {
  const reg = kyrgyzstanRegions.find(r => r.id === formData.value.regionId)
  return reg ? reg.districts : []
})

// Current selected category's subcategories
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

function getCategoryIcon(slug: string) {
  switch (slug) {
    case 'livestock': return Wheat
    case 'vehicles': return Car
    case 'real-estate': return Building2
    case 'electronics': return Smartphone
    case 'jewelry': return Gem
    case 'art-collectibles': return Palette
    case 'machinery': return Tractor
    default: return Tag
  }
}

function getCategoryColor(slug: string) {
  switch (slug) {
    case 'livestock': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'vehicles': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'real-estate': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'electronics': return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'jewelry': return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'art-collectibles': return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'machinery': return 'bg-teal-50 text-teal-700 border-teal-200'
    default: return 'bg-gray-50 text-gray-700 border-gray-200'
  }
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
      city: (activeRegion?.name as any)?.[locale.value] || activeRegion?.name.ky || 'Бишкек',
      district: (activeDistrict?.name as any)?.[locale.value] || activeDistrict?.name.ky || '',
      targetLanguage: (locale.value as any) || 'ky'
    })

    if (result.title) formData.value.title = result.title
    if (result.description) formData.value.description = result.description
    if (result.suggestedStartingPrice) formData.value.startingPrice = result.suggestedStartingPrice
    if (result.suggestedBidIncrement) formData.value.bidIncrement = result.suggestedBidIncrement
    formData.value.reservePrice = Math.round(formData.value.startingPrice * 1.15)
    formData.value.buyNowPrice = Math.round(formData.value.startingPrice * 1.35)
  } catch (e) {
    console.error('AI generation failed:', e)
  } finally {
    isAiGenerating.value = false
  }
}

// Next Step with validation
function validateStep(step: number): boolean {
  if (step === 1) {
    if (!formData.value.title.trim() || !formData.value.description.trim()) {
      alert(t('sellWizard.validation.titleRequired') || 'Lütfen ilan başlığı ve detaylı açıklama girin')
      return false
    }
    if (formData.value.images.length === 0) {
      alert(t('sellWizard.validation.imageRequired') || 'Lütfen en az 1 adet fotoğraf yükleyin')
      return false
    }
  }
  if (step === 3) {
    if (formData.value.startingPrice <= 0 || formData.value.bidIncrement <= 0) {
      alert(t('sellWizard.validation.priceError') || 'Fiyat ve artış tutarı 0\'dan büyük olmalıdır')
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
      const fd = new FormData()
      fd.append('file', file)
      const res: any = await apiClient.post('/api/upload', fd)
      const url = res?.data?.url || (res as any)?.url || ''
      if (url) formData.value.images.push(url)
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
    router.push('/login?redirect=/sell')
    return
  }
  if (!formData.value.title.trim() || !formData.value.description.trim()) {
    alert(t('sellWizard.validation.titleRequired') || 'Lütfen ilan başlığı ve açıklama girin')
    return
  }
  if (formData.value.images.length === 0) {
    alert(t('sellWizard.validation.imageRequired') || 'Lütfen en az 1 adet fotoğraf yükleyin')
    return
  }

  isSubmitting.value = true

  const activeRegion = kyrgyzstanRegions.find(r => r.id === formData.value.regionId)
  const activeDistrict = activeRegion?.districts.find(d => d.id === formData.value.districtId)

  const categoryAttrs =
    formData.value.category === 'livestock' ? formData.value.livestock :
    formData.value.category === 'vehicles' ? formData.value.vehicle :
    formData.value.category === 'real-estate' ? formData.value.realEstate : undefined

  const payload = {
    title: formData.value.title.trim(),
    description: formData.value.description.trim(),
    category: formData.value.category,
    subCategory: formData.value.subCategory,
    startingPrice: formData.value.startingPrice,
    reservePrice: formData.value.reservePrice,
    buyNowPrice: formData.value.buyNowPrice,
    bidIncrement: formData.value.bidIncrement,
    city: (activeRegion?.name as any)?.[locale.value] || activeRegion?.name.ky || 'Бишкек',
    regionId: formData.value.regionId,
    district: (activeDistrict?.name as any)?.[locale.value] || activeDistrict?.name.ky || '',
    isBlitz: formData.value.isBlitz,
    durationHours: formData.value.isBlitz ? 1 : formData.value.durationDays * 24,
    images: formData.value.images,
    attributes: categoryAttrs,
  }

  try {
    const res = await auctionService.createAuction(payload as any)
    const created = (res as any)?.data || res
    if (created?.id) {
      auctionStore.auctions.unshift(created as any)
    }
    router.push('/auctions/' + created.id)
  } catch (err: any) {
    const msg = err?.response?.data?.error || err?.data?.error || err?.message || 'İlan yayınlanamadı. Lütfen tekrar deneyin.'
    alert(msg)
    console.error('createAuction failed:', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-gray-900 font-sans pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto space-y-8">
      
      <!-- Top Title & Escrow Badge -->
      <div class="text-center space-y-2.5">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-extrabold shadow-2xs">
          <ShieldCheck class="w-4 h-4 text-amber-600" />
          <span>{{ t('sellWizard.escrowBadge') || 'Kırgızistan Genelinde %100 Banka Emanet Güvencesi' }}</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight">
          {{ t('sellWizard.title') || 'Yeni Açık Artırma Lotu Ekle' }}
        </h1>
        <p class="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
          {{ t('sellWizard.subtitle') || 'Hayvancılıktan araçlara, gayrimenkulden elektroniğe tüm ürünlerinizi şeffaf ve karlı satın.' }}
        </p>
      </div>

      <!-- Step Indicator Bar -->
      <div class="grid grid-cols-4 gap-2 sm:gap-4">
        <div 
          v-for="s in 4" 
          :key="s"
          class="p-3 sm:p-4 rounded-2xl border transition-all text-center flex flex-col justify-center"
          :class="currentStep === s
            ? 'bg-white border-primary ring-2 ring-primary/20 text-gray-950 font-black shadow-xs'
            : currentStep > s
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
              : 'bg-white/70 border-black/[0.06] text-gray-400 font-medium'"
        >
          <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
            0{{ s }}.
          </div>
          <div class="text-xs sm:text-sm font-bold truncate mt-0.5">
            {{ s === 1 ? (t('sellWizard.step1') || '01. İlan & AI') : s === 2 ? (t('sellWizard.step2') || '02. Özellikler') : s === 3 ? (t('sellWizard.step3') || '03. Fiyat & Süre') : (t('sellWizard.step4') || '04. Kontrol') }}
          </div>
        </div>
      </div>

      <!-- Form Container Card -->
      <div class="bg-white p-6 sm:p-10 rounded-3xl border border-black/[0.08] shadow-sm space-y-8">
        
        <!-- =================================================================
             STEP 1: DETAILS, CATEGORY & AI GENERATOR
             ================================================================= -->
        <div v-if="currentStep === 1" class="space-y-6">
          
          <!-- AI Assistant Banner -->
          <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-indigo-500/10 border border-amber-500/20 space-y-3 shadow-2xs">
            <div class="flex items-center gap-2 text-amber-900 font-extrabold text-xs sm:text-sm">
              <Sparkles class="w-4 h-4 text-amber-500 animate-pulse" />
              <span>{{ t('sellWizard.aiBadge') || 'iTorgo AI ile 1 Saniyede İlan Oluşturun' }}</span>
            </div>
            <p class="text-xs text-gray-600 leading-relaxed">
              {{ t('sellWizard.aiHint') || 'Örnek: "Ala-Too süt ineği 4 yaşında Koçkor Naryn" veya "Toyota Camry 2020 gümrük ödenmiş Bişkek" yazın, AI formu otomatik doldursun.' }}
            </p>
            <div class="flex flex-col sm:flex-row gap-2.5">
              <input
                v-model="aiPromptInput"
                :placeholder="t('sellWizard.aiPlaceholder') || 'Ürün adı ve kısa özelliklerini yazın...'"
                class="flex-1 px-4 py-3 rounded-2xl text-xs sm:text-sm bg-white border border-black/[0.08] focus:outline-none focus:border-primary text-gray-900 shadow-2xs placeholder-gray-400"
                @keyup.enter="handleAiMagicGenerate"
              />
              <button
                type="button"
                :disabled="isAiGenerating || !aiPromptInput.trim()"
                class="px-5 py-3 rounded-2xl bg-gray-950 hover:bg-gray-900 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                @click="handleAiMagicGenerate"
              >
                <Loader2 v-if="isAiGenerating" class="w-4 h-4 animate-spin text-amber-400" />
                <Sparkles v-else class="w-4 h-4 text-amber-400" />
                <span>{{ isAiGenerating ? (t('sellWizard.aiGenerating') || 'Oluşturuluyor...') : (t('sellWizard.aiGenerateBtn') || 'AI ile Oluştur') }}</span>
              </button>
            </div>
          </div>

          <!-- Category Selector -->
          <div class="space-y-2.5">
            <label class="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
              {{ t('sellWizard.selectCategory') || 'Kategori Seçiniz *' }}
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                v-for="cat in platformCategories"
                :key="cat.slug"
                type="button"
                class="p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer"
                :class="formData.category === cat.slug
                  ? 'bg-amber-500/10 border-primary ring-2 ring-primary/20 text-gray-950 font-extrabold shadow-2xs'
                  : 'bg-white border-black/[0.08] text-gray-600 hover:bg-slate-50 hover:border-black/15'"
                @click="formData.category = cat.slug"
              >
                <div 
                  class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                  :class="getCategoryColor(cat.slug)"
                >
                  <component :is="getCategoryIcon(cat.slug)" class="w-4 h-4" />
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-extrabold truncate">
                    {{ (cat.name as any)[locale] || cat.name.tr }}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- Kyrgyzstan Region & District -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
                {{ t('sellWizard.region') || 'Bölge / Şehir *' }}
              </label>
              <select
                v-model="formData.regionId"
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-semibold focus:outline-none focus:border-primary focus:bg-white text-gray-900 transition-all cursor-pointer"
              >
                <option v-for="r in kyrgyzstanRegions" :key="r.id" :value="r.id">
                  {{ (r.name as any)[locale] || r.name.ky }}
                </option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
                {{ t('sellWizard.district') || 'İlçe / Köy / Pazar Yeri *' }}
              </label>
              <select
                v-model="formData.districtId"
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-semibold focus:outline-none focus:border-primary focus:bg-white text-gray-900 transition-all cursor-pointer"
              >
                <option v-for="d in currentDistricts" :key="d.id" :value="d.id">
                  {{ (d.name as any)[locale] || d.name.ky }}
                </option>
              </select>
            </div>
          </div>

          <!-- Title -->
          <div class="space-y-1.5">
            <label class="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
              {{ t('sellWizard.lotTitle') || 'Lot Başlığı *' }}
            </label>
            <input
              v-model="formData.title"
              :placeholder="t('sellWizard.lotTitlePlaceholder') || 'Örn: Ala-Too Irkı Sağmal İnek (2. Doğum, 24 Litre Süt)'"
              class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-semibold focus:outline-none focus:border-primary focus:bg-white text-gray-900 transition-all placeholder-gray-400"
            />
          </div>

          <!-- Description -->
          <div class="space-y-1.5">
            <label class="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
              {{ t('sellWizard.description') || 'Detaylı Açıklama *' }}
            </label>
            <textarea
              v-model="formData.description"
              rows="4"
              :placeholder="t('sellWizard.descriptionPlaceholder') || 'Ürünün durumu, özellikleri, aşıları ve garanti bilgileri hakkında bilgi verin...'"
              class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-medium focus:outline-none focus:border-primary focus:bg-white text-gray-900 transition-all resize-none placeholder-gray-400 leading-relaxed"
            ></textarea>
          </div>

          <!-- Images Upload Dropzone -->
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
                {{ t('sellWizard.photos') || 'Fotoğraflar * (En az 1 adet)' }}
              </label>
              <span class="text-[11px] text-gray-400">
                {{ t('sellWizard.photoFormats') || 'JPEG, PNG, WebP desteklenir (Maks 10MB)' }}
              </span>
            </div>

            <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
              <div v-for="(img, idx) in formData.images" :key="idx" class="relative aspect-square rounded-2xl overflow-hidden border border-black/[0.08] group shadow-2xs">
                <img :src="img" class="w-full h-full object-cover" />
                <div v-if="idx === 0" class="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-bold">
                  {{ t('sellWizard.coverPhoto') || 'Kapak' }}
                </div>
                <button 
                  type="button" 
                  class="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer" 
                  @click="removeImage(idx)"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <label class="aspect-square rounded-2xl border-2 border-dashed border-black/15 hover:border-primary bg-slate-50 hover:bg-slate-100/80 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all">
                <Upload class="w-6 h-6 text-gray-400" />
                <span class="text-[11px] font-bold text-gray-600">
                  {{ isUploadingImages ? (t('sellWizard.uploading') || 'Yükleniyor...') : (t('sellWizard.addPhoto') || 'Fotoğraf Ekle') }}
                </span>
                <input type="file" accept="image/*" multiple class="hidden" :disabled="isUploadingImages" @change="handleImageFiles" />
              </label>
            </div>
            <p v-if="imageUploadError" class="text-xs font-bold text-rose-600">{{ imageUploadError }}</p>
          </div>

        </div>

        <!-- =================================================================
             STEP 2: CATEGORY ATTRIBUTES (LIVESTOCK / VEHICLES / REAL ESTATE)
             ================================================================= -->
        <div v-if="currentStep === 2" class="space-y-6">
          
          <!-- Livestock Specific Form -->
          <div v-if="formData.category === 'livestock'" class="space-y-5">
            <div class="flex items-center gap-2.5 text-base font-extrabold text-amber-900 pb-2 border-b border-black/[0.06]">
              <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                🐄
              </div>
              <span>{{ t('sellWizard.livestockTitle') || 'Hayvancılık & Besi Özellikleri' }}</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-600">{{ t('sellWizard.animalType') || 'Hayvan Türü' }}</label>
                <select v-model="formData.livestock.animalType" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-semibold focus:bg-white text-gray-900">
                  <option value="cow">{{ t('sellWizard.cow') || 'Sağmal İnek (Корова)' }}</option>
                  <option value="bull">{{ t('sellWizard.bull') || 'Boğa / Tosun (Бык)' }}</option>
                  <option value="horse">{{ t('sellWizard.horse') || 'At / Aygır (Лошадь)' }}</option>
                  <option value="foal">{{ t('sellWizard.foal') || 'Tay / Kulun (Жеребенок)' }}</option>
                  <option value="ram">{{ t('sellWizard.ram') || 'Koç (Araşan/Hissar)' }}</option>
                  <option value="sheep">{{ t('sellWizard.sheep') || 'Koyun (Овца)' }}</option>
                  <option value="goat">{{ t('sellWizard.goat') || 'Keçi (Коза)' }}</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-600">{{ t('sellWizard.breed') || 'Irkı / Cinsi' }}</label>
                <input v-model="formData.livestock.breed" :placeholder="t('sellWizard.breedPlaceholder') || 'Örn: Ala-Too, Araşan, Holstein'" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-semibold focus:bg-white text-gray-900" />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-600">{{ t('sellWizard.ageYears') || 'Yaşı (Yıl)' }}</label>
                <input v-model.number="formData.livestock.ageYears" type="number" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-bold font-mono focus:bg-white text-gray-900" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-600">{{ t('sellWizard.weightKg') || 'Canlı Ağırlık (kg)' }}</label>
                <input v-model.number="formData.livestock.weightKg" type="number" placeholder="520" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-bold font-mono focus:bg-white text-gray-900" />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-600">{{ t('sellWizard.milkYield') || 'Günlük Süt Verimi (Litre/gün)' }}</label>
                <input v-model.number="formData.livestock.milkYieldLiters" type="number" placeholder="22" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-bold font-mono focus:bg-white text-gray-900" />
              </div>
            </div>

            <div class="flex flex-wrap gap-4 pt-2">
              <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer text-gray-800">
                <input v-model="formData.livestock.isVaccinated" type="checkbox" class="w-4 h-4 rounded text-primary focus:ring-primary" />
                <span>{{ t('sellWizard.vaccinated') || 'Veteriner aşıları yapılmış' }}</span>
              </label>
              <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer text-gray-800">
                <input v-model="formData.livestock.hasVetPassport" type="checkbox" class="w-4 h-4 rounded text-primary focus:ring-primary" />
                <span>{{ t('sellWizard.vetPassport') || 'Veteriner pasaportu mevcut' }}</span>
              </label>
              <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer text-gray-800">
                <input v-model="formData.livestock.deliveryAvailable" type="checkbox" class="w-4 h-4 rounded text-primary focus:ring-primary" />
                <span>{{ t('sellWizard.deliveryAvailable') || 'Hayvan nakliyesi / taşıma sağlanır' }}</span>
              </label>
            </div>
          </div>

          <!-- Vehicle Specific Form -->
          <div v-else-if="formData.category === 'vehicles'" class="space-y-5">
            <div class="flex items-center gap-2.5 text-base font-extrabold text-blue-900 pb-2 border-b border-black/[0.06]">
              <div class="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                🚗
              </div>
              <span>{{ t('sellWizard.vehicleTitle') || 'Araç & Otomotiv Özellikleri' }}</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-600">{{ t('sellWizard.brandModel') || 'Marka & Model' }}</label>
                <input v-model="formData.vehicle.model" placeholder="Toyota Camry" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-semibold focus:bg-white text-gray-900" />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-600">{{ t('sellWizard.year') || 'Model Yılı' }}</label>
                <input v-model.number="formData.vehicle.year" type="number" placeholder="2020" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-bold font-mono focus:bg-white text-gray-900" />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-600">{{ t('sellWizard.mileage') || 'Kilometre (km)' }}</label>
                <input v-model.number="formData.vehicle.mileageKm" type="number" placeholder="68000" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-bold font-mono focus:bg-white text-gray-900" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-600">{{ t('sellWizard.steering') || 'Direksiyon Yönü' }}</label>
                <select v-model="formData.vehicle.steering" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-semibold focus:bg-white text-gray-900">
                  <option value="left">{{ t('sellWizard.steeringLeft') || 'Sol Direksiyon' }}</option>
                  <option value="right">{{ t('sellWizard.steeringRight') || 'Sağ Direksiyon' }}</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-600">{{ t('sellWizard.fuelType') || 'Yakıt Tipi' }}</label>
                <select v-model="formData.vehicle.fuelType" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-semibold focus:bg-white text-gray-900">
                  <option value="petrol">{{ t('sellWizard.petrol') || 'Benzin' }}</option>
                  <option value="gas">{{ t('sellWizard.gas') || 'LPG / Benzin' }}</option>
                  <option value="diesel">{{ t('sellWizard.diesel') || 'Dizel' }}</option>
                  <option value="hybrid">{{ t('sellWizard.hybrid') || 'Hibrit' }}</option>
                  <option value="electric">{{ t('sellWizard.electric') || 'Elektrikli' }}</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-600">{{ t('sellWizard.engineVolume') || 'Motor Hacmi (L)' }}</label>
                <input v-model.number="formData.vehicle.engineVolume" type="number" step="0.1" placeholder="2.5" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-bold font-mono focus:bg-white text-gray-900" />
              </div>
            </div>

            <div class="pt-2">
              <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer text-gray-800">
                <input v-model="formData.vehicle.isCustomsCleared" type="checkbox" class="w-4 h-4 rounded text-primary focus:ring-primary" />
                <span>{{ t('sellWizard.customsCleared') || 'Gümrük vergileri (%100 Rastamojka) ödenmiş, evrakları tam' }}</span>
              </label>
            </div>
          </div>

          <!-- Real Estate Specific Form -->
          <div v-else-if="formData.category === 'real-estate'" class="space-y-5">
            <div class="flex items-center gap-2.5 text-base font-extrabold text-emerald-900 pb-2 border-b border-black/[0.06]">
              <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                🏢
              </div>
              <span>{{ t('sellWizard.realEstateTitle') || 'Gayrimenkul & Ticari Mülk Özellikleri' }}</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-600">{{ t('sellWizard.propertyType') || 'Mülk Türü' }}</label>
                <select v-model="formData.realEstate.propertyType" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-semibold focus:bg-white text-gray-900">
                  <option value="dordoy_container">{{ t('sellWizard.dordoyContainer') || 'Dordoy / Kara-Suu Konteyneri' }}</option>
                  <option value="commercial_shop">{{ t('sellWizard.commercialShop') || 'Ticari Dükkan / Mağaza' }}</option>
                  <option value="apartment">{{ t('sellWizard.apartment') || 'Daire (Kira / Satılık)' }}</option>
                  <option value="house">{{ t('sellWizard.house') || 'Müstakil Ev / Villa' }}</option>
                  <option value="land">{{ t('sellWizard.land') || 'Arsa / Çiftlik Arazisi' }}</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-600">{{ t('sellWizard.areaSqm') || 'Alan (m²)' }}</label>
                <input v-model.number="formData.realEstate.areaSqm" type="number" placeholder="48" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-bold font-mono focus:bg-white text-gray-900" />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-600">{{ t('sellWizard.deedType') || 'Tapu / Belge Türü' }}</label>
                <select v-model="formData.realEstate.deedType" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-semibold focus:bg-white text-gray-900">
                  <option value="red_book">{{ t('sellWizard.redBook') || 'Kırmızı Kitap (Krasnaya Kniga)' }}</option>
                  <option value="tech_passport">{{ t('sellWizard.techPassport') || 'Teknik Pasaport / Sözleşme' }}</option>
                  <option value="yellowBook">{{ t('sellWizard.yellowBook') || 'Sarı Kitap (Kira)' }}</option>
                </select>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-gray-600">{{ t('sellWizard.monthlyRevenue') || 'Aylık Kira Geliri (KGS)' }}</label>
              <input v-model.number="formData.realEstate.monthlyRevenue" type="number" placeholder="180000" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-xs sm:text-sm font-bold font-mono focus:bg-white text-gray-900" />
            </div>
          </div>

          <!-- General Attributes for Other Categories -->
          <div v-else class="p-8 rounded-3xl bg-slate-50 text-center space-y-2.5 border border-black/[0.06]">
            <CheckCircle2 class="w-10 h-10 text-emerald-500 mx-auto" />
            <div class="text-sm font-extrabold text-gray-900">
              {{ t('sellWizard.generalParamsReady') || 'Genel Parametreler Hazır' }}
            </div>
            <p class="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              {{ t('sellWizard.generalParamsDesc') || 'Bu kategori için ek form alanı gerekmemektedir. Fiyat ve süre adımına geçebilirsiniz.' }}
            </p>
          </div>

        </div>

        <!-- =================================================================
             STEP 3: PRICING, BUY IT NOW & TIMING
             ================================================================= -->
        <div v-if="currentStep === 3" class="space-y-6">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
                {{ t('sellWizard.startingPrice') || 'Başlangıç Fiyatı (KGS) *' }}
              </label>
              <input 
                v-model.number="formData.startingPrice" 
                type="number" 
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-base font-black font-mono text-amber-700 focus:bg-white focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
                {{ t('sellWizard.bidIncrement') || 'Minimum Artış Adımı (KGS) *' }}
              </label>
              <input 
                v-model.number="formData.bidIncrement" 
                type="number" 
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-base font-black font-mono text-emerald-600 focus:bg-white focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <!-- Buy It Now & Reserve Price -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
                {{ t('sellWizard.buyNowPrice') || 'Hemen Al Fiyatı (Buy It Now)' }}
              </label>
              <input 
                v-model.number="formData.buyNowPrice" 
                type="number" 
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-base font-bold font-mono text-blue-700 focus:bg-white focus:outline-none focus:border-primary transition-all"
              />
              <p class="text-[11px] text-gray-400">
                {{ t('sellWizard.buyNowHint') || 'Alıcı açık artırma süresini beklemeden bu fiyata hemen satın alabilir.' }}
              </p>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
                {{ t('sellWizard.reservePrice') || 'Gizli Rezerve Fiyat (Admin)' }}
              </label>
              <input 
                v-model.number="formData.reservePrice" 
                type="number" 
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/[0.08] text-base font-bold font-mono text-purple-700 focus:bg-white focus:outline-none focus:border-primary transition-all"
              />
              <p class="text-[11px] text-gray-400">
                {{ t('sellWizard.reservePriceHint') || 'Bu fiyat gizlidir. Teklifler rezerve fiyata ulaşmazsa satmak zorunda değilsiniz.' }}
              </p>
            </div>
          </div>

          <!-- Duration / Blitz -->
          <div class="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-black/[0.06] space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="text-xs sm:text-sm font-extrabold text-gray-950">
                  {{ t('sellWizard.duration') || 'Açık Artırma Süresi' }}
                </div>
                <div class="text-[11px] text-gray-400">
                  {{ t('sellWizard.durationHint') || 'İlan ne kadar süre yayında kalacak?' }}
                </div>
              </div>
              <select v-model.number="formData.durationDays" class="px-4 py-2.5 rounded-2xl bg-white text-xs sm:text-sm font-bold border border-black/[0.08] shadow-2xs cursor-pointer">
                <option :value="1">{{ t('sellWizard.duration1Day') || '24 Saat (1 Gün)' }}</option>
                <option :value="3">{{ t('sellWizard.duration3Days') || '3 Gün (Önerilen)' }}</option>
                <option :value="5">{{ t('sellWizard.duration5Days') || '5 Gün' }}</option>
                <option :value="7">{{ t('sellWizard.duration7Days') || '7 Gün' }}</option>
              </select>
            </div>

            <div class="pt-3 border-t border-black/[0.06] flex items-center justify-between">
              <label class="flex items-center gap-2.5 text-xs font-bold text-rose-700 cursor-pointer">
                <input v-model="formData.isBlitz" type="checkbox" class="w-4 h-4 rounded text-rose-600 focus:ring-rose-500" />
                <span>{{ t('sellWizard.isBlitz') || '🔥 Flaş / Blitz Açık Artırma (1 Saatlik Hızlı Satış)' }}</span>
              </label>
            </div>
          </div>

        </div>

        <!-- =================================================================
             STEP 4: PREVIEW & FINAL CONFIRMATION
             ================================================================= -->
        <div v-if="currentStep === 4" class="space-y-6">
          
          <div class="p-6 sm:p-8 rounded-3xl bg-amber-500/5 border border-primary/20 space-y-5">
            <div class="flex items-center gap-4">
              <div 
                class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs"
                :class="getCategoryColor(formData.category)"
              >
                <component :is="getCategoryIcon(formData.category)" class="w-6 h-6" />
              </div>
              <div class="min-w-0">
                <h3 class="text-lg sm:text-xl font-black text-gray-950 truncate">{{ formData.title }}</h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  📍 {{ (kyrgyzstanRegions.find(r => r.id === formData.regionId)?.name as any)?.[locale] || formData.regionId }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-2">
              <div class="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-2xs">
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{{ t('sellWizard.startingPrice') || 'Başlangıç' }}</div>
                <div class="text-sm sm:text-base font-black text-amber-700 font-mono mt-0.5">{{ formData.startingPrice.toLocaleString() }} KGS</div>
              </div>
              <div class="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-2xs">
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{{ t('sellWizard.bidIncrement') || 'Artış Adımı' }}</div>
                <div class="text-sm sm:text-base font-black text-emerald-600 font-mono mt-0.5">+{{ formData.bidIncrement.toLocaleString() }} KGS</div>
              </div>
              <div class="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-2xs">
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{{ t('sellWizard.buyNowPrice') || 'Hemen Al' }}</div>
                <div class="text-sm sm:text-base font-black text-blue-600 font-mono mt-0.5">{{ formData.buyNowPrice.toLocaleString() }} KGS</div>
              </div>
              <div class="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-2xs">
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{{ t('sellWizard.duration') || 'Süre' }}</div>
                <div class="text-sm sm:text-base font-black text-gray-900 mt-0.5">{{ formData.isBlitz ? '1 Saat' : (formData.durationDays + ' Gün') }}</div>
              </div>
            </div>

            <p class="text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-black/[0.06] pt-4">
              {{ formData.description }}
            </p>
          </div>

          <div class="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3.5 text-xs text-emerald-800">
            <ShieldCheck class="w-6 h-6 flex-shrink-0 text-emerald-600" />
            <span class="leading-relaxed">
              {{ t('sellWizard.escrowProtectionNotice') || 'Bu lot MBank ve DemirBank emanet hesabı (escrow) garantisi altındadır. Satış gerçekleştiğinde ödeme doğrudan banka hesabınıza aktarılır.' }}
            </span>
          </div>

        </div>

        <!-- Navigation Action Buttons -->
        <div class="flex items-center justify-between pt-5 border-t border-black/[0.06]">
          <button
            v-if="currentStep > 1"
            type="button"
            class="px-6 py-3 rounded-2xl bg-slate-100 text-xs font-bold text-gray-700 hover:bg-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            @click="prevStep"
          >
            <ChevronLeft class="w-4 h-4" />
            <span>{{ t('sellWizard.prev') || 'Geri' }}</span>
          </button>
          <div v-else />

          <button
            v-if="currentStep < 4"
            type="button"
            class="px-8 py-3.5 rounded-2xl bg-primary text-text-primary font-black text-xs sm:text-sm shadow-md hover:bg-primary-hover transition-all flex items-center gap-2 cursor-pointer"
            @click="nextStep"
          >
            <span>{{ t('sellWizard.next') || 'İleri' }}</span>
            <ChevronRight class="w-4 h-4" />
          </button>

          <button
            v-else
            type="button"
            :disabled="isSubmitting"
            class="px-10 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            @click="submitAuction"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <Gavel v-else class="w-4 h-4" />
            <span>{{ isSubmitting ? (t('sellWizard.publishing') || 'Yayınlanıyor...') : (t('sellWizard.publish') || 'Açık Artırmayı Başlat 🚀') }}</span>
          </button>
        </div>

      </div>

    </div>
  </div>
</template>
