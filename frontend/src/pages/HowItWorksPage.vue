<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  ArrowRight, Shield, Clock, Search, Truck, ShieldCheck, 
  Award, Zap, Globe, Users, CreditCard, CheckCircle, User, 
  ChevronDown, ChevronRight, Sparkles, Play, Check, Lock,
  HelpCircle, ThumbsUp, Smartphone, Layers
} from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import SiteWalkthroughFilm from '@/components/film/SiteWalkthroughFilm.vue'
import SellerWalkthroughFilm from '@/components/film/SellerWalkthroughFilm.vue'

const { t, currentLocale, currentLang } = useI18n()

const activeFilmTab = ref<'buyer' | 'seller'>('buyer')
const filmRef = ref<any>(null)
const sellerFilmRef = ref<any>(null)
const filmContainerRef = ref<HTMLElement | null>(null)

function jumpToFilmScene(idx: number) {
  if (activeFilmTab.value === 'buyer' && filmRef.value) {
    filmRef.value.goToScene(idx)
  } else if (activeFilmTab.value === 'seller' && sellerFilmRef.value) {
    sellerFilmRef.value.goToScene(idx)
  }
  filmContainerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const steps = computed(() => [
  {
    number: '01',
    title: t('howItWorksPage.step1Title'),
    description: t('howItWorksPage.step1Desc'),
    icon: Smartphone,
    color: 'from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-500/20',
  },
  {
    number: '02',
    title: t('howItWorksPage.step2Title'),
    description: t('howItWorksPage.step2Desc'),
    icon: ShieldCheck,
    color: 'from-blue-500/10 to-indigo-500/10 text-blue-700 border-blue-500/20',
  },
  {
    number: '03',
    title: t('howItWorksPage.step3Title'),
    description: t('howItWorksPage.step3Desc'),
    icon: Search,
    color: 'from-emerald-500/10 to-teal-500/10 text-emerald-700 border-emerald-500/20',
  },
  {
    number: '04',
    title: t('howItWorksPage.step4Title'),
    description: t('howItWorksPage.step4Desc'),
    icon: Zap,
    color: 'from-amber-500/10 to-rose-500/10 text-rose-700 border-rose-500/20',
  },
  {
    number: '05',
    title: t('howItWorksPage.step5Title'),
    description: t('howItWorksPage.step5Desc'),
    icon: CreditCard,
    color: 'from-purple-500/10 to-indigo-500/10 text-purple-700 border-purple-500/20',
  },
  {
    number: '06',
    title: t('howItWorksPage.step6Title'),
    description: t('howItWorksPage.step6Desc'),
    icon: Truck,
    color: 'from-teal-500/10 to-green-500/10 text-teal-700 border-teal-500/20',
  },
])

const features = computed(() => [
  {
    title: t('howItWorksPage.featRealtimeTitle'),
    description: t('howItWorksPage.featRealtimeDesc'),
    icon: Zap,
    badge: 'WebSocket 0.1s'
  },
  {
    title: t('howItWorksPage.featEscrowTitle'),
    description: t('howItWorksPage.featEscrowDesc'),
    icon: Shield,
    badge: 'DemirBank Escrow'
  },
  {
    title: t('howItWorksPage.featBanksTitle'),
    description: t('howItWorksPage.featBanksDesc'),
    icon: Globe,
    badge: 'MBank & Optima'
  },
  {
    title: t('howItWorksPage.featDeliveryTitle'),
    description: t('howItWorksPage.featDeliveryDesc'),
    icon: Truck,
    badge: currentLocale.value === 'ky' ? 'Бүт Кыргызстан' : (currentLocale.value === 'tr' ? 'Tüm Kırgızistan' : 'Весь Кыргызстан')
  },
  {
    title: t('howItWorksPage.featLotsTitle'),
    description: t('howItWorksPage.featLotsDesc'),
    icon: Award,
    badge: currentLocale.value === 'ky' ? '5 000+ Лот' : (currentLocale.value === 'tr' ? '5.000+ Lot' : '5 000+ Лотов')
  },
  {
    title: t('howItWorksPage.featSupportTitle'),
    description: t('howItWorksPage.featSupportDesc'),
    icon: Clock,
    badge: currentLocale.value === 'ky' ? '24/7 Колдоо' : (currentLocale.value === 'tr' ? '7/24 Destek' : '24/7 Поддержка')
  },
])

// Categorized FAQ System
const activeFaqCategory = ref('all')

const allFaqs = computed(() => [
  {
    category: 'buyer',
    q: t('howItWorksPage.faq1Q'),
    a: t('howItWorksPage.faq1A'),
  },
  {
    category: 'escrow',
    q: t('howItWorksPage.faq2Q'),
    a: t('howItWorksPage.faq2A'),
  },
  {
    category: 'buyer',
    q: t('howItWorksPage.faq3Q'),
    a: t('howItWorksPage.faq3A'),
  },
  {
    category: 'delivery',
    q: t('howItWorksPage.faq4Q'),
    a: t('howItWorksPage.faq4A'),
  },
  {
    category: 'seller',
    q: t('howItWorksPage.faq5Q'),
    a: t('howItWorksPage.faq5A'),
  },
])

const filteredFaqs = computed(() => {
  if (activeFaqCategory.value === 'all') return allFaqs.value
  return allFaqs.value.filter(f => f.category === activeFaqCategory.value)
})

const openFaqIndex = ref<number | null>(0)

function toggleFaq(idx: number) {
  openFaqIndex.value = openFaqIndex.value === idx ? null : idx
}
</script>

<template>
  <div class="min-h-screen bg-[#F8F9FD] text-gray-900 font-sans pt-24 sm:pt-28 pb-24 px-3 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-16 sm:space-y-20">
      
      <!-- Breadcrumb Navigation -->
      <nav class="flex items-center gap-2 text-xs font-semibold text-gray-500" aria-label="Breadcrumb">
        <RouterLink to="/" class="hover:text-amber-600 transition-colors">{{ t('auction.breadcrumbHome') }}</RouterLink>
        <ChevronRight class="w-3.5 h-3.5" />
        <span class="text-gray-900 font-black">{{ t('howItWorksPage.title') }}</span>
      </nav>

      <!-- Hero Header Section -->
      <div class="text-center max-w-3xl mx-auto space-y-4">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-700 text-xs font-black border border-amber-500/20 shadow-xs">
          <Sparkles class="w-4 h-4 text-amber-600" />
          <span>iTorgo Кыргызстан — {{ currentLang === 'ky' ? 'Расмий Колдонмо' : (currentLang === 'tr' ? 'Resmi Kullanım Rehberi' : 'Официальное Руководство') }}</span>
        </div>

        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 tracking-tight leading-tight">
          {{ t('howItWorksPage.title') }}
        </h1>

        <p class="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">
          {{ t('howItWorksPage.subtitle') }}
        </p>
      </div>

      <!-- ================================================================
           SIGNATURE ANIMATED FILM & INTERACTIVE WALKTHROUGH
           ================================================================ -->
      <section
        ref="filmContainerRef"
        aria-label="Interactive Film Walkthrough"
        class="w-full space-y-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 px-2">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <h2 class="text-base sm:text-lg font-black text-gray-950">
              {{ currentLang === 'ky' ? '🎬 Интерактивдүү Видео-Гид (3 Тилде)' : (currentLang === 'tr' ? '🎬 İnteraktif Tanıtım Filmi (3 Dilde)' : '🎬 Интерактивный Фильм-Гид (на 3 языках)') }}
            </h2>
          </div>
          <div class="text-xs font-bold text-gray-500">
            {{ currentLang === 'ky' ? '▶ Кадамдарды басып өтүңүз' : (currentLang === 'tr' ? '▶ Durdurabilir ve deneyebilirsiniz' : '▶ Интерактивные шаги и симуляция') }}
          </div>
        </div>

        <!-- Film Mode Tabs -->
        <div class="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-white border border-black/10 shadow-xs">
          <div class="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              class="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2"
              :class="activeFilmTab === 'buyer'
                ? 'bg-amber-400 text-gray-950 shadow-xs'
                : 'text-gray-600 hover:text-gray-950 hover:bg-slate-50'"
              @click="activeFilmTab = 'buyer'"
            >
              <span>🛍️ {{ currentLang === 'ky' ? 'Сатып алуучунун Гиди' : (currentLang === 'tr' ? 'Alıcı Rehberi (Teklif Verme)' : 'Для Покупателей: Как участвовать') }}</span>
            </button>
            <button
              type="button"
              class="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2"
              :class="activeFilmTab === 'seller'
                ? 'bg-emerald-500 text-gray-950 shadow-xs'
                : 'text-gray-600 hover:text-gray-950 hover:bg-slate-50'"
              @click="activeFilmTab = 'seller'"
            >
              <span>🏪 {{ currentLang === 'ky' ? 'Сатуучунун Гиди (Илан берүү)' : (currentLang === 'tr' ? 'Satıcı Rehberi (Nasıl İlan Verilir?)' : 'Для Продавцов: Как создать лот') }}</span>
            </button>
          </div>

          <div class="hidden sm:flex items-center gap-2 pr-3 text-xs font-bold text-gray-500">
            <Sparkles class="w-4 h-4 text-amber-500" />
            <span>{{ activeFilmTab === 'buyer' ? (currentLang === 'ky' ? 'Коюм коюу, эскроу жана жеңүү' : (currentLang === 'tr' ? 'Teklif verme, emanet ve teslimat' : 'Ставки, эскроу и победа')) : (currentLang === 'ky' ? 'AI баяндоо, сүрөт жана акча чыгаруу' : (currentLang === 'tr' ? 'AI açıklama, fotoğraf ve tahsilat' : 'AI-описание, фото и выплата')) }}</span>
          </div>
        </div>

        <!-- Cinema Device Frame -->
        <SiteWalkthroughFilm v-if="activeFilmTab === 'buyer'" ref="filmRef" :initial-lang="currentLang" />
        <SellerWalkthroughFilm v-else ref="sellerFilmRef" :initial-lang="currentLang" />
      </section>

      <!-- ================================================================
           6 STEP CARDS (INTERACTIVE & TIED TO FILM)
           ================================================================ -->
      <section aria-labelledby="steps-grid-title" class="space-y-6">
        <div class="text-center max-w-2xl mx-auto space-y-2">
          <span class="text-xs font-black text-amber-600 uppercase tracking-widest">
            {{ currentLang === 'ky' ? '6 ЖӨНӨКӨЙ КАДАМ' : (currentLang === 'tr' ? '6 KOLAY ADIM' : '6 ПРОСТЫХ ШАГОВ') }}
          </span>
          <h2 id="steps-grid-title" class="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
            {{ currentLang === 'ky' ? 'Каттоодон баштап утушка чейин' : (currentLang === 'tr' ? 'Kayıttan Teslimata Alışveriş Süreci' : 'От регистрации до получения лота') }}
          </h2>
          <p class="text-xs sm:text-sm text-gray-500">
            {{ currentLang === 'ky' ? 'Карточканы басып, кинодогу тиешелүү кадамды көрүңүз' : (currentLang === 'tr' ? 'Kartlara tıklayarak animasyondaki ilgili adımı izleyebilirsiniz' : 'Нажмите на любую карточку, чтобы открыть шаг в интерактивном гиде') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          <div 
            v-for="(step, idx) in steps" 
            :key="idx"
            class="group relative p-6 sm:p-7 rounded-3xl border border-black/8 bg-white shadow-sm hover:border-amber-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer transform hover:-translate-y-1"
            @click="jumpToFilmScene(idx)"
          >
            <div class="space-y-4">
              <!-- Top Row: Number & Icon -->
              <div class="flex items-center justify-between">
                <span class="text-3xl font-black font-mono text-amber-500 group-hover:scale-105 transition-transform">
                  {{ step.number }}
                </span>
                <div
                  class="w-12 h-12 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110"
                  :class="step.color"
                >
                  <component :is="step.icon" class="w-6 h-6" />
                </div>
              </div>

              <!-- Content -->
              <div class="space-y-1.5">
                <h3 class="text-base sm:text-lg font-black text-gray-950 group-hover:text-amber-600 transition-colors">
                  {{ step.title }}
                </h3>
                <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {{ step.description }}
                </p>
              </div>
            </div>

            <!-- Bottom Action Trigger -->
            <div class="pt-4 mt-4 border-t border-black/5 flex items-center justify-between text-xs font-bold text-amber-600 group-hover:text-amber-700">
              <span class="flex items-center gap-1.5">
                <Play class="w-3.5 h-3.5 fill-current" />
                <span>{{ currentLang === 'ky' ? 'Кинодон көрүү' : (currentLang === 'tr' ? 'Filmde İzle' : 'Смотреть в гиде') }}</span>
              </span>
              <ChevronRight class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      <!-- ================================================================
           INTERACTIVE 3-WAY BANK ESCROW FLOW
           ================================================================ -->
      <section aria-label="3-Way Bank Escrow Guarantee" class="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-gray-950 to-slate-900 border border-white/10 text-white p-6 sm:p-10 lg:p-12 shadow-2xl space-y-8">
        <div class="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div class="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div class="text-center max-w-2xl mx-auto space-y-2">
          <span class="px-3.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            DEMIRBANK & OPTIMA 100% ESCROW
          </span>
          <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {{ currentLang === 'ky' ? 'Каражаттарыңыз Кантип Корголот?' : (currentLang === 'tr' ? 'Paranız Nasıl %100 Güvende Tutulur?' : 'Как защищены ваши деньги?') }}
          </h2>
          <p class="text-xs sm:text-sm text-white/60">
            {{ currentLang === 'ky' ? 'Сиз товарды текшерип, кабыл алганга чейин сатуучуга акча төлөнбөйт' : (currentLang === 'tr' ? 'Ürünü elinize alıp onaylamadan önce satıcıya tek kuruş aktarılmaz' : 'Продавец не получит оплату, пока вы лично не проверите и не подтвердите лот') }}
          </p>
        </div>

        <!-- 3-Pillars Interactive Graphic -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative z-10">
          <!-- Step 1: Buyer -->
          <div class="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h4 class="text-base font-black text-white">
              {{ currentLang === 'ky' ? 'Сатып алуучу төлөйт' : (currentLang === 'tr' ? 'Alıcı Tutarını Öder' : 'Покупатель вносит сумму') }}
            </h4>
            <p class="text-xs text-white/60 leading-relaxed">
              {{ currentLang === 'ky' ? 'MBank QR, Optima же Элкарт аркылуу расмий эсепке каражат которулат.' : (currentLang === 'tr' ? 'MBank QR, Optima veya kartla ödeme sisteme iletilir.' : 'Оплата через MBank QR, карты Optima или Элкарт поступает в защищенный шлюз.') }}
            </p>
          </div>

          <!-- Step 2: Escrow Vault Center -->
          <div class="p-6 rounded-2xl bg-gradient-to-b from-purple-950/80 to-purple-900/60 border border-purple-400/60 space-y-3 relative shadow-[0_0_30px_rgba(168,85,247,0.25)]">
            <div class="w-10 h-10 rounded-xl bg-purple-500/30 text-purple-300 flex items-center justify-center font-black">
              🔒
            </div>
            <h4 class="text-base font-black text-purple-200">
              {{ currentLang === 'ky' ? 'DemirBank Эскроу Капчыгы' : (currentLang === 'tr' ? 'DemirBank Emanet Havuzu' : 'Эскроу-хранилище DemirBank') }}
            </h4>
            <p class="text-xs text-white/70 leading-relaxed">
              {{ currentLang === 'ky' ? 'Акча атайын эсепте тоңдурулат. Эч ким, атүгүл сатуучу да аны чыгарып кете албайт.' : (currentLang === 'tr' ? 'Tutar banka emanet havuzunda kilitlenir. Teslimata kadar hiç kimse çekemez.' : 'Средства надежно заморожены на расчетном счете. Продавец не имеет к ним доступа.') }}
            </p>
          </div>

          <!-- Step 3: Seller -->
          <div class="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h4 class="text-base font-black text-white">
              {{ currentLang === 'ky' ? 'Текшерүү жана Төлөм' : (currentLang === 'tr' ? 'Kontrol & Satıcıya Aktarım' : 'Проверка и Выплата') }}
            </h4>
            <p class="text-xs text-white/60 leading-relaxed">
              {{ currentLang === 'ky' ? 'Товар текшерилген соң, эскроу кулпусу ачылып, акча сатуучунун эсебине түшөт.' : (currentLang === 'tr' ? 'Alıcı onay verdiği an bloke çözülür ve para satıcının kartına aktarılır.' : 'После подтверждения покупателем деньги мгновенно зачисляются на баланс продавца.') }}
            </p>
          </div>
        </div>

        <!-- Bank Partner Logos Stamp -->
        <div class="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-white/50">
          <span class="flex items-center gap-2">
            <ShieldCheck class="w-4 h-4 text-emerald-400" />
            {{ currentLang === 'ky' ? 'Кыргыз Республикасынын Улуттук Банкынын эрежелерине шайкеш' : (currentLang === 'tr' ? 'Kırgızistan Merkez Bankası Standartlarına Tam Uyum' : 'Соответствует стандартам Национального Банка КР') }}
          </span>
          <div class="flex items-center gap-4 font-black text-white/80">
            <span>DEMIRBANK</span>
            <span>•</span>
            <span>OPTIMA BANK</span>
            <span>•</span>
            <span>MBANK</span>
            <span>•</span>
            <span>ЭЛКАРТ</span>
          </div>
        </div>
      </section>

      <!-- ================================================================
           PLATFORM CORE FEATURES & ADVANTAGES
           ================================================================ -->
      <section aria-labelledby="features-title" class="space-y-8">
        <div class="text-center max-w-2xl mx-auto space-y-2">
          <span class="text-xs font-black text-amber-600 uppercase tracking-widest">
            {{ currentLang === 'ky' ? 'АРТЫКЧЫЛЫКТАР' : (currentLang === 'tr' ? 'AVANTAJLAR' : 'ПРЕИМУЩЕСТВА') }}
          </span>
          <h2 id="features-title" class="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
            {{ t('aboutPage.whyUsTitle') }}
          </h2>
          <p class="text-xs sm:text-sm text-gray-500">
            {{ t('home.escrowSubtitle') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          <div 
            v-for="(feat, idx) in features" 
            :key="idx"
            class="p-6 rounded-3xl border border-black/8 bg-white shadow-sm space-y-3 hover:border-amber-400 hover:shadow-md transition-all"
          >
            <div class="flex items-center justify-between">
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
                <component :is="feat.icon" class="w-5 h-5" />
              </div>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-gray-700 border border-black/5">
                {{ feat.badge }}
              </span>
            </div>
            <h3 class="text-base font-black text-gray-950">{{ feat.title }}</h3>
            <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">{{ feat.description }}</p>
          </div>
        </div>
      </section>

      <!-- ================================================================
           FAQ ACCORDION SECTION WITH CATEGORIES
           ================================================================ -->
      <section aria-labelledby="faq-title" class="space-y-6 max-w-3xl mx-auto">
        <div class="text-center space-y-2">
          <span class="text-xs font-black text-amber-600 uppercase tracking-widest">
            {{ currentLang === 'ky' ? 'СУРОО-ЖООП' : (currentLang === 'tr' ? 'SORULAR VE CEVAPLAR' : 'ВОПРОСЫ И ОТВЕТЫ') }}
          </span>
          <h2 id="faq-title" class="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
            {{ t('howItWorksPage.faqTitle') }}
          </h2>
          <p class="text-xs sm:text-sm text-gray-500">
            {{ t('howItWorksPage.faqSubtitle') }}
          </p>
        </div>

        <!-- FAQ Categories Filter Pills -->
        <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            v-for="cat in [
              { id: 'all', label: currentLang === 'ky' ? 'Бардык суроолор' : (currentLang === 'tr' ? 'Tüm Sorular' : 'Все вопросы') },
              { id: 'buyer', label: currentLang === 'ky' ? 'Сатып алуучуларга' : (currentLang === 'tr' ? 'Alıcılar' : 'Покупателям') },
              { id: 'escrow', label: currentLang === 'ky' ? 'Эскроу коопсуздугу' : (currentLang === 'tr' ? 'Escrow Güvenliği' : 'Эскроу и Защита') },
              { id: 'seller', label: currentLang === 'ky' ? 'Сатуучуларга' : (currentLang === 'tr' ? 'Satıcılar' : 'Продавцам') }
            ]"
            :key="cat.id"
            type="button"
            class="px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            :class="activeFaqCategory === cat.id ? 'bg-amber-400 text-gray-950 font-black shadow-xs' : 'bg-white border border-black/10 text-gray-700 hover:bg-slate-50'"
            @click="activeFaqCategory = cat.id"
          >
            {{ cat.label }}
          </button>
        </div>

        <!-- FAQ Accordion Rows -->
        <div class="space-y-3 pt-2">
          <div 
            v-for="(faq, idx) in filteredFaqs" 
            :key="idx"
            class="rounded-2xl border border-black/8 bg-white shadow-xs overflow-hidden transition-all duration-200"
          >
            <button 
              type="button"
              class="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-black text-xs sm:text-sm text-gray-950 hover:text-amber-700 transition-colors cursor-pointer"
              @click="toggleFaq(idx)"
            >
              <span>{{ faq.q }}</span>
              <ChevronDown 
                class="w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0"
                :class="{ 'rotate-180 text-amber-600': openFaqIndex === idx }"
              />
            </button>

            <div 
              v-show="openFaqIndex === idx"
              class="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs sm:text-sm text-gray-600 border-t border-black/5 leading-relaxed bg-slate-50/50"
            >
              {{ faq.a }}
            </div>
          </div>
        </div>
      </section>

      <!-- ================================================================
           BOTTOM CONVERSION CTA BANNER
           ================================================================ -->
      <section aria-label="Call to Action" class="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-400/10 via-white to-amber-500/5 p-8 sm:p-14 text-center space-y-4 shadow-sm">
        <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-900 text-xs font-bold border border-amber-400/30">
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ currentLang === 'ky' ? 'Тооруктар күн сайын жүрөт' : (currentLang === 'tr' ? 'Her Gün Canlı Açık Artırmalar' : 'Торги идут каждый день') }}</span>
        </div>

        <h3 class="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-950 tracking-tight">
          {{ t('howItWorksPage.ctaTitle') }}
        </h3>
        
        <p class="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
          {{ t('howItWorksPage.ctaSubtitle') }}
        </p>

        <div class="flex flex-wrap items-center justify-center gap-3 pt-4">
          <RouterLink to="/register">
            <button class="px-7 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-gray-950 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2">
              <span>{{ t('auth.registerBtn') }}</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </RouterLink>
          <RouterLink to="/auctions">
            <button class="px-7 py-3.5 rounded-2xl border border-black/10 bg-white hover:bg-slate-50 text-gray-900 font-extrabold text-xs sm:text-sm transition-all shadow-2xs hover:shadow-xs cursor-pointer">
              {{ t('howItWorksPage.ctaBtn') }}
            </button>
          </RouterLink>
        </div>
      </section>

    </div>
  </div>
</template>