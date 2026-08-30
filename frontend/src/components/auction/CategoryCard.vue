<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

interface Props {
  category: {
    slug: string
    name: string
    icon: string
    coverImage: string
    count: string
  }
}

const props = defineProps<Props>()

// If the cover photo fails to load (e.g. an unreachable external URL), fall
// back to the plain icon-in-circle treatment rather than a broken image.
const imgFailed = ref(false)
</script>

<template>
  <RouterLink
    :to="`/auctions?category=${props.category.slug}`"
    class="group relative block rounded-2xl overflow-hidden h-28 sm:h-36 lg:h-40 border border-black/10 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 select-none"
    :aria-label="`${props.category.name}, ${props.category.count}`"
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
      <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 group-hover:from-black/90 transition-colors" />
    </template>
    <div v-else class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-primary/20">
      <span class="text-4xl" aria-hidden="true">{{ props.category.icon }}</span>
    </div>

    <!-- Icon Badge (Top Left) -->
    <div class="absolute top-2.5 left-2.5 w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-sm shadow-xs">
      <span>{{ props.category.icon }}</span>
    </div>

    <!-- Title & Lot Count (Bottom) -->
    <div class="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 text-white flex flex-col justify-end">
      <h3 class="font-extrabold text-xs sm:text-sm leading-tight text-white drop-shadow-md group-hover:text-primary transition-colors line-clamp-1">
        {{ props.category.name }}
      </h3>
      <p class="text-[11px] font-semibold text-white/80 drop-shadow-sm mt-0.5">
        {{ props.category.count }} lot
      </p>
    </div>

    <!-- Gold Accent Line on Hover -->
    <div class="absolute bottom-0 left-0 right-0 h-1 bg-primary transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out" />
  </RouterLink>
</template>

<style scoped>
</style>
