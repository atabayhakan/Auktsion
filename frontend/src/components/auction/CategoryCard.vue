<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'

interface Props {
  category: {
    slug: string
    name: string
    icon: string
    coverImage: string
  }
}

const props = defineProps<Props>()
const { t } = useI18n()

// If the cover photo fails to load, fall back to plain icon treatment
const imgFailed = ref(false)
</script>

<template>
  <RouterLink
    :to="`/auctions?category=${props.category.slug}`"
    class="group relative block rounded-2xl overflow-hidden h-28 sm:h-36 lg:h-40 border border-black/10 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 select-none"
    :aria-label="props.category.name"
  >
    <template v-if="!imgFailed">
      <img
        :src="props.category.coverImage"
        :alt="props.category.name"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        loading="lazy"
        @error="imgFailed = true"
      />
      <!-- Rich contrast overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 group-hover:from-black/95 transition-colors" />
    </template>
    <div v-else class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-primary/20">
      <span class="text-4xl" aria-hidden="true">{{ props.category.icon }}</span>
    </div>

    <!-- Icon Badge (Top Left) -->
    <div class="absolute top-2.5 left-2.5 w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-sm shadow-xs">
      <span>{{ props.category.icon }}</span>
    </div>

    <!-- Title & Action Label (Bottom) -->
    <div class="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 text-white flex flex-col justify-end">
      <h3 class="font-extrabold text-xs sm:text-sm leading-tight text-white drop-shadow-md group-hover:text-primary transition-colors line-clamp-1">
        {{ props.category.name }}
      </h3>
      <div class="flex items-center gap-1 text-[11px] font-semibold text-white/80 drop-shadow-sm mt-0.5 group-hover:text-amber-300 transition-colors">
        <span>{{ t('categoriesPage.viewAuctions') }}</span>
        <ChevronRight class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>

    <!-- Gold Accent Line on Hover -->
    <div class="absolute bottom-0 left-0 right-0 h-1 bg-primary transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out" />
  </RouterLink>
</template>

<style scoped>
</style>
