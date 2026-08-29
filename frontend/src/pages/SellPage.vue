<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Sparkles, Upload, Image as ImageIcon, CheckCircle2, 
  AlertCircle, ChevronRight, ChevronLeft, DollarSign,
  Calendar, MapPin, Tag, ShieldCheck, Zap, Info, Loader2,
  Car, Home as HomeIcon, Smartphone, Gem, Palette, Tractor, Eye, Gavel
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { useAuctionStore } from '@/stores/auction'
import { useI18n } from '@/composables/useI18n'
import { kyrgyzstanRegions } from '@/data/regions'
import { platformCategories } from '@/data/categories'
import { generateListingWithAI } from '@/services/aiService'

const router = useRouter()
const auctionStore = useAuctionStore()
const { t, locale } = useI18n()

// Current Wizard Step (1: Details & AI, 2: Specific Attributes, 3: Pricing & Timing, 4: Preview)
const currentStep = ref(1)
const isSubmitting = ref(false)
const isAiGenerating = ref(false)
const aiPromptInput = ref('')

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
    breed: 'Ала-Тоо тукуму',
    ageYears: 4,
    weightKg: 520,
    milkYieldLiters: 22,
    isVaccinated: true,
    hasVetPassport: true,
    deliveryAvailable: true
  },
  vehicle: {
    brand: 'Toyota',
    model: 'Camry 70',
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

// 9Router AI Auto-Generator Trigger
async function handleAiMagicGenerate() {
  if (!aiPromptInput.value.trim()) return
  
  isAiGenerating.value = true
  try {
    const activeRegion = kyrgyzstanRegions.find(r => r.id === formData.value.regionId)
    const activeDistrict = activeRegion?.districts.find(d => d.id === formData.value.districtId)
    
    const result = await generateListingWithAI({
      keywords: aiPromptInput.value,
      category: formData.value.category,
      city: activeRegion?.name.ky || 'Бишкек',
      district: activeDistrict?.name.ky || '',
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

// Next Step
function nextStep() {
  if (currentStep.value < 4) {
    currentStep.value++
  }
}

// Previous Step
function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Publish Auction
async function submitAuction() {
  isSubmitting.value = true
  
  const activeRegion = kyrgyzstanRegions.find(r => r.id === formData.value.regionId)
  const activeDistrict = activeRegion?.districts.find(d => d.id === formData.value.districtId)
  
  const newLot: any = {
    id: 'lot-' + Date.now(),
    title: formData.value.title,
    description: formData.value.description,
    category: formData.value.category,
    subCategory: formData.value.subCategory,
    images: formData.value.images,
    startingPrice: {
      amount: formData.value.startingPrice.toFixed(2),
      minorUnits: formData.value.startingPrice * 100,
      currency: 'KGS',
      formatted: `${formData.value.startingPrice.toLocaleString()} сом`
    },
    currentPrice: {
      amount: formData.value.startingPrice.toFixed(2),
      minorUnits: formData.value.startingPrice * 100,
      currency: 'KGS',
      formatted: `${formData.value.startingPrice.toLocaleString()} сом`
    },
    reservePrice: {
      amount: formData.value.reservePrice.toFixed(2),
      minorUnits: formData.value.reservePrice * 100,
      currency: 'KGS',
      formatted: `${formData.value.reservePrice.toLocaleString()} сом`
    },
    buyNowPrice: {
      amount: formData.value.buyNowPrice.toFixed(2),
      minorUnits: formData.value.buyNowPrice * 100,
      currency: 'KGS',
      formatted: `${formData.value.buyNowPrice.toLocaleString()} сом`
    },
    bidIncrement: {
      amount: formData.value.bidIncrement.toFixed(2),
      minorUnits: formData.value.bidIncrement * 100,
      currency: 'KGS',
      formatted: `${formData.value.bidIncrement.toLocaleString()} сом`
    },
    bidCount: 0,
    status: 'active',
    sellerId: 'current-user',
    seller: {
      id: 'current-user',
      fullName: 'Сиздин Профилиңиз',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      city: activeRegion?.name.ky || 'Бишкек',
      rating: 5.0,
      totalSales: 1
    },
    city: activeRegion?.name.ky || 'Бишкек',
    regionId: formData.value.regionId,
    district: activeDistrict?.name.ky || '',
    startAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + (formData.value.isBlitz ? 3600000 : formData.value.durationDays * 86400000)).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 1,
    isWatching: false,
    isBlitz: formData.value.isBlitz,
    livestock: formData.value.category === 'livestock' ? formData.value.livestock : undefined,
    vehicle: formData.value.category === 'vehicles' ? formData.value.vehicle : undefined,
    realEstate: formData.value.category === 'real-estate' ? formData.value.realEstate : undefined
  }

  auctionStore.auctions.unshift(newLot)
  
  setTimeout(() => {
    isSubmitting.value = false
    router.push(`/auctions/${newLot.id}`)
  }, 600)
}
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fa] text-text-primary font-sans pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto space-y-8">
      
      <!-- Top Title & Header -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-bold border border-amber-500/20">
          <Gavel class="w-4 h-4" />
          <span>Кыргызстан боюнча 100% Банк Эскроу Кепилдиги</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          Жаңы Аукцион Лотун Жайгаштыруу
        </h1>
        <p class="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto">
          Малдан автоунаага, Дордойдогу контейнерден телефонго чейин бардык буюмдарыңызды ачык жана пайдалуу сатыңыз.
        </p>
      </div>

      <!-- Step Indicator Bar -->
      <div class="grid grid-cols-4 gap-2 sm:gap-4">
        <div 
          v-for="s in 4" 
          :key="s"
          class="p-3 rounded-2xl border transition-all text-center"
          :class="currentStep === s
            ? 'bg-amber-500/10 border-amber-500 text-amber-800 font-bold shadow-sm'
            : currentStep > s
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 font-semibold'
              : 'bg-white border-black/10 text-text-muted'"
        >
          <div class="text-xs font-mono">0{{ s }}-Кадам</div>
          <div class="text-[11px] sm:text-xs truncate hidden sm:block">
            {{ s === 1 ? 'Лот & AI Сыйкыры' : s === 2 ? 'Мүнөздөмөлөр' : s === 3 ? 'Баа & Мөөнөт' : 'Текшерүү' }}
          </div>
        </div>
      </div>

      <!-- Form Container -->
      <div class="glass p-6 sm:p-10 rounded-3xl border border-black/[0.08] bg-white/95 shadow-md space-y-8">
        
        <!-- =================================================================
             STEP 1: DETAILS, CATEGORY & 9ROUTER AI MAGIC
             ================================================================= -->
        <div v-if="currentStep === 1" class="space-y-6">
          
          <!-- 9Router AI Banner -->
          <div class="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-amber-500/10 border border-purple-500/20 space-y-3">
            <div class="flex items-center gap-2 text-purple-700 font-bold text-sm">
              <Sparkles class="w-4 h-4 text-amber-500 animate-pulse" />
              <span>9Router AI менен 1 Секүндө Илан Түзүү (NVIDIA Nemotron)</span>
            </div>
            <p class="text-xs text-text-secondary">
              Мисалы: <i>"Ала-Тоо саан уй 4 жашта Нарын Кочкордон"</i> же <i>"Toyota Camry 2020 Бажы төлөнгөн Бишкек"</i> деп жазып, баскычты басыңыз.
            </p>
            <div class="flex gap-2">
              <input
                v-model="aiPromptInput"
                placeholder="Буюмдун атын жана кыска маалыматын жазыңыз..."
                class="flex-1 px-4 py-2.5 rounded-xl text-base bg-white border border-black/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-text-primary"
                @keyup.enter="handleAiMagicGenerate"
              />
              <button
                type="button"
                :disabled="isAiGenerating || !aiPromptInput.trim()"
                @click="handleAiMagicGenerate"
                class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Loader2 v-if="isAiGenerating" class="w-4 h-4 animate-spin" />
                <Sparkles v-else class="w-4 h-4 text-primary" />
                <span>{{ isAiGenerating ? 'Түзүлүүдө...' : 'AI менен Түзүү' }}</span>
              </button>
            </div>
          </div>

          <!-- Category Selector -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-text-secondary">Категорияны тандаңыз *</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                v-for="cat in platformCategories"
                :key="cat.slug"
                type="button"
                @click="formData.category = cat.slug"
                class="p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer"
                :class="formData.category === cat.slug
                  ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 text-amber-900 font-bold'
                  : 'bg-white border-black/10 text-text-secondary hover:bg-black/5'"
              >
                <span class="text-2xl">{{ cat.icon }}</span>
                <div class="min-w-0">
                  <div class="text-xs font-bold truncate">{{ cat.name.ky.split(' ')[0] }}</div>
                  <div class="text-[10px] text-text-muted truncate">{{ cat.count }} лот</div>
                </div>
              </button>
            </div>
          </div>

          <!-- Kyrgyzstan Region & District -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-text-secondary">Облус / Шаар *</label>
              <select
                v-model="formData.regionId"
                class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 text-text-primary"
              >
                <option v-for="r in kyrgyzstanRegions" :key="r.id" :value="r.id">
                  {{ r.name.ky }}
                </option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-text-secondary">Район / Айыл / Базар *</label>
              <select
                v-model="formData.districtId"
                class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 text-text-primary"
              >
                <option v-for="d in currentDistricts" :key="d.id" :value="d.id">
                  {{ d.name.ky }}
                </option>
              </select>
            </div>
          </div>

          <!-- Title -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-text-secondary">Лоттун Аталышы *</label>
            <input
              v-model="formData.title"
              placeholder="Мисалы: Ала-Тоо тукумундагы саан уй (2-тууту, 24 литр сүт)"
              class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 text-text-primary"
            />
          </div>

          <!-- Description -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-text-secondary">Толук Сыпаттамасы *</label>
            <textarea
              v-model="formData.description"
              rows="4"
              placeholder="Буюмдун абалы, өзгөчөлүктөрү жана кепилдиги тууралуу жазыңыз..."
              class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 text-text-primary resize-none"
            ></textarea>
          </div>

        </div>

        <!-- =================================================================
             STEP 2: CATEGORY SPECIFIC ATTRIBUTES (LIVESTOCK / VEHICLE / PROPERTY)
             ================================================================= -->
        <div v-if="currentStep === 2" class="space-y-6">
          
          <!-- Livestock Form -->
          <div v-if="formData.category === 'livestock'" class="space-y-5">
            <div class="flex items-center gap-2 text-base font-bold text-amber-800">
              <span class="text-2xl">🐄</span>
              <span>Мал Чарбасынын Мүнөздөмөлөрү</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-text-secondary">Малдын Түрү</label>
                <select v-model="formData.livestock.animalType" class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-semibold">
                  <option value="cow">Саан Уй (Корова)</option>
                  <option value="bull">Бука / Торпок (Бык)</option>
                  <option value="horse">Жылкы / Аргымак (Лошадь)</option>
                  <option value="foal">Тай / Кунан (Жеребенок)</option>
                  <option value="ram">Кочкор (Арашан/Гиссар)</option>
                  <option value="sheep">Кой (Овца)</option>
                  <option value="goat">Эчки (Коза)</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-text-secondary">Породасы / Тукуму</label>
                <input v-model="formData.livestock.breed" placeholder="Мисалы: Ала-Тоо, Арашан, Голштин" class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base" />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-text-secondary">Жашы (Жыл)</label>
                <input v-model.number="formData.livestock.ageYears" type="number" class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-bold font-mono" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-text-secondary">Тирүү салмагы (кг)</label>
                <input v-model.number="formData.livestock.weightKg" type="number" placeholder="520" class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-bold font-mono" />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-text-secondary">Күнүмдүк сүтү (Литр/күн)</label>
                <input v-model.number="formData.livestock.milkYieldLiters" type="number" placeholder="22" class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-bold font-mono" />
              </div>
            </div>

            <div class="flex flex-wrap gap-4 pt-2">
              <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input type="checkbox" v-model="formData.livestock.isVaccinated" class="w-4 h-4 rounded text-amber-500" />
                <span>Ветеринардык эмдөөлөрү бар</span>
              </label>
              <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input type="checkbox" v-model="formData.livestock.hasVetPassport" class="w-4 h-4 rounded text-amber-500" />
                <span>Ветеринардык паспорту бар</span>
              </label>
              <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input type="checkbox" v-model="formData.livestock.deliveryAvailable" class="w-4 h-4 rounded text-amber-500" />
                <span>Жеткирүү (мал ташуу) каралган</span>
              </label>
            </div>
          </div>

          <!-- Vehicle Form -->
          <div v-else-if="formData.category === 'vehicles'" class="space-y-5">
            <div class="flex items-center gap-2 text-base font-bold text-amber-800">
              <span class="text-2xl">🚗</span>
              <span>Автоунаа Мүнөздөмөлөрү</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-text-secondary">Марка & Модель</label>
                <input v-model="formData.vehicle.model" placeholder="Toyota Camry" class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base" />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-text-secondary">Чыккан жылы</label>
                <input v-model.number="formData.vehicle.year" type="number" placeholder="2020" class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-bold font-mono" />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-text-secondary">Жүрүшү (Пробег км)</label>
                <input v-model.number="formData.vehicle.mileageKm" type="number" placeholder="68000" class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-bold font-mono" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-text-secondary">Руль (Оң / Сол)</label>
                <select v-model="formData.vehicle.steering" class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-semibold">
                  <option value="left">Сол руль (Левый)</option>
                  <option value="right">Оң руль (Правый)</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-text-secondary">Күйүүчү май</label>
                <select v-model="formData.vehicle.fuelType" class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-semibold">
                  <option value="petrol">Бензин</option>
                  <option value="gas">Газ / Бензин</option>
                  <option value="diesel">Дизель</option>
                  <option value="hybrid">Гибрид</option>
                  <option value="electric">Электромобиль</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-text-secondary">Мотор көлөмү (Л)</label>
                <input v-model.number="formData.vehicle.engineVolume" type="number" step="0.1" placeholder="2.5" class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-bold font-mono" />
              </div>
            </div>

            <div class="pt-2">
              <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input type="checkbox" v-model="formData.vehicle.isCustomsCleared" class="w-4 h-4 rounded text-amber-500" />
                <span>Бажы төлөмдөрү (Растаможка) 100% төлөнгөн, юридикалык жактан таза</span>
              </label>
            </div>
          </div>

          <!-- Real Estate / Dordoy Shop Form -->
          <div v-else-if="formData.category === 'real-estate'" class="space-y-5">
            <div class="flex items-center gap-2 text-base font-bold text-amber-800">
              <span class="text-2xl">🏢</span>
              <span>Кыймылсыз Мүлк & Соода Түйүнү (Дордой) Мүнөздөмөлөрү</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-text-secondary">Мүлктүн Түрү</label>
                <select v-model="formData.realEstate.propertyType" class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-semibold">
                  <option value="dordoy_container">Дордой / Кара-Суу Контейнери</option>
                  <option value="commercial_shop">Соода Дүкөнү (Магазин)</option>
                  <option value="apartment">Батир (Квартира)</option>
                  <option value="house">Жеке Үй / Коттедж</option>
                  <option value="land">Жер Тилкеси / Ферма</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-text-secondary">Аянты (м²)</label>
                <input v-model.number="formData.realEstate.areaSqm" type="number" placeholder="48" class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-bold font-mono" />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-text-secondary">Документ түрү (Кызыл китеп)</label>
                <select v-model="formData.realEstate.deedType" class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-semibold">
                  <option value="red_book">Кызыл китеп (Красная книга)</option>
                  <option value="tech_passport">Техпаспорт / Договор</option>
                  <option value="yellow_book">Сары китеп (Аренда)</option>
                </select>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-text-secondary">Айлык ижара кирешеси (Сом)</label>
              <input v-model.number="formData.realEstate.monthlyRevenue" type="number" placeholder="180000" class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-bold font-mono" />
            </div>
          </div>

          <!-- General Attributes for other categories -->
          <div v-else class="p-6 rounded-2xl bg-gray-50 text-center space-y-2">
            <CheckCircle2 class="w-8 h-8 text-emerald-500 mx-auto" />
            <div class="text-sm font-bold">Жалпы Параметрлер Даяр</div>
            <p class="text-xs text-text-muted">Бул категория үчүн кошумча документ талап кылынбайт. Баа жана мөөнөт кадамдарына өтсөңүз болот.</p>
          </div>

        </div>

        <!-- =================================================================
             STEP 3: PRICING, BUY IT NOW & TIMING
             ================================================================= -->
        <div v-if="currentStep === 3" class="space-y-6">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-text-secondary">Башталгыч Баа (KGS сом) *</label>
              <input 
                v-model.number="formData.startingPrice" 
                type="number" 
                class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-extrabold font-mono text-amber-700"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-text-secondary">Минималдуу Тепкич кадамы (KGS сом) *</label>
              <input 
                v-model.number="formData.bidIncrement" 
                type="number" 
                class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-extrabold font-mono text-emerald-600"
              />
            </div>
          </div>

          <!-- Buy It Now & Reserve Price -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-text-secondary">Дароо Сатып Алуу Баасы (Buy It Now)</label>
              <input 
                v-model.number="formData.buyNowPrice" 
                type="number" 
                class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-bold font-mono"
              />
              <p class="text-[10px] text-text-muted">Сатып алуучу күтпөстөн ушул баага дароо алып кете алат.</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-text-secondary">Жашыруун Резервдик Баа</label>
              <input 
                v-model.number="formData.reservePrice" 
                type="number" 
                class="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-base font-bold font-mono"
              />
              <p class="text-[10px] text-text-muted">Бул баага жетпесе сатууга милдеттүү эмессиз.</p>
            </div>
          </div>

          <!-- Duration / Blitz -->
          <div class="p-5 rounded-2xl bg-gray-50 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-bold text-text-primary">Аукциондун Мөөнөтү</div>
                <div class="text-[11px] text-text-muted">Лот канча убакыт активдүү болот?</div>
              </div>
              <select v-model.number="formData.durationDays" class="px-4 py-2 rounded-xl bg-white text-base font-bold border border-black/10">
                <option :value="1">24 Саат (1 Күн)</option>
                <option :value="3">3 Күн (Сунушталат)</option>
                <option :value="5">5 Күн</option>
                <option :value="7">7 Күн</option>
              </select>
            </div>

            <div class="pt-2 border-t border-black/5 flex items-center justify-between">
              <label class="flex items-center gap-2 text-xs font-bold text-red-600 cursor-pointer">
                <input type="checkbox" v-model="formData.isBlitz" class="w-4 h-4 rounded text-red-500" />
                <span>🔥 Флагман / Флаш Аукцион (1 Сааттык Тез Сатуу)</span>
              </label>
            </div>
          </div>

        </div>

        <!-- =================================================================
             STEP 4: PREVIEW & FINAL CONFIRMATION
             ================================================================= -->
        <div v-if="currentStep === 4" class="space-y-6">
          
          <div class="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">
                {{ currentCategoryData.icon }}
              </div>
              <div>
                <h3 class="text-lg font-extrabold text-text-primary">{{ formData.title }}</h3>
                <p class="text-xs text-text-muted">📍 {{ formData.regionId }}, {{ formData.districtId }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-2">
              <div class="p-3 rounded-xl bg-white">
                <div class="text-[10px] text-text-muted font-medium">Башталыш Баа</div>
                <div class="text-sm font-extrabold text-amber-700 font-mono">{{ formData.startingPrice.toLocaleString() }} KGS</div>
              </div>
              <div class="p-3 rounded-xl bg-white">
                <div class="text-[10px] text-text-muted font-medium">Тепкич Кадамы</div>
                <div class="text-sm font-extrabold text-emerald-600 font-mono">+{{ formData.bidIncrement.toLocaleString() }} KGS</div>
              </div>
              <div class="p-3 rounded-xl bg-white">
                <div class="text-[10px] text-text-muted font-medium">Дароо Сатып Алуу</div>
                <div class="text-sm font-extrabold text-blue-600 font-mono">{{ formData.buyNowPrice.toLocaleString() }} KGS</div>
              </div>
              <div class="p-3 rounded-xl bg-white">
                <div class="text-[10px] text-text-muted font-medium">Мөөнөтү</div>
                <div class="text-sm font-bold">{{ formData.isBlitz ? '1 Саат' : `${formData.durationDays} Күн` }}</div>
              </div>
            </div>

            <p class="text-xs text-text-secondary leading-relaxed border-t border-black/5 pt-3">
              {{ formData.description }}
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-700">
            <ShieldCheck class="w-6 h-6 flex-shrink-0" />
            <span>Бул лот MBank жана DemirBank эскроу кепилдиги менен корголот. Сатуудан кийин акча түздөн-түз сиздин банк эсебиңизге которулат.</span>
          </div>

        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between pt-4 border-t border-black/10">
          <button
            v-if="currentStep > 1"
            type="button"
            @click="prevStep"
            class="px-6 py-3 rounded-2xl bg-gray-100 text-xs font-bold text-text-secondary hover:bg-gray-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft class="w-4 h-4" />
            <span>Артка</span>
          </button>
          <div v-else />

          <button
            v-if="currentStep < 4"
            type="button"
            @click="nextStep"
            class="px-8 py-3.5 rounded-2xl bg-primary text-text-primary font-extrabold text-xs shadow-md hover:bg-primary-hover transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Кийинки Кадам</span>
            <ChevronRight class="w-4 h-4" />
          </button>

          <button
            v-else
            type="button"
            :disabled="isSubmitting"
            @click="submitAuction"
            class="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-extrabold text-xs shadow-md hover:from-emerald-400 hover:to-emerald-300 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <Gavel v-else class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Жайгаштырылууда...' : 'Аукционду Баштоо 🚀' }}</span>
          </button>
        </div>

      </div>

    </div>
  </div>
</template>