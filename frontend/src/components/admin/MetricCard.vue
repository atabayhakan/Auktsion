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
  <div class="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs hover:shadow-md hover:border-black/15 transition-all relative overflow-hidden group flex flex-col justify-between">
    <!-- Top Row: Title & Icon Badge -->
    <div class="flex items-start justify-between gap-3 mb-3">
      <span class="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 leading-tight">
        {{ title }}
      </span>
      <div
        v-if="icon"
        :class="[
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105',
          iconBg,
          iconColor
        ]"
      >
        <component :is="icon" class="w-5 h-5" />
      </div>
    </div>

    <!-- Main Metric Value -->
    <div>
      <div class="flex items-baseline gap-2 mb-1">
        <h3 class="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
          {{ value }}
        </h3>
      </div>
      <span v-if="subValue" class="text-xs font-semibold text-gray-400 block">
        {{ subValue }}
      </span>
    </div>

    <!-- Bottom Row: Trend & Subtitle -->
    <div v-if="trendPct !== undefined || trendLabel" class="mt-3 pt-2.5 border-t border-black/[0.05] flex items-center gap-2 text-xs">
      <div
        v-if="trendPct !== undefined"
        :class="[
          'inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[11px]',
          trendDirection === 'up' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : '',
          trendDirection === 'down' ? 'bg-rose-50 text-rose-700 border border-rose-200/60' : '',
          trendDirection === 'neutral' ? 'bg-gray-100 text-gray-600' : ''
        ]"
      >
        <TrendingUp v-if="trendDirection === 'up'" class="w-3 h-3" />
        <TrendingDown v-if="trendDirection === 'down'" class="w-3 h-3" />
        <Minus v-if="trendDirection === 'neutral'" class="w-3 h-3" />
        <span>{{ Math.abs(trendPct) }}%</span>
      </div>

      <span v-if="trendLabel" class="text-gray-400 text-[11px] truncate">
        {{ trendLabel }}
      </span>
    </div>
  </div>
</template>