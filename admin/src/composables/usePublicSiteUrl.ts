// src/composables/usePublicSiteUrl.ts
import { computed } from 'vue'

// A router-link to a non-admin path is caught by the admin-host guard in
// router/index.ts, which forces it back to /admin — so leaving the admin
// panel for the main site needs a real cross-origin navigation instead.
// The target origin is derived from window.location rather than hardcoded,
// so it still resolves correctly in local dev or any future staging host.
export function usePublicSiteUrl(path: string = '/') {
  return computed(() => {
    if (typeof window === 'undefined') return path
    const { protocol, hostname, port } = window.location
    const publicHost = hostname.replace(/^admin\./, '')
    return `${protocol}//${publicHost}${port ? ':' + port : ''}${path}`
  })
}
