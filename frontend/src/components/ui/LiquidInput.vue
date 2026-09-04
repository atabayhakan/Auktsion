<script setup lang="ts">
import { ref, computed } from 'vue'
import { Eye, EyeOff, Search, X, Loader2, Check, AlertCircle } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: string
  hint?: string
  success?: boolean
  loading?: boolean
  clearable?: boolean
  showPassword?: boolean
  autocomplete?: string
  name?: string
  id?: string
  maxLength?: number
  minLength?: number
  pattern?: string
  glass?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
  showPassword: false,
  glass: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  input: [event: InputEvent]
  change: [event: Event]
  clear: []
}>()

const { t } = useI18n()
const isFocused = ref(false)
const isHovered = ref(false)
const showPassword = ref(props.type === 'password' && props.showPassword)
const inputId = ref(props.id || `input-${Math.random().toString(36).substr(2, 9)}`)
const errorId = ref(`${inputId.value}-error`)
const hintId = ref(`${inputId.value}-hint`)

const hasError = computed(() => !!props.error)
const hasSuccess = computed(() => props.success && props.modelValue.length > 0 && !hasError.value)
const showClear = computed(() => props.clearable && props.modelValue.length > 0 && !props.disabled && !props.readonly && isFocused.value)
const showLoading = computed(() => props.loading)
const showPasswordToggle = computed(() => props.showPassword && props.type === 'password')

const describedBy = computed(() => {
  const ids = []
  if (hasError.value) ids.push(errorId.value)
  if (props.hint) ids.push(hintId.value)
  return ids.length > 0 ? ids.join(' ') : undefined
})

function handleInput(event: InputEvent) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
  emit('input', event)
}

function handleBlur(event: FocusEvent) {
  isFocused.value = false
  emit('blur', event)
}

function handleFocus(event: FocusEvent) {
  isFocused.value = true
  emit('focus', event)
}

function handleChange(event: Event) {
  emit('change', event)
}

function handleClear(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  emit('update:modelValue', '')
  emit('clear')
}

function togglePassword() {
  showPassword.value = !showPassword.value
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && showClear.value) {
    handleClear(event as unknown as MouseEvent)
  }
}
</script>

<template>
  <div class="relative w-full" :data-focus="isFocused" :data-error="hasError">
    <!-- Label -->
    <label
      v-if="props.label"
      :for="inputId"
      class="block text-sm font-medium text-[rgb(var(--color-text-primary))] mb-2 transition-colors duration-200"
      :class="{
        'text-[rgb(var(--color-secondary))]': isFocused,
        'text-[rgb(var(--color-error))]': hasError,
      }"
    >
      {{ props.label }}
      <span v-if="props.required" class="text-[rgb(var(--color-error))] ml-1" aria-hidden="true">*</span>
    </label>

    <!-- Input Wrapper -->
    <div
      :class="[
        'relative',
        'transition-all duration-300 ease-out',
        'hover:shadow-[0_0_0_1px_rgb(var(--color-secondary))/0.3]',
        'focus-within:shadow-[0_0_0_2px_rgb(var(--color-secondary))/0.2]',
        props.glass ? 'glass' : '',
      ]"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <!-- Leading Icon / Search -->
      <div
        v-if="props.type === 'search'"
        class="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] pointer-events-none transition-colors"
        :class="{
          'text-[rgb(var(--color-secondary))]': isFocused,
          'text-[rgb(var(--color-error))]': hasError,
        }"
        aria-hidden="true"
      >
        <Search class="w-5 h-5" />
      </div>

      <!-- Input Element -->
      <input
        :id="inputId"
        :type="showPassword ? 'text' : props.type"
        :placeholder="props.placeholder"
        :value="props.modelValue"
        :disabled="props.disabled"
        :readonly="props.readonly"
        :required="props.required"
        :autocomplete="props.autocomplete"
        :name="props.name"
        :maxlength="props.maxLength"
        :minlength="props.minLength"
        :pattern="props.pattern"
        :aria-describedby="describedBy"
        :aria-invalid="hasError"
        :aria-required="props.required"
        :class="[
          'input-liquid',
          'w-full',
          'transition-all duration-300',
          props.type === 'search' ? 'pl-12' : '',
          (showClear.value || showPasswordToggle.value || showLoading.value) ? 'pr-14' : 'pr-4',
          hasError ? 'border-[rgb(var(--color-error))] focus:border-[rgb(var(--color-error))] focus:ring-[rgb(var(--color-error))/0.2]' : '',
          hasSuccess ? 'border-[rgb(var(--color-success))] focus:border-[rgb(var(--color-success))] focus:ring-[rgb(var(--color-success))/0.2]' : '',
          isFocused ? 'ring-2 ring-[rgb(var(--color-secondary))/0.2]' : '',
          props.disabled ? 'opacity-50 cursor-not-allowed' : '',
          props.readonly ? 'cursor-default' : '',
          props.glass ? 'glass' : '',
        ]"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @change="handleChange"
        @keydown="handleKeyDown"
      />

      <!-- Loading Spinner -->
      <div
        v-if="showLoading"
        class="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center"
        aria-hidden="true"
      >
        <Loader2 class="w-5 h-5 text-[rgb(var(--color-text-muted))] animate-spin" />
      </div>

      <!-- Clear Button -->
      <button
        v-else-if="showClear"
        type="button"
        class="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))/0.1] transition-all duration-200"
        :aria-label="t('common.clear') || 'Очистить'"
        @click="handleClear"
      >
        <X class="w-4 h-4" />
      </button>

      <!-- Password Toggle -->
      <button
        v-else-if="showPasswordToggle"
        type="button"
        class="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-accent))] transition-all duration-200"
        :aria-label="showPassword ? (t('auth.hidePassword') || 'Скрыть пароль') : (t('auth.showPassword') || 'Показать пароль')"
        :aria-pressed="showPassword"
        @click="togglePassword"
      >
        <Eye v-if="!showPassword" class="w-5 h-5" />
        <EyeOff v-else class="w-5 h-5" />
      </button>

      <!-- Success Icon -->
      <div
        v-else-if="hasSuccess && !showLoading"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-[rgb(var(--color-success))]"
        aria-hidden="true"
      >
        <Check class="w-5 h-5" />
      </div>

      <!-- Error Icon -->
      <div
        v-else-if="hasError && !showLoading"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-[rgb(var(--color-error))]"
        aria-hidden="true"
      >
        <AlertCircle class="w-5 h-5" />
      </div>
    </div>

    <!-- Error Message -->
    <p
      v-if="hasError"
      :id="errorId"
      class="mt-2 text-sm text-[rgb(var(--color-error))] flex items-center gap-1.5 animate-slide-up"
      role="alert"
    >
      <AlertCircle class="w-4 h-4 flex-shrink-0" />
      <span>{{ props.error }}</span>
    </p>

    <!-- Hint / Helper Text -->
    <p
      v-else-if="props.hint && !hasError"
      :id="hintId"
      class="mt-2 text-sm text-[rgb(var(--color-text-muted))] flex items-center gap-1.5"
    >
      <span>{{ props.hint }}</span>
      <span v-if="props.maxLength" class="text-[rgb(var(--color-border))]">
        {{ props.modelValue.length }}/{{ props.maxLength }}
      </span>
    </p>

    <!-- Character Counter -->
    <p
      v-else-if="props.maxLength && !props.hint && !hasError"
      class="mt-2 text-sm text-[rgb(var(--color-text-muted))] text-right"
      aria-live="polite"
    >
      {{ props.modelValue.length }}/{{ props.maxLength }}
    </p>
  </div>
</template>

<style scoped>
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out forwards;
}

/* Custom focus styles for accessibility */
input:focus-visible {
  outline: none;
}

/* Placeholder styling */
input::placeholder {
  @apply text-[rgb(var(--color-text-muted))] transition-opacity;
}

input:focus::placeholder {
  @apply opacity-50;
}

/* Disabled state */
input:disabled {
  @apply bg-[rgb(var(--color-accent))] cursor-not-allowed;
}

/* Readonly state */
input:read-only {
  @apply bg-[rgb(var(--color-accent))/0.5];
}

/* Number input spinner hiding */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* Search input cancel button hiding */
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-decoration {
  -webkit-appearance: none;
}
</style>