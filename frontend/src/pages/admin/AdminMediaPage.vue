<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Image, Gavel, User as UserIcon, X, ChevronLeft, ChevronRight,
  CheckCircle2, Circle, Copy, Search, ListChecks, Loader2
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import { useUIStore } from '@/stores/ui'
import type { AdminMediaItem } from '@/types/admin'
import { useI18n } from '@/composables/useI18n'

const adminStore = useAdminStore()
const uiStore = useUIStore()
const { t } = useI18n()

const filterIds = ['all', 'auction', 'avatar'] as const
const filters = computed(() => filterIds.map(id => ({ id, label: t(`admin.media.filters.${id}`) })))

const activeFilter = ref<'all' | 'auction' | 'avatar'>('all')
const searchQuery = ref('')
const isSelectMode = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const lightboxIndex = ref<number | null>(null)

onMounted(() => {
  adminStore.fetchMedia()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const filteredMedia = computed<AdminMediaItem[]>(() => {
  let list = adminStore.media
  if (activeFilter.value !== 'all') {
    list = list.filter(m => m.source === activeFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(m => m.title.toLowerCase().includes(q) || m.ownerLabel.toLowerCase().includes(q))
  }
  return list
})

// Intl's ky-KG long-month names aren't reliably available across browsers'
// bundled ICU data (silently falls back to English), so month names are
// looked up from the locale dictionary instead of relying on Intl.
function monthName(date: Date): string {
  return t(`admin.media.months.${date.getMonth()}`)
}

function monthLabel(date: Date): string {
  return `${monthName(date)} ${date.getFullYear()}`
}

const groupedByMonth = computed(() => {
  const groups = new Map<string, Array<{ item: AdminMediaItem; index: number }>>()
  filteredMedia.value.forEach((item, index) => {
    const key = monthLabel(new Date(item.createdAt))
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push({ item, index })
  })
  return Array.from(groups.entries()).map(([label, entries]) => ({ label, entries }))
})

const lightboxItem = computed(() => (lightboxIndex.value !== null ? filteredMedia.value[lightboxIndex.value] : null))

function toggleSelectMode() {
  isSelectMode.value = !isSelectMode.value
  if (!isSelectMode.value) selectedIds.value.clear()
}

function toggleSelected(id: string) {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  else selectedIds.value.add(id)
}

function handleThumbClick(item: AdminMediaItem, index: number) {
  if (isSelectMode.value) {
    toggleSelected(item.id)
  } else {
    lightboxIndex.value = index
  }
}

function closeLightbox() {
  lightboxIndex.value = null
}

function nextLightbox() {
  if (lightboxIndex.value === null || filteredMedia.value.length === 0) return
  lightboxIndex.value = (lightboxIndex.value + 1) % filteredMedia.value.length
}

function prevLightbox() {
  if (lightboxIndex.value === null || filteredMedia.value.length === 0) return
  lightboxIndex.value = (lightboxIndex.value - 1 + filteredMedia.value.length) % filteredMedia.value.length
}

function handleKeydown(e: KeyboardEvent) {
  if (lightboxIndex.value === null) return
  if (e.key === 'Escape') closeLightbox()
  else if (e.key === 'ArrowRight') nextLightbox()
  else if (e.key === 'ArrowLeft') prevLightbox()
}

async function copySelectedLinks() {
  const urls = filteredMedia.value.filter(m => selectedIds.value.has(m.id)).map(m => m.url)
  try {
    await navigator.clipboard.writeText(urls.join('\n'))
  } catch {
    uiStore.toastError(t('admin.media.toast.copyErrorTitle'), t('admin.media.toast.copyErrorBody'))
    return
  }
  uiStore.toastSuccess(t('admin.media.toast.copySuccessTitle'), t('admin.media.toast.copySuccessBody', { count: urls.length }))
  isSelectMode.value = false
  selectedIds.value.clear()
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${monthName(d)}, ${d.getFullYear()}`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2.5">
          <Image class="w-6 h-6 text-primary" />
          <span>{{ t('admin.media.title') }}</span>
        </h1>
        <p class="text-xs text-text-secondary mt-1">
          {{ t('admin.media.subtitle') }}
        </p>
      </div>

      <div class="text-xs font-semibold text-text-secondary bg-white px-3 py-1.5 rounded-lg border border-border shadow-xs">
        {{ t('admin.media.totalCount', { count: adminStore.media.length }) }}
      </div>
    </div>

    <!-- Toolbar: segmented filter + search + select -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
      <div class="relative flex p-1 bg-black/[0.05] rounded-xl w-full sm:w-auto">
        <div
          class="absolute top-1 bottom-1 rounded-lg bg-white shadow-xs transition-all duration-200 ease-out"
          :style="{
            left: `calc(${filters.findIndex(f => f.id === activeFilter)} * (100% / 3) + 2px)`,
            width: `calc(100% / 3 - 4px)`
          }"
        />
        <button
          v-for="f in filters"
          :key="f.id"
          type="button"
          class="relative z-10 flex-1 px-4 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
          :class="activeFilter === f.id ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'"
          @click="activeFilter = f.id"
        >
          {{ f.label }}
        </button>
      </div>

      <div class="relative flex-1 max-w-sm">
        <Search class="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('admin.media.searchPlaceholder')"
          class="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-border text-base focus:outline-none focus:border-primary shadow-xs text-text-primary placeholder-text-muted"
        />
      </div>

      <button
        type="button"
        class="sm:ml-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors"
        :class="isSelectMode
          ? 'bg-primary text-text-primary border-primary shadow-md'
          : 'bg-white text-text-secondary border-border hover:text-text-primary'"
        @click="toggleSelectMode"
      >
        <ListChecks class="w-3.5 h-3.5" />
        <span>{{ isSelectMode ? t('admin.media.doneButton') : t('admin.media.selectButton') }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="adminStore.isLoading && adminStore.media.length === 0" class="py-24 text-center">
      <Loader2 class="w-8 h-8 animate-spin text-primary mx-auto" />
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredMedia.length === 0" class="py-24 text-center glass rounded-3xl space-y-2">
      <Image class="w-10 h-10 text-text-muted mx-auto" />
      <p class="text-sm font-semibold text-text-secondary">{{ t('admin.media.empty') }}</p>
    </div>

    <!-- Photo grid, grouped by month (iOS Photos style) -->
    <div v-else class="space-y-6">
      <div v-for="group in groupedByMonth" :key="group.label" class="space-y-2.5">
        <h3 class="text-sm font-bold text-text-primary capitalize px-0.5">{{ group.label }}</h3>

        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
          <button
            v-for="entry in group.entries"
            :key="entry.item.id"
            type="button"
            class="relative aspect-square overflow-hidden rounded-lg bg-black/5 group"
            @click="handleThumbClick(entry.item, entry.index)"
          >
            <img
              :src="entry.item.url"
              :alt="entry.item.title"
              loading="lazy"
              class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              :class="{ 'opacity-80': isSelectMode && selectedIds.has(entry.item.id) }"
            />

            <!-- Source badge -->
            <div class="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center">
              <Gavel v-if="entry.item.source === 'auction'" class="w-3 h-3 text-white" />
              <UserIcon v-else class="w-3 h-3 text-white" />
            </div>

            <!-- Select indicator -->
            <div v-if="isSelectMode" class="absolute top-1.5 right-1.5">
              <CheckCircle2 v-if="selectedIds.has(entry.item.id)" class="w-5 h-5 text-primary bg-white rounded-full" />
              <Circle v-else class="w-5 h-5 text-white/90 drop-shadow" />
            </div>
            <div
              v-if="isSelectMode && selectedIds.has(entry.item.id)"
              class="absolute inset-0 ring-2 ring-primary ring-inset bg-primary/15 pointer-events-none"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Selection action bar (iOS Photos style bottom toolbar) -->
    <Transition name="fade">
      <div
        v-if="isSelectMode && selectedIds.size > 0"
        class="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-5 py-3 rounded-2xl bg-text-primary text-white shadow-2xl"
      >
        <span class="text-xs font-semibold">{{ t('admin.media.selectedCount', { count: selectedIds.size }) }}</span>
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold transition-colors"
          @click="copySelectedLinks"
        >
          <Copy class="w-3.5 h-3.5" />
          <span>{{ t('admin.media.copyLinks') }}</span>
        </button>
      </div>
    </Transition>

    <!-- Lightbox -->
      <div
        v-if="lightboxItem"
        class="fixed inset-0 z-[60] bg-black/95 flex flex-col"
        @click.self="closeLightbox"
      >
        <div class="flex items-center justify-between p-4 sm:p-6 text-white flex-shrink-0">
          <span class="text-xs sm:text-sm text-white/70 font-medium font-mono">
            {{ (lightboxIndex ?? 0) + 1 }} / {{ filteredMedia.length }}
          </span>
          <button
            type="button"
            class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            :aria-label="t('admin.media.lightbox.close')"
            @click="closeLightbox"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 flex items-center justify-center relative px-3 sm:px-16 min-h-0">
          <button
            v-if="filteredMedia.length > 1"
            type="button"
            class="absolute left-2 sm:left-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            :aria-label="t('admin.media.lightbox.prev')"
            @click="prevLightbox"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>

          <img :src="lightboxItem.url" :alt="lightboxItem.title" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />

          <button
            v-if="filteredMedia.length > 1"
            type="button"
            class="absolute right-2 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            :aria-label="t('admin.media.lightbox.next')"
            @click="nextLightbox"
          >
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>

        <div class="p-4 sm:p-6 flex-shrink-0 text-white space-y-1">
          <div class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-white/60">
            <Gavel v-if="lightboxItem.source === 'auction'" class="w-3.5 h-3.5" />
            <UserIcon v-else class="w-3.5 h-3.5" />
            <span>{{ lightboxItem.source === 'auction' ? t('admin.media.lightbox.auctionSource') : t('admin.media.lightbox.avatarSource') }}</span>
          </div>
          <h3 class="text-base sm:text-lg font-bold">{{ lightboxItem.title }}</h3>
          <p class="text-xs sm:text-sm text-white/70">{{ lightboxItem.ownerLabel }} • {{ formatDate(lightboxItem.createdAt) }}</p>
        </div>
      </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
