// scripts/challenger_4_adversarial_suite.ts
/**
 * Challenger 4 Comprehensive Empirical Verification Suite
 * Gate Iteration 2: Deep Stress Testing of Auktsion i18n, Formatters, Reactive Switching & Build
 */

// Polyfill environment globals for Node/headless execution
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
import {
  useCurrencyFormatter,
  useDateFormatter,
  useNumberFormatter,
  useStatusLabels,
  useFormatters,
  currency,
  date,
  number,
  status,
} from '../frontend/src/composables/useFormatters'
import { useCountdown, useCountdownFormat } from '../frontend/src/composables/useCountdown'
import { supportedLocales, messages, type LocaleKey } from '../frontend/src/locales'

interface TestResult {
  category: string
  name: string
  status: 'PASS' | 'FAIL'
  details: string
}

const results: TestResult[] = []

function assert(category: string, name: string, condition: boolean, details: string) {
  const status: 'PASS' | 'FAIL' = condition ? 'PASS' : 'FAIL'
  results.push({ category, name, status, details })
  const icon = condition ? '✅' : '❌'
  console.log(`${icon} [${category}] ${name}: ${details}`)
}

console.log('======================================================================')
console.log('🚀 CHALLENGER 4: EMPIRICAL ADVERSARIAL STRESS TEST SUITE')
console.log('======================================================================\n')

const { locale, setLocale, t, supportedLocales: locales, currentLocale } = useI18n()

// ======================================================================
// SECTION 1: PARAMETER INTERPOLATION ADVERSARIAL TESTING
// ======================================================================
console.log('--- SECTION 1: Parameter Interpolation Adversarial Tests ---')

// 1.1 Single & Multiple Parameter Scenarios
;(messages.ky as any).test = { adv: { key: 'Салам {name}! Сенин балансың {amount} {curr}.' } }
;(messages.ru as any).test = { adv: { key: 'Привет {name}! Твой баланс {amount} {curr}.' } }
;(messages.tr as any).test = { adv: { key: 'Merhaba {name}! Bakiyeniz {amount} {curr}.' } }

setLocale('ky')
const singleTest = t('test.adv.key', { name: 'Азамат', amount: 1500, curr: 'сом' })
assert('Interpolation', 'KY Multi-param substitution', singleTest === 'Салам Азамат! Сенин балансың 1500 сом.', `Got: "${singleTest}"`)

setLocale('ru')
const singleTestRu = t('test.adv.key', { name: 'Иван', amount: 2500, curr: 'руб' })
assert('Interpolation', 'RU Multi-param substitution', singleTestRu === 'Привет Иван! Твой баланс 2500 руб.', `Got: "${singleTestRu}"`)

setLocale('tr')
const singleTestTr = t('test.adv.key', { name: 'Ahmet', amount: 3500, curr: 'TL' })
assert('Interpolation', 'TR Multi-param substitution', singleTestTr === 'Merhaba Ahmet! Bakiyeniz 3500 TL.', `Got: "${singleTestTr}"`)

// 1.2 Numerical Edge Cases
setLocale('ky')
;(messages.ky as any).test.num = 'Сан: {n}'

// Zero
assert('Interpolation', 'Numerical Zero (0)', t('test.num', { n: 0 }) === 'Сан: 0', `Got: "${t('test.num', { n: 0 })}"`)
// Negative number
assert('Interpolation', 'Negative Integer (-42)', t('test.num', { n: -42 }) === 'Сан: -42', `Got: "${t('test.num', { n: -42 })}"`)
// Floating point
assert('Interpolation', 'Floating point (3.14159)', t('test.num', { n: 3.14159 }) === 'Сан: 3.14159', `Got: "${t('test.num', { n: 3.14159 })}"`)
// Very large integer
assert('Interpolation', 'MAX_SAFE_INTEGER', t('test.num', { n: Number.MAX_SAFE_INTEGER }) === `Сан: ${Number.MAX_SAFE_INTEGER}`, `Got: "${t('test.num', { n: Number.MAX_SAFE_INTEGER })}"`)
// Negative zero
assert('Interpolation', 'Negative Zero (-0)', t('test.num', { n: -0 }) === 'Сан: 0', `Got: "${t('test.num', { n: -0 })}"`)

// 1.3 Empty & Falsy Arguments
;(messages.ky as any).test.empty = 'Маани: [{val}]'
assert('Interpolation', 'Empty String ("")', t('test.empty', { val: '' }) === 'Маани: []', `Got: "${t('test.empty', { val: '' })}"`)
assert('Interpolation', 'Null param value', t('test.empty', { val: null as any }) === 'Маани: [null]', `Got: "${t('test.empty', { val: null as any })}"`)
assert('Interpolation', 'Undefined param value', t('test.empty', { val: undefined as any }) === 'Маани: [undefined]', `Got: "${t('test.empty', { val: undefined as any })}"`)
assert('Interpolation', 'Boolean False', t('test.empty', { val: false as any }) === 'Маани: [false]', `Got: "${t('test.empty', { val: false as any })}"`)

// 1.4 Special Characters & Regex Hazards
;(messages.ky as any).test.special = 'Output: {token}'

// Normal currency dollar signs
const dollarCases = [
  { input: '$100', expected: 'Output: $100', desc: 'Standard Dollar Price $100' },
  { input: '$ 50.00', expected: 'Output: $ 50.00', desc: 'Dollar with space $ 50.00' },
]
for (const dc of dollarCases) {
  const res = t('test.special', { token: dc.input })
  assert('Interpolation', `Special Char: ${dc.desc}`, res === dc.expected, `Got: "${res}"`)
}

// HTML / Script injection strings
const htmlStr = '<script>alert("XSS")</script>&quot;<div>'
assert('Interpolation', 'HTML/Script Characters', t('test.special', { token: htmlStr }) === `Output: ${htmlStr}`, `Got: "${t('test.special', { token: htmlStr })}"`)

// Quotes, Slashes, Braces
const quotesStr = `'"\`\\/{nested}`
assert('Interpolation', 'Quotes & Slashes & Braces', t('test.special', { token: quotesStr }) === `Output: ${quotesStr}`, `Got: "${t('test.special', { token: quotesStr })}"`)

// Unicode & Diacritics
const kyDiacritics = 'Ң ң Ө ө Ү ү'
assert('Interpolation', 'Kyrgyz Diacritics', t('test.special', { token: kyDiacritics }) === `Output: ${kyDiacritics}`, `Got: "${t('test.special', { token: kyDiacritics })}"`)

const trDiacritics = 'ğ Ğ ı İ ö Ö ü Ü ş Ş ç Ç'
assert('Interpolation', 'Turkish Diacritics', t('test.special', { token: trDiacritics }) === `Output: ${trDiacritics}`, `Got: "${t('test.special', { token: trDiacritics })}"`)

const emojis = '🔥 🚀 💎 🦄'
assert('Interpolation', 'Unicode Emojis', t('test.special', { token: emojis }) === `Output: ${emojis}`, `Got: "${t('test.special', { token: emojis })}"`)

// 1.5 Dictionary Parameterized Keys Exhaustive Sweep Across KY, RU, TR
console.log('\n--- Exhaustive Dictionary Parameterized Keys Sweep ---')
function extractParameterizedKeys(obj: any, prefix = ''): { key: string; val: string; tokens: string[] }[] {
  let list: { key: string; val: string; tokens: string[] }[] = []
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      list = list.concat(extractParameterizedKeys(v, fullKey))
    } else if (typeof v === 'string') {
      const matches = v.match(/\{([a-zA-Z0-9_]+)\}/g)
      if (matches && matches.length > 0) {
        list.push({ key: fullKey, val: v, tokens: matches.map(m => m.replace(/[{}]/g, '')) })
      }
    }
  }
  return list
}

const kyParamKeys = extractParameterizedKeys(messages.ky)
console.log(`Found ${kyParamKeys.length} parameterized keys in dictionary.`)

for (const item of kyParamKeys) {
  for (const loc of ['ky', 'ru', 'tr'] as LocaleKey[]) {
    setLocale(loc)
    const params: Record<string, any> = {}
    item.tokens.forEach(tok => {
      if (['n', 'count', 'd', 'h', 'm'].includes(tok)) params[tok] = 7
      else if (['price', 'amount', 'minBid'].includes(tok)) params[tok] = '500 сом'
      else if (tok === 'keyword') params[tok] = 'DELETE'
      else if (tok === 'accepted') params[tok] = 'PNG, JPG'
      else if (tok === 'maxSize') params[tok] = '10MB'
      else if (tok === 'fileName') params[tok] = 'passport.pdf'
      else params[tok] = 'TEST_VAL'
    })

    const rendered = t(item.key, params)
    // Verify none of the placeholder tokens remain unreplaced
    const unreplacedTokens = rendered.match(/\{[a-zA-Z0-9_]+\}/g)
    assert('DictionarySweep', `Param resolution [${loc}] "${item.key}"`, !unreplacedTokens && rendered !== item.key, `Rendered: "${rendered}"`)
  }
}

// Clean up temporary test keys
delete (messages.ky as any).test
delete (messages.ru as any).test
delete (messages.tr as any).test


// ======================================================================
// SECTION 2: FORMATTERS & REACTIVE STATE TESTING
// ======================================================================
console.log('\n--- SECTION 2: Formatters & Reactive State Testing ---')

const fmt = useFormatters()
const currFmt = useCurrencyFormatter()
const dtFmt = useDateFormatter()
const numFmt = useNumberFormatter()
const statFmt = useStatusLabels()

// 2.1 Currency Formatter across Locales
setLocale('ky')
assert('Currency', 'KY currency symbol is сом', currFmt.getCurrencySymbol('KGS') === 'сом', `Got: ${currFmt.getCurrencySymbol('KGS')}`)
assert('Currency', 'KY formatMoney KGS', currFmt.formatMoney({ amount: '1234.50', currency: 'KGS', formatted: '', minorUnits: 123450 }).includes('сом'), `Got: ${currFmt.formatMoney({ amount: '1234.50', currency: 'KGS', formatted: '', minorUnits: 123450 })}`)

setLocale('tr')
assert('Currency', 'TR currency symbol is som', currFmt.getCurrencySymbol('KGS') === 'som', `Got: ${currFmt.getCurrencySymbol('KGS')}`)
assert('Currency', 'TR formatMoney KGS', currFmt.formatMoney({ amount: '1234.50', currency: 'KGS', formatted: '', minorUnits: 123450 }).includes('som'), `Got: ${currFmt.formatMoney({ amount: '1234.50', currency: 'KGS', formatted: '', minorUnits: 123450 })}`)

setLocale('ru')
assert('Currency', 'RU currency symbol is сом', currFmt.getCurrencySymbol('KGS') === 'сом', `Got: ${currFmt.getCurrencySymbol('KGS')}`)

// Currency Parsing and Minor Units
assert('Currency', 'parseAmount with spaces and currency text', currFmt.parseAmount('  10 500,75 сом ') === 10500.75, `Got: ${currFmt.parseAmount('  10 500,75 сом ')}`)
assert('Currency', 'toMinorUnits from string', currFmt.toMinorUnits('99.99') === 9999, `Got: ${currFmt.toMinorUnits('99.99')}`)
assert('Currency', 'formatMinorUnits', currFmt.formatMinorUnits(9999).includes('99'), `Got: ${currFmt.formatMinorUnits(9999)}`)

// 2.2 Date & Relative Time Formatter
setLocale('ky')
const nowTs = Date.now()
assert('Date', 'Relative: justNow', dtFmt.formatRelative(new Date(nowTs - 5000)) === 'Азыр эле', `Got: "${dtFmt.formatRelative(new Date(nowTs - 5000))}"`)
assert('Date', 'Relative: minutesAgo (15m)', dtFmt.formatRelative(new Date(nowTs - 15 * 60 * 1000)) === '15 мүнөт мурун', `Got: "${dtFmt.formatRelative(new Date(nowTs - 15 * 60 * 1000))}"`)
assert('Date', 'Relative: hoursAgo (3h)', dtFmt.formatRelative(new Date(nowTs - 3 * 3600 * 1000)) === '3 саат мурун', `Got: "${dtFmt.formatRelative(new Date(nowTs - 3 * 3600 * 1000))}"`)
assert('Date', 'Relative: daysAgo (4d)', dtFmt.formatRelative(new Date(nowTs - 4 * 86400 * 1000)) === '4 күн мурун', `Got: "${dtFmt.formatRelative(new Date(nowTs - 4 * 86400 * 1000))}"`)
assert('Date', 'Relative: weeksAgo (2w)', dtFmt.formatRelative(new Date(nowTs - 14 * 86400 * 1000)) === '2 апта мурун', `Got: "${dtFmt.formatRelative(new Date(nowTs - 14 * 86400 * 1000))}"`)
assert('Date', 'Relative: monthsAgo (3m)', dtFmt.formatRelative(new Date(nowTs - 90 * 86400 * 1000)) === '3 ай мурун', `Got: "${dtFmt.formatRelative(new Date(nowTs - 90 * 86400 * 1000))}"`)
assert('Date', 'Relative: yearsAgo (2y)', dtFmt.formatRelative(new Date(nowTs - 730 * 86400 * 1000)) === '2 жыл мурун', `Got: "${dtFmt.formatRelative(new Date(nowTs - 730 * 86400 * 1000))}"`)

// Switch to RU and verify relative time
setLocale('ru')
assert('Date', 'RU Relative: justNow', dtFmt.formatRelative(new Date(nowTs - 5000)) === 'Только что', `Got: "${dtFmt.formatRelative(new Date(nowTs - 5000))}"`)
assert('Date', 'RU Relative: minutesAgo (15m)', dtFmt.formatRelative(new Date(nowTs - 15 * 60 * 1000)) === '15 мин назад', `Got: "${dtFmt.formatRelative(new Date(nowTs - 15 * 60 * 1000))}"`)
assert('Date', 'RU Relative: daysAgo (4d)', dtFmt.formatRelative(new Date(nowTs - 4 * 86400 * 1000)) === '4 дн назад', `Got: "${dtFmt.formatRelative(new Date(nowTs - 4 * 86400 * 1000))}"`)

// Switch to TR and verify relative time
setLocale('tr')
assert('Date', 'TR Relative: justNow', dtFmt.formatRelative(new Date(nowTs - 5000)) === 'Az önce', `Got: "${dtFmt.formatRelative(new Date(nowTs - 5000))}"`)
assert('Date', 'TR Relative: minutesAgo (15m)', dtFmt.formatRelative(new Date(nowTs - 15 * 60 * 1000)) === '15 dk önce', `Got: "${dtFmt.formatRelative(new Date(nowTs - 15 * 60 * 1000))}"`)
assert('Date', 'TR Relative: daysAgo (4d)', dtFmt.formatRelative(new Date(nowTs - 4 * 86400 * 1000)) === '4 gün önce', `Got: "${dtFmt.formatRelative(new Date(nowTs - 4 * 86400 * 1000))}"`)

// 2.3 Status Labels across all domains and all 3 languages
console.log('\n--- Status Labels Domain Verification ---')
const domains = {
  kyc: ['not_started', 'phone_verified', 'id_uploaded', 'ocr_passed', 'verified', 'rejected', 'on_hold', 'pending'],
  auction: ['draft', 'pending_approval', 'active', 'ended_sold', 'ended_unsold', 'ended_reserve_not_met', 'cancelled', 'disputed'],
  payment: ['initial', 'pending', 'processing', 'success', 'failed', 'refunded', 'cancelled', 'disputed'],
  bid: ['pending', 'active', 'outbid', 'winning', 'won', 'lost', 'cancelled'],
  payout: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'aml_review'],
}

for (const loc of ['ky', 'ru', 'tr'] as LocaleKey[]) {
  setLocale(loc)
  for (const [domainName, statuses] of Object.entries(domains)) {
    for (const st of statuses) {
      const method = (statFmt as any)[domainName]
      const label = method(st)
      assert('StatusLabels', `[${loc}] ${domainName}.${st}`, Boolean(label) && label !== `status.${domainName}.${st}`, `Label: "${label}"`)
      
      // Also test global export status
      const globalLabel = (status as any)[domainName](st)
      assert('StatusLabels', `[${loc}] Global status.${domainName}('${st}')`, globalLabel === label, `Got: "${globalLabel}"`)
    }
  }
}

// 2.4 Countdown Composable Reactive & Edge Behavior
console.log('\n--- Countdown Composable Edge & Reactive Testing ---')
setLocale('ky')

// Ended countdown
const cdEnded = useCountdown({ endsAt: new Date(Date.now() - 1000) })
assert('Countdown', 'Ended countdown isEnded is true', cdEnded.countdown.value.isEnded === true, `isEnded: ${cdEnded.countdown.value.isEnded}`)
assert('Countdown', 'Ended countdown text in KY', cdEnded.countdown.value.formatted === 'Аяктады', `formatted: "${cdEnded.countdown.value.formatted}"`)

setLocale('ru')
const cdEndedRu = useCountdown({ endsAt: new Date(Date.now() - 1000) })
assert('Countdown', 'Ended countdown text in RU', cdEndedRu.countdown.value.formatted === 'Завершен', `formatted: "${cdEndedRu.countdown.value.formatted}"`)

setLocale('tr')
const cdEndedTr = useCountdown({ endsAt: new Date(Date.now() - 1000) })
assert('Countdown', 'Ended countdown text in TR', cdEndedTr.countdown.value.formatted === 'Bitti', `formatted: "${cdEndedTr.countdown.value.formatted}"`)

// Countdown with future duration: 2 days, 5 hours
setLocale('ky')
const cdFuture = useCountdown({ endsAt: new Date(Date.now() + (2 * 86400 + 5 * 3600) * 1000) })
assert('Countdown', 'KY Days/Hours format', cdFuture.countdown.value.formatted.includes('күн') && cdFuture.countdown.value.formatted.includes('саат'), `Got: "${cdFuture.countdown.value.formatted}"`)

setLocale('ru')
const cdFutureRu = useCountdown({ endsAt: new Date(Date.now() + (2 * 86400 + 5 * 3600) * 1000) })
assert('Countdown', 'RU Days/Hours format', cdFutureRu.countdown.value.formatted.includes('дней') && cdFutureRu.countdown.value.formatted.includes('часов'), `Got: "${cdFutureRu.countdown.value.formatted}"`)

setLocale('tr')
const cdFutureTr = useCountdown({ endsAt: new Date(Date.now() + (2 * 86400 + 5 * 3600) * 1000) })
assert('Countdown', 'TR Days/Hours format', cdFutureTr.countdown.value.formatted.includes('gün') && cdFutureTr.countdown.value.formatted.includes('saat'), `Got: "${cdFutureTr.countdown.value.formatted}"`)

// 2.5 Reactive State Switching Stress Test (50 Rapid Transitions)
console.log('\n--- Reactive State Switching Stress Test ---')
const switchLocales: LocaleKey[] = ['ky', 'ru', 'tr']
let reactiveSwitchSuccess = true
for (let i = 0; i < 50; i++) {
  const target = switchLocales[i % 3]
  setLocale(target)
  if (locale.value !== target) reactiveSwitchSuccess = false
  if (localStorage.getItem('auktsion_locale') !== target) reactiveSwitchSuccess = false
  if (document.documentElement.lang !== target) reactiveSwitchSuccess = false
}
assert('Reactivity', '50 Rapid Locale Transitions Synchronized', reactiveSwitchSuccess, `Final locale: ${locale.value}`)

// Clean fallback to 'ky'
setLocale('ky')


// ======================================================================
// FINAL SUMMARY
// ======================================================================
console.log('\n======================================================================')
console.log('📊 CHALLENGER 4 TEST SUITE SUMMARY')
console.log('======================================================================')
const totalTests = results.length
const passedTests = results.filter(r => r.status === 'PASS').length
const failedTests = results.filter(r => r.status === 'FAIL').length

console.log(`TOTAL TESTS: ${totalTests}`)
console.log(`PASSED:      ${passedTests}`)
console.log(`FAILED:      ${failedTests}`)

if (failedTests > 0) {
  console.log('\n❌ FAILED TEST DETAILS:')
  results.filter(r => r.status === 'FAIL').forEach(f => {
    console.error(`- [${f.category}] ${f.name}: ${f.details}`)
  })
  process.exit(1)
} else {
  console.log('\n🎉 ALL EMPIRICAL CHALLENGER 4 TESTS PASSED WITH ZERO ERRORS!')
  process.exit(0)
}
