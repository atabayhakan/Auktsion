<script setup lang="ts">
import { computed } from 'vue'
import type { BaseComponentProps } from '@/types'

interface TabItem {
  id: string
  label: string
  icon?: any
  disabled?: boolean
  badge?: string | number
}

interface Props extends BaseComponentProps {
  modelValue: string
  tabs: TabItem[]
  variant?: 'default' | 'pills' | 'underline' | 'gold'
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  fullWidth: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const variantClasses = computed(() => {
  const variants = {
    default: 'glass p-1 rounded-xl',
    pills: 'bg-transparent',
    underline: 'bg-transparent border-b border-border',
    gold: 'bg-primary/10 p-1 rounded-xl border border-primary/20',
  }
  return variants[props.variant]
})

const tabClasses = computed(() => {
  const base = 'relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    default: 'text-gray-400 hover:text-gray-900 hover:bg-black/5',
    pills: 'text-gray-400 hover:text-gray-900 hover:bg-black/5',
    underline: 'text-gray-400 hover:text-gray-900 border-b-2 border-transparent',
    gold: 'text-gray-400 hover:text-gray-900 hover:bg-primary/10',
  }

  const activeVariants = {
    default: 'bg-primary text-text-primary shadow-md',
    pills: 'bg-primary text-text-primary shadow-md',
    underline: 'text-primary border-b-2 border-primary',
    gold: 'bg-primary text-text-primary shadow-md',
  }

  return { base, ...variants, active: activeVariants[props.variant] }
})

function handleTabClick(tabId: string) {
  if (!props.tabs.find(t => t.id === tabId)?.disabled) {
    emit('update:modelValue', tabId)
  }
}
</script>

<template>
  <div 
    :class="[variantClasses, { 'flex': !fullWidth, 'w-full': fullWidth }, props.class]"
    role="tablist"
    aria-label="Tabs"
  >
    <template v-for="tab in tabs" :key="tab.id">
      <button
        :class="[
          tabClasses.base,
          modelValue === tab.id ? tabClasses.active : tabClasses[props.variant],
          tab.disabled && 'opacity-50 cursor-not-allowed',
        ]"
        :aria-selected="modelValue === tab.id"
        :aria-controls="`tabpanel-${tab.id}`"
        :id="`tab-${tab.id}`"
        :disabled="tab.disabled"
        role="tab"
        tabindex="0"
        @click="handleTabClick(tab.id)"
        @keydown.enter="handleTabClick(tab.id)"
        @keydown.space.prevent="handleTabClick(tab.id)"
      >
        <span class="flex items-center gap-2">
          <component v-if="tab.icon" :is="tab.icon" class="w-4 h-4" aria-hidden="true" />
          {{ tab.label }}
          <span v-if="tab.badge !== undefined"
            class="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary-container text-onPrimaryContainer"
          >
            {{ tab.badge }}
          </span>
        </span>

        <!-- Underline indicator -->
        <span
          v-if="props.variant === 'underline' && modelValue === tab.id"
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-scale-in origin-center"
          aria-hidden="true"
        />
      </button>
    </template>
  </div>
</template>