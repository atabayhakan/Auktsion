<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  ArrowRight, Shield, Clock, Search, Truck, ShieldCheck, 
  Award, Zap, Globe, Users, CreditCard, CheckCircle, User, 
  ChevronDown, ChevronRight, Sparkles 
} from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

const steps = computed(() => [
  {
    number: '01',
    title: t('howItWorksPage.step1Title'),
    description: t('howItWorksPage.step1Desc'),
    icon: User,
  },
  {
    number: '02',
    title: t('howItWorksPage.step2Title'),
    description: t('howItWorksPage.step2Desc'),
    icon: ShieldCheck,
  },
  {
    number: '03',
    title: t('howItWorksPage.step3Title'),
    description: t('howItWorksPage.step3Desc'),
    icon: Search,
  },
  {
    number: '04',
    title: t('howItWorksPage.step4Title'),
    description: t('howItWorksPage.step4Desc'),
    icon: Zap,
  },
  {
    number: '05',
    title: t('howItWorksPage.step5Title'),
    description: t('howItWorksPage.step5Desc'),
    icon: CreditCard,
  },
  {
    number: '06',
    title: t('howItWorksPage.step6Title'),
    description: t('howItWorksPage.step6Desc'),
    icon: Truck,
  },
])

const features = computed(() => [
  {
    title: t('howItWorksPage.featRealtimeTitle'),
    description: t('howItWorksPage.featRealtimeDesc'),
    icon: Zap,
  },
  {
    title: t('howItWorksPage.featEscrowTitle'),
    description: t('howItWorksPage.featEscrowDesc'),
    icon: Shield,
  },
  {
    title: t('howItWorksPage.featBanksTitle'),
    description: t('howItWorksPage.featBanksDesc'),
    icon: Globe,
  },
  {
    title: t('howItWorksPage.featDeliveryTitle'),
    description: t('howItWorksPage.featDeliveryDesc'),
    icon: Truck,
  },
  {
    title: t('howItWorksPage.featLotsTitle'),
    description: t('howItWorksPage.featLotsDesc'),
    icon: Award,
  },
  {
    title: t('howItWorksPage.featSupportTitle'),
    description: t('howItWorksPage.featSupportDesc'),
    icon: Clock,
  },
])

const faqs = computed(() => [
  {
    q: t('howItWorksPage.faq1Q'),
    a: t('howItWorksPage.faq1A'),
  },
  {
    q: t('howItWorksPage.faq2Q'),
    a: t('howItWorksPage.faq2A'),
  },
  {
    q: t('howItWorksPage.faq3Q'),
    a: t('howItWorksPage.faq3A'),
  },
  {
    q: t('howItWorksPage.faq4Q'),
    a: t('howItWorksPage.faq4A'),
  },
  {
    q: t('howItWorksPage.faq5Q'),
    a: t('howItWorksPage.faq5A'),
  },
])

const openFaqIndex = ref<number | null>(null)

function toggleFaq(idx: number) {
  openFaqIndex.value = openFaqIndex.value === idx ? null : idx
}
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fa] text-text-primary pt-26 lg:pt-30 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-7xl mx-auto space-y-16">
      
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs font-medium text-text-muted" aria-label="Breadcrumb">
        <RouterLink to="/" class="hover:text-primary transition-colors">{{ t('auction.breadcrumbHome') }}</RouterLink>
        <ChevronRight class="w-3.5 h-3.5" />
        <span class="text-text-primary font-bold">{{ t('howItWorksPage.title') }}</span>
      </nav>

      <!-- Hero Header -->
      <div class="text-center max-w-3xl mx-auto space-y-4">
        <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold">
          <Sparkles class="w-4 h-4" />
          <span>iTorgo — {{ t('howItWorksPage.subtitle') }}</span>
        </div>

        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight">
          {{ t('howItWorksPage.title') }}
        </h1>

        <p class="text-sm sm:text-base text-text-secondary leading-relaxed">
          {{ t('howItWorksPage.subtitle') }}
        </p>
      </div>

      <!-- 6 Simple Steps Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="(step, idx) in steps" 
          :key="idx"
          class="glass p-6 sm:p-7 rounded-3xl border border-black/[0.08] bg-white/95 shadow-sm hover:border-amber-400/60 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-2xl font-extrabold font-mono text-amber-700">
                {{ step.number }}
              </span>
              <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
                <component :is="step.icon" class="w-6 h-6" />
              </div>
            </div>

            <div>
              <h3 class="text-base sm:text-lg font-bold text-text-primary">
                {{ step.title }}
              </h3>
              <p class="text-xs sm:text-sm text-text-secondary mt-2 leading-relaxed">
                {{ step.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Features & Safety Grid -->
      <div class="space-y-8">
        <div class="text-center max-w-2xl mx-auto">
          <h2 class="text-2xl sm:text-3xl font-extrabold text-text-primary">
            {{ t('aboutPage.whyUsTitle') }}
          </h2>
          <p class="text-xs sm:text-sm text-text-secondary mt-2">
            {{ t('home.escrowSubtitle') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="(feat, idx) in features" 
            :key="idx"
            class="glass p-6 rounded-3xl border border-black/[0.08] bg-white/95 shadow-sm space-y-3"
          >
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
              <component :is="feat.icon" class="w-5 h-5" />
            </div>
            <h3 class="text-base font-bold text-text-primary">{{ feat.title }}</h3>
            <p class="text-xs text-text-secondary leading-relaxed">{{ feat.description }}</p>
          </div>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="space-y-6 max-w-3xl mx-auto">
        <div class="text-center">
          <h2 class="text-2xl sm:text-3xl font-extrabold text-text-primary">
            {{ t('howItWorksPage.faqTitle') }}
          </h2>
          <p class="text-xs sm:text-sm text-text-secondary mt-1">
            {{ t('howItWorksPage.faqSubtitle') }}
          </p>
        </div>

        <div class="space-y-3">
          <div 
            v-for="(faq, idx) in faqs" 
            :key="idx"
            class="glass rounded-2xl border border-black/[0.08] bg-white/95 shadow-sm overflow-hidden transition-all"
          >
            <button 
              class="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-text-primary hover:text-primary transition-colors"
              @click="toggleFaq(idx)"
            >
              <span>{{ faq.q }}</span>
              <ChevronDown 
                class="w-4 h-4 text-text-muted transition-transform duration-200 flex-shrink-0"
                :class="{ 'rotate-180': openFaqIndex === idx }"
              />
            </button>

            <div 
              v-show="openFaqIndex === idx"
              class="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs text-text-secondary border-t border-black/[0.04] leading-relaxed"
            >
              {{ faq.a }}
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom CTA Banner -->
      <div class="glass p-8 sm:p-12 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-transparent to-primary/[0.05] text-center space-y-4 shadow-sm">
        <h3 class="text-2xl sm:text-3xl font-extrabold text-text-primary">
          {{ t('howItWorksPage.ctaTitle') }}
        </h3>
        <p class="text-xs sm:text-sm text-text-secondary max-w-lg mx-auto">
          {{ t('howItWorksPage.ctaSubtitle') }}
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
          <RouterLink to="/register">
            <button class="px-6 py-3 rounded-xl bg-primary text-text-primary font-extrabold text-xs sm:text-sm hover:bg-primary-hover shadow-md transition-all">
              {{ t('auth.registerBtn') }}
            </button>
          </RouterLink>
          <RouterLink to="/auctions">
            <button class="px-6 py-3 rounded-xl border border-gray-300 bg-white/90 text-gray-800 font-bold text-xs sm:text-sm hover:bg-black/5 transition-all">
              {{ t('howItWorksPage.ctaBtn') }}
            </button>
          </RouterLink>
        </div>
      </div>

    </div>
  </div>
</template>