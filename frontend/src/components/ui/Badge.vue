<script setup lang="ts">
import { computed } from 'vue'
import type { BaseComponentProps } from '@/types'

interface Props extends BaseComponentProps {
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'gray'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  removable?: boolean
  onRemove?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  dot: false,
  removable: false,
})

const emit = defineEmits<{
  remove: []
}>()

const variantClasses = computed(() => {
  const variants = {
    default: 'bg-black/5 text-text-secondary border border-black/10',
    gold: 'bg-primary/15 text-primary border border-primary/30',
    success: 'bg-success/15 text-success border border-success/30',
    warning: 'bg-warning/15 text-amber-700 border border-warning/40',
    danger: 'bg-error/10 text-error border border-error/30',
    info: 'bg-secondary/15 text-secondary border border-secondary/30',
    gray: 'bg-black/5 text-text-muted border border-black/10',
  }
  return variants[props.variant]
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  }
  return sizes[props.size]
})

function handleRemove() {
  if (props.removable) {
    emit('remove')
  }
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center font-medium rounded-full transition-colors',
      variantClasses,
      sizeClasses,
      props.class
    ]"
  >
    <span v-if="props.dot" class="w-1.5 h-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
    <slot />
    <button
      v-if="removable"
      class="ml-1 p-0.5 rounded-full hover:bg-black/10 transition-colors"
      aria-label="Remove"
      @click="handleRemove"
    >
      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
      </svg>
    </button>
  </span>
</template>