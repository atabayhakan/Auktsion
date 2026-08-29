<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { BaseComponentProps } from '@/types'
import { ChevronDown } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'

interface Props extends BaseComponentProps {
  modelValue?: boolean
  trigger?: 'click' | 'hover'
  placement?: 'bottom' | 'top' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  closeOnOutsideClick?: boolean
  closeOnEscape?: boolean
  teleport?: boolean | string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  trigger: 'click',
  placement: 'bottom',
  align: 'start',
  closeOnOutsideClick: true,
  closeOnEscape: true,
  teleport: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  open: []
}>()

const { t } = useI18n()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    emit('update:modelValue', val)
    if (val) emit('open')
    else emit('close')
  }
})

const dropdownRef = ref<HTMLDivElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLDivElement | null>(null)
const isHovering = ref(false)
const previouslyFocused = ref<HTMLElement | null>(null)

const placementClasses = computed(() => {
  switch (props.placement) {
    case 'top':
      return 'bottom-full mb-2'
    case 'left':
      return 'right-full mr-2 top-0'
    case 'right':
      return 'left-full ml-2 top-0'
    case 'bottom':
    default:
      return 'top-full mt-2'
  }
})

const alignClasses = computed(() => {
  switch (props.align) {
    case 'end':
      return 'right-0'
    case 'center':
      return 'left-1/2 -translate-x-1/2'
    case 'start':
    default:
      return 'left-0'
  }
})

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function toggle() {
  isOpen.value = !isOpen.value
}

function handleTriggerClick(event: MouseEvent) {
  event.stopPropagation()
  // Always toggle on click/Enter regardless of trigger mode: hover-mode
  // dropdowns (e.g. a mega-menu) still need to open for keyboard users, who
  // reach the trigger via Tab and activate it with Enter — that fires a
  // native click, not a mouseenter.
  toggle()
}

let hoverTimer: ReturnType<typeof setTimeout> | null = null

function handleTriggerMouseEnter() {
  if (props.trigger === 'hover') {
    if (hoverTimer) clearTimeout(hoverTimer)
    isHovering.value = true
    open()
  }
}

function handleTriggerMouseLeave() {
  if (props.trigger === 'hover') {
    isHovering.value = false
    hoverTimer = setTimeout(() => {
      if (!isHovering.value) close()
    }, 150)
  }
}

function handleContentMouseEnter() {
  if (props.trigger === 'hover') {
    if (hoverTimer) clearTimeout(hoverTimer)
    isHovering.value = true
  }
}

function handleContentMouseLeave() {
  if (props.trigger === 'hover') {
    isHovering.value = false
    hoverTimer = setTimeout(() => {
      if (!isHovering.value) close()
    }, 150)
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.closeOnEscape) {
    close()
    triggerRef.value?.focus()
    return
  }
  
  if (event.key === 'Tab' && contentRef.value) {
    const focusableElements = contentRef.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusableElements.length === 0) return
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

function handleOutsideClick(event: MouseEvent) {
  if (!props.closeOnOutsideClick || !isOpen.value) return
  
  const target = event.target as Node | null
  if (!target) return
  
  const clickedTrigger = triggerRef.value?.contains(target) ?? false
  const clickedContent = contentRef.value?.contains(target) ?? false
  const clickedDropdown = dropdownRef.value?.contains(target) ?? false
  
  if (!clickedTrigger && !clickedContent && !clickedDropdown) {
    close()
  }
}

watch(isOpen, async (val) => {
  if (val) {
    previouslyFocused.value = (document.activeElement as HTMLElement) || null
    document.addEventListener('click', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
    
    await nextTick()
    const focusable = contentRef.value?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable?.focus()
  } else {
    document.removeEventListener('click', handleOutsideClick)
    document.removeEventListener('keydown', handleKeyDown)
  }
})

onMounted(() => {
  if (isOpen.value) {
    document.addEventListener('click', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  if (hoverTimer) clearTimeout(hoverTimer)
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div
    ref="dropdownRef"
    class="relative inline-block text-left"
  >
    <!-- Trigger Slot -->
    <div
      ref="triggerRef"
      @click="handleTriggerClick"
      @mouseenter="handleTriggerMouseEnter"
      @mouseleave="handleTriggerMouseLeave"
      class="cursor-pointer inline-flex items-center"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      :aria-controls="isOpen ? 'dropdown-content' : undefined"
    >
      <slot name="trigger">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 border border-black/10 text-gray-800 text-xs font-medium hover:bg-black/10 transition-all"
        >
          <span>{{ t('common.menu') }}</span>
          <ChevronDown
            :class="['w-3.5 h-3.5 transition-transform duration-200', { 'rotate-180': isOpen }]"
            aria-hidden="true"
          />
        </button>
      </slot>
    </div>
    
    <!-- Content - Teleported if teleport prop specified -->
    <Teleport v-if="isOpen && props.teleport" :to="props.teleport === true ? 'body' : props.teleport">
      <Transition name="dropdown">
        <div
          ref="contentRef"
          id="dropdown-content"
          :class="['dropdown-menu absolute z-50 rounded-2xl shadow-xl border border-black/10 bg-white', placementClasses, alignClasses]"
          role="menu"
          @mouseenter="handleContentMouseEnter"
          @mouseleave="handleContentMouseLeave"
        >
          <slot />
        </div>
      </Transition>
    </Teleport>
    
    <!-- Non-teleported fallback (Default, perfect for inline components) -->
    <Transition name="dropdown" v-else-if="isOpen">
      <div
        ref="contentRef"
        id="dropdown-content"
        :class="['dropdown-menu absolute z-50 rounded-2xl shadow-xl border border-black/10 bg-white', placementClasses, alignClasses]"
        role="menu"
        @mouseenter="handleContentMouseEnter"
        @mouseleave="handleContentMouseLeave"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease-out;
}

.dropdown-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}

/* Focus visible styles for accessibility */
.dropdown-menu :focus-visible {
  outline: 2px solid #f59e0b;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .dropdown-menu {
    border-width: 2px;
  }
}
</style>