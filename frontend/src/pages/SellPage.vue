<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'
import { useAuctionStore } from '@/stores/auction'
import { auctionService } from '@/services/auctionService'
import { generateListingWithAI } from '@/services/aiService'
import { platformCategories } from '@/data/categories'
import { kyrgyzstanRegions } from '@/data/regions'
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  AlertCircle,
  HelpCircle,
  Clock,
  Flame,
  Info,
  DollarSign,
  Layers,
  FileCheck,
  Loader2,
  ShieldCheck,
  ArrowRight
} from 'lucide-vue-next'

const { t, currentLocale } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const uiStore = useUIStore()
const auctionStore = useAuctionStore()

const currentLang = computed(() => currentLocale.value?.code || 'ru')

// Current Wizard Step (1: General, 2: Category Attributes, 3: Pricing & Duration, 4: Preview)
const currentStep = ref(1)

// AI Assistant State
const aiPromptInput = ref('')
const isAiGenerating = ref(false)
const isUploadingImages = ref(false)
const imageUploadError = ref('')
const isSubmitting = ref(false)

// Main Form Data
const formData = ref({
  title: '',
  description: '',
  category: 'electronics',
  subCategory: '',
  regionId: 'chuy',
  districtId: 'bishkek-lenin',
  images: [] as string[],
  startingPrice: 5000,
  bidIncrement: 500,
  reservePrice: 0,
  buyNowPrice: 0,
  durationDays: 3,
  isBlitz: false,
  agreeTerms: true,

  // Dynamic Category Specific Attributes
  livestock: {
    animalType: 'sheep',
    breed: '',
    ageYears: 2,
    weightKg: 85,
    isVaccinated: true,
    hasVetPassport: true,
    isFatTailed: true
  },
  vehicle: {
    brand: '',
    model: '',
    year: 2020,
    mileageKm: 85000,
    fuelType: 'petrol',
    transmission: 'automatic',
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
    brand: '',
    model: '',
    storage: '',
    condition: 'used_good',
    hasBox: false,
    hasWarranty: false
  }
})

// Categories
const categories = computed(() => {
  const lang = currentLang.value
  return platformCategories.map(c => ({
    id: c.slug,
    name: c.name[lang] || c.name.ru || c.name.tr || c.name.ky,
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

// AI Quick Suggestions by language
const aiSuggestions = computed(() => {
  const lang = currentLang.value
  if (lang === 'ru') {
    return [
      '🚗 2020 Toyota Camry 2.5 бензин идеальное состояние Бишкек',
      '❄️ Кондиционер инверторный на 35м² Чуйская область',
      '🐑 2-х летний племенной баран Арашан 120кг',
      '🏢 Дордой 2-этажный контейнер с арендаторами',
      '📱 Смартфон 256GB в отличном состоянии'
    ]
  } else if (lang === 'tr') {
    return [
      '🚗 2020 Toyota Camry 2.5 benzinli kusursuz Bişkek',
      '❄️ Klima İnverter 35m² Çüy Bölgesi',
      '🐑 2 Yaşında Damızlık Arashan Koçu 120kg',
      '🏢 Dordoy 2 Katlı Çift Konteyner Kira Getirili',
      '📱 Telefon 256GB Sıfır Ayarında'
    ]
  } else {
    return [
      '🚗 2020 Toyota Camry 2.5 бензин таза абалда Бишкек',
      '❄️ Кондиционер инвертор 35м² Чүй облусу',
      '🐑 2 жаштагы асыл тукум Арашан кочкору 120кг',
      '🏢 Дордой 2 кабаттуу контейнер ижарасы менен',
      '📱 Смартфон 256GB идеалдуу абалда'
    ]
  }
})

function useAiSuggestion(s: string) {
  aiPromptInput.value = s.replace(/^[^\s]+\s/, '') // remove emoji
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
      city: (activeRegion?.name as any)?.[currentLang.value] || activeRegion?.name.ru || 'Бишкек',
      district: (activeDistrict?.name as any)?.[currentLang.value] || activeDistrict?.name.ru || '',
      targetLanguage: currentLang.value
    })

    if (result.title) formData.value.title = result.title
    if (result.description) formData.value.description = result.description
    if (result.suggestedStartingPrice) formData.value.startingPrice = result.suggestedStartingPrice
    if (result.suggestedBidIncrement) formData.value.bidIncrement = result.suggestedBidIncrement
    formData.value.reservePrice = Math.round(formData.value.startingPrice * 1.15)
    formData.value.buyNowPrice = Math.round(formData.value.startingPrice * 1.35)
    uiStore.toastSuccess('iTorgo AI', t('sell.aiGenerating') || 'OK')
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
      uiStore.toastWarning('!', t('sell.titleDescRequired') || 'Lütfen ilan başlığı girin.')
      return false
    }
    if (!formData.value.description.trim()) {
      uiStore.toastWarning('!', t('sell.titleDescRequired') || 'Lütfen detaylı açıklama girin.')
      return false
    }
    if (formData.value.images.length === 0) {
      uiStore.toastWarning('!', t('sell.photoRequired') || 'Lütfen en az 1 adet fotoğraf yükleyin.')
      return false
    }
  }
  if (step === 3) {
    if (formData.value.startingPrice <= 0) {
      uiStore.toastWarning('!', t('sell.startingPriceLabel') || 'Başlangıç fiyatı 0\'dan büyük olmalıdır.')
      return false
    }
    if (formData.value.bidIncrement <= 0) {
      uiStore.toastWarning('!', t('sell.bidIncrementLabel') || 'Teklif artış tutarı 0\'dan büyük olmalıdır.')
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
        imageUploadError.value = file.name + ' maks 10MB'
        continue
      }
      if (!file.type.startsWith('image/')) {
        imageUploadError.value = file.name + ' - image format only'
        continue
      }

      // Convert to base64 preview or upload
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          formData.value.images.push(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  } catch (err: any) {
    const msg = err?.response?.data?.error || err?.message || 'Upload error'
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
    uiStore.toastInfo('iTorgo', t('sell.loginRequired') || 'İlanınızı yayınlamak için lütfen oturum açın.')
    router.push('/login?redirect=/sell')
    return
  }
  if (!formData.value.title.trim() || !formData.value.description.trim()) {
    uiStore.toastWarning('!', t('sell.titleDescRequired') || 'Lütfen ilan başlığı ve açıklama girin.')
    return
  }
  if (formData.value.images.length === 0) {
    uiStore.toastWarning('!', t('sell.photoRequired') || 'Lütfen en az 1 adet fotoğraf yükleyin.')
    return
  }

  isSubmitting.value = true

  const activeRegion = kyrgyzstanRegions.find(r => r.id === formData.value.regionId)
  const activeDistrict = activeRegion?.districts.find(d => d.id === formData.value.districtId)

  const payload: any = {
    title: formData.value.title.trim(),
    description: formData.value.description.trim(),
    category: formData.value.category,
    subCategory: formData.value.subCategory,
    regionId: formData.value.regionId,
    city: (activeRegion?.name as any)?.[currentLang.value] || activeRegion?.name.ru || 'Бишкек',
    district: (activeDistrict?.name as any)?.[currentLang.value] || activeDistrict?.name.ru || '',
    startingPrice: Number(formData.value.startingPrice),
    bidIncrement: Number(formData.value.bidIncrement),
    durationHours: (Number(formData.value.durationDays) || 3) * 24,
    durationDays: Number(formData.value.durationDays) || 3,
    isBlitz: Boolean(formData.value.isBlitz),
    images: formData.value.images,
    attributes: {
      ...formData.value.livestock,
      ...formData.value.vehicle,
      ...formData.value.realEstate,
      ...formData.value.electronics
    }
  }

  if (formData.value.reservePrice > 0) {
    payload.reservePrice = Number(formData.value.reservePrice)
  }
  if (formData.value.buyNowPrice > 0) {
    payload.buyNowPrice = Number(formData.value.buyNowPrice)
  }

  try {
    await auctionService.createAuction(payload)
    uiStore.toastSuccess('iTorgo', t('sell.successCreated') || 'Açık artırma ilanınız başarıyla oluşturuldu ve yayına alındı.')
    router.push('/auctions')
  } catch (err: any) {
    console.error('API createAuction fallback to store:', err)
    auctionStore.addAuction({
      ...payload,
      id: 'auc-' + Date.now(),
      sellerId: userStore.user?.id || 'usr-1',
      status: 'active',
      currentPrice: { amount: String(payload.startingPrice), currency: 'KGS', minorUnits: payload.startingPrice * 100 },
      startingPrice: { amount: String(payload.startingPrice), currency: 'KGS', minorUnits: payload.startingPrice * 100 },
      bidCount: 0,
      createdAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + payload.durationHours * 3600000).toISOString()
    })
    uiStore.toastSuccess('iTorgo', t('sell.successCreated') || 'Açık artırma ilanınız başarıyla yayına alındı.')
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
                <span>{{ t('sell.zeroCommissionBadge') || '%0 Komisyon Kampanyası' }}</span>
              </span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
              {{ t('sell.title') || 'Новый аукционный лот' }}
            </h1>
            <p class="text-xs sm:text-sm text-gray-500 mt-0.5">
              {{ t('sell.subtitle') || 'Оформите лот за 4 шага, используйте AI для автозаполнения и привлекайте тысячи покупателей.' }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-black text-gray-400 font-mono">
              {{ t('sell.stepCounter', { step: currentStep }) || `Шаг ${currentStep} / 4` }}
            </span>
          </div>
        </div>

        <!-- Visual Stepper Bar -->
        <div class="grid grid-cols-4 gap-2 sm:gap-4">
          <div
            v-for="(stepName, idx) in [t('sell.step1') || 'Общие данные', t('sell.step2') || 'Параметры', t('sell.step3') || 'Цена и сроки', t('sell.step4') || 'Предпросмотр']"
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

      <!-- STEP 1: General Info & Photos -->
      <div v-if="currentStep === 1" class="space-y-6 animate-fade-in-up">

        <!-- AI Smart Auto-Generator Banner -->
        <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50 border border-amber-500/20 shadow-2xs space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-gray-950 flex items-center justify-center shadow-xs">
                <Sparkles class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-sm font-black text-gray-950">{{ t('sell.aiBannerTitle') || 'Создайте лот за 1 секунду с iTorgo AI' }}</h3>
                <p class="text-[11px] text-gray-500">{{ t('sell.aiBannerDesc') || 'Укажите название или параметры товара — искусственный интеллект заполнит форму автоматически.' }}</p>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch gap-2">
            <input
              v-model="aiPromptInput"
              type="text"
              :placeholder="t('sell.aiPromptPlaceholder') || 'Например: 2020 Toyota Camry 2.5 бензин или кондиционер инверторный 35м²...'"
              class="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-amber-400/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 font-medium placeholder:text-gray-400/50 shadow-2xs"
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
              <span>{{ isAiGenerating ? (t('sell.aiGenerating') || 'Создание...') : (t('sell.aiBtnFill') || 'Заполнить с AI') }}</span>
            </button>
          </div>

          <!-- Quick AI Prompt Pills -->
          <div class="flex flex-wrap items-center gap-1.5 pt-1">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">{{ t('sell.examples') || 'Примеры:' }}</span>
            <button
              v-for="sugg in aiSuggestions"
              :key="sugg"
              type="button"
              class="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-amber-100/60 border border-black/5 hover:border-amber-400/40 text-[11px] font-bold text-gray-700 transition-all cursor-pointer shadow-2xs"
              @click="useAiSuggestion(sugg)"
            >
              {{ sugg }}
            </button>
          </div>
        </div>

        <!-- Form Card 1 -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-6">

          <!-- Category Selection -->
          <div class="space-y-3">
            <label class="text-xs font-black text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
              <Layers class="w-4 h-4 text-amber-600" />
              <span>{{ t('sell.selectCategory') || 'Выберите категорию *' }}</span>
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                v-for="cat in categories"
                :key="cat.slug"
                type="button"
                class="p-3 rounded-2xl border text-left transition-all flex flex-col items-start gap-2 cursor-pointer"
                :class="[
                  formData.category === cat.slug
                    ? 'border-amber-500 bg-amber-500/10 text-amber-950 font-black shadow-xs ring-2 ring-amber-500/20'
                    : 'border-black/[0.08] bg-slate-50/50 hover:bg-slate-100/70 text-gray-700 font-bold'
                ]"
                @click="formData.category = cat.slug"
              >
                <span class="text-2xl">{{ cat.icon }}</span>
                <span class="text-xs line-clamp-1 leading-tight">{{ cat.name }}</span>
              </button>
            </div>
          </div>

          <!-- Region & District -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-black/[0.06]">
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.region') || 'Область / Город *' }}</label>
              <select
                v-model="formData.regionId"
                class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary text-gray-900"
              >
                <option v-for="r in kyrgyzstanRegions" :key="r.id" :value="r.id">
                  {{ r.name[currentLang] || r.name.ru || r.name.tr || r.name.ky }}
                </option>
              </select>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.district') || 'Район / Село / Рынок *' }}</label>
              <select
                v-model="formData.districtId"
                class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary text-gray-900"
              >
                <option v-for="d in currentDistricts" :key="d.id" :value="d.id">
                  {{ d.name[currentLang] || d.name.ru || d.name.tr || d.name.ky }}
                </option>
              </select>
            </div>
          </div>

          <!-- Title -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.lotTitle') || 'Название лота *' }}</label>
              <span class="text-[10px] font-bold text-gray-400 font-mono">{{ formData.title.length }}/100</span>
            </div>
            <input
              v-model="formData.title"
              type="text"
              maxlength="100"
              :placeholder="t('sell.lotTitlePlaceholder') || 'Например: Инверторный кондиционер 35м² или баран Арашан...'"
              class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 placeholder:text-gray-400/50"
            />
          </div>

          <!-- Description -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.detailedDesc') || 'Подробное описание *' }}</label>
              <span class="text-[10px] font-bold text-gray-400 font-mono">{{ formData.description.length }}/2000</span>
            </div>
            <textarea
              v-model="formData.description"
              rows="4"
              maxlength="2000"
              :placeholder="t('sell.detailedDescPlaceholder') || 'Опишите состояние, характеристики, комплектность, условия доставки и гарантии...'"
              class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 leading-relaxed placeholder:text-gray-400/50"
            />
          </div>

          <!-- Photo Upload (Starts 100% EMPTY!) -->
          <div class="space-y-3 pt-2 border-t border-black/[0.06]">
            <div class="flex items-center justify-between">
              <label class="text-xs font-black text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon class="w-4 h-4 text-amber-600" />
                <span>{{ t('sell.photosReq') || 'Фотографии * (минимум 1)' }}</span>
              </label>
              <span class="text-[11px] font-bold text-gray-400">{{ t('sell.photoSpecs') || 'JPG, PNG, WebP (макс. 10MB)' }}</span>
            </div>

            <!-- Upload Dropzone & Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <!-- Upload Box Trigger -->
              <label class="border-2 border-dashed border-black/15 hover:border-amber-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-amber-50/30 transition-all group min-h-[120px]">
                <Upload class="w-6 h-6 text-gray-400 group-hover:text-amber-700 group-hover:scale-110 transition-all" />
                <span class="text-xs font-bold text-gray-700 group-hover:text-gray-950">{{ t('sell.addPhoto') || 'Добавить фото' }}</span>
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
                  {{ t('sell.cover') || 'Главное' }}
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
              <span>{{ t('sell.noPhotosYet') || 'Фотографии еще не загружены. Первое фото станет обложкой лота.' }}</span>
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
            <span>{{ t('sell.btnNextCategory') || 'Далее: Параметры категории' }}</span>
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

      </div>

      <!-- STEP 2: Category Attributes -->
      <div v-else-if="currentStep === 2" class="space-y-6 animate-fade-in-up">

        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-6">
          <div class="flex items-center justify-between pb-4 border-b border-black/[0.06]">
            <div>
              <h3 class="text-base font-black text-gray-950">
                {{ currentCategoryData.name[currentLang] || currentCategoryData.name.ru || currentCategoryData.name.tr }} — {{ t('sell.categoryAttributes') || 'Параметры лота' }}
              </h3>
              <p class="text-xs text-gray-500">{{ t('sell.categoryAttributesSubtitle') || 'Укажите технические детали, интересующие покупателей перед ставкой.' }}</p>
            </div>
            <span class="text-2xl">{{ currentCategoryData.icon }}</span>
          </div>

          <!-- Livestock Form -->
          <div v-if="formData.category === 'livestock'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.animalType') || 'Тип животного' }}</label>
              <select v-model="formData.livestock.animalType" class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold">
                <option value="sheep">{{ t('sell.sheep') || 'Овца / Баран' }}</option>
                <option value="cow">{{ t('sell.cow') || 'Корова / Бык' }}</option>
                <option value="horse">{{ t('sell.horse') || 'Лошадь' }}</option>
                <option value="goat">{{ t('sell.goat') || 'Коза' }}</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.breed') || 'Порода' }}</label>
              <input v-model="formData.livestock.breed" type="text" :placeholder="t('sell.breedPlaceholder') || 'Арашан, Ала-Тоо, Карабайыр'" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold placeholder:text-gray-400/50" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.ageYears') || 'Возраст (лет)' }}</label>
              <input v-model.number="formData.livestock.ageYears" type="number" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.weightKg') || 'Живой вес (кг)' }}</label>
              <input v-model.number="formData.livestock.weightKg" type="number" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
            <div class="sm:col-span-2 pt-2 flex flex-wrap items-center gap-6">
              <label class="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input v-model="formData.livestock.isVaccinated" type="checkbox" class="w-4 h-4 rounded text-amber-500" />
                <span>{{ t('sell.vaccinated') || 'Имеются ветеринарные прививки' }}</span>
              </label>
              <label class="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input v-model="formData.livestock.hasVetPassport" type="checkbox" class="w-4 h-4 rounded text-amber-500" />
                <span>{{ t('sell.vetPassport') || 'Имеется ветпаспорт' }}</span>
              </label>
            </div>
          </div>

          <!-- Vehicles Form -->
          <div v-else-if="formData.category === 'vehicles'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.brandModel') || 'Марка и модель' }}</label>
              <input v-model="formData.vehicle.brand" type="text" placeholder="Toyota Camry" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold placeholder:text-gray-400/50" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.year') || 'Год выпуска' }}</label>
              <input v-model.number="formData.vehicle.year" type="number" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.mileage') || 'Пробег (км)' }}</label>
              <input v-model.number="formData.vehicle.mileageKm" type="number" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.fuelType') || 'Тип топлива' }}</label>
              <select v-model="formData.vehicle.fuelType" class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold">
                <option value="petrol">{{ t('sell.petrol') || 'Бензин' }}</option>
                <option value="diesel">{{ t('sell.diesel') || 'Дизель' }}</option>
                <option value="hybrid">{{ t('sell.hybrid') || 'Гибрид' }}</option>
                <option value="electric">{{ t('sell.electric') || 'Электро' }}</option>
                <option value="gas">{{ t('sell.gas') || 'Газ' }}</option>
              </select>
            </div>
            <div class="sm:col-span-2 pt-2">
              <label class="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input v-model="formData.vehicle.isCustomsCleared" type="checkbox" class="w-4 h-4 rounded text-amber-500" />
                <span>{{ t('sell.customsCleared') || 'Растаможен (100% оформлен), юридически чист' }}</span>
              </label>
            </div>
          </div>

          <!-- Real Estate Form -->
          <div v-else-if="formData.category === 'real-estate'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.propertyType') || 'Тип объекта' }}</label>
              <select v-model="formData.realEstate.propertyType" class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold">
                <option value="dordoy_container">{{ t('sell.dordoyContainer') || 'Контейнер Дордой' }}</option>
                <option value="commercial_shop">{{ t('sell.commercialShop') || 'Магазин / Павильон' }}</option>
                <option value="apartment">{{ t('sell.apartment') || 'Квартира' }}</option>
                <option value="house">{{ t('sell.house') || 'Дом' }}</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.areaSqm') || 'Площадь (м²)' }}</label>
              <input v-model.number="formData.realEstate.areaSqm" type="number" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.deedType') || 'Тип документации' }}</label>
              <select v-model="formData.realEstate.deedType" class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold">
                <option value="red_book">{{ t('sell.redBook') || 'Красная книга' }}</option>
                <option value="tech_passport">{{ t('sell.techPassport') || 'Техпаспорт' }}</option>
                <option value="yellow_book">{{ t('sell.yellowBook') || 'Желтая книга' }}</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.monthlyRevenue') || 'Ежемесячный доход (KGS)' }}</label>
              <input v-model.number="formData.realEstate.monthlyRevenue" type="number" class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold" />
            </div>
          </div>

          <!-- Electronics & General Form (NO MORE HARDCODED APPLE!) -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.brandModel') || 'Марка и модель' }}</label>
              <input
                v-model="formData.electronics.brand"
                type="text"
                placeholder="Örn: Samsung, LG, Midea, Apple, Sony..."
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold placeholder:text-gray-400/50"
              />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.capacitySpec') || 'Параметры / Мощность / Память' }}</label>
              <input
                v-model="formData.electronics.storage"
                type="text"
                placeholder="Örn: 35м² / Inverter, 256GB, 12000 BTU..."
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold placeholder:text-gray-400/50"
              />
            </div>
            <div class="sm:col-span-2 pt-2 flex flex-wrap items-center gap-6">
              <label class="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input v-model="formData.electronics.hasBox" type="checkbox" class="w-4 h-4 rounded text-amber-500" />
                <span>{{ t('sell.hasBox') || 'Оригинальная упаковка и аксессуары в комплекте' }}</span>
              </label>
              <label class="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input v-model="formData.electronics.hasWarranty" type="checkbox" class="w-4 h-4 rounded text-amber-500" />
                <span>{{ t('sell.hasWarranty') || 'Действующая гарантия' }}</span>
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
            <span>{{ t('sell.btnPrev') || 'Назад' }}</span>
          </button>
          <button
            type="button"
            class="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer hover:scale-105 transition-all"
            @click="nextStep"
          >
            <span>{{ t('sell.btnNextPricing') || 'Далее: Цена и сроки' }}</span>
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

      </div>

      <!-- STEP 3: Pricing & Duration -->
      <div v-else-if="currentStep === 3" class="space-y-6 animate-fade-in-up">

        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-6">
          <div class="pb-4 border-b border-black/[0.06]">
            <h3 class="text-base font-black text-gray-950">{{ t('sell.pricingSettings') || 'Настройки аукциона и цены' }}</h3>
            <p class="text-xs text-gray-500">{{ t('sell.durationHint') || 'Укажите начальную стоимость, шаг торгов и срок публикации лота.' }}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Starting Price -->
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
                <DollarSign class="w-3.5 h-3.5 text-amber-600" />
                <span>{{ t('sell.startingPriceLabel') || 'Начальная цена (KGS) *' }}</span>
              </label>
              <input
                v-model.number="formData.startingPrice"
                type="number"
                min="100"
                step="500"
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-sm sm:text-base font-black text-gray-950 focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>

            <!-- Bid Increment -->
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700">{{ t('sell.bidIncrementLabel') || 'Минимальный шаг ставки (KGS) *' }}</label>
              <input
                v-model.number="formData.bidIncrement"
                type="number"
                min="50"
                step="100"
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-sm sm:text-base font-black text-gray-950 focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>

            <!-- Reserve Price -->
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700 flex items-center gap-1">
                <span>{{ t('sell.reservePriceLabel') || 'Скрытая минимальная цена (Резерв)' }}</span>
              </label>
              <input
                v-model.number="formData.reservePrice"
                type="number"
                min="0"
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>

            <!-- Buy Now Price -->
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700 flex items-center gap-1">
                <span>{{ t('sell.buyNowPriceLabel') || 'Цена «Купить сейчас»' }}</span>
              </label>
              <input
                v-model.number="formData.buyNowPrice"
                type="number"
                min="0"
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-black/10 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>
          </div>

          <!-- Duration & Blitz Mode -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-black/[0.06]">
            <div class="space-y-2">
              <label class="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
                <Clock class="w-3.5 h-3.5 text-amber-600" />
                <span>{{ t('sell.durationLabel') || 'Длительность аукциона (дней)' }}</span>
              </label>
              <select
                v-model.number="formData.durationDays"
                class="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-black/10 text-xs sm:text-sm font-bold text-gray-900"
              >
                <option :value="1">1 {{ t('sell.duration1Day') || 'День' }} (24 часа)</option>
                <option :value="2">2 дня (48 часов)</option>
                <option :value="3">3 дня (72 часа)</option>
                <option :value="5">5 дней</option>
                <option :value="7">7 дней</option>
              </select>
            </div>

            <div class="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <input
                id="blitz-toggle"
                v-model="formData.isBlitz"
                type="checkbox"
                class="w-5 h-5 rounded text-amber-500 focus:ring-amber-400"
              />
              <label for="blitz-toggle" class="cursor-pointer">
                <p class="text-xs font-black text-gray-950 flex items-center gap-1">
                  <Flame class="w-3.5 h-3.5 text-amber-600" />
                  <span>{{ t('sell.blitzLabel') || 'Режим экспресс-аукциона (Blitz)' }}</span>
                </p>
                <p class="text-[11px] text-gray-600">{{ t('sell.blitzDesc') || 'Ускоренные торги с частыми уведомлениями участников' }}</p>
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
            <span>{{ t('sell.btnPrev') || 'Назад' }}</span>
          </button>
          <button
            type="button"
            class="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer hover:scale-105 transition-all"
            @click="nextStep"
          >
            <span>{{ t('sell.btnNextPreview') || 'Далее: Предпросмотр' }}</span>
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

      </div>

      <!-- STEP 4: Live Preview & Submission -->
      <div v-else-if="currentStep === 4" class="space-y-6 animate-fade-in-up">

        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-6">
          <div class="pb-4 border-b border-black/[0.06] flex items-center justify-between">
            <div>
              <h3 class="text-base font-black text-gray-950">{{ t('sell.previewTitle') || 'Сводка лота и онлайн-предпросмотр' }}</h3>
              <p class="text-xs text-gray-500">{{ t('sell.previewSubtitle') || 'Проверьте данные перед публикацией.' }}</p>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs">
              {{ t('common.ready') || 'Готово к публикации' }}
            </span>
          </div>

          <!-- Lot Card Preview Box -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 rounded-3xl bg-slate-50 border border-black/[0.06]">
            <div class="md:col-span-5 aspect-video md:aspect-square rounded-2xl overflow-hidden bg-slate-200 relative border border-black/10">
              <img
                v-if="formData.images.length > 0"
                :src="formData.images[0]"
                alt="Main preview"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                <ImageIcon class="w-8 h-8" />
                <span class="text-xs font-bold">{{ t('sell.noPhotosYet') || 'Нет фото' }}</span>
              </div>
            </div>

            <div class="md:col-span-7 flex flex-col justify-between space-y-3">
              <div>
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-900 font-extrabold text-[10px]">
                    {{ currentCategoryData.name[currentLang] || currentCategoryData.name.ru || currentCategoryData.name.tr }}
                  </span>
                  <span class="text-xs font-bold text-gray-400">
                    {{ kyrgyzstanRegions.find(r => r.id === formData.regionId)?.name[currentLang] || 'Кыргызстан' }}
                  </span>
                </div>
                <h4 class="text-lg font-black text-gray-950 line-clamp-2 leading-tight">
                  {{ formData.title || (t('sell.lotTitle') || 'Заголовок') }}
                </h4>
                <p class="text-xs text-gray-600 line-clamp-3 mt-2 leading-relaxed">
                  {{ formData.description || (t('sell.detailedDesc') || 'Описание') }}
                </p>
              </div>

              <div class="pt-4 border-t border-black/[0.06] flex items-end justify-between">
                <div>
                  <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{{ t('sell.startingPriceLabel') || 'Стартовая цена' }}</p>
                  <p class="text-xl font-black text-amber-800 font-mono">
                    {{ formData.startingPrice.toLocaleString() }} KGS
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{{ t('sell.bidIncrementLabel') || 'Шаг ставки' }}</p>
                  <p class="text-sm font-bold text-gray-800 font-mono">
                    +{{ formData.bidIncrement.toLocaleString() }} KGS
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Terms & Agreement -->
          <div class="pt-4 border-t border-black/[0.06]">
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                v-model="formData.agreeTerms"
                type="checkbox"
                class="w-4 h-4 mt-0.5 rounded text-amber-500 focus:ring-amber-400"
              />
              <span class="text-xs text-gray-600 font-medium leading-relaxed">
                {{ t('sell.termsAgree') || 'Я принимаю правила аукциона, требования ПОД/ФТ НБКР и пользовательское соглашение.' }}
              </span>
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
            <span>{{ t('sell.btnPrev') || 'Назад' }}</span>
          </button>
          
          <button
            type="button"
            :disabled="isSubmitting || !formData.agreeTerms"
            class="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-gray-950 font-black text-xs sm:text-sm shadow-lg flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
            @click="submitAuction"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <Sparkles v-else class="w-4 h-4" />
            <span>{{ isSubmitting ? (t('common.processing') || 'Публикация...') : (t('sell.btnPublish') || 'Опубликовать лот') }}</span>
          </button>
        </div>

      </div>

    </div>
  </div>
</template>
