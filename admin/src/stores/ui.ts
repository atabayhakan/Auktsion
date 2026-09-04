// src/stores/ui.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Toast, ModalState, DrawerState } from '@/types'

export const useUIStore = defineStore('ui', () => {
  // State
  const toasts = ref<Toast[]>([])
  const modals = ref<Record<string, ModalState>>({})
  const drawers = ref<Record<string, DrawerState>>({})
  const isMobileMenuOpen = ref(false)
  const isSearchOpen = false
  const scrollY = ref(0)
  const isOnline = ref(true)
  const theme = ref<'dark' | 'light'>('dark')

  // Toast management
  let toastId = 0

  function addToast(toast: Omit<Toast, 'id'>) {
    const id = `toast-${++toastId}`
    const newToast: Toast = { ...toast, id }
    toasts.value.push(newToast)
    
    // Auto-remove
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
    
    return id
  }

  function removeToast(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function clearToasts() {
    toasts.value = []
  }

  // Convenience toast methods
  function toastSuccess(title: string, message?: string, duration?: number) {
    return addToast({ type: 'success', title, message, duration })
  }

  function toastError(title: string, message?: string, duration?: number) {
    return addToast({ type: 'error', title, message, duration: duration ?? 8000 })
  }

  function toastWarning(title: string, message?: string, duration?: number) {
    return addToast({ type: 'warning', title, message, duration })
  }

  function toastInfo(title: string, message?: string, duration?: number) {
    return addToast({ type: 'info', title, message, duration })
  }

  // Modal management
  function openModal(key: string, props?: Record<string, any>, size: ModalState['size'] = 'md') {
    modals.value[key] = {
      isOpen: true,
      component: key,
      props,
      size,
    }
  }

  function closeModal(key: string) {
    if (modals.value[key]) {
      modals.value[key].isOpen = false
      // Keep in state for animation, clean up after
      setTimeout(() => {
        delete modals.value[key]
      }, 300)
    }
  }

  function closeAllModals() {
    Object.keys(modals.value).forEach(key => closeModal(key))
  }

  // Drawer management
  function openDrawer(key: string, side: DrawerState['side'] = 'right', props?: Record<string, any>) {
    drawers.value[key] = {
      isOpen: true,
      side,
      component: key,
      props,
    }
  }

  function closeDrawer(key: string) {
    if (drawers.value[key]) {
      drawers.value[key].isOpen = false
      setTimeout(() => {
        delete drawers.value[key]
      }, 300)
    }
  }

  function toggleMobileMenu() {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }

  function closeMobileMenu() {
    isMobileMenuOpen.value = false
  }

  function setScrollY(y: number) {
    scrollY.value = y
  }

  function setOnlineStatus(online: boolean) {
    isOnline.value = online
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
    localStorage.setItem('theme', theme.value)
  }

  function initTheme() {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (saved) {
      theme.value = saved
    } else {
      theme.value = 'dark'
    }
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
  }

  return {
    // State
    toasts,
    modals,
    drawers,
    isMobileMenuOpen,
    isSearchOpen,
    scrollY,
    isOnline,
    theme,
    
    // Getters
    // (computed properties would go here)
    
    // Actions
    addToast,
    removeToast,
    clearToasts,
    toastSuccess,
    toastError,
    toastWarning,
    toastInfo,
    openModal,
    closeModal,
    closeAllModals,
    openDrawer,
    closeDrawer,
    toggleMobileMenu,
    closeMobileMenu,
    setScrollY,
    setOnlineStatus,
    toggleTheme,
    initTheme,
  }
})