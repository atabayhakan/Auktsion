<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '@/composables/useI18n'
import Modal from '@/components/ui/Modal.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'success'): void
}>()

const { t } = useI18n()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const error = ref('')

function handleSubmit() {
  if (newPassword.value !== confirmPassword.value) {
    error.value = t('auth.passwordsDoNotMatch')
    return
  }
  if (newPassword.value.length < 8) {
    error.value = t('auth.passwordLengthError')
    return
  }
  error.value = ''
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
    emit('success')
    emit('update:modelValue', false)
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  }, 500)
}
</script>

<template>
  <Modal :model-value="modelValue" :title="t('auth.changePassword')" @update:model-value="emit('update:modelValue', $event)">
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div v-if="error" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
        {{ error }}
      </div>

      <Input
        v-model="currentPassword"
        type="password"
        :label="t('auth.currentPassword')"
        placeholder="••••••••"
        required
      />

      <Input
        v-model="newPassword"
        type="password"
        :label="t('auth.newPassword')"
        placeholder="••••••••"
        required
      />

      <Input
        v-model="confirmPassword"
        type="password"
        :label="t('auth.confirmPassword')"
        placeholder="••••••••"
        required
      />

      <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button variant="outline" type="button" @click="emit('update:modelValue', false)">
          {{ t('common.cancel') }}
        </Button>
        <Button variant="primary" type="submit" :loading="isLoading">
          {{ t('common.save') }}
        </Button>
      </div>
    </form>
  </Modal>
</template>
