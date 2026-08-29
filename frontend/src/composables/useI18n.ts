// src/composables/useI18n.ts
import { ref, computed } from 'vue'
import { messages, supportedLocales, type LocaleKey } from '@/locales'

const savedLocale = (typeof localStorage !== 'undefined' ? localStorage.getItem('itorgo_locale') : null) as LocaleKey | null
const initialLocale: LocaleKey = savedLocale && ['ky', 'ru', 'tr'].includes(savedLocale) ? savedLocale : 'ru'
const currentLocale = ref<LocaleKey>(initialLocale)

// Synchronize document lang immediately on load
if (typeof document !== 'undefined') {
  document.documentElement.lang = currentLocale.value
}

export function useI18n() {
  function setLocale(locale: LocaleKey) {
    if (['ky', 'ru', 'tr'].includes(locale)) {
      currentLocale.value = locale
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('itorgo_locale', locale)
      }
      if (typeof document !== 'undefined') {
        document.documentElement.lang = locale
      }
    }
  }

  function t(path: string, params?: Record<string, any>): string {
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
            return path
          }
        }
        current = fallback
        break
      }
    }

    if (typeof current !== 'string') {
      return path
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
