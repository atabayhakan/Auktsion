// src/locales/index.ts
import ky from './ky'
import ru from './ru'
import tr from './tr'

export type LocaleKey = 'ky' | 'ru' | 'tr'

export const supportedLocales: Array<{ code: LocaleKey; name: string; nativeName: string; flag: string }> = [
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча', flag: '🇰🇬' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
]

export const messages: Record<LocaleKey, any> = {
  ky,
  ru,
  tr,
}
