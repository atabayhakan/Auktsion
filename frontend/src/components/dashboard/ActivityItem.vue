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

const statusColors = computed(() => {
  const colors = {
    green: 'bg-green-500/20 text-green-300 border-green-500/30',
    red: 'bg-red-500/20 text-red-300 border-red-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  }
  return colors[props.statusColor]
})

const iconColors = computed(() => {
  const colors = {
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
  }
  return colors[props.color]
})

const iconComponent = computed(() => resolveIcon(props.icon))
</script>

<template>
  <RouterLink :to="link" class="block">
    <div class="glass rounded-xl p-4 flex items-center gap-4 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="['bg-' + color + '-500/20', iconColors]">
        <component :is="iconComponent" v-if="iconComponent" class="w-5 h-5" />
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-text-primary font-medium truncate">{{ title }}</p>
        <p class="text-text-muted text-sm">{{ subtitle }}</p>
      </div>

      <div class="flex items-center gap-3 text-right">
        <span class="text-text-muted text-xs">{{ time }}</span>
        <Badge :variant="statusColor">{{ status }}</Badge>
      </div>
    </div>
  </RouterLink>
</template>