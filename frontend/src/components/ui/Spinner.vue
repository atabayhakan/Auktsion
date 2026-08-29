<script setup lang="ts">
import { computed } from 'vue'
import type { BaseComponentProps } from '@/types'

interface Props extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'gold' | 'dots' | 'pulse'
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  label: '',
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }
  return sizes[props.size]
})

const variantClasses = computed(() => {
  const variants = {
    default: 'border-4 border-primary border-t-transparent animate-spin',
    gold: 'border-4 border-primary border-t-transparent animate-spin',
    dots: 'flex items-center justify-center gap-1',
    pulse: 'animate-pulse rounded-full',
  }
  return variants[props.variant]
})
</script>

<template>
  <div 
    :class="['inline-flex items-center justify-center', sizeClasses, props.class]"
    role="status"
    :aria-label="label || 'Loading...'"
    :aria-busy="true"
  >
    <!-- Default / Gold spinner -->
    <div
v-if="variant !== 'dots' && variant !== 'pulse'" 
         :class="['rounded-full', variantClasses]" 
         aria-hidden="true">
    </div>
    
    <!-- Dots spinner -->
    <div v-else-if="variant === 'dots'" class="flex items-center justify-center gap-1" aria-hidden="true">
      <span
v-for="i in 3" :key="i"
        class="w-2 h-2 rounded-full bg-primary animate-bounce"
        :style="{ animationDelay: `${i * 150}ms` }"
        aria-hidden="true"
      />
    </div>

    <!-- Pulse spinner -->
    <div
v-else-if="variant === 'pulse'"
         :class="['rounded-full bg-primary', sizeClasses, variantClasses]"
         aria-hidden="true"
    />
    
    <span v-if="label" class="sr-only">{{ label }}</span>
  </div>
</template>