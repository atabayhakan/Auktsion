<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '@/composables/useI18n'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import { AlertTriangle } from 'lucide-vue-next'

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

function handleConfirm() {
  if (confirmationText.value !== 'DELETE' && confirmationText.value !== 'ӨЧҮРҮҮ' && confirmationText.value !== 'УДАЛИТЬ' && confirmationText.value !== 'SİL') return
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
    emit('confirm')
    emit('update:modelValue', false)
  }, 500)
}
</script>

<template>
  <Modal :modelValue="modelValue" @update:modelValue="emit('update:modelValue', $event)" :title="t('dashboard.deleteAccount')">
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

      <div class="flex justify-end gap-3 pt-4 border-t border-black/[0.06]">
        <Button variant="outline" @click="emit('update:modelValue', false)">
          {{ t('common.cancel') }}
        </Button>
        <Button variant="danger" :disabled="!confirmationText" :loading="isLoading" @click="handleConfirm">
          {{ t('dashboard.deleteAccount') }}
        </Button>
      </div>
    </div>
  </Modal>
</template>
