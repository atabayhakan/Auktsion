<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { CheckCircle2, ChevronRight, Store, Star } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'

export interface MerchantStore {
  id: string
  name: string
  city: string
  category: string
  avatar: string
  rating: number
  totalSales: number
  activeLotsCount: number
  previewImages: string[]
}

interface Props {
  store: MerchantStore
}

defineProps<Props>()
const { t } = useI18n()
</script>

<template>
  <div class="rounded-3xl bg-white border border-black/[0.08] p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
    <div>
      <!-- Store Header -->
      <div class="flex items-start gap-3.5 mb-4">
        <img
          :src="store.avatar"
          :alt="store.name"
          class="w-12 h-12 rounded-2xl object-cover border border-black/10 shadow-xs shrink-0"
        />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1">
            <h4 class="text-sm font-black text-gray-950 truncate group-hover:text-primary transition-colors">
              {{ store.name }}
            </h4>
            <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div class="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
            <span>{{ store.city }}</span>
            <span>•</span>
            <span class="text-gray-400">{{ store.category }}</span>
          </div>
          <div class="flex items-center gap-3 mt-1.5 text-xs">
            <div class="flex items-center gap-1 font-bold text-amber-600">
              <Star class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{{ store.rating }}</span>
            </div>
            <span class="text-gray-400 text-[10px]">•</span>
            <span class="text-gray-600 font-medium text-[11px]">{{ store.totalSales }} {{ t('home.deals') || 'сделок' }}</span>
          </div>
        </div>
      </div>

      <!-- Preview Image Thumbnails -->
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div
          v-for="(img, idx) in store.previewImages.slice(0, 3)"
          :key="idx"
          class="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-black/5"
        >
          <img
            :src="img"
            :alt="store.name"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
    </div>

    <!-- Bottom Action Link -->
    <RouterLink
      :to="`/auctions?seller=${store.id}`"
      class="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-gray-800 hover:text-gray-950 font-bold text-xs flex items-center justify-between border border-black/5 transition-colors"
    >
      <span>{{ t('home.activeLotsCount', { n: store.activeLotsCount }) || `${store.activeLotsCount} активных лотов` }}</span>
      <div class="flex items-center gap-0.5 text-amber-600 font-bold">
        <span>{{ t('home.catalog') || 'Каталог' }}</span>
        <ChevronRight class="w-3.5 h-3.5" />
      </div>
    </RouterLink>
  </div>
</template>
