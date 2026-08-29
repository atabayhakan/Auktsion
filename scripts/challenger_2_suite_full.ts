// scripts/challenger_2_suite_full.ts
/**
 * Challenger 2 Adversarial Verification Suite (Full Extended)
 */

// Polyfill window / DOM globals for Node test execution
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = globalThis
}
if (typeof globalThis.document === 'undefined') {
  (globalThis as any).document = {
    documentElement: { lang: 'ky' },
    hidden: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }
}
if (typeof globalThis.localStorage === 'undefined') {
  let store: Record<string, string> = {}
  ;(globalThis as any).localStorage = {
    getItem: (k: string) => store[k] || null,
    setItem: (k: string, v: string) => { store[k] = v },
    clear: () => { store = {} }
  }
}
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  (globalThis as any).requestAnimationFrame = (cb: Function) => setTimeout(cb, 16)
}
if (typeof globalThis.cancelAnimationFrame === 'undefined') {
  (globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id)
}

import { useI18n } from '../frontend/src/composables/useI18n'
import { useCurrencyFormatter, useDateFormatter, useNumberFormatter, useStatusLabels, useFormatters } from '../frontend/src/composables/useFormatters'
import { useCountdown, useCountdownFormat } from '../frontend/src/composables/useCountdown'
import { supportedLocales, messages } from '../frontend/src/locales'

const results: {
  test: string
  category: string
  status: 'PASS' | 'FAIL' | 'WARN'
  details: string
}[] = []

function assert(category: string, name: string, condition: boolean, details: string) {
  const status = condition ? 'PASS' : 'FAIL'
  results.push({ category, test: name, status, details })
  const icon = condition ? '✅' : '❌'
  console.log(`${icon} [${category}] ${name}: ${details}`)
}

console.log('====================================================')
console.log('CHALLENGER 2: EXTENDED ADVERSARIAL STRESS TEST HARNESS')
console.log('====================================================\n')

// ==========================================
// TEST SUITE 1: Locale Switching Flow
// ==========================================
console.log('--- Suite 1: Locale Switching Flow ---')
const { locale, setLocale, t, supportedLocales: locales } = useI18n()

assert('LocaleSwitching', 'Supported Locales Count', locales.length === 3, `Count: ${locales.length}`)
const codes = locales.map(l => l.code)
assert('LocaleSwitching', 'Supported Locales Codes', codes.includes('ky') && codes.includes('ru') && codes.includes('tr'), `Codes: ${codes.join(', ')}`)

// Switch to RU
setLocale('ru')
assert('LocaleSwitching', 'Switch to RU', locale.value === 'ru', `Current locale: ${locale.value}`)
assert('LocaleSwitching', 'RU localStorage sync', localStorage.getItem('auktsion_locale') === 'ru', `localStorage: ${localStorage.getItem('auktsion_locale')}`)
assert('LocaleSwitching', 'RU document.documentElement.lang sync', document.documentElement.lang === 'ru', `document.documentElement.lang: ${document.documentElement.lang}`)
assert('LocaleSwitching', 'RU Translation Lookup', t('common.save') === 'Сохранить', `t('common.save') in RU: ${t('common.save')}`)

// Switch to TR
setLocale('tr')
assert('LocaleSwitching', 'Switch to TR', locale.value === 'tr', `Current locale: ${locale.value}`)
assert('LocaleSwitching', 'TR localStorage sync', localStorage.getItem('auktsion_locale') === 'tr', `localStorage: ${localStorage.getItem('auktsion_locale')}`)
assert('LocaleSwitching', 'TR document.documentElement.lang sync', document.documentElement.lang === 'tr', `document.documentElement.lang: ${document.documentElement.lang}`)
assert('LocaleSwitching', 'TR Translation Lookup', t('common.save') === 'Kaydet', `t('common.save') in TR: ${t('common.save')}`)

// Switch to KY
setLocale('ky')
assert('LocaleSwitching', 'Switch to KY', locale.value === 'ky', `Current locale: ${locale.value}`)
assert('LocaleSwitching', 'KY localStorage sync', localStorage.getItem('auktsion_locale') === 'ky', `localStorage: ${localStorage.getItem('auktsion_locale')}`)
assert('LocaleSwitching', 'KY document.documentElement.lang sync', document.documentElement.lang === 'ky', `document.documentElement.lang: ${document.documentElement.lang}`)
assert('LocaleSwitching', 'KY Translation Lookup', t('common.save') === 'Сактоо', `t('common.save') in KY: ${t('common.save')}`)

// Invalid Locale Switch attempt
// @ts-ignore
setLocale('invalid_locale')
assert('LocaleSwitching', 'Reject Invalid Locale', locale.value === 'ky', `Current locale after invalid switch: ${locale.value}`)

// Fallback to KY when missing in RU
// @ts-ignore
messages.ky.test_fb_key = 'Кыргызча Текст'
setLocale('ru')
assert('LocaleSwitching', 'Fallback to KY when missing in RU', t('test_fb_key') === 'Кыргызча Текст', `Result: ${t('test_fb_key')}`)
delete (messages.ky as any).test_fb_key

// Non-existent key returns path
assert('LocaleSwitching', 'Non-existent key returns path', t('fake.nonexistent.path') === 'fake.nonexistent.path', `Result: ${t('fake.nonexistent.path')}`)

// Object key path returns path
assert('LocaleSwitching', 'Object path returns path', t('common') === 'common', `Result: ${t('common')}`)


// ==========================================
// TEST SUITE 2: Parameter Interpolation in t()
// ==========================================
console.log('\n--- Suite 2: Parameter Interpolation Stress Testing ---')
setLocale('ky')

// Normal number param: time.minutesAgo is '{n} мүнөт мурун'
const interpMin = t('time.minutesAgo', { n: 5 })
assert('Interpolation', 'Normal Number Param {n: 5}', interpMin === '5 мүнөт мурун', `Expected '5 мүнөт мурун', got '${interpMin}'`)

// Zero number param: {n: 0}
const interpZero = t('time.minutesAgo', { n: 0 })
assert('Interpolation', 'Zero Number Param {n: 0}', interpZero === '0 мүнөт мурун', `Expected '0 мүнөт мурун', got '${interpZero}'`)

// Negative number param: {n: -10}
const interpNeg = t('time.minutesAgo', { n: -10 })
assert('Interpolation', 'Negative Number Param {n: -10}', interpNeg === '-10 мүнөт мурун', `Expected '-10 мүнөт мурун', got '${interpNeg}'`)

// String param
const interpStr = t('time.minutesAgo', { n: 'он' })
assert('Interpolation', 'String Param {n: "он"}', interpStr === 'он мүнөт мурун', `Expected 'он мүнөт мурун', got '${interpStr}'`)

// Empty string param
const interpEmpty = t('time.minutesAgo', { n: '' })
assert('Interpolation', 'Empty String Param {n: ""}', interpEmpty === ' мүнөт мурун', `Expected ' мүнөт мурун', got '${interpEmpty}'`)

// Multiple parameters
;(messages.ky as any).test_multi = 'Салам {name}, баланс {balance}'
const interpMulti = t('test_multi', { name: 'Азамат', balance: 5000 })
assert('Interpolation', 'Multiple Params {name, balance}', interpMulti === 'Салам Азамат, баланс 5000', `Expected 'Салам Азамат, баланс 5000', got '${interpMulti}'`)
delete (messages.ky as any).test_multi


// ==========================================
// TEST SUITE 3: Formatters (useFormatters.ts)
// ==========================================
console.log('\n--- Suite 3: Formatters Stress Testing ---')
const currFormatter = useCurrencyFormatter('KGS')
const dateFormatter = useDateFormatter()
const numFormatter = useNumberFormatter()
const statusLabels = useStatusLabels()

// Currency: formatMoney
assert('Formatters', 'formatMoney null input', currFormatter.formatMoney(null) === '-', `Got: '${currFormatter.formatMoney(null)}'`)
assert('Formatters', 'formatMoney undefined input', currFormatter.formatMoney(undefined) === '-', `Got: '${currFormatter.formatMoney(undefined)}'`)
assert('Formatters', 'formatMoney 0 amount KGS', currFormatter.formatMoney({ amount: '0', currency: 'KGS', formatted: '', minorUnits: 0 }).includes('0'), `Got: '${currFormatter.formatMoney({ amount: '0', currency: 'KGS', formatted: '', minorUnits: 0 })}'`)
assert('Formatters', 'formatMoney large amount KGS', currFormatter.formatMoney({ amount: '1500000000', currency: 'KGS', formatted: '', minorUnits: 150000000000 }).includes('1'), `Got: '${currFormatter.formatMoney({ amount: '1500000000', currency: 'KGS', formatted: '', minorUnits: 150000000000 })}'`)
assert('Formatters', 'formatMoney negative amount', currFormatter.formatMoney({ amount: '-500', currency: 'USD', formatted: '', minorUnits: -50000 }).includes('-'), `Got: '${currFormatter.formatMoney({ amount: '-500', currency: 'USD', formatted: '', minorUnits: -50000 })}'`)
assert('Formatters', 'formatMoney compact millions', currFormatter.formatMoney({ amount: '2500000', currency: 'KGS', formatted: '', minorUnits: 250000000 }, { compact: true }).includes('2.5M'), `Got: '${currFormatter.formatMoney({ amount: '2500000', currency: 'KGS', formatted: '', minorUnits: 250000000 }, { compact: true })}'`)
assert('Formatters', 'formatMoney compact thousands', currFormatter.formatMoney({ amount: '15400', currency: 'KGS', formatted: '', minorUnits: 1540000 }, { compact: true }).includes('15.4K'), `Got: '${currFormatter.formatMoney({ amount: '15400', currency: 'KGS', formatted: '', minorUnits: 1540000 }, { compact: true })}'`)
assert('Formatters', 'formatMoney USD currency prefix', currFormatter.formatMoney({ amount: '100', currency: 'USD', formatted: '', minorUnits: 10000 }).startsWith('$'), `Got: '${currFormatter.formatMoney({ amount: '100', currency: 'USD', formatted: '', minorUnits: 10000 })}'`)
assert('Formatters', 'formatMoney RUB currency symbol', currFormatter.formatMoney({ amount: '100', currency: 'RUB', formatted: '', minorUnits: 10000 }).includes('₽'), `Got: '${currFormatter.formatMoney({ amount: '100', currency: 'RUB', formatted: '', minorUnits: 10000 })}'`)
assert('Formatters', 'formatMoney invalid non-numeric amount', currFormatter.formatMoney({ amount: 'not-a-number', currency: 'KGS', formatted: 'raw-fallback', minorUnits: 0 }) === 'raw-fallback', `Got: '${currFormatter.formatMoney({ amount: 'not-a-number', currency: 'KGS', formatted: 'raw-fallback', minorUnits: 0 })}'`)

// Currency Symbols in different locales
setLocale('ky')
assert('Formatters', 'KGS symbol in KY', currFormatter.getCurrencySymbol('KGS') === 'сом', `Got: '${currFormatter.getCurrencySymbol('KGS')}'`)
setLocale('tr')
assert('Formatters', 'KGS symbol in TR', currFormatter.getCurrencySymbol('KGS') === 'som', `Got: '${currFormatter.getCurrencySymbol('KGS')}'`)
setLocale('ru')
assert('Formatters', 'KGS symbol in RU', currFormatter.getCurrencySymbol('KGS') === 'сом', `Got: '${currFormatter.getCurrencySymbol('KGS')}'`)
setLocale('ky')

// Minor units
assert('Formatters', 'formatMinorUnits 0 minor', currFormatter.formatMinorUnits(0).includes('0'), `Got: '${currFormatter.formatMinorUnits(0)}'`)
assert('Formatters', 'formatMinorUnits 50000 som (5000000 minor)', currFormatter.formatMinorUnits(5000000).includes('50'), `Got: '${currFormatter.formatMinorUnits(5000000)}'`)

// parseAmount
assert('Formatters', 'parseAmount standard number', currFormatter.parseAmount('1250.50') === 1250.5, `Got: ${currFormatter.parseAmount('1250.50')}`)
assert('Formatters', 'parseAmount comma decimal', currFormatter.parseAmount('1250,50') === 1250.5, `Got: ${currFormatter.parseAmount('1250,50')}`)
assert('Formatters', 'parseAmount currency symbols & spaces', currFormatter.parseAmount('  15 000 сом ') === 15000, `Got: ${currFormatter.parseAmount('  15 000 сом ')}`)
assert('Formatters', 'parseAmount negative amount', currFormatter.parseAmount('-500.25') === -500.25, `Got: ${currFormatter.parseAmount('-500.25')}`)
assert('Formatters', 'parseAmount invalid garbage', currFormatter.parseAmount('garbage') === 0, `Got: ${currFormatter.parseAmount('garbage')}`)

// toMinorUnits
assert('Formatters', 'toMinorUnits string', currFormatter.toMinorUnits('12.50') === 1250, `Got: ${currFormatter.toMinorUnits('12.50')}`)
assert('Formatters', 'toMinorUnits number', currFormatter.toMinorUnits(12.50) === 1250, `Got: ${currFormatter.toMinorUnits(12.50)}`)

// Date formatter
assert('Formatters', 'formatDate null', dateFormatter.formatDate(null as any) === '-', `Got: '${dateFormatter.formatDate(null as any)}'`)
assert('Formatters', 'formatDate undefined', dateFormatter.formatDate(undefined as any) === '-', `Got: '${dateFormatter.formatDate(undefined as any)}'`)
assert('Formatters', 'formatDate invalid string', dateFormatter.formatDate('not-a-valid-date') === '-', `Got: '${dateFormatter.formatDate('not-a-valid-date')}'`)
assert('Formatters', 'formatDate valid ISO', dateFormatter.formatDate('2026-08-16T12:00:00Z') !== '-', `Got: '${dateFormatter.formatDate('2026-08-16T12:00:00Z')}'`)
assert('Formatters', 'formatDateTime valid ISO', dateFormatter.formatDateTime('2026-08-16T12:00:00Z') !== '-', `Got: '${dateFormatter.formatDateTime('2026-08-16T12:00:00Z')}'`)

// Relative time formatting
const now = Date.now()
assert('Formatters', 'formatRelative just now (<1 min)', dateFormatter.formatRelative(new Date(now - 10000)) === t('time.justNow'), `Got: '${dateFormatter.formatRelative(new Date(now - 10000))}'`)

// Number formatter
assert('Formatters', 'formatNumber NaN', numFormatter.formatNumber(NaN) === '-', `Got: '${numFormatter.formatNumber(NaN)}'`)
assert('Formatters', 'formatNumber 0', numFormatter.formatNumber(0) === '0', `Got: '${numFormatter.formatNumber(0)}'`)
assert('Formatters', 'formatNumber negative', numFormatter.formatNumber(-1234.5).includes('1'), `Got: '${numFormatter.formatNumber(-1234.5)}'`)
assert('Formatters', 'formatCompact 1,500,000', numFormatter.formatCompact(1500000).length > 0, `Got: '${numFormatter.formatCompact(1500000)}'`)
assert('Formatters', 'formatPercent 0.155', numFormatter.formatPercent(0.155).includes('15'), `Got: '${numFormatter.formatPercent(0.155)}'`)

// Status labels
const kycStatuses = ['not_started', 'phone_verified', 'id_uploaded', 'ocr_passed', 'verified', 'rejected', 'on_hold', 'pending']
for (const st of kycStatuses) {
  const res = statusLabels.getKycLabel(st as any)
  assert('Formatters', `status KYC [${st}]`, res.label !== `status.kyc.${st}` && Boolean(res.color), `label: '${res.label}', color: '${res.color}'`)
}

const auctionStatuses = ['draft', 'pending_approval', 'active', 'ended_sold', 'ended_unsold', 'ended_reserve_not_met', 'cancelled', 'disputed']
for (const st of auctionStatuses) {
  const res = statusLabels.getAuctionLabel(st as any)
  assert('Formatters', `status Auction [${st}]`, res.label !== `status.auction.${st}` && Boolean(res.color), `label: '${res.label}', color: '${res.color}'`)
}

const bidStatuses = ['pending', 'active', 'outbid', 'winning', 'won', 'lost', 'cancelled']
for (const st of bidStatuses) {
  const res = statusLabels.getBidLabel(st as any)
  assert('Formatters', `status Bid [${st}]`, res.label !== `status.bid.${st}` && Boolean(res.color), `label: '${res.label}', color: '${res.color}'`)
}

const payoutStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'aml_review']
for (const st of payoutStatuses) {
  const res = statusLabels.getPayoutLabel(st as any)
  assert('Formatters', `status Payout [${st}]`, res.label !== `status.payout.${st}` && Boolean(res.color), `label: '${res.label}', color: '${res.color}'`)
}

assert('Formatters', 'status Unknown fallback', statusLabels.getAuctionLabel('custom_nonexistent').label === 'custom_nonexistent', `Got: '${statusLabels.getAuctionLabel('custom_nonexistent').label}'`)

// Gateway info
const gateways = ['mbank', 'optima', 'demirbank', 'elqr', 'o_nom', 'stripe']
for (const gw of gateways) {
  const info = statusLabels.getGatewayInfo(gw as any)
  assert('Formatters', `gateway info [${gw}]`, info.name.length > 0 && info.color.length > 0, `name: '${info.name}', color: '${info.color}'`)
}


// ==========================================
// TEST SUITE 4: Countdown (useCountdown.ts)
// ==========================================
console.log('\n--- Suite 4: Countdown Stress Testing ---')
const cdNull = useCountdown({ endsAt: null })
assert('Countdown', 'Countdown null endsAt returns ended state', cdNull.countdown.value.isEnded === true, `isEnded: ${cdNull.countdown.value.isEnded}`)

const cdPast = useCountdown({ endsAt: new Date(now - 100000) })
assert('Countdown', 'Countdown past date isEnded', cdPast.countdown.value.isEnded === true && cdPast.countdown.value.total === 0, `total: ${cdPast.countdown.value.total}, isEnded: ${cdPast.countdown.value.isEnded}`)

const cdFutureSec = useCountdown({ endsAt: new Date(Date.now() + 45 * 1000) })
assert('Countdown', 'Countdown 45s formatted seconds', (cdFutureSec.countdown.value.seconds === 45 || cdFutureSec.countdown.value.seconds === 44) && !cdFutureSec.countdown.value.isEnded, `formatted: '${cdFutureSec.countdown.value.formatted}', isEnded: ${cdFutureSec.countdown.value.isEnded}`)

const cdFutureMin = useCountdown({ endsAt: new Date(Date.now() + (12 * 60 + 30) * 1000) })
assert('Countdown', 'Countdown 12m 30s', cdFutureMin.countdown.value.minutes === 12 && !cdFutureMin.countdown.value.isEnded, `formatted: '${cdFutureMin.countdown.value.formatted}'`)

const cdFutureHours = useCountdown({ endsAt: new Date(now + (5 * 3600 + 15 * 60) * 1000) })
assert('Countdown', 'Countdown 5h 15m', cdFutureHours.countdown.value.hours === 5 && !cdFutureHours.countdown.value.isEnded, `formatted: '${cdFutureHours.countdown.value.formatted}'`)

const cdFutureDays = useCountdown({ endsAt: new Date(now + (3 * 86400 + 4 * 3600) * 1000) })
assert('Countdown', 'Countdown 3d 4h', cdFutureDays.countdown.value.days === 3 && !cdFutureDays.countdown.value.isEnded, `formatted: '${cdFutureDays.countdown.value.formatted}'`)

// Test countdown in TR locale
setLocale('tr')
const cdTrDays = useCountdown({ endsAt: new Date(now + (2 * 86400 + 3 * 3600) * 1000) })
assert('Countdown', 'Countdown TR localized days', cdTrDays.countdown.value.formatted.includes('gün') && cdTrDays.countdown.value.formatted.includes('saat'), `formatted in TR: '${cdTrDays.countdown.value.formatted}'`)

// Test countdown in RU locale
setLocale('ru')
const cdRuDays = useCountdown({ endsAt: new Date(now + (2 * 86400 + 3 * 3600) * 1000) })
assert('Countdown', 'Countdown RU localized days', cdRuDays.countdown.value.formatted.includes('дн') && cdRuDays.countdown.value.formatted.includes('ч'), `formatted in RU: '${cdRuDays.countdown.value.formatted}'`)

setLocale('ky')

// Summary
console.log('\n====================================================')
console.log('TEST SUMMARY RESULTS')
console.log('====================================================')
const passed = results.filter(r => r.status === 'PASS').length
const failed = results.filter(r => r.status === 'FAIL').length
console.log(`TOTAL: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`)

if (failed > 0) {
  console.log('\nFAILED TESTS:')
  results.filter(r => r.status === 'FAIL').forEach(f => {
    console.error(`- [${f.category}] ${f.test}: ${f.details}`)
  })
}
