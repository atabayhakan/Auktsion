<script setup lang="ts">
import { computed } from 'vue'
import {
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  title: string
  value: string | number
  subValue?: string
  trendPct?: number
  trendLabel?: string
  icon?: any
  iconColor?: string
  iconBg?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}>(), {
  variant: 'default',
  iconColor: 'text-primary',
  iconBg: 'bg-primary/10'
})

const trendDirection = computed(() => {
  if (props.trendPct === undefined || props.trendPct === 0) return 'neutral'
  return props.trendPct > 0 ? 'up' : 'down'
})
</script>

<template>
  <div class="glass rounded-xl p-5 hover:shadow-lg transition-shadow relative overflow-hidden group">
    <!-- Top Row: Title & Icon -->
    <div class="flex items-center justify-between gap-3 mb-3">
      <span class="text-xs font-semibold uppercase tracking-wider text-text-muted truncate">
        {{ title }}
      </span>
      <div
        v-if="icon"
        :class="[
          'w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105',
          iconBg,
          iconColor
        ]"
      >
        <component :is="icon" class="w-5 h-5" />
      </div>
    </div>

    <!-- Main Metric Value -->
    <div class="flex items-baseline gap-2 mb-2">
      <h3 class="text-2xl font-bold text-text-primary tracking-tight">
        {{ value }}
      </h3>
      <span v-if="subValue" class="text-xs font-medium text-text-muted">
        {{ subValue }}
      </span>
    </div>

    <!-- Bottom Row: Trend & Subtitle -->
    <div v-if="trendPct !== undefined || trendLabel" class="flex items-center gap-2 text-xs">
      <div
        v-if="trendPct !== undefined"
        :class="[
          'inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full',
          trendDirection === 'up' ? 'bg-emerald-50 text-emerald-600' : '',
          trendDirection === 'down' ? 'bg-rose-50 text-rose-600' : '',
          trendDirection === 'neutral' ? 'bg-accent text-text-secondary' : ''
        ]"
      >
        <TrendingUp v-if="trendDirection === 'up'" class="w-3.5 h-3.5" />
        <TrendingDown v-if="trendDirection === 'down'" class="w-3.5 h-3.5" />
        <Minus v-if="trendDirection === 'neutral'" class="w-3.5 h-3.5" />
        <span>{{ Math.abs(trendPct) }}%</span>
      </div>

      <span v-if="trendLabel" class="text-text-muted truncate">
        {{ trendLabel }}
      </span>
    </div>
  </div>
</template>
