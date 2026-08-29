<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '@/composables/useI18n'
import Modal from '@/components/ui/Modal.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import { Building2, CreditCard } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'success'): void
}>()

const { t } = useI18n()

const bank = ref('MBank')
const accountNumber = ref('')
const accountHolder = ref('')
const isLoading = ref(false)

const banks = [
  { id: 'MBank', name: 'MBank (КБ Кыргызстан)' },
  { id: 'Optima Bank', name: 'Optima Bank' },
  { id: 'DemirBank', name: 'DemirBank' },
  { id: 'Bakai Bank', name: 'Bakai Bank' },
  { id: 'KICB', name: 'KICB' },
]

function handleSubmit() {
  if (!accountNumber.value) return
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
    emit('success')
    emit('update:modelValue', false)
    accountNumber.value = ''
    accountHolder.value = ''
  }, 600)
}
</script>

<template>
  <Modal :modelValue="modelValue" @update:modelValue="emit('update:modelValue', $event)" :title="t('dashboard.addPayoutMethod')">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-text-secondary mb-1.5">{{ t('payoutModal.selectBank') }}</label>
        <select v-model="bank" class="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-secondary">
          <option v-for="b in banks" :key="b.id" :value="b.id">{{ b.name }}</option>
        </select>
      </div>

      <Input
        v-model="accountNumber"
        :label="t('payoutModal.accountNumber')"
        placeholder="1180 0000 0000 0000"
        required
      />

      <Input
        v-model="accountHolder"
        :label="t('payoutModal.accountHolder')"
        placeholder="Azamat Bakirov"
        required
      />

      <div class="flex justify-end gap-3 pt-4 border-t border-black/[0.06]">
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
