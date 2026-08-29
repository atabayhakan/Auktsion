<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BaseComponentProps } from '@/types'
import { resolveIcon } from '@/utils/iconMap'

interface Props extends BaseComponentProps {
  modelValue?: string | number
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  error?: string
  hint?: string
  success?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  autocomplete?: string
  maxLength?: number
  minLength?: number
  pattern?: string
  step?: number
  min?: number | string
  max?: number | string
  icon?: string
  iconRight?: string
  clearable?: boolean
  debounce?: number
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
  debounce: 0,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  change: [value: string]
  clear: []
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)
const localValue = ref(props.modelValue ?? '')
const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const inputClasses = computed(() => {
  const base = 'w-full px-4 py-2.5 sm:py-3 rounded bg-white border border-border text-text-primary placeholder-text-muted transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary disabled:opacity-50 disabled:cursor-not-allowed readonly:bg-black/[0.03] text-base'

  const states = {
    default: '',
    error: '!border-error/50 placeholder-error/50 text-error focus:!border-error focus:!ring-error/20',
    success: '!border-success/50 placeholder-success/50 text-success focus:!border-success focus:!ring-success/20',
    focused: '!border-secondary focus:!border-secondary focus:!ring-secondary/20',
  }
  
  let state = 'default'
  if (props.error) state = 'error'
  else if (props.success) state = 'success'
  else if (isFocused.value) state = 'focused'
  
  const iconPadding = [
    props.icon ? '!pl-11' : '',
    hasIconRight.value ? '!pr-11' : '',
  ].filter(Boolean).join(' ')
  
  return [base, states[state], iconPadding, props.class || ''].filter(Boolean).join(' ')
})

const hasIconRight = computed(() =>
  props.iconRight || (props.clearable && String(localValue.value).length > 0)
)

const iconComponent = computed(() => resolveIcon(props.icon))
const iconRightComponent = computed(() => resolveIcon(props.iconRight))

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  localValue.value = target.value
  
  if (props.debounce > 0) {
    if (debounceTimer.value) clearTimeout(debounceTimer.value)
    debounceTimer.value = setTimeout(() => {
      emit('update:modelValue', localValue.value)
    }, props.debounce)
  } else {
    emit('update:modelValue', localValue.value)
  }
}

function handleBlur(event: FocusEvent) {
  isFocused.value = false
  emit('blur', event)
  emit('update:modelValue', localValue.value)
}

function handleFocus(event: FocusEvent) {
  isFocused.value = true
  emit('focus', event)
}

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement
  localValue.value = target.value
  emit('change', localValue.value)
}

function handleClear() {
  localValue.value = ''
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    inputRef.value?.blur()
  }
}

// Sync local value with props
watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="input-label mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">{{ label }}</label>
    
    <div class="relative">
      <input
        ref="inputRef"
        :id="id"
        :type="type"
        :placeholder="placeholder"
        :value="localValue"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        :maxlength="maxLength"
        :minlength="minLength"
        :pattern="pattern"
        :step="step"
        :min="min"
        :max="max"
        :class="inputClasses"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @change="handleChange"
        @keydown="handleKeydown"
      />
      
      <!-- Left Icon -->
      <div v-if="iconComponent" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true">
        <component :is="iconComponent" class="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      
      <!-- Right Icon / Clear Button -->
      <div v-if="hasIconRight" class="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2" aria-hidden="true">
        <button
          v-if="props.clearable && localValue.length > 0 && !disabled && !readonly"
          type="button"
          @click="handleClear"
          class="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Clear input"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <component v-else-if="iconRightComponent" :is="iconRightComponent" class="w-4 h-4 text-gray-400" />
      </div>
    </div>
    
    <!-- Error / Hint Text -->
    <div v-if="error" :id="`${id}-error`" class="input-error-text flex items-center gap-1 text-xs text-red-500 mt-1" role="alert">
      <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 10-2 0v6a1 1 0 102 0V5z" clip-rule="evenodd" />
      </svg>
      {{ error }}
    </div>
    
    <p v-else-if="hint" :id="`${id}-hint`" class="input-hint text-xs text-gray-500 dark:text-gray-400 mt-1">{{ hint }}</p>
  </div>
</template>