<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import Badge from '@/components/ui/Badge.vue'
import { resolveIcon } from '@/utils/iconMap'

interface Props {
  title: string
  subtitle: string
  time: string
  icon: string
  color: 'green' | 'red' | 'blue' | 'yellow' | 'purple'
  status: string
  statusColor: 'green' | 'red' | 'blue' | 'yellow' | 'purple'
  link: string
}

const props = defineProps<Props>()

const colorPresets = computed(() => {
  switch (props.color) {
    case 'green':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'red':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'blue':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'yellow':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'purple':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    default:
      return 'bg-slate-100 text-gray-700 border-slate-200'
  }
})

const iconComponent = computed(() => resolveIcon(props.icon))
</script>

<template>
  <RouterLink :to="link" class="block group">
    <div class="bg-slate-50 hover:bg-slate-100/80 border border-black/[0.06] rounded-2xl p-3.5 flex items-center gap-3.5 transition-all duration-200 hover:shadow-2xs">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border" :class="colorPresets">
        <component :is="iconComponent" v-if="iconComponent" class="w-4 h-4 stroke-[2.25]" />
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-xs font-black text-gray-950 truncate group-hover:text-amber-800 transition-colors">{{ title }}</p>
        <p class="text-[11px] font-medium text-gray-500 mt-0.5">{{ subtitle }}</p>
      </div>

      <div class="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-2.5 text-right shrink-0">
        <span class="text-[10px] font-semibold text-gray-400 font-mono">{{ time }}</span>
        <Badge :variant="statusColor" class="text-[10px] font-black uppercase">{{ status }}</Badge>
      </div>
    </div>
  </RouterLink>
</template>