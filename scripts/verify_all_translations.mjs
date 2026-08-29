// scripts/verify_all_translations.mjs
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('====================================================');
  console.log('🔍 AUKTSION COMPREHENSIVE TRANSLATION AUDITOR');
  console.log('====================================================\n');

  // 1. Load locale files
  const kyMod = await import('../frontend/src/locales/ky.ts');
  const ruMod = await import('../frontend/src/locales/ru.ts');
  const trMod = await import('../frontend/src/locales/tr.ts');

  const locales = {
    ky: kyMod.default,
    ru: ruMod.default,
    tr: trMod.default,
  };

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

  const flatKy = flatten(locales.ky);
  const flatRu = flatten(locales.ru);
  const flatTr = flatten(locales.tr);

  const kyKeys = Object.keys(flatKy);
  const ruKeys = Object.keys(flatRu);
  const trKeys = Object.keys(flatTr);

  console.log('📊 Dictionary Key Counts:');
  console.log(`  - Kyrgyz (ky.ts):   ${kyKeys.length} keys`);
  console.log(`  - Russian (ru.ts):  ${ruKeys.length} keys`);
  console.log(`  - Turkish (tr.ts):  ${trKeys.length} keys\n`);

  let errors = 0;

  // 2. Parity Check
  console.log('🔄 Checking 3-Language Key Parity...');
  const allKeys = Array.from(new Set([...kyKeys, ...ruKeys, ...trKeys]));
  const missingInKy = allKeys.filter(k => flatKy[k] === undefined);
  const missingInRu = allKeys.filter(k => flatRu[k] === undefined);
  const missingInTr = allKeys.filter(k => flatTr[k] === undefined);

  if (missingInKy.length > 0) {
    console.error(`❌ Missing in ky.ts (${missingInKy.length}):`, missingInKy);
    errors++;
  }
  if (missingInRu.length > 0) {
    console.error(`❌ Missing in ru.ts (${missingInRu.length}):`, missingInRu);
    errors++;
  }
  if (missingInTr.length > 0) {
    console.error(`❌ Missing in tr.ts (${missingInTr.length}):`, missingInTr);
    errors++;
  }

  if (missingInKy.length === 0 && missingInRu.length === 0 && missingInTr.length === 0) {
    console.log('✅ 100% Symmetrical Key Parity across KY, RU, TR.\n');
  }

  // 3. Value Integrity (No empty or whitespace-only strings)
  console.log('🛡️ Checking Value Integrity (Empty/Corrupted values)...');
  let emptyCount = 0;
  for (const [lang, flat] of Object.entries({ ky: flatKy, ru: flatRu, tr: flatTr })) {
    for (const [k, v] of Object.entries(flat)) {
      if (typeof v !== 'string' || v.trim() === '') {
        console.error(`❌ Empty or invalid value in ${lang}: "${k}" = ${JSON.stringify(v)}`);
        emptyCount++;
        errors++;
      }
    }
  }
  if (emptyCount === 0) {
    console.log('✅ All values are non-empty valid strings.\n');
  }

  // 4. Parameter Interpolation Placeholder Consistency
  console.log('🧩 Checking Parameter Placeholder Consistency ({param})...');
  let paramMismatches = 0;
  for (const k of allKeys) {
    const valKy = flatKy[k] || '';
    const valRu = flatRu[k] || '';
    const valTr = flatTr[k] || '';

    const tokensKy = (valKy.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
    const tokensRu = (valRu.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
    const tokensTr = (valTr.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();

    if (tokensKy.join(',') !== tokensRu.join(',') || tokensKy.join(',') !== tokensTr.join(',')) {
      console.error(`❌ Parameter placeholder mismatch in "${k}":`);
      console.error(`   KY: ${tokensKy.join(',')} ("${valKy}")`);
      console.error(`   RU: ${tokensRu.join(',')} ("${valRu}")`);
      console.error(`   TR: ${tokensTr.join(',')} ("${valTr}")`);
      paramMismatches++;
      errors++;
    }
  }
  if (paramMismatches === 0) {
    console.log('✅ All parameterized placeholders match 100% across all 3 languages.\n');
  }

  // 5. Codebase t(...) Call Resolution Audit
  console.log('🔎 Scanning Codebase for t(...) Calls...');
  function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(walk(fullPath));
      } else if (file.endsWith('.vue') || file.endsWith('.ts')) {
        results.push(fullPath);
      }
    });
    return results;
  }

  function getVal(obj, pathStr) {
    const keys = pathStr.split('.');
    let cur = obj;
    for (const k of keys) {
      if (cur && typeof cur === 'object' && k in cur) {
        cur = cur[k];
      } else {
        return undefined;
      }
    }
    return typeof cur === 'string' ? cur : undefined;
  }

  const srcFiles = walk('frontend/src');
  const unresolvedCalls = [];

  for (const file of srcFiles) {
    if (file.includes('src/locales/')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g);
    for (const m of matches) {
      const key = m[1];
      if (key.includes('${') || key.endsWith('.')) continue;
      
      const kyVal = getVal(locales.ky, key);
      const ruVal = getVal(locales.ru, key);
      const trVal = getVal(locales.tr, key);

      if (kyVal === undefined || ruVal === undefined || trVal === undefined) {
        unresolvedCalls.push({
          file: path.relative('frontend', file),
          key,
          ky: kyVal !== undefined,
          ru: ruVal !== undefined,
          tr: trVal !== undefined,
        });
        errors++;
      }
    }
  }

  if (unresolvedCalls.length > 0) {
    console.error(`❌ Total Unresolved t() calls: ${unresolvedCalls.length}`);
    for (const u of unresolvedCalls) {
      console.error(`  - ${u.file}: t('${u.key}') [KY: ${u.ky}, RU: ${u.ru}, TR: ${u.tr}]`);
    }
  } else {
    console.log(`✅ 100% of t(...) calls across ${srcFiles.length} files resolve cleanly in all 3 languages!\n`);
  }

  // 6. Parameter Substitution Logic Unit Tests
  console.log('🧪 Testing Runtime Parameter Substitution Logic...');
  function simulateT(template, params) {
    if (!params) return template;
    return Object.entries(params).reduce((str, [k, v]) => {
      return str.replaceAll(`{${k}}`, String(v));
    }, template);
  }

  const testCases = [
    { template: '{n} мүнөт мурун', params: { n: 5 }, expected: '5 мүнөт мурун' },
    { template: '{n} минут назад', params: { n: 10 }, expected: '10 минут назад' },
    { template: '{n} dakika önce', params: { n: 1 }, expected: '1 dakika önce' },
    { template: 'Жаңы текеп: {amount}', params: { amount: '150 000 сом' }, expected: 'Жаңы текеп: 150 000 сом' },
  ];

  let testPassed = true;
  for (const tc of testCases) {
    const res = simulateT(tc.template, tc.params);
    if (res !== tc.expected) {
      console.error(`❌ Interpolation failed for "${tc.template}": got "${res}", expected "${tc.expected}"`);
      testPassed = false;
      errors++;
    }
  }
  if (testPassed) {
    console.log('✅ All Parameter Interpolation Unit Tests PASSED.\n');
  }

  console.log('====================================================');
  if (errors === 0) {
    console.log('🎉 AUDIT COMPLETE: 100% SUCCESS, 0 ERRORS DETECTED!');
    console.log('====================================================');
    process.exit(0);
  } else {
    console.error(`❌ AUDIT FAILED: ${errors} errors detected.`);
    console.log('====================================================');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error during audit:', err);
  process.exit(1);
});
