<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
  Shield
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

onMounted(async () => {
  await adminStore.fetchUsers()
})

function showToast(msg: string) {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3500)
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
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2.5">
          <Users class="w-6 h-6 text-primary" />
          <span>{{ t('admin.users.title') }}</span>
        </h1>
        <p class="text-xs text-text-muted mt-1">
          {{ t('admin.users.subtitle') }}
        </p>
      </div>

      <div class="text-xs font-semibold text-text-muted bg-white px-3 py-1.5 rounded-lg border border-border shadow-xs">
        {{ t('admin.users.total', { count: adminStore.usersMeta.total }) }}
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="bg-white border border-border rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
      <!-- Search -->
      <div class="relative">
        <Search class="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          v-model="adminStore.userFilters.search"
          @input="onFilterChange"
          type="text"
          :placeholder="t('admin.users.searchPlaceholder')"
          class="w-full pl-9 pr-3 py-2 bg-accent border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 text-base text-text-primary"
        />
      </div>

      <!-- Role Filter -->
      <div>
        <select
          v-model="adminStore.userFilters.role"
          @change="onFilterChange"
          :aria-label="t('admin.users.roleFilter')"
          class="w-full px-3 py-2 bg-accent border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 text-text-primary font-medium"
        >
          <option value="all">{{ t('admin.users.roleOptions.all') }}</option>
          <option value="buyer">{{ t('admin.users.roleOptions.buyer') }}</option>
          <option value="seller">{{ t('admin.users.roleOptions.seller') }}</option>
          <option value="moderator">{{ t('admin.users.roleOptions.moderator') }}</option>
          <option value="admin">{{ t('admin.users.roleOptions.admin') }}</option>
        </select>
      </div>

      <!-- Status Filter -->
      <div>
        <select
          v-model="adminStore.userFilters.status"
          @change="onFilterChange"
          :aria-label="t('admin.users.statusFilter')"
          class="w-full px-3 py-2 bg-accent border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 text-text-primary font-medium"
        >
          <option value="all">{{ t('admin.users.statusOptions.all') }}</option>
          <option value="active">{{ t('admin.users.statusOptions.active') }}</option>
          <option value="suspended">{{ t('admin.users.statusOptions.suspended') }}</option>
          <option value="banned">{{ t('admin.users.statusOptions.banned') }}</option>
        </select>
      </div>

      <!-- KYC Status Filter -->
      <div>
        <select
          v-model="adminStore.userFilters.kycStatus"
          @change="onFilterChange"
          :aria-label="t('admin.users.kycFilter')"
          class="w-full px-3 py-2 bg-accent border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 text-text-primary font-medium"
        >
          <option value="all">{{ t('admin.users.kycOptions.all') }}</option>
          <option value="verified">{{ t('admin.users.kycOptions.verified') }}</option>
          <option value="pending">{{ t('admin.users.kycOptions.pending') }}</option>
          <option value="not_started">{{ t('admin.users.kycOptions.notStarted') }}</option>
          <option value="rejected">{{ t('admin.users.kycOptions.rejected') }}</option>
        </select>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white border border-border rounded-2xl overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-accent/80 text-text-muted font-bold uppercase tracking-wider border-b border-border text-[11px]">
            <tr>
              <th class="p-4">{{ t('admin.users.table.user') }}</th>
              <th class="p-4">{{ t('admin.users.table.innContacts') }}</th>
              <th class="p-4">{{ t('admin.users.table.role') }}</th>
              <th class="p-4">{{ t('admin.users.table.status') }}</th>
              <th class="p-4">{{ t('admin.users.table.kycStatus') }}</th>
              <th class="p-4">{{ t('admin.users.table.balance') }}</th>
              <th class="p-4 text-right">{{ t('admin.users.table.actions') }}</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-border">
            <tr
              v-for="u in adminStore.users"
              :key="u.id"
              class="hover:bg-accent/60 transition-colors"
            >
              <!-- User profile -->
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <img
                    :src="u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'"
                    class="w-10 h-10 rounded-full object-cover ring-1 ring-border shrink-0"
                  />
                  <div>
                    <span class="font-bold text-text-primary block text-sm">{{ u.fullName }}</span>
                    <span class="text-text-muted text-[11px]">{{ u.email }} • ID: {{ u.id }}</span>
                  </div>
                </div>
              </td>

              <!-- INN & Phone -->
              <td class="p-4">
                <span class="font-mono font-semibold text-text-secondary block">{{ u.inn }}</span>
                <span class="text-text-muted text-[11px]">{{ u.phone }}</span>
              </td>

              <!-- Role -->
              <td class="p-4">
                <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                  {{ u.role }}
                </span>
              </td>

              <!-- Account Status -->
              <td class="p-4">
                <span
                  :class="[
                    'text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize',
                    u.status === 'active' ? 'bg-success/15 text-success border border-success/30' : '',
                    u.status === 'suspended' ? 'bg-warning/15 text-amber-700 border border-warning/40' : '',
                    u.status === 'banned' ? 'bg-error/10 text-error border border-error/30' : ''
                  ]"
                >
                  {{ u.status === 'active' ? t('admin.users.statusOptions.active') : (u.status === 'suspended' ? t('admin.users.statusOptions.suspended') : t('admin.users.statusOptions.banned')) }}
                </span>
              </td>

              <!-- KYC Status -->
              <td class="p-4">
                <span
                  :class="[
                    'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-max',
                    u.kycStatus === 'verified' ? 'bg-success/15 text-success' : 'bg-black/5 text-text-secondary'
                  ]"
                >
                  <ShieldCheck v-if="u.kycStatus === 'verified'" class="w-3 h-3 text-success" />
                  <span class="capitalize">{{ u.kycStatus }}</span>
                </span>
              </td>

              <!-- Balance -->
              <td class="p-4">
                <span class="font-bold text-text-primary block">{{ u.balance.formatted }}</span>
              </td>

              <!-- Actions -->
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    @click="handleViewDetail(u)"
                    class="p-1.5 text-text-secondary hover:bg-accent rounded-lg transition-colors"
                    :title="t('admin.users.viewProfile')"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <button
                    @click="handleOpenRole(u)"
                    class="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    :title="t('admin.actions.changeRole')"
                  >
                    <ShieldCheck class="w-4 h-4" />
                  </button>

                  <button
                    @click="handleOpenBan(u)"
                    class="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors"
                    :title="t('admin.users.toggleBan')"
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
      <div class="p-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
        <span>{{ t('admin.pagination.page', { current: adminStore.usersMeta.currentPage, last: adminStore.usersMeta.lastPage }) }}</span>
        <div class="flex gap-2">
          <button
            :disabled="adminStore.usersMeta.currentPage <= 1"
            @click="adminStore.fetchUsers(adminStore.usersMeta.currentPage - 1)"
            class="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-accent font-medium flex items-center gap-1"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
            <span>{{ t('admin.pagination.prev') }}</span>
          </button>

          <button
            :disabled="adminStore.usersMeta.currentPage >= adminStore.usersMeta.lastPage"
            @click="adminStore.fetchUsers(adminStore.usersMeta.currentPage + 1)"
            class="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-accent font-medium flex items-center gap-1"
          >
            <span>{{ t('admin.pagination.next') }}</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <UserDetailModal
      :is-open="showDetailModal"
      :user="adminStore.selectedUser"
      @close="showDetailModal = false"
      @ban="handleOpenBan"
      @change-role="handleOpenRole"
      @reset-password="handleResetPassword"
    />

    <BanUserModal
      :is-open="showBanModal"
      :user="targetUser"
      @close="showBanModal = false"
      @submit="handleBanSubmit"
    />

    <ChangeRoleModal
      :is-open="showRoleModal"
      :user="targetUser"
      @close="showRoleModal = false"
      @submit="handleRoleSubmit"
    />

    <!-- Global Toast Notification -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 bg-white text-text-primary px-4 py-3 rounded-xl shadow-xl border border-border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200"
    >
      <ShieldCheck class="w-4 h-4 text-success" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
