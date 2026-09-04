<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowUpRight } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'
import { resolveIcon } from '@/utils/iconMap'

interface Props {
  title: string
  value: string | number
  icon: string
  color: 'gold' | 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  subtitle?: string
  link?: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const iconComponent = computed(() => resolveIcon(props.icon))

const colorStyles = computed(() => {
  switch (props.color) {
    case 'gold':
    case 'yellow':
      return {
        bg: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
        glow: 'group-hover:border-amber-500/40',
        badge: 'text-amber-800 bg-amber-50 border-amber-200/60'
      }
    case 'blue':
      return {
        bg: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
        glow: 'group-hover:border-blue-500/40',
        badge: 'text-blue-700 bg-blue-50 border-blue-200/60'
      }
    case 'green':
      return {
        bg: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20',
        glow: 'group-hover:border-emerald-500/40',
        badge: 'text-emerald-800 bg-emerald-50 border-emerald-200/60'
      }
    case 'purple':
      return {
        bg: 'bg-purple-500/10 text-purple-800 border-purple-500/20',
        glow: 'group-hover:border-purple-500/40',
        badge: 'text-purple-800 bg-purple-50 border-purple-200/60'
      }
    case 'red':
      return {
        bg: 'bg-rose-500/10 text-rose-800 border-rose-500/20',
        glow: 'group-hover:border-rose-500/40',
        badge: 'text-rose-800 bg-rose-50 border-rose-200/60'
      }
    default:
      return {
        bg: 'bg-slate-100 text-gray-800 border-slate-200',
        glow: 'group-hover:border-slate-300',
        badge: 'text-gray-700 bg-slate-50 border-slate-200'
      }
  }
})
</script>

<template>
  <RouterLink :to="link || '#'" class="block group">
    <div 
      class="bg-white p-5 rounded-3xl border border-black/[0.08] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden"
      :class="colorStyles.glow"
    >
      <div class="flex items-start justify-between gap-2">
        <div 
          class="w-11 h-11 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-105"
          :class="colorStyles.bg"
        >
          <component :is="iconComponent" v-if="iconComponent" class="w-5 h-5 stroke-[2.25]" />
        </div>
        
        <div v-if="link" class="w-7 h-7 rounded-xl bg-slate-50 group-hover:bg-gray-950 group-hover:text-white text-gray-400 flex items-center justify-center transition-colors">
          <ArrowUpRight class="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>

      <div class="mt-4 space-y-1">
        <p class="text-2xl sm:text-3xl font-black font-mono text-gray-950 tracking-tight leading-none truncate">
          {{ value }}
        </p>
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {{ title }}
        </p>
        <p v-if="subtitle" class="text-[11px] font-semibold text-gray-500 pt-0.5 truncate">
          {{ subtitle }}
        </p>
      </div>
    </div>
  </RouterLink>
</template>