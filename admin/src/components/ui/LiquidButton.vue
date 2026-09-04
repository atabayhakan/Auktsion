<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'glass' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
  icon?: any
  iconRight?: any
  tag?: 'button' | 'a'
  to?: string
  target?: string
  ripple?: boolean
  glass?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  fullWidth: false,
  type: 'button',
  ripple: true,
  glass: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isHovered = ref(false)
const isFocused = ref(false)
const ripplePosition = ref<{ x: number; y: number } | null>(null)

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-2 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-2.5',
  }
  return sizes[props.size]
})

const variantClasses = computed(() => {
  const variants = {
    primary: 'btn-liquid-primary',
    secondary: 'btn-liquid-secondary',
    glass: 'btn-liquid-glass',
    outline: 'btn-liquid-outline',
    ghost: 'btn-liquid-ghost',
  }
  return variants[props.variant]
})

const glassClass = computed(() => props.glass ? 'glass' : '')

function handleClick(event: MouseEvent) {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  
  if (props.ripple && !props.loading) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    ripplePosition.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    setTimeout(() => {
      ripplePosition.value = null
    }, 600)
  }
  
  emit('click', event)
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    if (props.tag === 'a') return
    event.preventDefault()
    handleClick(event as unknown as MouseEvent)
  }
}
</script>

<template>
  <component
    :is="props.tag === 'a' && props.to ? 'router-link' : 'button'"
    :to="props.to"
    :target="props.target"
    :type="props.tag === 'button' ? props.type : undefined"
    :class="[
      'inline-flex items-center justify-center font-medium transition-all duration-300 ease-out',
      'rounded-[0.625rem]',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
      'hover:scale-[1.02] active:scale-[0.98]',
      'relative overflow-hidden',
      sizeClasses,
      variantClasses,
      glassClass,
      props.fullWidth ? 'w-full' : '',
      props.loading ? 'cursor-wait' : 'cursor-pointer',
    ]"
    :disabled="props.disabled || props.loading"
    @click="handleClick"
    @keydown="handleKeyDown"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @focus="isFocused = true"
    @blur="isFocused = false"
  >
    <!-- Ripple Effect -->
    <span
      v-if="ripplePosition"
      :style="{
        left: ripplePosition.x + 'px',
        top: ripplePosition.y + 'px',
      }"
      class="absolute w-1 h-1 rounded-full bg-current opacity-30 animate-ripple pointer-events-none"
    />

    <!-- Loading Spinner -->
    <span v-if="props.loading" class="flex items-center justify-center">
      <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </span>

    <!-- Icon Left -->
    <span v-if="props.icon && !props.loading" class="flex-shrink-0" aria-hidden="true">
      <component :is="props.icon" :class="['w-5 h-5', { 'w-4 h-4': props.size === 'sm', 'w-6 h-6': props.size === 'xl' }]" />
    </span>

    <!-- Content -->
    <span class="relative z-10">
      <slot />
    </span>

    <!-- Icon Right -->
    <span v-if="props.iconRight && !props.loading" class="flex-shrink-0" aria-hidden="true">
      <component :is="props.iconRight" :class="['w-5 h-5', { 'w-4 h-4': props.size === 'sm', 'w-6 h-6': props.size === 'xl' }]" />
    </span>

    <!-- Shimmer overlay on hover -->
    <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none" />
  </component>
</template>

<style scoped>
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 0.5;
  }
  100% {
    transform: scale(50);
    opacity: 0;
  }
}

.animate-ripple {
  animation: ripple 0.6s ease-out forwards;
}
</style>