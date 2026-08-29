<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Ban, AlertTriangle, ShieldCheck } from 'lucide-vue-next'
import type { AdminUser, AdminUserDetail } from '@/types/admin'
import { useI18n } from '@/composables/useI18n'

const props = defineProps<{
  user: AdminUser | AdminUserDetail | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: { id: string; status: 'active' | 'suspended' | 'banned'; reason: string }): void
}>()

const { t } = useI18n()
const targetStatus = ref<'active' | 'suspended' | 'banned'>('banned')
const reason = ref('')
const cancelBids = ref(true)

watch(() => props.user, (u) => {
  if (u) {
    targetStatus.value = u.status === 'banned' ? 'active' : 'banned'
    reason.value = u.banReason || ''
  }
})

function handleSubmit() {
  if (!props.user) return
  emit('submit', {
    id: props.user.id,
    status: targetStatus.value,
    reason: reason.value
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
        <div class="flex items-center gap-2 text-error font-bold">
          <Ban class="w-5 h-5" />
          <h3 class="text-base font-bold text-text-primary">
            {{ targetStatus === 'active' ? t('admin.actions.unban') : t('admin.users.ban.banOrSuspend') }}
          </h3>
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
            <div class="text-text-muted">{{ user.email }} • ИНН: {{ user.inn }}</div>
          </div>
        </div>

        <div>
          <label class="block font-semibold text-text-secondary mb-1.5">{{ t('admin.users.ban.actionType') }}</label>
          <select
            v-model="targetStatus"
            class="w-full px-3 py-2 text-xs bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-error/20 text-text-primary"
          >
            <option value="banned">{{ t('admin.users.ban.banFull') }}</option>
            <option value="suspended">{{ t('admin.users.ban.suspendTemp') }}</option>
            <option value="active">{{ t('admin.users.ban.activateUnban') }}</option>
          </select>
        </div>

        <div v-if="targetStatus !== 'active'">
          <label class="block font-semibold text-text-secondary mb-1.5">{{ t('admin.users.ban.banReason') }}</label>
          <textarea
            v-model="reason"
            rows="3"
            required
            :placeholder="t('admin.users.ban.banReasonPlaceholder')"
            class="w-full px-3 py-2 text-xs bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-error/20 text-text-primary"
          ></textarea>
        </div>

        <div v-if="targetStatus === 'banned'" class="flex items-center gap-2">
          <input
            type="checkbox"
            id="cancel-bids"
            v-model="cancelBids"
            class="rounded border-border text-error focus:ring-error"
          />
          <label for="cancel-bids" class="text-text-secondary font-medium">
            {{ t('admin.users.ban.autoCancelBids') }}
          </label>
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
            :class="[
              'px-4 py-2 rounded-lg font-semibold border transition-colors',
              targetStatus === 'active' ? 'bg-success/10 text-success border-success/30 hover:bg-success/15' : 'bg-error/10 text-error border-error/30 hover:bg-error/15'
            ]"
          >
            {{ targetStatus === 'active' ? t('admin.actions.unban') : t('admin.users.ban.confirmSave') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
