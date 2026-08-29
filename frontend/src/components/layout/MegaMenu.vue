<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'
import { platformCategories } from '@/data/categories'

const { t, locale } = useI18n()

const emit = defineEmits<{
  navigate: []
}>()

// Same localization pattern already used by CategoriesPage.vue.
const localizedCategories = computed(() => {
  const currentLang = (locale.value as 'ky' | 'ru' | 'tr') || 'ky'
  return platformCategories.map(cat => ({
    slug: cat.slug,
    name: cat.name[currentLang] || cat.name.ky,
    icon: cat.icon,
    count: cat.count,
    popularTags: cat.popularTags,
    subCategories: cat.subCategories.map(sub => ({
      slug: sub.slug,
      name: sub.name[currentLang] || sub.name.ky
    }))
  }))
})

const activeIndex = ref(0)
const activeCategory = computed(() => localizedCategories.value[activeIndex.value])

function setActive(index: number) {
  activeIndex.value = index
}
</script>

<template>
  <div class="w-[560px] max-w-[90vw]">
    <div class="flex">
      <!-- Left rail: category list -->
      <div class="w-[220px] flex-shrink-0 border-r border-border py-2">
        <RouterLink
          v-for="(cat, index) in localizedCategories"
          :key="cat.slug"
          :to="`/auctions?category=${cat.slug}`"
          role="menuitem"
          class="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors"
          :class="index === activeIndex ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-accent hover:text-text-primary'"
          @mouseenter="setActive(index)"
          @focus="setActive(index)"
          @click="emit('navigate')"
        >
          <span class="text-base" aria-hidden="true">{{ cat.icon }}</span>
          <span class="flex-1 truncate">{{ cat.name }}</span>
          <ChevronRight class="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
        </RouterLink>
      </div>

      <!-- Right pane: active category detail -->
      <div v-if="activeCategory" class="flex-1 p-5 space-y-4">
        <div class="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <RouterLink
            v-for="sub in activeCategory.subCategories"
            :key="sub.slug"
            :to="`/auctions?category=${activeCategory.slug}&subCategory=${sub.slug}`"
            class="text-sm text-text-secondary hover:text-primary transition-colors truncate"
            @click="emit('navigate')"
          >
            {{ sub.name }}
          </RouterLink>
        </div>

        <div v-if="activeCategory.popularTags?.length" class="flex flex-wrap gap-1.5 pt-2 border-t border-border">
          <span class="text-[11px] text-text-muted font-semibold uppercase tracking-wide w-full mb-0.5">
            {{ t('megaMenu.popularSearches') }}
          </span>
          <RouterLink
            v-for="tag in activeCategory.popularTags"
            :key="tag"
            :to="`/auctions?category=${activeCategory.slug}&search=${encodeURIComponent(tag)}`"
            class="px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors"
            @click="emit('navigate')"
          >
            {{ tag }}
          </RouterLink>
        </div>

        <RouterLink
          :to="`/auctions?category=${activeCategory.slug}`"
          class="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline pt-1"
          @click="emit('navigate')"
        >
          <span>{{ t('megaMenu.viewAllIn', { category: activeCategory.name }) }}</span>
          <ChevronRight class="w-4 h-4" />
        </RouterLink>
      </div>
    </div>

    <!-- Footer: link to the full categories page -->
    <div class="border-t border-border px-5 py-2.5 bg-accent/40">
      <RouterLink
        to="/categories"
        class="text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
        @click="emit('navigate')"
      >
        {{ t('megaMenu.browseAll') }}
      </RouterLink>
    </div>
  </div>
</template>
