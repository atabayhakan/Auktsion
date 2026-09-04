<script setup lang="ts">
import { computed } from 'vue'
import { Shield, Users, Award, Zap, Globe, Heart, CheckCircle, TrendingUp, Target, Lightbulb, ChevronRight, Sparkles } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

const values = computed(() => [
  {
    title: t('aboutPage.valSecurity'),
    description: t('aboutPage.valSecurityDesc'),
    icon: Shield,
  },
  {
    title: t('aboutPage.valTransparency'),
    description: t('aboutPage.valTransparencyDesc'),
    icon: Lightbulb,
  },
  {
    title: t('aboutPage.valSpeed'),
    description: t('aboutPage.valSpeedDesc'),
    icon: Zap,
  },
  {
    title: t('aboutPage.valSupport'),
    description: t('aboutPage.valSupportDesc'),
    icon: Target,
  },
])

const stats = computed(() => [
  { value: '50 000+', label: t('aboutPage.statsUsers') },
  { value: '150M+ ' + t('common.currency'), label: t('aboutPage.statsVolume') },
  { value: '5 000+', label: t('aboutPage.statsLots') },
  { value: '100%', label: t('aboutPage.statsEscrow') },
])
</script>

<template>
  <div class="min-h-screen bg-background text-text-primary pt-26 lg:pt-30 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-6xl mx-auto space-y-16">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs font-medium text-text-muted" aria-label="Breadcrumb">
        <RouterLink to="/" class="hover:text-primary transition-colors">{{ t('auction.breadcrumbHome') }}</RouterLink>
        <ChevronRight class="w-3.5 h-3.5" />
        <span class="text-text-primary font-bold">{{ t('aboutPage.title') }}</span>
      </nav>

      <!-- Hero -->
      <div class="text-center max-w-3xl mx-auto space-y-4">
        <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold">
          <Sparkles class="w-4 h-4" />
          <span>iTorgo — {{ t('aboutPage.subtitle') }}</span>
        </div>

        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight">
          {{ t('aboutPage.title') }}
        </h1>

        <p class="text-sm sm:text-base text-text-secondary leading-relaxed">
          {{ t('aboutPage.missionDesc') }}
        </p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="glass p-6 rounded-3xl text-center space-y-1 shadow-sm"
        >
          <div class="text-2xl sm:text-3xl font-extrabold text-amber-700 font-mono">
            {{ stat.value }}
          </div>
          <div class="text-xs text-text-secondary font-medium">
            {{ stat.label }}
          </div>
        </div>
      </div>

      <!-- Values Grid -->
      <div class="space-y-6">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-text-primary text-center">
          {{ t('aboutPage.valuesTitle') }}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="val in values"
            :key="val.title"
            class="glass p-6 sm:p-7 rounded-3xl shadow-sm flex items-start gap-4"
          >
            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 flex-shrink-0">
              <component :is="val.icon" class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-bold text-text-primary">
                {{ val.title }}
              </h3>
              <p class="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
                {{ val.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>