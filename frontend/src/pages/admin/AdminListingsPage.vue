<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
  Clock
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
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2.5">
          <Gavel class="w-6 h-6 text-primary" />
          <span>{{ t('admin.listings.title') }}</span>
        </h1>
        <p class="text-xs text-text-secondary mt-1">
          {{ t('admin.listings.subtitle') }}
        </p>
      </div>

      <div class="text-xs font-semibold text-text-secondary bg-white px-3 py-1.5 rounded-lg border border-border shadow-xs">
        {{ t('admin.listings.total', { count: adminStore.listingsMeta.total }) }}
      </div>
    </div>

    <!-- Status Tabs -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
      <button
        v-for="tab in [
          { id: 'all', label: t('admin.listings.tabs.all') },
          { id: 'pending_approval', label: t('admin.listings.tabs.pending_approval') },
          { id: 'active', label: t('admin.listings.tabs.active') },
          { id: 'flagged', label: t('admin.listings.tabs.flagged') },
          { id: 'ended_sold', label: t('admin.listings.tabs.ended_sold') }
        ]"
        :key="tab.id"
        :class="[
          'px-4 py-2 rounded-xl transition-all border whitespace-nowrap',
          activeTab === tab.id
            ? 'bg-primary text-text-primary border-primary shadow-sm'
            : 'bg-white text-text-secondary border-border hover:bg-accent'
        ]"
        @click="handleTabChange(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Filters Bar -->
    <div class="bg-white border border-border rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
      <div class="relative sm:col-span-2">
        <Search class="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          v-model="adminStore.listingFilters.search"
          type="text"
          :placeholder="t('admin.listings.searchPlaceholder')"
          class="w-full pl-9 pr-3 py-2 bg-accent border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-base text-text-primary"
          @input="adminStore.fetchListings(1)"
        />
      </div>

      <div>
        <select
          v-model="adminStore.listingFilters.category"
          class="w-full px-3 py-2 bg-accent border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-primary font-medium"
          @change="adminStore.fetchListings(1)"
        >
          <option value="all">{{ t('admin.listings.categoryOptions.all') }}</option>
          <option value="livestock">{{ t('admin.listings.categoryOptions.livestock') }}</option>
          <option value="vehicles">{{ t('admin.listings.categoryOptions.vehicles') }}</option>
          <option value="real_estate">{{ t('admin.listings.categoryOptions.realEstate') }}</option>
          <option value="electronics">{{ t('admin.listings.categoryOptions.electronics') }}</option>
          <option value="jewelry">{{ t('admin.listings.categoryOptions.jewelry') }}</option>
        </select>
      </div>
    </div>

    <!-- Listings Table -->
    <div class="bg-white border border-border rounded-2xl overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-accent/80 text-text-muted font-bold uppercase tracking-wider border-b border-border text-[11px]">
            <tr>
              <th class="p-4">{{ t('admin.listings.table.listing') }}</th>
              <th class="p-4">{{ t('admin.listings.table.category') }}</th>
              <th class="p-4">{{ t('admin.listings.table.currentPrice') }}</th>
              <th class="p-4">{{ t('admin.listings.table.reservePrice') }}</th>
              <th class="p-4">{{ t('admin.listings.table.seller') }}</th>
              <th class="p-4">{{ t('admin.listings.table.status') }}</th>
              <th class="p-4 text-center">{{ t('admin.listings.table.featured') }}</th>
              <th class="p-4 text-right">{{ t('admin.listings.table.actions') }}</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-border">
            <tr
              v-for="l in adminStore.listings"
              :key="l.id"
              class="hover:bg-accent/60 transition-colors"
            >
              <!-- Listing info & thumbnail -->
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <img
                    :src="l.images[0] || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=150&q=80'"
                    class="w-12 h-10 rounded-lg object-cover ring-1 ring-border shrink-0"
                  />
                  <div class="min-w-0">
                    <span class="font-bold text-text-primary block text-sm truncate max-w-xs">{{ l.title }}</span>
                    <span class="text-text-muted text-[11px]">ID: {{ l.id }} • {{ l.city }}</span>
                  </div>
                </div>
              </td>

              <!-- Category -->
              <td class="p-4">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-accent text-text-secondary uppercase">
                  {{ l.category }}
                </span>
              </td>

              <!-- Current Price -->
              <td class="p-4">
                <span class="font-extrabold text-primary block text-sm">{{ l.currentPrice.formatted }}</span>
                <span class="text-[10px] text-text-muted font-medium">{{ t('admin.listings.bidsCount', { count: l.bidCount }) }}</span>
              </td>

              <!-- Reserve Price -->
              <td class="p-4">
                <span class="font-bold text-amber-700 block font-mono">{{ l.reservePrice.formatted }}</span>
                <span class="text-[10px] text-text-muted">{{ t('admin.listings.hiddenMinimum') }}</span>
              </td>

              <!-- Seller -->
              <td class="p-4">
                <span class="font-semibold text-text-primary block">{{ l.seller.fullName }}</span>
                <span class="text-emerald-500 text-[10px] font-bold">★ {{ l.seller.rating }}</span>
              </td>

              <!-- Status -->
              <td class="p-4">
                <span
                  :class="[
                    'text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase',
                    l.status === 'active' ? 'bg-success/20 text-success' : '',
                    l.status === 'pending_approval' ? 'bg-warning/20 text-warning animate-pulse' : '',
                    l.status === 'flagged' ? 'bg-error/20 text-error' : '',
                    l.status === 'draft' ? 'bg-accent text-text-secondary' : ''
                  ]"
                >
                  {{ l.status }}
                </span>
              </td>

              <!-- Featured toggle -->
              <td class="p-4 text-center">
                <button
                  :class="[
                    'p-1.5 rounded-lg transition-colors',
                    l.isFeatured ? 'text-amber-500 hover:text-amber-600 bg-amber-50' : 'text-text-muted hover:text-text-secondary'
                  ]"
                  :title="t('admin.listings.toggleFeaturedTitle')"
                  @click="handleToggleFeatured(l.id)"
                >
                  <Star class="w-4 h-4 fill-current" />
                </button>
              </td>

              <!-- Actions -->
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    class="p-1.5 text-text-secondary hover:bg-accent rounded-lg transition-colors"
                    :title="t('admin.listings.viewDetail')"
                    @click="handleViewListing(l)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <button
                    v-if="l.status === 'pending_approval' || l.status === 'flagged'"
                    class="p-1.5 text-success hover:bg-success/10 rounded-lg transition-colors"
                    :title="t('admin.actions.approve')"
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

      <!-- Pagination -->
      <div class="p-4 border-t border-border flex items-center justify-between text-xs text-text-secondary">
        <span>{{ t('admin.pagination.page', { current: adminStore.listingsMeta.currentPage, last: adminStore.listingsMeta.lastPage }) }}</span>
        <div class="flex gap-2">
          <button
            :disabled="adminStore.listingsMeta.currentPage <= 1"
            class="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-accent font-medium flex items-center gap-1"
            @click="adminStore.fetchListings(adminStore.listingsMeta.currentPage - 1)"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
            <span>{{ t('admin.pagination.prev') }}</span>
          </button>

          <button
            :disabled="adminStore.listingsMeta.currentPage >= adminStore.listingsMeta.lastPage"
            class="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-accent font-medium flex items-center gap-1"
            @click="adminStore.fetchListings(adminStore.listingsMeta.currentPage + 1)"
          >
            <span>{{ t('admin.pagination.next') }}</span>
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
      class="fixed bottom-6 right-6 z-50 bg-white border border-border text-text-primary px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200"
    >
      <CheckCircle2 class="w-4 h-4 text-success" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
