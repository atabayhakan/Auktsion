// src/composables/useI18n.ts
import { ref, computed } from 'vue'
import { messages, supportedLocales, type LocaleKey } from '@/locales'

function getStoredLocale(): LocaleKey | null {
  if (typeof localStorage === 'undefined') return null
  const itorgoLocale = localStorage.getItem('itorgo_locale') as LocaleKey | null
  if (itorgoLocale && ['ru', 'ky', 'tr'].includes(itorgoLocale)) return itorgoLocale
  const legacyLocale = localStorage.getItem('locale') as LocaleKey | null
  if (legacyLocale && ['ru', 'ky', 'tr'].includes(legacyLocale)) return legacyLocale
  return null
}

const initialLocale: LocaleKey = getStoredLocale() || 'ru'
const currentLocale = ref<LocaleKey>(initialLocale)

// Synchronize document lang immediately on load
if (typeof document !== 'undefined') {
  document.documentElement.lang = currentLocale.value
}

export function useI18n() {
  function setLocale(locale: LocaleKey) {
    if (['ru', 'ky', 'tr'].includes(locale)) {
      currentLocale.value = locale
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('itorgo_locale', locale)
        localStorage.setItem('locale', locale)
      }
      if (typeof document !== 'undefined') {
        document.documentElement.lang = locale
      }
    }
  }

  function t(path: string, params?: Record<string, any>, fallbackStr?: string): string {
    const keys = path.split('.')
    let current: any = messages[currentLocale.value] || messages.ru

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        // Fallback to Russian (the platform's primary language) if missing in active locale
        let fallback: any = messages.ru
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey]
          } else {
            return fallbackStr !== undefined ? fallbackStr : ''
          }
        }
        current = fallback
        break
      }
    }

    if (typeof current !== 'string') {
      return fallbackStr !== undefined ? fallbackStr : ''
    }

    if (params) {
      return Object.entries(params).reduce((str, [k, v]) => {
        return str.replaceAll(`{${k}}`, String(v))
      }, current)
    }

    return current
  }

  const currentLocaleInfo = computed(() => {
    return supportedLocales.find(l => l.code === currentLocale.value) || supportedLocales[0]
  })

  return {
    locale: currentLocale,
    currentLocale: currentLocaleInfo,
    supportedLocales,
    setLocale,
    t,
  }
}
