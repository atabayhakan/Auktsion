<script setup lang="ts">
import { computed } from 'vue'
import type { BaseComponentProps } from '@/types'
import { resolveIcon } from '@/utils/iconMap'

interface Props extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  icon?: string
  iconRight?: string
  type?: 'button' | 'submit' | 'reset'
  asChild?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  fullWidth: false,
  type: 'button',
  asChild: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const classes = computed(() => {
  const base = 'inline-flex items-center justify-center gap-2 rounded font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-primary text-text-primary hover:bg-primary-hover shadow-md hover:shadow-lg focus:ring-primary active:scale-[0.98]',
    secondary: 'bg-secondary text-white hover:bg-secondary-hover shadow-md hover:shadow-lg focus:ring-secondary active:scale-[0.98]',
    outline: 'bg-transparent border-2 border-secondary text-secondary hover:bg-secondary/10 focus:ring-secondary',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-black/5 focus:ring-black/10',
    danger: 'bg-error/10 text-error border border-error/30 hover:bg-error/15 focus:ring-error',
    success: 'bg-success/10 text-success border border-success/30 hover:bg-success/15 focus:ring-success',
  }

  const sizes = {
    sm: 'px-4 py-2.5 min-h-[44px] text-sm',
    md: 'px-6 py-3 min-h-[44px] text-base',
    lg: 'px-8 py-4 min-h-[48px] text-lg',
    xl: 'px-10 py-5 min-h-[52px] text-xl',
    icon: 'p-3 min-w-[44px] min-h-[44px]',
  }

  const width = props.fullWidth ? 'w-full' : ''
  const loading = props.loading ? 'relative text-transparent' : ''

  return [base, variants[props.variant], sizes[props.size], width, loading, props.class || ''].filter(Boolean).join(' ')
})

const iconComponent = computed(() => resolveIcon(props.icon))
const iconRightComponent = computed(() => resolveIcon(props.iconRight))

function handleClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :class="classes"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    :aria-disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <svg class="w-5 h-5 animate-spin text-current" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </span>
    
    <span v-if="iconComponent && !loading" class="flex-shrink-0" aria-hidden="true">
      <component :is="iconComponent" class="w-5 h-5" />
    </span>

    <span v-if="!loading" class="flex items-center gap-2">
      <slot />
    </span>

    <span v-if="iconRightComponent && !loading" class="flex-shrink-0" aria-hidden="true">
      <component :is="iconRightComponent" class="w-5 h-5" />
    </span>
  </button>
</template>