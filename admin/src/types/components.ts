// src/types/components.ts
// Shared component props types

export interface BaseComponentProps {
  class?: string
  style?: string | Record<string, string | number>
  id?: string
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  dismissible?: boolean
}

export interface ModalState {
  show?: boolean
  isOpen?: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  component?: string
  props?: Record<string, any>
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  hideFooter?: boolean
}

export interface DrawerState {
  show?: boolean
  isOpen?: boolean
  side?: 'left' | 'right' | 'top' | 'bottom'
  size?: string
  component?: string
  props?: Record<string, any>
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}