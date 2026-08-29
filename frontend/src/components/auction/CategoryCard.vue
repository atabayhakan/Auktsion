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
    class="category-card group relative block rounded-2xl overflow-hidden aspect-square"
    :aria-label="`${props.category.name}, ${props.category.count}`"
  >
    <template v-if="!imgFailed">
      <img
        :src="props.category.coverImage"
        :alt="props.category.name"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        @error="imgFailed = true"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
    </template>
    <div v-else class="absolute inset-0 flex items-center justify-center bg-accent">
      <span class="text-5xl" aria-hidden="true">{{ props.category.icon }}</span>
    </div>

    <div class="absolute inset-x-0 bottom-0 p-4 text-white">
      <h3 class="font-bold text-sm sm:text-base leading-tight drop-shadow-sm">{{ props.category.name }}</h3>
      <p class="text-xs opacity-90 drop-shadow-sm">{{ props.category.count }}</p>
    </div>

    <!-- Hover indicator -->
    <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out" />
  </RouterLink>
</template>

<style scoped>
.category-card {
  animation: slideUp 0.5s ease-out forwards;
  opacity: 0;
}

.category-card:nth-child(1) { animation-delay: 0.05s; }
.category-card:nth-child(2) { animation-delay: 0.1s; }
.category-card:nth-child(3) { animation-delay: 0.15s; }
.category-card:nth-child(4) { animation-delay: 0.2s; }
.category-card:nth-child(5) { animation-delay: 0.25s; }
.category-card:nth-child(6) { animation-delay: 0.3s; }
.category-card:nth-child(7) { animation-delay: 0.35s; }

.category-card:focus-visible {
  outline: 2px solid rgb(var(--color-secondary));
  outline-offset: 2px;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
