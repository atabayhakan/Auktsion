<script setup lang="ts">
import { Building2, CheckCircle, MoreVertical, Trash2, Star } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'

interface PayoutMethod {
  id: string
  bankName: string
  accountNumber: string
  isVerified: boolean
  isDefault: boolean
}

defineProps<{
  method: PayoutMethod
}>()

const emit = defineEmits<{
  (e: 'set-default', id: string): void
  (e: 'delete', id: string): void
}>()

const { t } = useI18n()
</script>

<template>
  <Card variant="glass" class="p-4 flex items-center justify-between hover:border-primary/30 transition-all">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
        <Building2 class="w-6 h-6" />
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h4 class="text-text-primary font-medium">{{ method.bankName }}</h4>
          <Badge v-if="method.isDefault" variant="gold">{{ t('common.default') }}</Badge>
          <Badge v-if="method.isVerified" variant="success">{{ t('status.kyc.verified') }}</Badge>
        </div>
        <p class="text-text-muted text-sm font-mono mt-0.5">{{ method.accountNumber }}</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <Button v-if="!method.isDefault" variant="ghost" size="sm" @click="emit('set-default', method.id)">
        {{ t('dashboard.makeDefault') }}
      </Button>
      <Button variant="ghost" size="sm" class="text-red-400 hover:text-red-300" @click="emit('delete', method.id)">
        <Trash2 class="w-4 h-4" />
      </Button>
    </div>
  </Card>
</template>
