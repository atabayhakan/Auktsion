<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search, X, Clock, Flame, Sparkles, TrendingUp,
  ArrowRight, Smartphone, Car, Building2, Wheat, Gem, ShieldCheck
} from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const router = useRouter()
const { t } = useI18n()

const searchInputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const onlyLive = ref(false)

const recentSearches = ref<string[]>([
  'iPhone 17 Pro Max',
  'Toyota Camry 70',
  'Баран Арашан',
  'Дордой контейнер'
])

const trendingTags = [
  'iPhone 17 Pro',
  'Camry 70 Растаможен',
  'Арашан 140кг',
  'Дордой 12 проход',
  'Lexus GX 460',
  'MacBook M3 Max',
  'Золото 585',
  'PS5 Slim'
]

const quickCategories = [
  { slug: 'electronics', label: 'Электроника', icon: Smartphone, count: '4.8k' },
  { slug: 'vehicles', label: 'Автомобили', icon: Car, count: '5.2k' },
  { slug: 'livestock', label: 'Скотный рынок', icon: Wheat, count: '3.4k' },
  { slug: 'real-estate', label: 'Недвижимость', icon: Building2, count: '1.8k' },
  { slug: 'jewelry', label: 'Ювелирные', icon: Gem, count: '1.1k' },
]

const aiPrompts = [
  'iPhone в Бишкеке до 50 000 сом',
  'Toyota Camry с гарантией и растаможкой',
  'Племенной баран Арашан с ветпаспортом',
  'Торговый контейнер на Дордое до 1.5 млн сом'
]

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      searchInputRef.value?.focus()
    })
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

function close() {
  emit('update:modelValue', false)
}

function handleSearch(term?: string) {
  const searchTerm = (term !== undefined ? term : query.value).trim()
  if (!searchTerm) return

  // Add to recent if not exists
  if (!recentSearches.value.includes(searchTerm)) {
    recentSearches.value.unshift(searchTerm)
    if (recentSearches.value.length > 6) recentSearches.value.pop()
  }

  const queryParams: Record<string, string> = { search: searchTerm }
  if (onlyLive.value) {
    queryParams.status = 'live'
  }

  close()
  router.push({ path: '/auctions', query: queryParams })
}

function removeRecent(index: number) {
  recentSearches.value.splice(index, 1)
}

function selectCategory(slug: string) {
  close()
  router.push({ path: '/auctions', query: { category: slug } })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
        @click.self="close"
      >
        <!-- Modal / Sheet Container -->
        <div
          class="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-slide-up sm:animate-scale-in"
        >
          <!-- Drag Handle for Mobile Sheet -->
          <div class="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2.5 shrink-0" />

          <!-- Search Input Header -->
          <div class="p-4 sm:p-6 border-b border-black/[0.06] bg-slate-50/50">
            <div class="relative flex items-center bg-white rounded-2xl border-2 border-primary/40 focus-within:border-primary shadow-xs px-4 py-3 transition-all">
              <Search class="w-5 h-5 text-gray-400 shrink-0 mr-3" />
              <input
                ref="searchInputRef"
                v-model="query"
                type="text"
                :placeholder="t('nav.searchPlaceholder') || 'Что вы ищете? Например: iPhone, Camry, Арашан...'"
                class="w-full bg-transparent border-none text-sm sm:text-base font-semibold text-gray-900 placeholder-gray-400 outline-none"
                @keydown.enter="handleSearch()"
                @keydown.esc="close"
              />
              <button
                v-if="query"
                type="button"
                class="p-1 rounded-full text-gray-400 hover:text-gray-700 mr-2 cursor-pointer"
                @click="query = ''"
              >
                <X class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="px-4 py-1.5 bg-gray-950 text-white rounded-xl text-xs font-black hover:bg-primary hover:text-gray-950 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                @click="handleSearch()"
              >
                <span>Найти</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Filters Strip -->
            <div class="flex items-center gap-2 mt-3 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                :class="onlyLive
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-white border border-black/10 text-gray-700 hover:bg-slate-100'"
                @click="onlyLive = !onlyLive"
              >
                <span class="w-2 h-2 rounded-full" :class="onlyLive ? 'bg-white animate-ping' : 'bg-rose-500'" />
                <span>Только живые торги (Live)</span>
              </button>
              <div class="text-[11px] text-gray-400 px-2 flex items-center gap-1 shrink-0">
                <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
                <span>Escrow защита на все сделки</span>
              </div>
            </div>
          </div>

          <!-- Content Scroll Body -->
          <div class="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 overscroll-contain">
            <!-- Recent Searches -->
            <div v-if="recentSearches.length > 0">
              <div class="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                <span class="flex items-center gap-1.5">
                  <Clock class="w-3.5 h-3.5 text-gray-400" />
                  Недавние поиски
                </span>
                <button
                  type="button"
                  class="text-[11px] text-gray-400 hover:text-gray-700 cursor-pointer"
                  @click="recentSearches = []"
                >
                  Очистить
                </button>
              </div>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(item, idx) in recentSearches"
                  :key="item"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-bold text-gray-800 transition-colors cursor-pointer group"
                >
                  <span @click="handleSearch(item)">{{ item }}</span>
                  <button
                    type="button"
                    class="text-gray-400 hover:text-gray-700 p-0.5"
                    @click.stop="removeRecent(idx)"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Trending Searches -->
            <div>
              <div class="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                <Flame class="w-3.5 h-3.5 text-orange-500" />
                Популярные запросы прямо сейчас
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tag in trendingTags"
                  :key="tag"
                  type="button"
                  class="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 border border-amber-500/20 text-xs font-bold transition-all hover:scale-105 cursor-pointer flex items-center gap-1"
                  @click="handleSearch(tag)"
                >
                  <TrendingUp class="w-3 h-3 text-amber-600" />
                  <span>{{ tag }}</span>
                </button>
              </div>
            </div>

            <!-- Category Shortcuts -->
            <div>
              <div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                Категории
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  v-for="cat in quickCategories"
                  :key="cat.slug"
                  type="button"
                  class="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-black/5 text-left flex items-center gap-2.5 transition-all hover:-translate-y-0.5 cursor-pointer group"
                  @click="selectCategory(cat.slug)"
                >
                  <div class="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-gray-800 group-hover:text-primary">
                    <component :is="cat.icon" class="w-4 h-4" />
                  </div>
                  <div>
                    <div class="text-xs font-extrabold text-gray-900 group-hover:text-primary transition-colors">
                      {{ cat.label }}
                    </div>
                    <div class="text-[10px] text-gray-400 font-medium">
                      {{ cat.count }} предложений
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- AI Smart Query Suggestions -->
            <div class="p-4 rounded-2xl bg-gradient-to-r from-amber-500/[0.08] to-orange-500/[0.06] border border-amber-500/20 space-y-2">
              <div class="flex items-center gap-1.5 text-xs font-black text-amber-950">
                <Sparkles class="w-4 h-4 text-amber-600" />
                <span>ИИ-поиск ITOrgo Assistant</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  v-for="prompt in aiPrompts"
                  :key="prompt"
                  type="button"
                  class="p-2.5 rounded-xl bg-white/80 hover:bg-white text-left text-xs font-medium text-gray-800 border border-black/5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group cursor-pointer"
                  @click="handleSearch(prompt)"
                >
                  <span class="truncate">{{ prompt }}</span>
                  <ArrowRight class="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-600 transition-colors shrink-0 ml-1" />
                </button>
              </div>
            </div>
          </div>

          <!-- Footer Bar -->
          <div class="p-3 sm:p-4 bg-slate-50 border-t border-black/[0.06] flex items-center justify-between text-xs text-gray-500">
            <span class="hidden sm:inline">Нажмите <kbd class="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono">ESC</kbd> чтобы закрыть</span>
            <button
              type="button"
              class="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-gray-800 font-bold transition-colors cursor-pointer text-center"
              @click="close"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-scale-in {
  animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
