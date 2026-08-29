<script setup lang="ts">
import { computed } from 'vue'
import type { BaseComponentProps } from '@/types'

interface Step {
  id: string
  label: string
  description?: string
  icon?: any
  disabled?: boolean
}

interface Props extends BaseComponentProps {
  modelValue: number
  steps: Step[]
  variant?: 'default' | 'vertical' | 'compact'
  showDescriptions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  showDescriptions: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  stepClick: [step: number]
}>()

const isVertical = computed(() => props.variant === 'vertical')
const isCompact = computed(() => props.variant === 'compact')

function getStepStatus(index: number) {
  if (index < props.modelValue) return 'completed'
  if (index === props.modelValue) return 'active'
  return 'pending'
}

function getStepClasses(index: number) {
  const status = getStepStatus(index)
  const base = 'relative z-10 flex items-center justify-center font-bold transition-all duration-300'
  
  const sizes = {
    default: 'w-8 h-8 text-sm',
    vertical: 'w-10 h-10 text-base',
    compact: 'w-6 h-6 text-xs',
  }
  
  const statusClasses = {
    completed: 'bg-primary text-text-primary',
    active: 'bg-primary text-text-primary shadow-md ring-4 ring-primary/20',
    pending: 'bg-gray-100 text-gray-500 border-2 border-border',
  }
  
  return [base, sizes[props.variant], statusClasses[status]].join(' ')
}

function getLineClasses(index: number) {
  if (index === props.steps.length - 1) return ''
  
  const status = getStepStatus(index + 1)
  const lineStatus = index < props.modelValue ? 'completed' : 'pending'
  
  const base = isVertical.value 
    ? 'absolute left-5 top-10 bottom-10 w-0.5' 
    : 'absolute top-4 left-8 right-8 h-0.5'
  
  const statusClasses = {
    completed: 'bg-primary',
    pending: 'bg-border',
  }
  
  return [base, statusClasses[lineStatus]].join(' ')
}

function handleStepClick(stepIndex: number) {
  if (!props.steps[stepIndex]?.disabled) {
    emit('update:modelValue', stepIndex)
    emit('stepClick', stepIndex)
  }
}
</script>

<template>
  <div 
    :class="[
      'relative',
      { 'flex': !isVertical, 'flex-col': isVertical },
      props.class
    ]"
    role="navigation"
    aria-label="Steps"
  >
    <!-- Connector line -->
    <template v-if="!isCompact && steps.length > 1">
      <div 
        v-for="index in steps.length - 1" 
        :key="`line-${index}`"
        :class="getLineClasses(index)"
        aria-hidden="true"
      />
    </template>

    <!-- Steps -->
    <div 
      :class="[
        'flex',
        { 'flex-col gap-6': isVertical, 'items-center': !isVertical },
        { 'w-full': isVertical }
      ]"
    >
      <template v-for="(step, index) in steps" :key="step.id">
        <button
          :class="[
            'relative flex items-center',
            { 'flex-col items-start gap-3': isVertical, 'flex-1': !isVertical && !isVertical },
          ]"
          :disabled="step.disabled"
          @click="() => handleStepClick(index)"
          @keydown.enter="() => handleStepClick(index)"
          @keydown.space.prevent="() => handleStepClick(index)"
          :aria-current="index === modelValue ? 'step' : undefined"
          :aria-disabled="step.disabled"
        >
          <!-- Step circle -->
          <div 
            :class="getStepClasses(index)"
            aria-hidden="true"
          >
            <span v-if="getStepStatus(index) === 'completed'" class="flex items-center justify-center">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </span>
            <span v-else-if="getStepStatus(index) === 'active'">{{ index + 1 }}</span>
            <span v-else>{{ index + 1 }}</span>
          </div>

          <!-- Step label & description -->
          <div v-if="!isCompact" :class="[isVertical ? 'flex-1' : 'flex flex-col items-center gap-1']">
            <span
              class="font-medium text-sm"
              :class="getStepStatus(index) === 'active' ? 'text-primary' : getStepStatus(index) === 'pending' ? 'text-gray-400' : 'text-text-primary'"
            >
              {{ step.label }}
            </span>
            <span v-if="props.showDescriptions && step.description" class="text-xs text-gray-500">
              {{ step.description }}
            </span>
          </div>
        </button>
      </template>
    </div>
  </div>
</template>