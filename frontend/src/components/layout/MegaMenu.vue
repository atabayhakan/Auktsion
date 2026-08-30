<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ChevronRight, Smartphone, Car, Gem, Palette,
  Building2, Tractor, Wheat, Flame, ArrowRight,
  Layers, Sparkles
} from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'
import { platformCategories } from '@/data/categories'

const { t, currentLocale } = useI18n()

const emit = defineEmits<{
  navigate: []
}>()

const iconMap: Record<string, any> = {
  electronics: { icon: Smartphone, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  vehicles: { icon: Car, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  jewelry: { icon: Gem, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  art: { icon: Palette, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  'real-estate': { icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  machinery: { icon: Tractor, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
  livestock: { icon: Wheat, color: 'text-amber-800', bg: 'bg-amber-100/70', border: 'border-amber-200' },
}

const localizedCategories = computed(() => {
  const lang = (currentLocale.value?.code as 'ky' | 'ru' | 'tr') || 'ru'
  return platformCategories.map(cat => {
    let tags: string[] = []
    if (cat.popularTags && typeof cat.popularTags === 'object') {
      if (Array.isArray(cat.popularTags)) {
        tags = cat.popularTags
      } else if (lang in cat.popularTags) {
        tags = (cat.popularTags as any)[lang] || []
      }
    }

    return {
      id: cat.id,
      slug: cat.slug,
      name: cat.name[lang] || cat.name.ky,
      description: cat.description[lang] || cat.description.ky,
      iconConfig: iconMap[cat.slug] || { icon: Layers, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
      coverImage: cat.coverImage,
      count: cat.count,
      popularTags: tags,
      subCategories: cat.subCategories.map(sub => ({
        id: sub.id,
        slug: sub.slug,
        name: sub.name[lang] || sub.name.ky
      }))
    }
  })
})

const activeIndex = ref(0)
const activeCategory = computed(() => localizedCategories.value[activeIndex.value] || localizedCategories.value[0])

function setActive(index: number) {
  activeIndex.value = index
}
</script>

<template>
  <div class="w-[780px] lg:w-[860px] max-w-[95vw] bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col">
    <!-- Main Two-Column Layout -->
    <div class="flex min-h-[420px]">
      
      <!-- Left Rail: Categories List -->
      <div class="w-[290px] lg:w-[320px] flex-shrink-0 border-r border-black/[0.06] bg-slate-50/50 py-2.5 flex flex-col justify-between">
        <div class="space-y-0.5 px-2">
          <RouterLink
            v-for="(cat, index) in localizedCategories"
            :key="cat.slug"
            :to="`/auctions?category=${cat.slug}`"
            role="menuitem"
            class="group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150"
            :class="index === activeIndex
              ? 'bg-white text-gray-950 font-bold shadow-xs border-l-4 border-primary pl-2.5 ring-1 ring-black/[0.04]'
              : 'text-gray-600 hover:bg-white/80 hover:text-gray-950'"
            @mouseenter="setActive(index)"
            @focus="setActive(index)"
            @click="emit('navigate')"
          >
            <div class="flex items-center gap-2.5 min-w-0 pr-2">
              <div
                class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border transition-transform group-hover:scale-105"
                :class="[cat.iconConfig.bg, cat.iconConfig.border]"
              >
                <component :is="cat.iconConfig.icon" class="w-3.5 h-3.5" :class="cat.iconConfig.color" />
              </div>
              <span class="truncate leading-tight">{{ cat.name }}</span>
            </div>

            <div class="flex items-center gap-1.5 flex-shrink-0">
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 group-hover:bg-primary/15 group-hover:text-amber-900 transition-colors">
                {{ cat.count }}
              </span>
              <ChevronRight
                class="w-3.5 h-3.5 transition-transform text-gray-400 group-hover:text-primary"
                :class="index === activeIndex ? 'translate-x-0.5 text-primary opacity-100 font-bold' : 'opacity-40'"
              />
            </div>
          </RouterLink>
        </div>
      </div>

      <!-- Right Pane: Active Category Subcategories & Visual Showcase -->
      <div v-if="activeCategory" class="flex-1 p-6 flex flex-col justify-between bg-white">
        <div>
          <!-- Header of Active Category -->
          <div class="flex items-start justify-between gap-3 border-b border-black/[0.06] pb-3.5 mb-4">
            <div>
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-xl flex items-center justify-center border"
                  :class="[activeCategory.iconConfig.bg, activeCategory.iconConfig.border]"
                >
                  <component :is="activeCategory.iconConfig.icon" class="w-4 h-4" :class="activeCategory.iconConfig.color" />
                </div>
                <h3 class="text-base font-extrabold text-gray-900 tracking-tight">
                  {{ activeCategory.name }}
                </h3>
              </div>
              <p class="text-xs text-gray-500 mt-1 line-clamp-1">
                {{ activeCategory.description }}
              </p>
            </div>
            
            <span class="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/15 text-amber-950 border border-primary/20 flex items-center gap-1">
              <Sparkles class="w-3 h-3 text-primary" />
              <span>{{ activeCategory.count }} {{ t('megaMenu.activeLots') || 'активдүү лот' }}</span>
            </span>
          </div>

          <!-- Subcategories Grid -->
          <div class="grid grid-cols-2 gap-2 mb-4">
            <RouterLink
              v-for="sub in activeCategory.subCategories"
              :key="sub.slug"
              :to="`/auctions?category=${activeCategory.slug}&subCategory=${sub.slug}`"
              class="group flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-primary/5 hover:border-primary/30 transition-all"
              @click="emit('navigate')"
            >
              <span class="text-xs font-semibold text-gray-800 group-hover:text-primary transition-colors truncate">
                {{ sub.name }}
              </span>
              <ChevronRight class="w-3 h-3 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1.5 opacity-60 group-hover:opacity-100" />
            </RouterLink>
          </div>

          <!-- Popular Searches / Trends -->
          <div v-if="activeCategory.popularTags?.length" class="pt-2 border-t border-black/[0.05]">
            <div class="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-2">
              <Flame class="w-3 h-3 text-amber-500" />
              <span>{{ t('megaMenu.popularSearches') || 'Популярдуу издөөлөр' }}</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <RouterLink
                v-for="tag in activeCategory.popularTags"
                :key="tag"
                :to="`/auctions?category=${activeCategory.slug}&search=${encodeURIComponent(tag)}`"
                class="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-primary/20 hover:text-amber-950 transition-colors flex items-center gap-1"
                @click="emit('navigate')"
              >
                <span>{{ tag }}</span>
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Featured Banner / Full Category CTA -->
        <div class="mt-4 pt-3 border-t border-black/[0.06]">
          <RouterLink
            :to="`/auctions?category=${activeCategory.slug}`"
            class="group relative w-full h-16 rounded-xl overflow-hidden flex items-center justify-between px-4 border border-black/10 shadow-xs hover:shadow-md transition-all block"
            @click="emit('navigate')"
          >
            <!-- Background HD Image with Overlay -->
            <img
              :src="activeCategory.coverImage"
              :alt="activeCategory.name"
              class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-75"
            />
            <div class="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40" />

            <!-- Content -->
            <div class="relative z-10 text-white">
              <p class="text-xs font-bold tracking-tight text-amber-300">
                {{ activeCategory.name }}
              </p>
              <p class="text-[11px] text-gray-200">
                {{ t('megaMenu.viewAllIn', { category: activeCategory.name }) }}
              </p>
            </div>

            <div class="relative z-10 w-7 h-7 rounded-full bg-primary text-text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
              <ArrowRight class="w-3.5 h-3.5" />
            </div>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Mega-Menu Footer Bar -->
    <div class="border-t border-black/[0.08] px-6 py-2.5 bg-slate-50 flex items-center justify-between text-xs">
      <span class="text-gray-500 font-medium hidden sm:inline flex items-center gap-1.5">
        <Sparkles class="w-3.5 h-3.5 text-primary" />
        {{ t('megaMenu.allSectors') || '7 негизги тармак, 30+ чакан категория' }}
      </span>

      <RouterLink
        to="/categories"
        class="font-bold text-primary hover:text-primary-hover flex items-center gap-1 group ml-auto transition-colors"
        @click="emit('navigate')"
      >
        <span>{{ t('megaMenu.browseAll') || 'Бардык категорияларды көрүү' }}</span>
        <ArrowRight class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </RouterLink>
    </div>
  </div>
</template>