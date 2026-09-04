<script setup lang="ts">
import { computed } from 'vue'
import type { BaseComponentProps } from '@/types'

interface Props extends BaseComponentProps {
  variant?: 'default' | 'glass' | 'gold' | 'hover' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hoverable?: boolean
  bordered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
  hoverable: false,
  bordered: false,
})

const paddingClasses = computed(() => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8',
  }
  return paddings[props.padding]
})

const variantClasses = computed(() => {
  const variants = {
    default: 'bg-white border border-border shadow-sm text-text-primary',
    glass: 'glass text-text-primary',
    gold: 'bg-primary/10 border border-primary/30 text-text-primary',
    hover: 'bg-white border border-border hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300 text-text-primary',
    elevated: 'bg-white shadow-md border border-border text-text-primary',
  }
  return variants[props.variant]
})

const borderClass = computed(() => props.bordered ? 'border border-border' : '')
const hoverClass = computed(() => props.hoverable ? 'hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300' : '')
</script>

<template>
  <div
    :class="[
      'rounded-2xl overflow-hidden transition-all duration-300',
      variantClasses,
      borderClass,
      hoverClass,
      paddingClasses,
      props.class
    ]"
  >
    <slot />
  </div>
</template>