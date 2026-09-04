<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Search, X, Sparkles, ChevronRight, ArrowRight,
  Smartphone, Car, Gem, Palette, Building2,
  Tractor, Wheat, Layers, Flame, ArrowUpRight, CheckCircle2
} from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'
import { platformCategories } from '@/data/categories'

const { t, currentLocale } = useI18n()
const searchQuery = ref('')
const selectedCategorySlug = ref<string | null>(null)

const iconMap: Record<string, any> = {
  electronics: { icon: Smartphone, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-500' },
  vehicles: { icon: Car, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', dot: 'bg-rose-500' },
  jewelry: { icon: Gem, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', dot: 'bg-purple-500' },
  art: { icon: Palette, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-500' },
  'real-estate': { icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500' },
  machinery: { icon: Tractor, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', dot: 'bg-teal-500' },
  livestock: { icon: Wheat, color: 'text-amber-800', bg: 'bg-amber-100/70', border: 'border-amber-200', dot: 'bg-amber-600' },
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
      id: cat.slug,
      slug: cat.slug,
      name: cat.name[lang] || cat.name.ky,
      desc: cat.description[lang] || cat.description.ky,
      iconConfig: iconMap[cat.slug] || { icon: Layers, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', dot: 'bg-primary' },
      coverImage: cat.coverImage,
      popularTags: tags,
      subCategories: cat.subCategories.map(sub => ({
        id: sub.slug,
        slug: sub.slug,
        name: sub.name[lang] || sub.name.ky
      }))
    }
  })
})

const filteredCategories = computed(() => {
  let list = localizedCategories.value
  if (selectedCategorySlug.value) {
    list = list.filter(c => c.slug === selectedCategorySlug.value)
  }
  if (!searchQuery.value.trim()) return list
  const q = searchQuery.value.toLowerCase().trim()
  return list.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.desc.toLowerCase().includes(q) ||
    c.subCategories.some(sub => sub.name.toLowerCase().includes(q)) ||
    c.popularTags.some(tag => tag.toLowerCase().includes(q))
  )
})

function clearFilters() {
  searchQuery.value = ''
  selectedCategorySlug.value = null
}
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 text-gray-900 pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-7xl mx-auto space-y-8">

      <!-- Breadcrumb Navigation -->
      <nav class="flex items-center gap-2 text-xs font-medium text-gray-500" aria-label="Breadcrumb">
        <RouterLink to="/" class="hover:text-primary transition-colors">iTorgo</RouterLink>
        <ChevronRight class="w-3.5 h-3.5 text-gray-400" />
        <span class="text-gray-900 font-bold">{{ t('categoriesPage.breadcrumb') }}</span>
      </nav>

      <!-- Hero Header & Search Section -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.06] shadow-xs space-y-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-2 max-w-3xl">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-amber-950 text-xs font-bold border border-primary/20">
              <Sparkles class="w-3.5 h-3.5 text-primary" />
              <span>{{ t('categoriesPage.badge') }}</span>
            </div>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-950 tracking-tight">
              {{ t('categoriesPage.title') }}
            </h1>
            <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {{ t('categoriesPage.subtitle') }}
            </p>
          </div>

          <!-- Live Search Bar -->
          <div class="w-full lg:w-96 relative">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('categoriesPage.searchPlaceholder')"
              class="w-full pl-10 pr-9 py-3 rounded-2xl bg-gray-50 border border-black/10 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all shadow-xs text-gray-900 placeholder-gray-400"
            />
            <Search class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <button
              v-if="searchQuery"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
              @click="searchQuery = ''"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Quick Filter Pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-black/[0.05] scrollbar-none">
          <button
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
            :class="selectedCategorySlug === null
              ? 'bg-primary text-text-primary shadow-xs font-extrabold'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-950'"
            @click="selectedCategorySlug = null"
          >
            {{ t('categoriesPage.resetFilter') }} ({{ localizedCategories.length }})
          </button>

          <button
            v-for="cat in localizedCategories"
            :key="cat.slug"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all border"
            :class="selectedCategorySlug === cat.slug
              ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
              : 'bg-white border-black/[0.08] text-gray-700 hover:border-black/20 hover:text-gray-950'"
            @click="selectedCategorySlug = selectedCategorySlug === cat.slug ? null : cat.slug"
          >
            <component :is="cat.iconConfig.icon" class="w-3.5 h-3.5" :class="selectedCategorySlug === cat.slug ? 'text-amber-400' : cat.iconConfig.color" />
            <span>{{ cat.name }}</span>
          </button>
        </div>
      </div>

      <!-- Categories Grid -->
      <div v-if="filteredCategories.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="cat in filteredCategories"
          :key="cat.id"
          class="group bg-white rounded-3xl p-6 border border-black/[0.08] shadow-xs hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
        >
          <div class="space-y-4">
            
            <!-- Card Header: Lucide Icon + Status Badge -->
            <div class="flex items-center justify-between">
              <div
                class="w-13 h-13 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105"
                :class="[cat.iconConfig.bg, cat.iconConfig.border]"
              >
                <component :is="cat.iconConfig.icon" class="w-6 h-6" :class="cat.iconConfig.color" />
              </div>

              <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-gray-700 border border-black/[0.06]">
                <span class="w-2 h-2 rounded-full animate-pulse" :class="cat.iconConfig.dot" />
                <span>{{ t('categoriesPage.liveAuctions') }}</span>
              </div>
            </div>

            <!-- Title & Description -->
            <div>
              <RouterLink
                :to="`/auctions?category=${cat.id}`"
                class="text-lg font-extrabold text-gray-950 group-hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <span>{{ cat.name }}</span>
                <ArrowUpRight class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary flex-shrink-0" />
              </RouterLink>
              <p class="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2 min-h-[32px]">
                {{ cat.desc }}
              </p>
            </div>

            <!-- Subcategories Chips -->
            <div class="space-y-1.5 pt-2 border-t border-black/[0.05]">
              <span class="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                {{ t('categoriesPage.subcategories') }}
              </span>
              <div class="grid grid-cols-2 gap-1.5">
                <RouterLink
                  v-for="sub in cat.subCategories"
                  :key="sub.id"
                  :to="`/auctions?category=${cat.id}&subCategory=${sub.id}`"
                  class="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-slate-50 hover:bg-primary/10 hover:text-amber-950 text-gray-700 transition-colors truncate border border-black/[0.03] flex items-center justify-between"
                >
                  <span class="truncate">{{ sub.name }}</span>
                  <ChevronRight class="w-3 h-3 text-gray-400 opacity-60 flex-shrink-0 ml-1" />
                </RouterLink>
              </div>
            </div>

            <!-- Popular Tags / Trends -->
            <div v-if="cat.popularTags?.length" class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-black/[0.05]">
              <Flame class="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <RouterLink
                v-for="tag in cat.popularTags.slice(0, 3)"
                :key="tag"
                :to="`/auctions?category=${cat.id}&search=${encodeURIComponent(tag)}`"
                class="text-[10px] font-medium text-gray-500 hover:text-primary transition-colors bg-gray-100 hover:bg-primary/15 px-2 py-0.5 rounded-md"
              >
                #{{ tag }}
              </RouterLink>
            </div>
          </div>

          <!-- Bottom Action Button -->
          <div class="pt-5 mt-3 border-t border-black/[0.06]">
            <RouterLink
              :to="`/auctions?category=${cat.id}`"
              class="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-primary text-gray-800 hover:text-text-primary transition-all flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-text-primary shadow-2xs"
            >
              <span>{{ t('categoriesPage.viewAllLots') }}</span>
              <ArrowRight class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- No Results Found State -->
      <div v-else class="bg-white rounded-3xl p-12 text-center border border-black/[0.06] shadow-xs space-y-4 max-w-lg mx-auto">
        <div class="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
          <Search class="w-8 h-8" />
        </div>
        <div class="space-y-1">
          <h3 class="text-base font-bold text-gray-900">
            {{ t('categoriesPage.noResults') }}
          </h3>
          <p class="text-xs text-gray-500">
            {{ t('categoriesPage.noResultsDesc') }}
          </p>
        </div>
        <button
          class="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-text-primary hover:bg-primary-hover transition-colors shadow-xs"
          @click="clearFilters"
        >
          {{ t('categoriesPage.clearSearch') }}
        </button>
      </div>

    </div>
  </div>
</template>