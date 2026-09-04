<script setup lang="ts">
import { computed } from 'vue'
import {
  Layers, Smartphone, Car, Building2, Wheat,
  Gem, Palette, Tractor
} from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'
import { platformCategories } from '@/data/categories'

interface Props {
  activeSlug?: string
}

const props = withDefaults(defineProps<Props>(), {
  activeSlug: 'all'
})

const emit = defineEmits<{
  'select': [slug: string]
}>()

const { currentLocale, t } = useI18n()

const iconMap: Record<string, any> = {
  electronics: Smartphone,
  vehicles: Car,
  'real-estate': Building2,
  livestock: Wheat,
  jewelry: Gem,
  art: Palette,
  machinery: Tractor,
}

const categories = computed(() => {
  const lang = (currentLocale.value?.code as 'ky' | 'ru' | 'tr') || 'ru'
  const items = platformCategories.map(cat => ({
    slug: cat.slug,
    name: cat.name[lang] || cat.name.ru,
    icon: iconMap[cat.slug] || Layers,
    count: cat.count
  }))

  return [
    {
      slug: 'all',
      name: t('home.tabAll') || 'Все категории',
      icon: Layers,
      count: '16.5k'
    },
    ...items
  ]
})
</script>

<template>
  <div class="relative">
    <!-- Horizontal Scroll Bar -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none scroll-smooth">
      <button
        v-for="cat in categories"
        :key="cat.slug"
        type="button"
        class="group shrink-0 px-3.5 py-2 rounded-2xl transition-all duration-200 flex items-center gap-2 border text-xs font-bold cursor-pointer"
        :class="activeSlug === cat.slug
          ? 'bg-gray-950 text-white border-gray-950 shadow-sm ring-2 ring-gray-950/10'
          : 'bg-white text-gray-700 border-black/10 hover:border-black/20 hover:bg-slate-50 hover:text-gray-950 shadow-2xs'"
        @click="emit('select', cat.slug)"
      >
        <div
          class="w-6 h-6 rounded-xl flex items-center justify-center transition-colors"
          :class="activeSlug === cat.slug
            ? 'bg-white/20 text-amber-400'
            : 'bg-slate-100 text-gray-500 group-hover:text-gray-900 group-hover:bg-slate-200/80'"
        >
          <component :is="cat.icon" class="w-3.5 h-3.5" />
        </div>
        <span class="whitespace-nowrap">{{ cat.name }}</span>
        <span
          class="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
          :class="activeSlug === cat.slug
            ? 'bg-white/15 text-white/90'
            : 'bg-slate-100 text-gray-400 group-hover:text-gray-600'"
        >
          {{ cat.count }}
        </span>
      </button>
    </div>
  </div>
</template>
