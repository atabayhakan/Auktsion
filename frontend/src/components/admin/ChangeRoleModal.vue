<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, ShieldCheck } from 'lucide-vue-next'
import type { AdminUser, AdminUserDetail } from '@/types/admin'
import { useI18n } from '@/composables/useI18n'

const props = defineProps<{
  user: AdminUser | AdminUserDetail | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: { id: string; role: string }): void
}>()

const { t } = useI18n()
const targetRole = ref('buyer')

watch(() => props.user, (u) => {
  if (u) {
    targetRole.value = u.role
  }
})

function handleSubmit() {
  if (!props.user) return
  emit('submit', {
    id: props.user.id,
    role: targetRole.value
  })
}
</script>

<template>
  <div
    v-if="isOpen && user"
    class="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
  >
    <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-black/10 overflow-hidden animate-in zoom-in-95 duration-200">
      <div class="p-5 border-b border-black/[0.06] flex items-center justify-between bg-accent/50">
        <div class="flex items-center gap-2 text-primary font-bold">
          <ShieldCheck class="w-5 h-5" />
          <h3 class="text-base font-bold text-text-primary">{{ t('admin.users.role.title') }}</h3>
        </div>
        <button @click="emit('close')" class="text-text-muted hover:text-text-primary">
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-5 space-y-4 text-xs">
        <div class="flex items-center gap-3 p-3 rounded-xl bg-accent border border-border">
          <img
            :src="user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'"
            class="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div class="font-bold text-text-primary text-sm">{{ user.fullName }}</div>
            <div class="text-text-muted">{{ t('admin.users.role.currentRole') }} <span class="font-bold uppercase text-primary">{{ user.role }}</span></div>
          </div>
        </div>

        <div>
          <label class="block font-semibold text-text-secondary mb-1.5">{{ t('admin.users.role.selectNewRole') }}</label>
          <select
            v-model="targetRole"
            class="w-full px-3 py-2 text-xs bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-primary"
          >
            <option value="buyer">{{ t('admin.users.role.buyerOption') }}</option>
            <option value="seller">{{ t('admin.users.role.sellerOption') }}</option>
            <option value="moderator">{{ t('admin.users.role.moderatorOption') }}</option>
            <option value="admin">{{ t('admin.users.role.adminOption') }}</option>
          </select>
        </div>

        <div class="p-3 bg-warning/10 rounded-xl border border-warning/30 text-amber-800 text-[11px]">
          {{ t('admin.users.role.warningText') }}
        </div>

        <div class="pt-3 border-t border-black/[0.06] flex justify-end gap-2">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 rounded-lg bg-black/5 text-text-secondary font-semibold hover:bg-black/10 transition-colors"
          >
            {{ t('admin.actions.cancel') }}
          </button>
          <button
            type="submit"
            class="px-4 py-2 rounded-lg font-semibold text-text-primary bg-primary hover:bg-primary-hover transition-colors"
          >
            {{ t('admin.users.role.saveApply') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
