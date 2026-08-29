// scripts/challenger_2_suite.ts
/**
 * Challenger 2 Adversarial Verification Suite
 * Tests:
 * 1. Locale switching flow (ky, ru, tr)
 * 2. Parameter interpolation in t() with stress edge cases
 * 3. Formatters (useFormatters.ts, useCountdown.ts) with extreme/boundary inputs
 * 4. Key symmetry & locale fallbacks
 */

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
console.log('CHALLENGER 2: ADVERSARIAL STRESS TEST HARNESS')
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
assert('LocaleSwitching', 'RU Translation Lookup', t('common.save') === 'Сохранить', `t('common.save') in RU: ${t('common.save')}`)

// Switch to TR
setLocale('tr')
assert('LocaleSwitching', 'Switch to TR', locale.value === 'tr', `Current locale: ${locale.value}`)
assert('LocaleSwitching', 'TR Translation Lookup', t('common.save') === 'Kaydet', `t('common.save') in TR: ${t('common.save')}`)

// Switch to KY
setLocale('ky')
assert('LocaleSwitching', 'Switch to KY', locale.value === 'ky', `Current locale: ${locale.value}`)
assert('LocaleSwitching', 'KY Translation Lookup', t('common.save') === 'Сактоо', `t('common.save') in KY: ${t('common.save')}`)

// Invalid Locale Switch attempt
// @ts-ignore
setLocale('de')
assert('LocaleSwitching', 'Reject Invalid Locale (de)', locale.value === 'ky', `Current locale after invalid switch: ${locale.value}`)

// Test Fallback when key is missing in RU/TR
const originalRuNav = messages.ru.nav
// simulate missing key in RU
delete messages.ru.nav.__temp_missing
messages.ky.nav.__temp_missing = 'Кыргызча Текст'
setLocale('ru')
assert('LocaleSwitching', 'Fallback to KY when missing in active locale', t('nav.__temp_missing') === 'Кыргызча Текст', `Result: ${t('nav.__temp_missing')}`)
delete messages.ky.nav.__temp_missing

// Non-existent key returns the path itself
assert('LocaleSwitching', 'Non-existent key returns path', t('completely.fake.key.123') === 'completely.fake.key.123', `Result: ${t('completely.fake.key.123')}`)

// Object key path returns path instead of [object Object]
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

// Special regex characters in param value: $, &, $1, $$
const interpSpecialRegex = t('time.minutesAgo', { n: '$100 & $200' })
assert('Interpolation', 'Special Regex Chars in Param Value', interpSpecialRegex.includes('$100 & $200'), `Expected to contain '$100 & $200', got '${interpSpecialRegex}'`)

// HTML / Script injection in param value
const interpXss = t('time.minutesAgo', { n: '<script>alert(1)</script>' })
assert('Interpolation', 'HTML string in Param Value', interpXss === '<script>alert(1)</script> мүнөт мурун', `Got: '${interpXss}'`)

// Multiple parameters
messages.ky.test_multi = 'Салам {name}, сенин балансың: {balance} сом'
const interpMulti = t('test_multi', { name: 'Азамат', balance: 5000 })
assert('Interpolation', 'Multiple Params {name, balance}', interpMulti === 'Салам Азамат, сенин балансың: 5000 сом', `Expected 'Салам Азамат, сенин балансың: 5000 сом', got '${interpMulti}'`)
delete messages.ky.test_multi

// Extra / unused parameters passed
const interpExtra = t('time.minutesAgo', { n: 7, unused: 'test' })
assert('Interpolation', 'Extra Unused Param ignored cleanly', interpExtra === '7 мүнөт мурун', `Got: '${interpExtra}'`)

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
assert('Formatters', 'formatMoney 0 amount', currFormatter.formatMoney({ amount: '0', currency: 'KGS', formatted: '', minorUnits: 0 }).includes('0'), `Got: '${currFormatter.formatMoney({ amount: '0', currency: 'KGS', formatted: '', minorUnits: 0 })}'`)
assert('Formatters', 'formatMoney large amount KGS', currFormatter.formatMoney({ amount: '1500000000', currency: 'KGS', formatted: '', minorUnits: 150000000000 }).includes('1'), `Got: '${currFormatter.formatMoney({ amount: '1500000000', currency: 'KGS', formatted: '', minorUnits: 150000000000 })}'`)
assert('Formatters', 'formatMoney compact millions', currFormatter.formatMoney({ amount: '2500000', currency: 'KGS', formatted: '', minorUnits: 250000000 }, { compact: true }).includes('2.5M'), `Got: '${currFormatter.formatMoney({ amount: '2500000', currency: 'KGS', formatted: '', minorUnits: 250000000 }, { compact: true })}'`)
assert('Formatters', 'formatMoney compact thousands', currFormatter.formatMoney({ amount: '15400', currency: 'KGS', formatted: '', minorUnits: 1540000 }, { compact: true }).includes('15.4K'), `Got: '${currFormatter.formatMoney({ amount: '15400', currency: 'KGS', formatted: '', minorUnits: 1540000 }, { compact: true })}'`)
assert('Formatters', 'formatMoney USD currency symbol prefix', currFormatter.formatMoney({ amount: '100', currency: 'USD', formatted: '', minorUnits: 10000 }).startsWith('$'), `Got: '${currFormatter.formatMoney({ amount: '100', currency: 'USD', formatted: '', minorUnits: 10000 })}'`)
assert('Formatters', 'formatMoney invalid non-numeric amount', currFormatter.formatMoney({ amount: 'not-a-number', currency: 'KGS', formatted: 'raw-fallback', minorUnits: 0 }) === 'raw-fallback', `Got: '${currFormatter.formatMoney({ amount: 'not-a-number', currency: 'KGS', formatted: 'raw-fallback', minorUnits: 0 })}'`)

// Minor units
assert('Formatters', 'formatMinorUnits 50000 som (5000000 minor)', currFormatter.formatMinorUnits(5000000).includes('50'), `Got: '${currFormatter.formatMinorUnits(5000000)}'`)

// parseAmount
assert('Formatters', 'parseAmount standard number', currFormatter.parseAmount('1250.50') === 1250.5, `Got: ${currFormatter.parseAmount('1250.50')}`)
assert('Formatters', 'parseAmount comma decimal', currFormatter.parseAmount('1250,50') === 1250.5, `Got: ${currFormatter.parseAmount('1250,50')}`)
assert('Formatters', 'parseAmount currency symbols & spaces', currFormatter.parseAmount('  15 000 сом ') === 15000, `Got: ${currFormatter.parseAmount('  15 000 сом ')}`)
assert('Formatters', 'parseAmount invalid garbage', currFormatter.parseAmount('garbage') === 0, `Got: ${currFormatter.parseAmount('garbage')}`)

// Date formatter
assert('Formatters', 'formatDate null', dateFormatter.formatDate(null as any) === '-', `Got: '${dateFormatter.formatDate(null as any)}'`)
assert('Formatters', 'formatDate undefined', dateFormatter.formatDate(undefined as any) === '-', `Got: '${dateFormatter.formatDate(undefined as any)}'`)
assert('Formatters', 'formatDate invalid string', dateFormatter.formatDate('not-a-valid-date') === '-', `Got: '${dateFormatter.formatDate('not-a-valid-date')}'`)
assert('Formatters', 'formatDate valid ISO', dateFormatter.formatDate('2026-08-16T12:00:00Z') !== '-', `Got: '${dateFormatter.formatDate('2026-08-16T12:00:00Z')}'`)

// Relative time formatting
const now = Date.now()
assert('Formatters', 'formatRelative just now (<1 min)', dateFormatter.formatRelative(new Date(now - 10000)) === t('time.justNow'), `Got: '${dateFormatter.formatRelative(new Date(now - 10000))}'`)
assert('Formatters', 'formatRelative 5 minutes ago', dateFormatter.formatRelative(new Date(now - 5 * 60 * 1000)).includes('5'), `Got: '${dateFormatter.formatRelative(new Date(now - 5 * 60 * 1000))}'`)
assert('Formatters', 'formatRelative 3 hours ago', dateFormatter.formatRelative(new Date(now - 3 * 3600 * 1000)).includes('3'), `Got: '${dateFormatter.formatRelative(new Date(now - 3 * 3600 * 1000))}'`)
assert('Formatters', 'formatRelative 4 days ago', dateFormatter.formatRelative(new Date(now - 4 * 86400 * 1000)).includes('4'), `Got: '${dateFormatter.formatRelative(new Date(now - 4 * 86400 * 1000))}'`)

// Number formatter
assert('Formatters', 'formatNumber NaN', numFormatter.formatNumber(NaN) === '-', `Got: '${numFormatter.formatNumber(NaN)}'`)
assert('Formatters', 'formatNumber 0', numFormatter.formatNumber(0) === '0', `Got: '${numFormatter.formatNumber(0)}'`)
assert('Formatters', 'formatCompact 1,500,000', numFormatter.formatCompact(1500000).length > 0, `Got: '${numFormatter.formatCompact(1500000)}'`)
assert('Formatters', 'formatPercent 0.155', numFormatter.formatPercent(0.155).includes('15'), `Got: '${numFormatter.formatPercent(0.155)}'`)

// Status labels
assert('Formatters', 'status KYC verified', statusLabels.getKycLabel('verified').label !== 'status.kyc.verified', `Got: '${statusLabels.getKycLabel('verified').label}'`)
assert('Formatters', 'status Auction active', statusLabels.getAuctionLabel('active').label !== 'status.auction.active', `Got: '${statusLabels.getAuctionLabel('active').label}'`)
assert('Formatters', 'status Payment success', statusLabels.getPaymentLabel('success').label !== 'status.payment.success', `Got: '${statusLabels.getPaymentLabel('success').label}'`)
assert('Formatters', 'status Bid winning', statusLabels.getBidLabel('winning').label !== 'status.bid.winning', `Got: '${statusLabels.getBidLabel('winning').label}'`)
assert('Formatters', 'status Payout completed', statusLabels.getPayoutLabel('completed').label !== 'status.payout.completed', `Got: '${statusLabels.getPayoutLabel('completed').label}'`)
assert('Formatters', 'status Unknown fallback', statusLabels.getAuctionLabel('custom_nonexistent').label === 'custom_nonexistent', `Got: '${statusLabels.getAuctionLabel('custom_nonexistent').label}'`)

// ==========================================
// TEST SUITE 4: Countdown (useCountdown.ts)
// ==========================================
console.log('\n--- Suite 4: Countdown Stress Testing ---')
const cdNull = useCountdown({ endsAt: null })
assert('Countdown', 'Countdown null endsAt returns ended state', cdNull.countdown.value.isEnded === true, `isEnded: ${cdNull.countdown.value.isEnded}`)

const cdPast = useCountdown({ endsAt: new Date(now - 100000) })
assert('Countdown', 'Countdown past date isEnded', cdPast.countdown.value.isEnded === true && cdPast.countdown.value.total === 0, `total: ${cdPast.countdown.value.total}, isEnded: ${cdPast.countdown.value.isEnded}`)

const cdFutureSec = useCountdown({ endsAt: new Date(now + 45 * 1000) })
assert('Countdown', 'Countdown 45s formatted seconds', cdFutureSec.countdown.value.seconds === 45 && !cdFutureSec.countdown.value.isEnded, `formatted: '${cdFutureSec.countdown.value.formatted}', isEnded: ${cdFutureSec.countdown.value.isEnded}`)

const cdFutureMin = useCountdown({ endsAt: new Date(now + (12 * 60 + 30) * 1000) })
assert('Countdown', 'Countdown 12m 30s', cdFutureMin.countdown.value.minutes === 12, `formatted: '${cdFutureMin.countdown.value.formatted}'`)

const cdFutureHours = useCountdown({ endsAt: new Date(now + (5 * 3600 + 15 * 60) * 1000) })
assert('Countdown', 'Countdown 5h 15m', cdFutureHours.countdown.value.hours === 5, `formatted: '${cdFutureHours.countdown.value.formatted}'`)

const cdFutureDays = useCountdown({ endsAt: new Date(now + (3 * 86400 + 4 * 3600) * 1000) })
assert('Countdown', 'Countdown 3d 4h', cdFutureDays.countdown.value.days === 3, `formatted: '${cdFutureDays.countdown.value.formatted}'`)

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
