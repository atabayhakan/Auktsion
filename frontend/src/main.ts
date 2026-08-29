import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { router } from '@/router'
import { setupDirectives } from '@/directives'
import apiClient from '@/services/api'
import { useUserStore } from '@/stores/user'
import { useEcho } from '@/composables/useEcho'

import './styles/tailwind.css'

// Provide global apiClient on window for any legacy or dynamic callers
if (typeof window !== 'undefined') {
  ;(window as any).axios = apiClient
  ;(window as any).apiClient = apiClient
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
setupDirectives(app)

// Initialize user session
const userStore = useUserStore()
userStore.fetchUser().catch(() => {})

// Connect to the real-time WebSocket server (public, unauthenticated feed —
// bid counts and prices update live for every visitor, logged in or not)
useEcho().initialize()

app.mount('#app')