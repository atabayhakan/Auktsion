/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_WS_URL?: string
  readonly BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface HTMLElement {
  _clickOutside?: (event: Event) => void
  _intersectObserver?: IntersectionObserver
  _ripple?: (event: MouseEvent) => void
  _tooltip?: HTMLElement
  _permissionHidden?: boolean
}

interface HTMLImageElement {
  _lazyObserver?: IntersectionObserver
}

interface Window {
  axios?: any
}
