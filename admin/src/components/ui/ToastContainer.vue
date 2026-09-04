<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-vue-next'
import type { BaseComponentProps, Toast } from '@/types'
import { useUIStore } from '@/stores/ui'

interface Props extends BaseComponentProps {}

const props = withDefaults(defineProps<Props>(), {})

const uiStore = useUIStore()

const toasts = computed(() => uiStore.toasts)

const visibleToasts = computed(() => toasts.value.slice(0, 5))

function getToastClasses(toast: Toast) {
  const base = 'relative flex items-start gap-3.5 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border animate-slide-in-right w-full sm:min-w-[340px] sm:max-w-md sm:w-auto overflow-hidden'
  const variants = {
    success: 'bg-gray-950/95 border-emerald-500/40 text-white shadow-emerald-950/20',
    error: 'bg-gray-950/95 border-red-500/40 text-white shadow-red-950/20',
    warning: 'bg-gray-950/95 border-amber-500/40 text-white shadow-amber-950/20',
    info: 'bg-gray-950/95 border-blue-500/40 text-white shadow-blue-950/20',
  }
  return [base, variants[toast.type] || variants.info, toast.class || ''].filter(Boolean).join(' ')
}

function getIcon(toast: Toast) {
  switch (toast.type) {
    case 'success':
      return CheckCircle
    case 'error':
      return AlertCircle
    case 'warning':
      return AlertTriangle
    default:
      return Info
  }
}

function removeToast(id: string) {
  uiStore.removeToast(id)
}
</script>

<template>
  <Teleport to="body">
    <div 
      class="fixed bottom-6 left-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none sm:left-auto sm:right-6 lg:bottom-8 lg:right-8"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      <TransitionGroup name="toast" tag="div" class="flex flex-col gap-3">
        <div
          v-for="toast in visibleToasts"
          :key="toast.id"
          :class="getToastClasses(toast)"
          class="pointer-events-auto"
        >
          <component
            :is="getIcon(toast)"
            class="w-5 h-5 flex-shrink-0 mt-0.5"
            :class="{
              'text-emerald-400': toast.type === 'success',
              'text-red-400': toast.type === 'error',
              'text-amber-400': toast.type === 'warning',
              'text-blue-400': !toast.type || toast.type === 'info'
            }"
          />

          <div class="flex-1 min-w-0">
            <p v-if="toast.title" class="font-bold text-white text-sm leading-snug">{{ toast.title }}</p>
            <p v-if="toast.message" class="text-xs text-gray-300 mt-1 leading-relaxed">{{ toast.message }}</p>
          </div>
          
          <button
            class="p-1 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10 flex-shrink-0 cursor-pointer"
            aria-label="Close notification"
            @click="removeToast(toast.id)"
          >
            <X class="w-4 h-4" />
          </button>
          
          <!-- Progress bar for auto-dismiss -->
          <div 
            v-if="toast.duration && toast.duration > 0"
            class="absolute bottom-0 left-0 h-0.5"
            :class="{
              'bg-emerald-500': toast.type === 'success',
              'bg-red-500': toast.type === 'error',
              'bg-amber-500': toast.type === 'warning',
              'bg-blue-500': !toast.type || toast.type === 'info'
            }"
            :style="{
              width: '100%',
              animation: `toast-progress ${toast.duration}ms linear forwards`
            }"
          />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease-out;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease-out;
}
</style>