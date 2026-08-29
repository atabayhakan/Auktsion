<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { resolveIcon } from '@/utils/iconMap'

interface Props {
  title: string
  value: string | number
  icon: string
  color: 'gold' | 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  link?: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const iconComponent = computed(() => resolveIcon(props.icon))
</script>

<template>
  <RouterLink :to="link || '#'" class="block">
    <div class="glass p-6 rounded-2xl hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div class="flex items-start justify-between">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-primary bg-primary/10">
          <component :is="iconComponent" v-if="iconComponent" class="w-6 h-6" />
        </div>
        <span v-if="link" class="text-text-muted text-xs flex items-center gap-1">{{ t('common.viewAll') }} →</span>
      </div>

      <div class="mt-4">
        <p class="text-2xl font-bold text-text-primary">{{ value }}</p>
        <p class="text-text-muted text-sm mt-1">{{ title }}</p>
      </div>
    </div>
  </RouterLink>
</template>