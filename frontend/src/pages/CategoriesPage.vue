<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Search, Filter, Grid, List, ChevronRight, Sparkles, ArrowRight } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'
import { platformCategories } from '@/data/categories'

const router = useRouter()
const { t, locale } = useI18n()
const searchQuery = ref('')

const localizedCategories = computed(() => {
  const currentLang = (locale.value as 'ky' | 'ru' | 'tr') || 'ky'
  return platformCategories.map(cat => ({
    id: cat.slug,
    name: cat.name[currentLang] || cat.name.ky,
    desc: cat.description[currentLang] || cat.description.ky,
    icon: cat.icon,
    count: cat.count,
    popularTags: cat.popularTags,
    subCategories: cat.subCategories.map(sub => ({
      id: sub.slug,
      name: sub.name[currentLang] || sub.name.ky
    }))
  }))
})

const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return localizedCategories.value
  const q = searchQuery.value.toLowerCase()
  return localizedCategories.value.filter(c => 
    c.name.toLowerCase().includes(q) ||
    c.desc.toLowerCase().includes(q) ||
    c.popularTags.some(tag => tag.toLowerCase().includes(q))
  )
})
</script>

<template>
  <div class="min-h-screen bg-background text-text-primary pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-7xl mx-auto space-y-8">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs font-medium text-text-muted" aria-label="Breadcrumb">
        <RouterLink to="/" class="hover:text-amber-600 transition-colors">iTorgo</RouterLink>
        <ChevronRight class="w-3.5 h-3.5" />
        <span class="text-text-primary font-bold">Бардык Категориялар</span>
      </nav>

      <!-- Header & Search Bar -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-black/[0.06]">
        <div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold mb-2">
            <Sparkles class="w-3.5 h-3.5" />
            <span>Кыргызстандын Эң Чоң Ачык Соода Каталогу</span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Бардык Категориялар & Мал Базары
          </h1>
          <p class="text-xs sm:text-sm text-text-secondary mt-1 max-w-2xl">
            Мал чарбасынан автоунаага, Дордой контейнерлеринен гаджеттерге чейин каалаган буюмду табыңыз.
          </p>
        </div>

        <div class="w-full md:w-80 relative">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Категория же товар боюнча издөө..."
            class="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-black/10 text-base focus:outline-none focus:border-primary shadow-sm text-text-primary placeholder-gray-400"
          />
          <Search class="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <!-- Categories Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="cat in filteredCategories"
          :key="cat.id"
          class="glass p-6 rounded-3xl hover:border-primary/50 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
        >
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                {{ cat.icon }}
              </div>
              <span class="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-800 border border-amber-500/20">
                {{ cat.count }} активдүү лот
              </span>
            </div>

            <div>
              <RouterLink :to="`/auctions?category=${cat.id}`" class="text-lg font-bold text-text-primary group-hover:text-amber-700 transition-colors block">
                {{ cat.name }}
              </RouterLink>
              <p class="text-xs text-text-secondary mt-1 leading-relaxed line-clamp-2">
                {{ cat.desc }}
              </p>
            </div>

            <!-- Subcategories Pills -->
            <div class="flex flex-wrap gap-1.5 pt-2 border-t border-black/5">
              <RouterLink
                v-for="sub in cat.subCategories"
                :key="sub.id"
                :to="`/auctions?category=${cat.id}&subCategory=${sub.id}`"
                class="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-black/5 hover:bg-amber-500/10 hover:text-amber-800 text-text-secondary transition-colors"
              >
                {{ sub.name }}
              </RouterLink>
            </div>
          </div>

          <!-- Bottom View Link -->
          <div class="pt-4 mt-2">
            <RouterLink
              :to="`/auctions?category=${cat.id}`"
              class="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 group-hover:underline"
            >
              <span>Бардык лотторду көрүү</span>
              <ChevronRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </RouterLink>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>