<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import { AlertTriangle } from 'lucide-vue-next'
import apiClient from '@/services/api'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'confirm'): void
}>()

const { t } = useI18n()

const confirmationText = ref('')
const isLoading = ref(false)
const error = ref('')

const isConfirmed = computed(() => {
  const normalized = confirmationText.value.trim().toUpperCase()
  return ['DELETE', 'ӨЧҮРҮҮ', 'УДАЛИТЬ', 'SİL'].includes(normalized)
})

async function handleConfirm() {
  if (!isConfirmed.value) return
  isLoading.value = true
  error.value = ''
  try {
    await apiClient.delete('/api/user/profile')
    emit('confirm')
    emit('update:modelValue', false)
    confirmationText.value = ''
  } catch (err: any) {
    error.value = err?.response?.data?.error || err?.data?.error || err?.message || 'Failed to delete account'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Modal :model-value="modelValue" :title="t('dashboard.deleteAccount')" @update:model-value="emit('update:modelValue', $event)">
    <div class="space-y-4">
      <div class="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300">
        <AlertTriangle class="w-6 h-6 flex-shrink-0" />
        <p class="text-sm">
          {{ t('dashboard.deleteAccountWarning') }}
        </p>
      </div>

      <p class="text-sm text-text-muted">
        {{ t('auth.confirmDeleteInstruction') || 'Type DELETE to confirm:' }}
      </p>

      <input
        v-model="confirmationText"
        type="text"
        placeholder="DELETE"
        class="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-base text-text-primary focus:outline-none focus:border-red-500 font-bold tracking-widest uppercase"
      />
      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

      <div class="flex justify-end gap-3 pt-4 border-t border-black/[0.06]">
        <Button variant="outline" @click="emit('update:modelValue', false)">
          {{ t('common.cancel') }}
        </Button>
        <Button variant="danger" :disabled="!isConfirmed" :loading="isLoading" @click="handleConfirm">
          {{ t('dashboard.deleteAccount') }}
        </Button>
      </div>
    </div>
  </Modal>
</template>
