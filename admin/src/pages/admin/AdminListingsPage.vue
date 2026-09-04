<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Gavel,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Star,
  Eye,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  AlertTriangle,
  Flame,
  Clock,
  Plus,
  RotateCcw,
  Sparkles,
  MapPin,
  X
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import type { AdminListing } from '@/types/admin'
import ListingDetailModal from '@/components/admin/ListingDetailModal.vue'
import { useI18n } from '@/composables/useI18n'

const adminStore = useAdminStore()
const { t } = useI18n()

const showDetailModal = ref(false)
const targetListing = ref<AdminListing | null>(null)
const activeTab = ref<string>('all')
const toastMessage = ref<string | null>(null)

onMounted(async () => {
  await adminStore.fetchListings()
})

const pendingCount = computed(() => adminStore.listings.filter(l => l.status === 'pending_approval').length)
const activeCount = computed(() => adminStore.listings.filter(l => l.status === 'active').length)
const featuredCount = computed(() => adminStore.listings.filter(l => l.isFeatured).length)

function showToast(msg: string) {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3500)
}

function handleTabChange(tab: string) {
  activeTab.value = tab
  adminStore.listingFilters.status = tab
  adminStore.fetchListings(1)
}

function handleViewListing(listing: AdminListing) {
  targetListing.value = listing
  showDetailModal.value = true
}

async function handleApproveListing(id: string) {
  const success = await adminStore.approveListing(id)
  if (success) {
    showDetailModal.value = false
    showToast(t('admin.listings.toast.approved', { id }))
  }
}

async function handleRejectListing(payload: { id: string; reason: string }) {
  const success = await adminStore.rejectListing(payload.id, payload.reason)
  if (success) {
    showDetailModal.value = false
    showToast(t('admin.listings.toast.rejected', { id: payload.id }))
  }
}

async function handleToggleFeatured(id: string) {
  await adminStore.toggleListingFeatured(id)
  showToast(t('admin.listings.toast.featuredToggled'))
}

function resetFilters() {
  activeTab.value = 'all'
  adminStore.listingFilters.search = ''
  adminStore.listingFilters.status = 'all'
  adminStore.listingFilters.category = 'all'
  adminStore.fetchListings(1)
}
</script>

<template>
  <div class="space-y-6 font-sans">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-3">
          <span>{{ t('admin.listings.title') || 'Модерация и управление лотами' }}</span>
        </h1>
        <p class="text-xs sm:text-sm text-gray-500 mt-1">
          {{ t('admin.listings.subtitle') || 'Каталог аукционов, утверждение лотов, контроль скрытых резервных цен и подозрительных объявлений' }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <router-link
          to="/sell"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary hover:bg-primary-hover text-text-primary text-xs font-extrabold shadow-sm transition-all"
        >
          <Plus class="w-4 h-4" />
          <span>{{ t('admin.listings.createListing') || 'Создать новый лот' }}</span>
        </router-link>
      </div>
    </div>

    <!-- Quick Stats Ribbon (4 KPI Chips) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      <div class="bg-white rounded-2xl p-4 border border-black/[0.08] shadow-xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
          <Gavel class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
            {{ t('admin.listings.metrics.total') || 'Всего лотов' }}
          </span>
          <span class="text-lg font-black text-gray-900 mt-0.5 block">
            {{ adminStore.listingsMeta.total }}
          </span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-black/[0.08] shadow-xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
          <Clock class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
            {{ t('admin.listings.metrics.pending') || 'На модерации' }}
          </span>
          <span class="text-lg font-black text-gray-900 mt-0.5 block">
            {{ pendingCount }}
          </span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-black/[0.08] shadow-xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
          <Flame class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
            {{ t('admin.listings.metrics.active') || 'Активные торги' }}
          </span>
          <span class="text-lg font-black text-gray-900 mt-0.5 block">
            {{ activeCount }}
          </span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-black/[0.08] shadow-xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shrink-0">
          <Star class="w-5 h-5 fill-current" />
        </div>
        <div class="min-w-0">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
            {{ t('admin.listings.metrics.featured') || 'На главной (Витрина)' }}
          </span>
          <span class="text-lg font-black text-gray-900 mt-0.5 block">
            {{ featuredCount }}
          </span>
        </div>
      </div>
    </div>

    <!-- Status Filter Tabs -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold custom-scrollbar">
      <button
        v-for="tab in [
          { id: 'all', label: t('admin.listings.tabs.all') || 'Tüm İlanlar', count: adminStore.listingsMeta.total },
          { id: 'pending_approval', label: t('admin.listings.tabs.pending_approval') || 'Moderasyonda (Beklemede)', count: pendingCount },
          { id: 'active', label: t('admin.listings.tabs.active') || 'Aktif Açık Artırmalar', count: activeCount },
          { id: 'flagged', label: t('admin.listings.tabs.flagged') || 'Şüpheli / Şikayetli', count: 0 },
          { id: 'ended_sold', label: t('admin.listings.tabs.ended_sold') || 'Satılanlar', count: 0 }
        ]"
        :key="tab.id"
        :class="[
          'px-4 py-2.5 rounded-2xl transition-all border whitespace-nowrap flex items-center gap-2 shadow-2xs',
          activeTab === tab.id
            ? 'bg-primary text-text-primary border-primary shadow-xs font-black'
            : 'bg-white text-gray-600 border-black/[0.08] hover:bg-slate-50'
        ]"
        @click="handleTabChange(tab.id)"
      >
        <span>{{ tab.label }}</span>
        <span
          class="px-2 py-0.5 rounded-full text-[10px] font-mono font-black"
          :class="activeTab === tab.id ? 'bg-black/15 text-gray-950' : 'bg-slate-100 text-gray-500'"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- Filters Bar -->
    <div class="bg-white border border-black/[0.08] rounded-3xl p-4 sm:p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
      <div class="relative sm:col-span-2">
        <Search class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="adminStore.listingFilters.search"
          type="text"
          :placeholder="t('admin.listings.searchPlaceholder') || 'İlan başlığı veya açıklamasında ara...'"
          class="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-black/[0.08] rounded-2xl focus:outline-none focus:border-primary focus:bg-white text-xs text-gray-900 transition-all placeholder-gray-400"
          @input="adminStore.fetchListings(1)"
        />
        <button
          v-if="adminStore.listingFilters.search"
          @click="adminStore.listingFilters.search = ''; adminStore.fetchListings(1)"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <select
          v-model="adminStore.listingFilters.category"
          class="w-full px-3.5 py-2.5 bg-slate-50 border border-black/[0.08] rounded-2xl focus:outline-none focus:border-primary focus:bg-white text-gray-800 font-semibold text-xs cursor-pointer transition-all"
          @change="adminStore.fetchListings(1)"
        >
          <option value="all">{{ t('admin.listings.categoryOptions.all') || 'Tüm Kategoriler' }}</option>
          <option value="livestock">{{ t('admin.listings.categoryOptions.livestock') || 'Hayvancılık' }}</option>
          <option value="vehicles">{{ t('admin.listings.categoryOptions.vehicles') || 'Araçlar & Otomotiv' }}</option>
          <option value="real_estate">{{ t('admin.listings.categoryOptions.realEstate') || 'Gayrimenkul' }}</option>
          <option value="electronics">{{ t('admin.listings.categoryOptions.electronics') || 'Elektronik' }}</option>
          <option value="jewelry">{{ t('admin.listings.categoryOptions.jewelry') || 'Mücevherat & Antika' }}</option>
        </select>
      </div>
    </div>

    <!-- Listings Table Container -->
    <div class="bg-white border border-black/[0.08] rounded-3xl overflow-hidden shadow-xs">
      <div v-if="adminStore.listings.length > 0" class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-gray-500 font-extrabold uppercase tracking-wider border-b border-black/[0.06] text-[11px]">
            <tr>
              <th class="py-3.5 px-5">{{ t('admin.listings.table.listing') || 'İLAN' }}</th>
              <th class="py-3.5 px-4">{{ t('admin.listings.table.category') || 'KATEGORİ' }}</th>
              <th class="py-3.5 px-4">{{ t('admin.listings.table.currentPrice') || 'GÜNCEL FİYAT' }}</th>
              <th class="py-3.5 px-4">{{ t('admin.listings.table.reservePrice') || 'REZERVE FİYAT (ADMİN)' }}</th>
              <th class="py-3.5 px-4">{{ t('admin.listings.table.seller') || 'SATICI' }}</th>
              <th class="py-3.5 px-4">{{ t('admin.listings.table.status') || 'DURUM' }}</th>
              <th class="py-3.5 px-4 text-center">{{ t('admin.listings.table.featured') || 'ÖNE ÇIKAN' }}</th>
              <th class="py-3.5 px-5 text-right">{{ t('admin.listings.table.actions') || 'İŞLEMLER' }}</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-black/[0.05]">
            <tr
              v-for="l in adminStore.listings"
              :key="l.id"
              class="hover:bg-slate-50/80 transition-colors group"
            >
              <!-- Listing info & thumbnail -->
              <td class="py-3.5 px-5">
                <div class="flex items-center gap-3">
                  <img
                    :src="(l.images && l.images[0]) || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=150&q=80'"
                    class="w-12 h-10 rounded-xl object-cover ring-1 ring-black/10 shadow-2xs shrink-0"
                  />
                  <div class="min-w-0">
                    <span class="font-extrabold text-gray-950 block text-xs sm:text-sm group-hover:text-primary transition-colors truncate max-w-xs">
                      {{ l.title }}
                    </span>
                    <div class="flex items-center gap-1.5 text-gray-400 text-[11px] mt-0.5">
                      <span>ID: {{ l.id }}</span>
                      <span>•</span>
                      <span>{{ l.city }}</span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- Category -->
              <td class="py-3.5 px-4">
                <span class="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-slate-100 text-gray-700 uppercase border border-black/[0.05]">
                  {{ l.category }}
                </span>
              </td>

              <!-- Current Price -->
              <td class="py-3.5 px-4">
                <span class="font-black text-amber-600 block text-sm">{{ l.currentPrice?.formatted || l.startingPrice?.formatted || '—' }}</span>
                <span class="text-[10px] text-gray-400 font-medium">{{ t('admin.listings.bidsCount', { count: l.bidCount || 0 }) }}</span>
              </td>

              <!-- Reserve Price -->
              <td class="py-3.5 px-4">
                <span class="font-bold text-gray-800 block font-mono">{{ l.reservePrice?.formatted || '—' }}</span>
                <span class="text-[10px] text-gray-400">{{ t('admin.listings.hiddenMinimum') || 'Gizli minimum' }}</span>
              </td>

              <!-- Seller -->
              <td class="py-3.5 px-4">
                <span class="font-extrabold text-gray-900 block">{{ l.seller?.fullName || l.sellerId || '—' }}</span>
                <span class="text-amber-500 text-[10px] font-bold">★ {{ l.seller?.rating || '5.0' }}</span>
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-xl uppercase border',
                    l.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' : '',
                    l.status === 'pending_approval' ? 'bg-amber-50 text-amber-800 border-amber-200/80 animate-pulse' : '',
                    l.status === 'flagged' ? 'bg-rose-50 text-rose-800 border-rose-200/80' : '',
                    l.status === 'draft' ? 'bg-slate-100 text-gray-600 border-black/[0.05]' : ''
                  ]"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="[
                      l.status === 'active' ? 'bg-emerald-600 animate-pulse' : '',
                      l.status === 'pending_approval' ? 'bg-amber-600' : '',
                      l.status === 'flagged' ? 'bg-rose-600' : '',
                      l.status === 'draft' ? 'bg-gray-400' : ''
                    ]"
                  />
                  <span>{{ l.status }}</span>
                </span>
              </td>

              <!-- Featured toggle -->
              <td class="py-3.5 px-4 text-center">
                <button
                  :class="[
                    'p-2 rounded-xl transition-all shadow-2xs border',
                    l.isFeatured ? 'text-amber-500 hover:text-amber-600 bg-amber-50 border-amber-200' : 'text-gray-400 hover:text-gray-600 bg-slate-50 border-black/[0.05]'
                  ]"
                  :title="t('admin.listings.toggleFeaturedTitle') || 'Öne Çıkar'"
                  @click="handleToggleFeatured(l.id)"
                >
                  <Star class="w-4 h-4 fill-current" />
                </button>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-5 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    class="p-2 text-gray-600 hover:text-gray-950 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-black/[0.08] shadow-2xs"
                    :title="t('admin.listings.viewDetail') || 'İncele'"
                    @click="handleViewListing(l)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <button
                    v-if="l.status === 'pending_approval' || l.status === 'flagged'"
                    class="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-200 shadow-2xs"
                    :title="t('admin.actions.approve') || 'Onayla'"
                    @click="handleApproveListing(l.id)"
                  >
                    <CheckCircle2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State When 0 Listings -->
      <div v-else class="py-14 px-4 text-center space-y-3 bg-white">
        <div class="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-100 shadow-2xs">
          <Gavel class="w-8 h-8 stroke-[1.5]" />
        </div>
        <div class="space-y-1">
          <h4 class="text-base font-extrabold text-gray-950">
            {{ t('admin.listings.emptyTitle') || 'İlan Moderasyon Kataloğu Temiz' }}
          </h4>
          <p class="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            {{ t('admin.listings.emptyDesc') || 'Şu anda bu kriterlere uygun veya onay bekleyen ilan bulunmuyor. Yeni bir ilan oluşturulduğunda moderasyon kuyruğunda anında listelenecektir.' }}
          </p>
        </div>
        <div class="pt-2 flex items-center justify-center gap-3">
          <router-link
            to="/sell"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-text-primary text-xs font-extrabold shadow-sm transition-all"
          >
            <Plus class="w-4 h-4" />
            <span>{{ t('admin.listings.createListing') || 'Yeni İlan Ekle' }}</span>
          </router-link>

          <button
            v-if="activeTab !== 'all' || adminStore.listingFilters.search || adminStore.listingFilters.category !== 'all'"
            @click="resetFilters"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold transition-colors"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>{{ t('admin.listings.clearFilters') || 'Filtreleri Sıfırla' }}</span>
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div class="p-4 border-t border-black/[0.06] flex items-center justify-between text-xs text-gray-500 bg-slate-50/50">
        <span class="font-medium">
          {{ t('admin.pagination.page', { current: adminStore.listingsMeta.currentPage, last: adminStore.listingsMeta.lastPage }) }}
        </span>
        <div class="flex gap-2">
          <button
            :disabled="adminStore.listingsMeta.currentPage <= 1"
            class="px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white disabled:opacity-40 hover:bg-slate-100 font-bold flex items-center gap-1 text-gray-700 transition-colors shadow-2xs"
            @click="adminStore.fetchListings(adminStore.listingsMeta.currentPage - 1)"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
            <span>{{ t('admin.pagination.prev') || 'Geri' }}</span>
          </button>

          <button
            :disabled="adminStore.listingsMeta.currentPage >= adminStore.listingsMeta.lastPage"
            class="px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white disabled:opacity-40 hover:bg-slate-100 font-bold flex items-center gap-1 text-gray-700 transition-colors shadow-2xs"
            @click="adminStore.fetchListings(adminStore.listingsMeta.currentPage + 1)"
          >
            <span>{{ t('admin.pagination.next') || 'İleri' }}</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ListingDetailModal
      :is-open="showDetailModal"
      :listing="targetListing"
      @close="showDetailModal = false"
      @approve="handleApproveListing"
      @reject="handleRejectListing"
      @toggle-featured="handleToggleFeatured"
    />

    <!-- Global Toast Notification -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 bg-white border border-black/10 text-gray-900 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom duration-200"
    >
      <CheckCircle2 class="w-4 h-4 text-emerald-600" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>