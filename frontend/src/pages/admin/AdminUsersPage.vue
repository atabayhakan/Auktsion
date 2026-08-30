<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  MoreVertical,
  Ban,
  Key,
  UserCheck,
  Eye,
  ChevronLeft,
  ChevronRight,
  Shield,
  Crown,
  Store,
  ShoppingBag,
  Clock,
  Phone,
  Copy,
  Check,
  X,
  Sparkles,
  RotateCcw
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import type { AdminUser, AdminUserDetail } from '@/types/admin'
import UserDetailModal from '@/components/admin/UserDetailModal.vue'
import BanUserModal from '@/components/admin/BanUserModal.vue'
import ChangeRoleModal from '@/components/admin/ChangeRoleModal.vue'
import { useI18n } from '@/composables/useI18n'

const adminStore = useAdminStore()
const { t } = useI18n()

const showDetailModal = ref(false)
const showBanModal = ref(false)
const showRoleModal = ref(false)
const targetUser = ref<AdminUser | AdminUserDetail | null>(null)
const toastMessage = ref<string | null>(null)
const copiedId = ref<string | null>(null)

onMounted(async () => {
  await adminStore.fetchUsers()
})

const totalSellers = computed(() => adminStore.users.filter(u => u.role === 'seller').length)
const totalBuyers = computed(() => adminStore.users.filter(u => u.role === 'buyer').length)
const totalVerified = computed(() => adminStore.users.filter(u => u.kycStatus === 'verified').length)

function showToast(msg: string) {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3500)
}

function copyToClipboard(text: string, id: string) {
  navigator.clipboard.writeText(text)
  copiedId.value = id
  showToast('Kopyalandı: ' + text)
  setTimeout(() => { copiedId.value = null }, 2000)
}

async function handleViewDetail(user: AdminUser) {
  await adminStore.fetchUserDetail(user.id)
  targetUser.value = adminStore.selectedUser
  showDetailModal.value = true
}

function handleOpenBan(user: AdminUser | AdminUserDetail) {
  targetUser.value = user
  showBanModal.value = true
}

function handleOpenRole(user: AdminUser | AdminUserDetail) {
  targetUser.value = user
  showRoleModal.value = true
}

async function handleBanSubmit(payload: { id: string; status: 'active' | 'suspended' | 'banned'; reason: string }) {
  const success = await adminStore.updateUserStatus(payload.id, payload.status, payload.reason)
  if (success) {
    showBanModal.value = false
    showToast(t('admin.users.toast.statusChanged', { status: payload.status }))
  }
}

async function handleRoleSubmit(payload: { id: string; role: string }) {
  const success = await adminStore.updateUserRole(payload.id, payload.role)
  if (success) {
    showRoleModal.value = false
    showToast(t('admin.users.toast.roleChanged', { role: payload.role }))
  }
}

async function handleResetPassword(user: AdminUser | AdminUserDetail) {
  const res = await adminStore.resetUserPassword(user.id)
  showToast(res.message || t('admin.users.toast.passwordResetSent'))
}

function onFilterChange() {
  adminStore.fetchUsers(1)
}

function resetFilters() {
  adminStore.userFilters.search = ''
  adminStore.userFilters.role = 'all'
  adminStore.userFilters.status = 'all'
  adminStore.userFilters.kycStatus = 'all'
  adminStore.fetchUsers(1)
}
</script>

<template>
  <div class="space-y-6 font-sans">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-3">
          <span>{{ t('admin.users.title') || 'Kullanıcı Yönetimi' }}</span>
        </h1>
        <p class="text-xs sm:text-sm text-gray-500 mt-1">
          {{ t('admin.users.subtitle') || 'Tüm kayıtlı kullanıcılar, roller, escrow bakiyeleri ve güvenlik kontrolü' }}
        </p>
      </div>

        <div class="text-xs font-bold text-gray-700 bg-white px-3.5 py-2 rounded-2xl border border-black/[0.08] shadow-2xs">
          {{ t('admin.users.total', { count: adminStore.usersMeta.total }) }}
        </div>
    </div>

    <!-- Quick Stats Ribbon (4 KPI Chips) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      <div class="bg-white rounded-2xl p-4 border border-black/[0.08] shadow-xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
          <Users class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
            Toplam Kullanıcı
          </span>
          <span class="text-lg font-black text-gray-900 mt-0.5 block">
            {{ adminStore.usersMeta.total }}
          </span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-black/[0.08] shadow-xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
          <Store class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
            Satıcılar (Sellers)
          </span>
          <span class="text-lg font-black text-gray-900 mt-0.5 block">
            {{ totalSellers }}
          </span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-black/[0.08] shadow-xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
          <ShoppingBag class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
            Alıcılar (Buyers)
          </span>
          <span class="text-lg font-black text-gray-900 mt-0.5 block">
            {{ totalBuyers }}
          </span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-black/[0.08] shadow-xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
          <ShieldCheck class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
            KYC Doğrulandı
          </span>
          <span class="text-lg font-black text-gray-900 mt-0.5 block">
            {{ totalVerified }}
          </span>
        </div>
      </div>
    </div>

    <!-- Filters & Search Bar -->
    <div class="bg-white border border-black/[0.08] rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <!-- Search Input -->
        <div class="relative">
          <Search class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="adminStore.userFilters.search"
            type="text"
            :placeholder="t('admin.users.searchPlaceholder') || 'İsim, VKN, telefon veya e-posta...'"
            class="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-black/[0.08] rounded-2xl focus:outline-none focus:border-primary focus:bg-white text-xs text-gray-900 transition-all placeholder-gray-400"
            @input="onFilterChange"
          />
          <button
            v-if="adminStore.userFilters.search"
            @click="adminStore.userFilters.search = ''; onFilterChange()"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Role Filter -->
        <div>
          <select
            v-model="adminStore.userFilters.role"
            :aria-label="t('admin.users.roleFilter')"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-black/[0.08] rounded-2xl focus:outline-none focus:border-primary focus:bg-white text-gray-800 font-semibold text-xs cursor-pointer transition-all"
            @change="onFilterChange"
          >
            <option value="all">{{ t('admin.users.roleOptions.all') || 'Tüm Roller' }}</option>
            <option value="buyer">{{ t('admin.users.roleOptions.buyer') || 'Alıcı (Buyer)' }}</option>
            <option value="seller">{{ t('admin.users.roleOptions.seller') || 'Satıcı (Seller)' }}</option>
            <option value="moderator">{{ t('admin.users.roleOptions.moderator') || 'Moderatör' }}</option>
            <option value="admin">{{ t('admin.users.roleOptions.admin') || 'Yönetici (Admin)' }}</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div>
          <select
            v-model="adminStore.userFilters.status"
            :aria-label="t('admin.users.statusFilter')"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-black/[0.08] rounded-2xl focus:outline-none focus:border-primary focus:bg-white text-gray-800 font-semibold text-xs cursor-pointer transition-all"
            @change="onFilterChange"
          >
            <option value="all">{{ t('admin.users.statusOptions.all') || 'Tüm Durumlar' }}</option>
            <option value="active">{{ t('admin.users.statusOptions.active') || 'Aktif' }}</option>
            <option value="suspended">{{ t('admin.users.statusOptions.suspended') || 'Askıya Alındı' }}</option>
            <option value="banned">{{ t('admin.users.statusOptions.banned') || 'Engellendi' }}</option>
          </select>
        </div>

        <!-- KYC Status Filter -->
        <div>
          <select
            v-model="adminStore.userFilters.kycStatus"
            :aria-label="t('admin.users.kycFilter')"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-black/[0.08] rounded-2xl focus:outline-none focus:border-primary focus:bg-white text-gray-800 font-semibold text-xs cursor-pointer transition-all"
            @change="onFilterChange"
          >
            <option value="all">{{ t('admin.users.kycOptions.all') || 'Tüm KYC Seviyeleri' }}</option>
            <option value="verified">{{ t('admin.users.kycOptions.verified') || 'Doğrulandı' }}</option>
            <option value="pending">{{ t('admin.users.kycOptions.pending') || 'İncelemede' }}</option>
            <option value="not_started">{{ t('admin.users.kycOptions.notStarted') || 'Başlatılmadı' }}</option>
            <option value="rejected">{{ t('admin.users.kycOptions.rejected') || 'Reddedildi' }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white border border-black/[0.08] rounded-3xl overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-gray-500 font-extrabold uppercase tracking-wider border-b border-black/[0.06] text-[11px]">
            <tr>
              <th class="py-3.5 px-5">{{ t('admin.users.table.user') || 'KULLANICI' }}</th>
              <th class="py-3.5 px-4">{{ t('admin.users.table.innContacts') || 'VKN VE İLETİŞİM' }}</th>
              <th class="py-3.5 px-4">{{ t('admin.users.table.role') || 'ROL' }}</th>
              <th class="py-3.5 px-4">{{ t('admin.users.table.status') || 'DURUM' }}</th>
              <th class="py-3.5 px-4">{{ t('admin.users.table.kycStatus') || 'KYC DURUMU' }}</th>
              <th class="py-3.5 px-4">{{ t('admin.users.table.balance') || 'BAKİYE' }}</th>
              <th class="py-3.5 px-5 text-right">{{ t('admin.users.table.actions') || 'İŞLEMLER' }}</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-black/[0.05]">
            <tr
              v-for="u in adminStore.users"
              :key="u.id"
              class="hover:bg-slate-50/80 transition-colors group"
            >
              <!-- User profile -->
              <td class="py-3.5 px-5">
                <div class="flex items-center gap-3">
                  <div class="relative shrink-0">
                    <img
                      :src="u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'"
                      class="w-10 h-10 rounded-2xl object-cover ring-1 ring-black/10 shadow-2xs"
                    />
                    <div
                      v-if="u.kycStatus === 'verified'"
                      class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white text-[9px]"
                      title="KYC Doğrulanmış"
                    >
                      ✓
                    </div>
                  </div>
                  <div class="min-w-0">
                    <span class="font-extrabold text-gray-950 block text-xs sm:text-sm group-hover:text-primary transition-colors">
                      {{ u.fullName }}
                    </span>
                    <div class="flex items-center gap-1.5 text-gray-400 text-[11px] mt-0.5">
                      <span class="truncate max-w-[140px]">{{ u.email }}</span>
                      <span>•</span>
                      <button
                        @click="copyToClipboard(u.id, u.id)"
                        class="hover:text-gray-700 font-mono text-[10px] bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded transition-colors"
                        :title="'Kullanıcı ID Kopyala: ' + u.id"
                      >
                        {{ u.id }}
                      </button>
                    </div>
                  </div>
                </div>
              </td>

              <!-- INN & Phone -->
              <td class="py-3.5 px-4">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-1.5 font-mono font-bold text-gray-800 text-xs">
                    <span>{{ u.inn || '—' }}</span>
                    <button
                      v-if="u.inn"
                      @click="copyToClipboard(u.inn, u.id + '-inn')"
                      class="text-gray-400 hover:text-gray-700 transition-colors"
                      title="VKN Kopyala"
                    >
                      <Copy class="w-3 h-3" />
                    </button>
                  </div>
                  <div class="flex items-center gap-1 text-gray-500 text-[11px]">
                    <Phone class="w-3 h-3 text-gray-400" />
                    <span>{{ u.phone || '—' }}</span>
                  </div>
                </div>
              </td>

              <!-- Role Badge -->
              <td class="py-3.5 px-4">
                <span
                  v-if="u.role === 'admin'"
                  class="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs"
                >
                  <Crown class="w-3 h-3 text-purple-600" />
                  <span>ADMIN</span>
                </span>
                <span
                  v-else-if="u.role === 'seller'"
                  class="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs"
                >
                  <Store class="w-3 h-3 text-emerald-600" />
                  <span>SELLER</span>
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs"
                >
                  <ShoppingBag class="w-3 h-3 text-sky-600" />
                  <span>BUYER</span>
                </span>
              </td>

              <!-- Account Status -->
              <td class="py-3.5 px-4">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-xl border',
                    u.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' : '',
                    u.status === 'suspended' ? 'bg-amber-50 text-amber-800 border-amber-200/80' : '',
                    u.status === 'banned' ? 'bg-rose-50 text-rose-800 border-rose-200/80' : ''
                  ]"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="[
                      u.status === 'active' ? 'bg-emerald-600 animate-pulse' : '',
                      u.status === 'suspended' ? 'bg-amber-600' : '',
                      u.status === 'banned' ? 'bg-rose-600' : ''
                    ]"
                  />
                  <span>{{ u.status === 'active' ? (t('admin.users.statusOptions.active') || 'Aktif') : (u.status === 'suspended' ? (t('admin.users.statusOptions.suspended') || 'Askıya Alındı') : (t('admin.users.statusOptions.banned') || 'Engellendi')) }}</span>
                </span>
              </td>

              <!-- KYC Status -->
              <td class="py-3.5 px-4">
                <span
                  v-if="u.kycStatus === 'verified'"
                  class="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                >
                  <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
                  <span>{{ t('admin.users.kycOptions.verified') || 'Doğrulandı' }}</span>
                </span>
                <span
                  v-else-if="u.kycStatus === 'pending'"
                  class="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60"
                >
                  <Clock class="w-3.5 h-3.5 text-amber-600" />
                  <span>{{ t('admin.users.kycOptions.pending') || 'İncelemede' }}</span>
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500"
                >
                  <span>{{ t('admin.users.kycOptions.notStarted') || 'Başlatılmadı' }}</span>
                </span>
              </td>

              <!-- Balance -->
              <td class="py-3.5 px-4">
                <span class="font-extrabold text-gray-950 block text-xs sm:text-sm">
                  {{ u.balance.formatted }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-5 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    class="p-2 text-gray-600 hover:text-gray-950 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-black/[0.08] shadow-2xs"
                    :title="t('admin.users.viewProfile') || 'Detayları İncele'"
                    @click="handleViewDetail(u)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <button
                    class="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-xl transition-all border border-transparent hover:border-purple-200 shadow-2xs"
                    :title="t('admin.actions.changeRole') || 'Rol Düzenle'"
                    @click="handleOpenRole(u)"
                  >
                    <Shield class="w-4 h-4" />
                  </button>

                  <button
                    class="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200 shadow-2xs"
                    :title="t('admin.users.toggleBan') || 'Engelle / Durum Değiştir'"
                    @click="handleOpenBan(u)"
                  >
                    <Ban class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-4 border-t border-black/[0.06] flex items-center justify-between text-xs text-gray-500 bg-slate-50/50">
        <span class="font-medium">
          {{ t('admin.pagination.page', { current: adminStore.usersMeta.currentPage, last: adminStore.usersMeta.lastPage }) }}
        </span>
        <div class="flex gap-2">
          <button
            :disabled="adminStore.usersMeta.currentPage <= 1"
            class="px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white disabled:opacity-40 hover:bg-slate-100 font-bold flex items-center gap-1 text-gray-700 transition-colors shadow-2xs"
            @click="adminStore.fetchUsers(adminStore.usersMeta.currentPage - 1)"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
            <span>{{ t('admin.pagination.prev') || 'Geri' }}</span>
          </button>

          <button
            :disabled="adminStore.usersMeta.currentPage >= adminStore.usersMeta.lastPage"
            class="px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white disabled:opacity-40 hover:bg-slate-100 font-bold flex items-center gap-1 text-gray-700 transition-colors shadow-2xs"
            @click="adminStore.fetchUsers(adminStore.usersMeta.currentPage + 1)"
          >
            <span>{{ t('admin.pagination.next') || 'İleri' }}</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <UserDetailModal
      :user="targetUser"
      :is-open="showDetailModal"
      @close="showDetailModal = false"
      @ban="handleOpenBan"
      @change-role="handleOpenRole"
      @reset-password="handleResetPassword"
    />

    <BanUserModal
      :user="targetUser"
      :is-open="showBanModal"
      @close="showBanModal = false"
      @submit="handleBanSubmit"
    />

    <ChangeRoleModal
      :user="targetUser"
      :is-open="showRoleModal"
      @close="showRoleModal = false"
      @submit="handleRoleSubmit"
    />

    <!-- Global Toast Notification -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 bg-white border border-black/10 text-gray-900 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom duration-200"
    >
      <Check class="w-4 h-4 text-emerald-600" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>