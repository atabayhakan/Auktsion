<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileText, Shield, User, DollarSign, Clock, AlertTriangle, CheckCircle, Scale, ChevronRight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

const { t } = useI18n()

const termsTabs = computed(() => [
  { id: 'overview', label: t('termsPage.tabOverview'), icon: FileText },
  { id: 'general', label: t('termsPage.tabGeneral'), icon: Shield },
  { id: 'registration', label: t('termsPage.tabRegistration'), icon: User },
  { id: 'auctions', label: t('termsPage.tabAuctions'), icon: Clock },
  { id: 'bidding', label: t('termsPage.tabBidding'), icon: DollarSign },
  { id: 'payments', label: t('termsPage.tabPayments'), icon: DollarSign },
  { id: 'disputes', label: t('termsPage.tabDisputes'), icon: Scale },
  { id: 'liability', label: t('termsPage.tabLiability'), icon: AlertTriangle },
  { id: 'termination', label: t('termsPage.tabTermination'), icon: CheckCircle },
])

const activeTab = ref('overview')

const lastUpdated = '2026-08-01'
const version = '2.0'

const termsSections = computed<Record<string, { title: string; content: string }>>(() => ({
  overview: {
    title: t('termsPage.overviewTitle'),
    content: t('termsPage.overviewContent'),
  },
  general: {
    title: t('termsPage.generalTitle'),
    content: t('termsPage.generalContent'),
  },
  registration: {
    title: t('termsPage.regTitle'),
    content: t('termsPage.regContent'),
  },
  auctions: {
    title: t('termsPage.auctionsTitle'),
    content: t('termsPage.auctionsContent'),
  },
  bidding: {
    title: t('termsPage.biddingTitle'),
    content: t('termsPage.biddingContent'),
  },
  payments: {
    title: t('termsPage.paymentsTitle'),
    content: t('termsPage.paymentsContent'),
  },
  disputes: {
    title: t('termsPage.disputesTitle'),
    content: t('termsPage.disputesContent'),
  },
  liability: {
    title: t('termsPage.liabilityTitle'),
    content: t('termsPage.liabilityContent'),
  },
  termination: {
    title: t('termsPage.terminationTitle'),
    content: t('termsPage.terminationContent'),
  },
}))
</script>

<template>
  <div class="min-h-screen bg-background text-text-primary pt-26 lg:pt-30 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-4xl mx-auto space-y-8">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs font-medium text-text-muted" aria-label="Breadcrumb">
        <RouterLink to="/" class="hover:text-primary transition-colors">{{ t('auction.breadcrumbHome') }}</RouterLink>
        <ChevronRight class="w-3.5 h-3.5" />
        <span class="text-text-primary font-bold">{{ t('termsPage.title') }}</span>
      </nav>

      <!-- Header -->
      <div class="text-center max-w-2xl mx-auto space-y-3">
        <h1 class="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          {{ t('termsPage.title') }}
        </h1>
        <p class="text-xs sm:text-sm text-text-secondary">
          {{ t('termsPage.subtitle') }}
        </p>
        <div class="flex items-center justify-center gap-4 text-[11px] text-text-muted pt-1">
          <span>{{ t('termsPage.lastUpdated') }}: {{ lastUpdated }}</span>
          <span>•</span>
          <span>{{ t('termsPage.version') }}: {{ version }}</span>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="flex flex-wrap gap-2 justify-center border-b border-black/[0.06] pb-4">
        <button
          v-for="tab in termsTabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
          :class="activeTab === tab.id
            ? 'bg-amber-500/15 text-amber-800 border border-amber-500/30 shadow-sm'
            : 'bg-white border border-border text-text-secondary hover:text-text-primary'"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Main Terms Card -->
      <div class="glass p-6 sm:p-10 rounded-3xl shadow-sm space-y-6">
        <h2 class="text-xl font-bold text-text-primary">
          {{ termsSections[activeTab]?.title }}
        </h2>

        <div
          class="prose max-w-none text-xs sm:text-sm text-text-secondary leading-relaxed space-y-4"
          v-html="termsSections[activeTab]?.content"
        />
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>