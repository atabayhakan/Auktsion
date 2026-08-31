<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
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

function handleStepClick(stepIndex: number) {
  if (!props.steps[stepIndex]?.disabled) {
    emit('update:modelValue', stepIndex)
    emit('stepClick', stepIndex)
  }
}
</script>

<template>
  <!-- Vertical Layout -->
  <div v-if="isVertical" :class="['space-y-0 relative', props.class]" role="navigation" aria-label="Steps">
    <div 
      v-for="(step, index) in steps" 
      :key="step.id" 
      class="relative flex items-start gap-4 pb-6 last:pb-0 group"
    >
      <!-- Connecting line for vertical -->
      <div 
        v-if="index < steps.length - 1"
        class="absolute left-5 top-10 bottom-0 w-0.5 -ml-px transition-colors duration-300"
        :class="index < modelValue ? 'bg-primary' : 'bg-gray-200'"
        aria-hidden="true"
      />

      <!-- Circle Indicator -->
      <button
        type="button"
        :disabled="step.disabled"
        :class="[
          'relative z-10 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 shrink-0 cursor-pointer shadow-2xs',
          getStepStatus(index) === 'completed'
            ? 'bg-emerald-500 text-white shadow-emerald-500/20'
            : getStepStatus(index) === 'active'
              ? 'bg-primary text-gray-950 ring-4 ring-primary/25 font-black shadow-primary/20 scale-105'
              : 'bg-slate-100 text-gray-400 border border-slate-200 hover:bg-slate-200/80'
        ]"
        @click="() => handleStepClick(index)"
      >
        <Check v-if="getStepStatus(index) === 'completed'" class="w-5 h-5 stroke-[2.5]" />
        <span v-else>{{ index + 1 }}</span>
      </button>

      <!-- Label & Description -->
      <div class="flex-1 pt-1.5 min-w-0">
        <div class="flex items-center gap-2">
          <p 
            class="text-xs sm:text-sm font-extrabold truncate"
            :class="getStepStatus(index) === 'active' ? 'text-gray-950' : getStepStatus(index) === 'completed' ? 'text-emerald-700' : 'text-gray-500'"
          >
            {{ step.label }}
          </p>
          <span 
            v-if="getStepStatus(index) === 'completed'" 
            class="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold"
          >
            ✓
          </span>
          <span 
            v-else-if="getStepStatus(index) === 'active'" 
            class="px-2 py-0.5 rounded-md bg-amber-50 border border-primary/40 text-amber-900 text-[10px] font-extrabold animate-pulse"
          >
            Aktif
          </span>
        </div>
        <p v-if="props.showDescriptions && step.description" class="text-xs text-gray-400 mt-0.5 leading-relaxed">
          {{ step.description }}
        </p>
      </div>
    </div>
  </div>

  <!-- Horizontal / Default Layout -->
  <div v-else :class="['relative flex items-center justify-between w-full', props.class]" role="navigation" aria-label="Steps">
    <div 
      v-for="(step, index) in steps" 
      :key="step.id" 
      class="flex-1 relative flex flex-col items-center group"
    >
      <!-- Connecting line -->
      <div 
        v-if="index < steps.length - 1"
        class="absolute left-1/2 right-[-50%] top-4 h-0.5 transition-colors duration-300 z-0"
        :class="index < modelValue ? 'bg-primary' : 'bg-gray-200'"
        aria-hidden="true"
      />

      <!-- Circle Indicator -->
      <button
        type="button"
        :disabled="step.disabled"
        :class="[
          'relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 shrink-0 cursor-pointer shadow-2xs',
          getStepStatus(index) === 'completed'
            ? 'bg-emerald-500 text-white'
            : getStepStatus(index) === 'active'
              ? 'bg-primary text-gray-950 ring-4 ring-primary/25 font-black scale-105'
              : 'bg-slate-100 text-gray-400 border border-slate-200'
        ]"
        @click="() => handleStepClick(index)"
      >
        <Check v-if="getStepStatus(index) === 'completed'" class="w-4 h-4 stroke-[2.5]" />
        <span v-else>{{ index + 1 }}</span>
      </button>

      <!-- Label & Description -->
      <div v-if="!isCompact" class="text-center mt-2.5 px-1 max-w-[140px]">
        <p 
          class="text-xs font-extrabold truncate"
          :class="getStepStatus(index) === 'active' ? 'text-gray-950' : getStepStatus(index) === 'completed' ? 'text-emerald-700' : 'text-gray-400'"
        >
          {{ step.label }}
        </p>
        <p v-if="props.showDescriptions && step.description" class="text-[11px] text-gray-400 truncate mt-0.5">
          {{ step.description }}
        </p>
      </div>
    </div>
  </div>
</template>
