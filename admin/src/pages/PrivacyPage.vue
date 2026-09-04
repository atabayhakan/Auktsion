<script setup lang="ts">
import { ref, computed } from 'vue'
import { Shield, Lock, User, Mail, Database, Clock, AlertCircle, CheckCircle, FileText, Settings, Globe, ShieldCheck, Download, ExternalLink, Trash2, Eye, EyeOff, Share2, Cookie, ChevronRight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'

const { t } = useI18n()

const privacyTabs = computed(() => [
  { id: 'overview', label: t('privacyPage.tabOverview'), icon: FileText },
  { id: 'collection', label: t('privacyPage.tabCollection'), icon: Database },
  { id: 'usage', label: t('privacyPage.tabUsage'), icon: Eye },
  { id: 'sharing', label: t('privacyPage.tabSharing'), icon: Share2 },
  { id: 'rights', label: t('privacyPage.tabRights'), icon: Shield },
  { id: 'cookies', label: t('privacyPage.tabCookies'), icon: Cookie },
  { id: 'security', label: t('privacyPage.tabSecurity'), icon: ShieldCheck },
  { id: 'contact', label: t('privacyPage.tabContact'), icon: Mail },
])

const activeTab = ref('overview')

const lastUpdated = '2026-08-01'
const version = '2.0'

const privacySections = computed<Record<string, { title: string; content: string }>>(() => ({
  overview: {
    title: t('privacyPage.overviewTitle'),
    content: t('privacyPage.overviewContent'),
  },
  collection: {
    title: t('privacyPage.collectionTitle'),
    content: t('privacyPage.collectionContent'),
  },
  usage: {
    title: t('privacyPage.usageTitle'),
    content: t('privacyPage.usageContent'),
  },
  sharing: {
    title: t('privacyPage.sharingTitle'),
    content: t('privacyPage.sharingContent'),
  },
  rights: {
    title: t('privacyPage.rightsTitle'),
    content: t('privacyPage.rightsContent'),
  },
  cookies: {
    title: t('privacyPage.cookiesTitle'),
    content: t('privacyPage.cookiesContent'),
  },
  security: {
    title: t('privacyPage.securityTitle'),
    content: t('privacyPage.securityContent'),
  },
  contact: {
    title: t('privacyPage.contactTitle'),
    content: t('privacyPage.contactContent'),
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
        <span class="text-text-primary font-bold">{{ t('privacyPage.title') }}</span>
      </nav>

      <!-- Header -->
      <div class="text-center max-w-2xl mx-auto space-y-3">
        <h1 class="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          {{ t('privacyPage.title') }}
        </h1>
        <p class="text-xs sm:text-sm text-text-secondary">
          {{ t('privacyPage.subtitle') }}
        </p>
        <div class="flex items-center justify-center gap-4 text-[11px] text-text-muted pt-1">
          <span>{{ t('privacyPage.lastUpdated') }}: {{ lastUpdated }}</span>
          <span>•</span>
          <span>{{ t('privacyPage.version') }}: {{ version }}</span>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="flex flex-wrap gap-2 justify-center border-b border-black/[0.06] pb-4">
        <button
          v-for="tab in privacyTabs"
          :key="tab.id"
          class="px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
          :class="activeTab === tab.id
            ? 'bg-amber-500/15 text-amber-800 border border-amber-500/30 shadow-sm'
            : 'bg-white border border-border text-text-secondary hover:text-text-primary'"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Main Privacy Card -->
      <div class="glass p-6 sm:p-10 rounded-3xl shadow-sm space-y-6">
        <h2 class="text-xl font-bold text-text-primary">
          {{ privacySections[activeTab]?.title }}
        </h2>

        <div
          class="prose max-w-none text-xs sm:text-sm text-text-secondary leading-relaxed space-y-4"
          v-html="privacySections[activeTab]?.content"
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