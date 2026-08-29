<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { BaseComponentProps } from '@/types'
import { X } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'
import Button from './Button.vue'

interface Props extends BaseComponentProps {
  modelValue: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  hideFooter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closeOnOverlayClick: true,
  closeOnEscape: true,
  showCloseButton: true,
  hideFooter: false,
})

const { t } = useI18n()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  confirm: []
  cancel: []
}>()

const isVisible = ref(false)
const overlayRef = ref<HTMLDivElement | null>(null)
const contentRef = ref<HTMLDivElement | null>(null)

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw] max-h-[90vh]',
  }
  return sizes[props.size]
})

function open() {
  isVisible.value = true
  document.body.style.overflow = 'hidden'
}

function close() {
  isVisible.value = false
  document.body.style.overflow = ''
  emit('update:modelValue', false)
  emit('close')
}

function handleOverlayClick(event: MouseEvent) {
  if (props.closeOnOverlayClick && event.target === overlayRef.value) {
    close()
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (props.closeOnEscape && event.key === 'Escape') {
    close()
  }
}

function handleConfirm() {
  emit('confirm')
  close()
}

function handleCancel() {
  emit('cancel')
  close()
}

watch(() => props.modelValue, (val) => {
  if (val) open()
  else close()
}, { immediate: true })

onMounted(() => {
  if (isVisible.value) {
    document.body.style.overflow = 'hidden'
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Transition name="modal" appear>
    <Teleport to="body">
      <div v-if="modelValue" class="modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" ref="overlayRef" @click="handleOverlayClick" @keydown="handleKeyDown" tabindex="-1">
        <div
          :class="['modal-content w-full bg-white rounded-2xl shadow-2xl border border-black/10 max-h-[90vh] flex flex-col', sizeClasses]"
          ref="contentRef"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? 'modal-title' : undefined"
          :aria-describedby="description ? 'modal-description' : undefined"
        >
          <div class="flex items-start justify-between p-6 border-b border-black/[0.06]">
            <div>
              <h2 v-if="title" id="modal-title" class="text-xl font-semibold text-text-primary">{{ title }}</h2>
              <p v-if="description" id="modal-description" class="text-sm text-text-muted mt-1">{{ description }}</p>
            </div>

            <button
              v-if="showCloseButton"
              @click="close"
              class="p-2 text-text-muted hover:text-text-primary transition-colors rounded hover:bg-black/5"
              aria-label="Close modal"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="p-6 overflow-y-auto">
            <slot />
          </div>

          <div v-if="!hideFooter" class="flex items-center justify-end gap-3 p-6 border-t border-black/[0.06]">
            <slot name="footer">
              <Button variant="ghost" @click="handleCancel">{{ t('common.cancel') }}</Button>
              <Button variant="primary" @click="handleConfirm">{{ t('common.confirm') }}</Button>
            </slot>
          </div>
        </div>
      </div>
    </Teleport>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease-out;
}

.modal-enter-from {
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-content {
  transform: scale(0.95);
}

.modal-enter-to .modal-content,
.modal-leave-from .modal-content {
  transform: scale(1);
}
</style>