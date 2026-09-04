import type { App } from 'vue'

export function setupStore(_app: App) {
  // Pinia stores are auto-registered
  console.log('Stores initialized')
}


export function setupDirectives(app: App) {
  // Import directives here to avoid circular dependency
  import('@/directives').then(({ setupDirectives: setupDirs }) => {
    setupDirs(app)
  })
}