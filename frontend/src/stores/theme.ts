// src/stores/theme.ts
// Real-time Dynamic CSS Variables Theme Store for iTorgo Design Suite

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/services/api'

export interface ThemeSettings {
  logoType: 'icon_text' | 'image' | 'text_only'
  logoUrl: string
  logoText: string
  logoTagline: string
  logoHeightPx: number
  logoBadgeShape: 'rounded' | 'square' | 'circle' | 'transparent'
  logoBadgeColor: string
  faviconUrl: string

  primaryColor: string
  primaryHoverColor: string
  secondaryColor: string
  secondaryHoverColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  surfaceElevatedColor: string
  textPrimaryColor: string
  textSecondaryColor: string
  textMutedColor: string
  borderColor: string

  buttonRadius: '0px' | '6px' | '10px' | '16px' | '9999px'
  buttonShadow: 'none' | 'sm' | 'md' | 'lg' | 'glow'
  buttonHoverEffect: 'scale' | 'lift' | 'glow' | 'none'

  cardRadius: '8px' | '16px' | '24px'
  cardGlassBlur: 'none' | '10px' | '20px' | '40px'
  cardBorder: 'none' | 'subtle' | 'solid'
  cardShadow: 'none' | 'sm' | 'md' | 'lg'

  fontFamily: 'Poppins' | 'Inter' | 'Plus Jakarta Sans' | 'Montserrat' | 'Rubik'
  titleFontWeight: '600' | '700' | '800' | '900'

  activePreset: string
  updatedAt: string
}

export interface ThemePresetItem {
  id: string
  name: string
  description: string
  author: string
  version: string
  previewColors: string[]
  theme: Partial<ThemeSettings>
}

function hexToRgbValues(hex: string): string {
  if (!hex) return '242 177 56'
  let cleanHex = hex.replace('#', '')
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('')
  }
  if (cleanHex.length !== 6) return '242 177 56'
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  return `${r} ${g} ${b}`
}

function loadGoogleFont(fontFamily: string) {
  if (typeof document === 'undefined') return
  const fontId = 'dynamic-google-font'
  let link = document.getElementById(fontId) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.id = fontId
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  const fontNameParam = fontFamily.replace(/ /g, '+')
  link.href = `https://fonts.googleapis.com/css2?family=${fontNameParam}:wght@400;500;600;700;800;900&display=swap`
}

export const useThemeStore = defineStore('theme', () => {
  const defaultTheme: ThemeSettings = {
    logoType: 'icon_text',
    logoUrl: '',
    logoText: 'iTorgo',
    logoTagline: 'Real-Time Platform',
    logoHeightPx: 40,
    logoBadgeShape: 'rounded',
    logoBadgeColor: '#F2B138',
    faviconUrl: '/favicon.ico',

    primaryColor: '#F2B138',
    primaryHoverColor: '#E09E22',
    secondaryColor: '#5B9BD5',
    secondaryHoverColor: '#4787C4',
    accentColor: '#F4F4F5',
    backgroundColor: '#FFFFFF',
    surfaceColor: '#FFFFFF',
    surfaceElevatedColor: '#FFFFFF',
    textPrimaryColor: '#18181B',
    textSecondaryColor: '#52525B',
    textMutedColor: '#71717A',
    borderColor: '#E4E4E7',

    buttonRadius: '10px',
    buttonShadow: 'md',
    buttonHoverEffect: 'lift',

    cardRadius: '16px',
    cardGlassBlur: '20px',
    cardBorder: 'subtle',
    cardShadow: 'md',

    fontFamily: 'Poppins',
    titleFontWeight: '800',

    activePreset: 'sunlit_gold',
    updatedAt: new Date().toISOString()
  }

  const theme = ref<ThemeSettings>({ ...defaultTheme })
  const publishedTheme = ref<ThemeSettings>({ ...defaultTheme })
  const presets = ref<Record<string, ThemePresetItem>>({})
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isInitialized = ref(false)

  const isDirty = computed(() => {
    return JSON.stringify(theme.value) !== JSON.stringify(publishedTheme.value)
  })

  function applyThemeToDOM(t: ThemeSettings) {
    if (typeof document === 'undefined') return
    const root = document.documentElement

    // Primary Colors
    root.style.setProperty('--color-primary', hexToRgbValues(t.primaryColor))
    root.style.setProperty('--color-primary-hover', hexToRgbValues(t.primaryHoverColor || t.primaryColor))
    root.style.setProperty('--color-primary-container', hexToRgbValues(t.primaryColor))

    // Secondary Colors
    root.style.setProperty('--color-secondary', hexToRgbValues(t.secondaryColor))
    root.style.setProperty('--color-secondary-hover', hexToRgbValues(t.secondaryHoverColor || t.secondaryColor))

    // Background & Surface
    root.style.setProperty('--color-background', hexToRgbValues(t.backgroundColor))
    root.style.setProperty('--color-surface', hexToRgbValues(t.surfaceColor))
    root.style.setProperty('--color-surface-elevated', hexToRgbValues(t.surfaceElevatedColor || t.surfaceColor))

    // Text & Border
    root.style.setProperty('--color-text-primary', hexToRgbValues(t.textPrimaryColor))
    root.style.setProperty('--color-text-secondary', hexToRgbValues(t.textSecondaryColor))
    root.style.setProperty('--color-text-muted', hexToRgbValues(t.textMutedColor))
    root.style.setProperty('--color-border', hexToRgbValues(t.borderColor))

    // Button & Card Design Tokens
    root.style.setProperty('--btn-radius', t.buttonRadius)
    root.style.setProperty('--card-radius', t.cardRadius)

    // Dynamic Google Fonts
    if (t.fontFamily && (t.fontFamily as string) !== 'system-ui') {
      try { loadGoogleFont(t.fontFamily) } catch {}
      root.style.setProperty('--font-sans', `'${t.fontFamily}', system-ui, sans-serif`)
      if (document.body) {
        document.body.style.fontFamily = `'${t.fontFamily}', system-ui, sans-serif`
      }
    }

    // Favicon update if provided
    if (t.faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null
      if (link) link.href = t.faviconUrl
    }
  }

  async function initTheme() {
    if (isInitialized.value) return
    isLoading.value = true
    try {
      const { data: res } = await apiClient.get<any>('/api/admin/theme')
      if (res && res.success && res.data) {
        theme.value = { ...defaultTheme, ...res.data }
        publishedTheme.value = { ...theme.value }
        applyThemeToDOM(theme.value)
      }
      const { data: presetsRes } = await apiClient.get<any>('/api/admin/theme/presets')
      if (presetsRes && presetsRes.success && presetsRes.data) {
        presets.value = presetsRes.data
      }
      isInitialized.value = true
    } catch (err) {
      console.warn('[ThemeStore] Failed to fetch theme from server, using default:', err)
      applyThemeToDOM(theme.value)
    } finally {
      isLoading.value = false
    }
  }

  function setLivePreview(partial: Partial<ThemeSettings>) {
    theme.value = { ...theme.value, ...partial }
    applyThemeToDOM(theme.value)
  }

  function revertPreview() {
    theme.value = { ...publishedTheme.value }
    applyThemeToDOM(theme.value)
  }

  function applyPreset(presetKey: string) {
    const preset = presets.value[presetKey]
    if (!preset) return
    theme.value = {
      ...theme.value,
      ...preset.theme,
      activePreset: presetKey
    }
    applyThemeToDOM(theme.value)
  }

  async function publishTheme(): Promise<{ success: boolean; message?: string }> {
    isSaving.value = true
    try {
      const { data: res } = await apiClient.put<any>('/api/admin/theme', theme.value)
      if (res && res.success) {
        publishedTheme.value = { ...res.data }
        theme.value = { ...res.data }
        applyThemeToDOM(theme.value)
        return { success: true, message: res.message || 'Дизайн жаңыртылды' }
      }
      throw new Error('Theme update failed')
    } catch (err: any) {
      console.error('[ThemeStore] Error publishing theme:', err)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  function resetToDefault() {
    theme.value = { ...defaultTheme }
    applyThemeToDOM(theme.value)
  }

  return {
    theme,
    publishedTheme,
    presets,
    isLoading,
    isSaving,
    isDirty,
    isInitialized,
    initTheme,
    setLivePreview,
    revertPreview,
    applyPreset,
    publishTheme,
    resetToDefault
  }
})
