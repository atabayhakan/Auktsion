// scripts/forensic_auditor_2_deep_check.mjs
import fs from 'fs';
import path from 'path';

async function forensicAudit() {
  console.log('====================================================');
  console.log('🛡️ FORENSIC AUDITOR 2: INDEPENDENT INTEGRITY AUDIT');
  console.log('====================================================\n');

  let violations = [];
  let warnings = [];

  // Phase 1: Load Locales
  const ky = (await import('../frontend/src/locales/ky.ts')).default;
  const ru = (await import('../frontend/src/locales/ru.ts')).default;
  const tr = (await import('../frontend/src/locales/tr.ts')).default;

  function flatten(obj, prefix = '') {
    const res = {};
    for (const [k, v] of Object.entries(obj)) {
      const p = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        Object.assign(res, flatten(v, p));
      } else {
        res[p] = v;
      }
    }
    return res;
  }

  const flatKy = flatten(ky);
  const flatRu = flatten(ru);
  const flatTr = flatten(tr);

  const kyKeys = Object.keys(flatKy);
  const ruKeys = Object.keys(flatRu);
  const trKeys = Object.keys(flatTr);

  console.log(`[CHECK 1] Key Symmetry & Counts:`);
  console.log(`  KY: ${kyKeys.length} | RU: ${ruKeys.length} | TR: ${trKeys.length}`);

  if (kyKeys.length !== 1090 || ruKeys.length !== 1090 || trKeys.length !== 1090) {
    violations.push(`Expected 1,090 keys in each locale, found KY: ${kyKeys.length}, RU: ${ruKeys.length}, TR: ${trKeys.length}`);
  }

  // Key symmetry
  const allKeys = Array.from(new Set([...kyKeys, ...ruKeys, ...trKeys]));
  for (const k of allKeys) {
    if (flatKy[k] === undefined) violations.push(`Key '${k}' missing in ky.ts`);
    if (flatRu[k] === undefined) violations.push(`Key '${k}' missing in ru.ts`);
    if (flatTr[k] === undefined) violations.push(`Key '${k}' missing in tr.ts`);
  }

  // [CHECK 2] Placeholder / Dummy / Facade Strings
  console.log(`\n[CHECK 2] Dummy / Placeholder Detection:`);
  const suspiciousRegex = /\b(todo|dummy|placeholder|lorem|ipsum|asdf|qwerty|test_key|null|undefined|nan)\b/i;
  for (const [lang, flat] of Object.entries({ ky: flatKy, ru: flatRu, tr: flatTr })) {
    for (const [k, v] of Object.entries(flat)) {
      if (typeof v !== 'string') {
        violations.push(`Non-string value in ${lang} key '${k}': ${typeof v}`);
        continue;
      }
      if (v.trim() === '') {
        violations.push(`Empty string in ${lang} key '${k}'`);
      }
      // Check for placeholder words in value
      if (suspiciousRegex.test(v)) {
        // Exclude legitimate words that might contain substrings if any
        warnings.push(`Suspicious token in ${lang} key '${k}': "${v}"`);
      }
    }
  }

  // [CHECK 3] Cyrillic Leakage in Turkish Locale
  console.log(`\n[CHECK 3] Language Purity / Character Set Analysis:`);
  const cyrillicRegex = /[\u0400-\u04FF]/;
  let trCyrillicViolations = 0;
  for (const [k, v] of Object.entries(flatTr)) {
    if (typeof v === 'string' && cyrillicRegex.test(v)) {
      // Cyrillic in Turkish dictionary is a violation
      violations.push(`Cyrillic character detected in Turkish locale '${k}': "${v}"`);
      trCyrillicViolations++;
    }
  }
  if (trCyrillicViolations === 0) {
    console.log(`  ✅ Turkish dictionary (tr.ts) has 0 Cyrillic characters across all 1,090 keys.`);
  }

  // [CHECK 4] Slang & Typo Audit in Kyrgyz Locale & Domain
  console.log(`\n[CHECK 4] Slang & Typo Eradication Audit:`);
  const prohibitedKyTerms = [
    'босого',     // Incorrect KYC not_started
    'чекирилди',  // Typo for четке кагылды
    'бекрилди',   // Typo for жокко чыгарылды
    'күтөп жатат',// Typo for күтүп жатат
    'коток',      // Vulgar profanity
    'сигейин',    // Vulgar profanity
    'далбай',     // Vulgar profanity
    'энен',       // Vulgar profanity
    'ам',         // Vulgar profanity
    'чоток',      // Slang
  ];

  for (const [k, v] of Object.entries(flatKy)) {
    if (typeof v === 'string') {
      const lower = v.toLowerCase();
      for (const bad of prohibitedKyTerms) {
        if (lower.includes(bad)) {
          // Special check: ensure we don't false positive on common words like "айланам", "салам", etc.
          const wordBoundary = new RegExp(`(^|[^а-яёөүң])${bad}([^а-яёөүң]|$)`, 'i');
          if (wordBoundary.test(lower)) {
            violations.push(`Prohibited slang/typo "${bad}" found in ky.ts key '${k}': "${v}"`);
          }
        }
      }
    }
  }

  // Check domain.ts file content directly
  const domainContent = fs.readFileSync('frontend/src/types/domain.ts', 'utf8').toLowerCase();
  for (const bad of prohibitedKyTerms) {
    const wordBoundary = new RegExp(`(^|[^а-яёөүң])${bad}([^а-яёөүң]|$)`, 'i');
    if (wordBoundary.test(domainContent)) {
      violations.push(`Prohibited slang/typo "${bad}" found in frontend/src/types/domain.ts`);
    }
  }

  // Verify specific corrected keys in ky.ts
  const kyVerifications = [
    { key: 'status.kyc.id_uploaded', expected: 'Өздүк документ жүктөлдү' },
    { key: 'status.kyc.not_started', expected: 'Башталган жок' },
    { key: 'status.kyc.rejected', expected: 'Четке кагылды' },
    { key: 'status.kyc.on_hold', expected: 'Күтүп жатат' },
    { key: 'status.bid.pending', expected: 'Күтүп жатат' },
    { key: 'status.auction.cancelled', expected: 'Жокко чыгарылды' },
    { key: 'status.bid.cancelled', expected: 'Жокко чыгарылды' },
    { key: 'status.payment.cancelled', expected: 'Жокко чыгарылды' },
    { key: 'status.payout.cancelled', expected: 'Жокко чыгарылды' },
  ];

  for (const item of kyVerifications) {
    if (flatKy[item.key] !== item.expected) {
      violations.push(`Key '${item.key}' in ky.ts expected "${item.expected}", found "${flatKy[item.key]}"`);
    } else {
      console.log(`  ✅ ky.ts['${item.key}'] = "${flatKy[item.key]}" (Verified)`);
    }
  }

  // [CHECK 5] Parameter Interpolation Key Parity
  console.log(`\n[CHECK 5] Parameter Interpolation Symmetrical Extraction:`);
  let paramErrors = 0;
  for (const k of allKeys) {
    const pKy = (flatKy[k].match(/\{[a-zA-Z0-9_]+\}/g) || []).sort().join(',');
    const pRu = (flatRu[k].match(/\{[a-zA-Z0-9_]+\}/g) || []).sort().join(',');
    const pTr = (flatTr[k].match(/\{[a-zA-Z0-9_]+\}/g) || []).sort().join(',');
    if (pKy !== pRu || pKy !== pTr) {
      violations.push(`Parameter mismatch in '${k}': KY(${pKy}) vs RU(${pRu}) vs TR(${pTr})`);
      paramErrors++;
    }
  }
  if (paramErrors === 0) {
    console.log(`  ✅ 100% parameter symmetry across all parameterized keys.`);
  }

  // [CHECK 6] Distinct Language Lexical Uniqueness
  console.log(`\n[CHECK 6] Lexical Language Diversity Check:`);
  let identicalKyRu = 0;
  let identicalKyTr = 0;
  for (const k of allKeys) {
    // Some proper nouns / abbreviations like 'MBank', 'KGS', '$', '2FA', 'IBAN' can match
    if (flatKy[k] === flatRu[k] && flatKy[k].length > 6) {
      identicalKyRu++;
    }
    if (flatKy[k] === flatTr[k] && flatKy[k].length > 6) {
      identicalKyTr++;
    }
  }
  console.log(`  - Identical string count KY vs RU (>6 chars): ${identicalKyRu}/${allKeys.length}`);
  console.log(`  - Identical string count KY vs TR (>6 chars): ${identicalKyTr}/${allKeys.length}`);
  if (identicalKyRu > 200 || identicalKyTr > 100) {
    violations.push(`Abnormally high identical translation overlap across languages (KY-RU: ${identicalKyRu}, KY-TR: ${identicalKyTr})`);
  } else {
    console.log(`  ✅ Translation sets exhibit genuine linguistic distinctiveness.`);
  }

  // Summary
  console.log('\n====================================================');
  console.log(`AUDIT SUMMARY: ${violations.length} VIOLATIONS, ${warnings.length} WARNINGS`);
  console.log('====================================================');

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(w => console.log('  ⚠️ ' + w));
  }

  if (violations.length > 0) {
    console.error('\nViolations:');
    violations.forEach(v => console.error('  ❌ ' + v));
    process.exit(1);
  } else {
    console.log('\n🎉 FORENSIC AUDIT PASSED: ZERO INTEGRITY VIOLATIONS DETECTED!');
    process.exit(0);
  }
}

forensicAudit().catch(err => {
  console.error('Fatal error during forensic audit:', err);
  process.exit(1);
});
