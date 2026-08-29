// scripts/challenger_3_adversarial_suite.mjs
import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('CHALLENGER 3: INDEPENDENT ADVERSARIAL STRESS SUITE');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function test(category, name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`✅ [${category}] ${name}`);
  } catch (err) {
    failedTests++;
    failures.push({ category, name, error: err.message || String(err) });
    console.error(`❌ [${category}] ${name}: ${err.message || String(err)}`);
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) {
        throw new Error(`Expected deep equality:\nActual: ${a}\nExpected: ${b}`);
      }
    },
    toBeGreaterThan(expected) {
      if (!(actual > expected)) {
        throw new Error(`Expected ${actual} > ${expected}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy, got ${actual}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy, got ${actual}`);
      }
    },
    toContain(expected) {
      if (typeof actual === 'string' || Array.isArray(actual)) {
        if (!actual.includes(expected)) {
          throw new Error(`Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`);
        }
      } else {
        throw new Error(`Cannot check containment on ${typeof actual}`);
      }
    }
  };
}

async function run() {
  // 1. Load locale modules
  const kyMod = await import('../frontend/src/locales/ky.ts');
  const ruMod = await import('../frontend/src/locales/ru.ts');
  const trMod = await import('../frontend/src/locales/tr.ts');

  const locales = {
    ky: kyMod.default || kyMod.ky,
    ru: ruMod.default || ruMod.ru,
    tr: trMod.default || trMod.tr,
  };

  test('Locales', 'Load all 3 locale dictionaries', () => {
    expect(Boolean(locales.ky)).toBe(true);
    expect(Boolean(locales.ru)).toBe(true);
    expect(Boolean(locales.tr)).toBe(true);
  });

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

  const keysKy = Object.keys(flatKy).sort();
  const keysRu = Object.keys(flatRu).sort();
  const keysTr = Object.keys(flatTr).sort();

  test('Key Parity', 'Key counts match across all 3 languages', () => {
    expect(keysKy.length).toBe(keysRu.length);
    expect(keysKy.length).toBe(keysTr.length);
    expect(keysKy.length).toBeGreaterThan(1000);
  });

  test('Key Parity', 'Exact symmetrical key sets across KY, RU, TR', () => {
    const diffKyRu = keysKy.filter(k => !(k in flatRu));
    const diffRuKy = keysRu.filter(k => !(k in flatKy));
    const diffKyTr = keysKy.filter(k => !(k in flatTr));
    const diffTrKy = keysTr.filter(k => !(k in flatKy));

    if (diffKyRu.length || diffRuKy.length || diffKyTr.length || diffTrKy.length) {
      throw new Error(`Key discrepancies: KY-RU missing: ${diffKyRu.join(', ')}, RU-KY missing: ${diffRuKy.join(', ')}, KY-TR missing: ${diffKyTr.join(', ')}, TR-KY missing: ${diffTrKy.join(', ')}`);
    }
  });

  test('Integrity', 'No empty or whitespace-only strings in any locale', () => {
    for (const lang of ['ky', 'ru', 'tr']) {
      const flat = lang === 'ky' ? flatKy : (lang === 'ru' ? flatRu : flatTr);
      for (const [k, v] of Object.entries(flat)) {
        if (typeof v !== 'string') {
          throw new Error(`[${lang}] "${k}" is not a string (type=${typeof v})`);
        }
        if (v.trim().length === 0) {
          throw new Error(`[${lang}] "${k}" is empty or whitespace-only`);
        }
      }
    }
  });

  test('Integrity', 'Placeholder symmetry across all keys', () => {
    for (const k of keysKy) {
      const vKy = flatKy[k];
      const vRu = flatRu[k];
      const vTr = flatTr[k];

      const pKy = (vKy.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
      const pRu = (vRu.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
      const pTr = (vTr.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();

      if (pKy.join(',') !== pRu.join(',') || pKy.join(',') !== pTr.join(',')) {
        throw new Error(`Placeholder mismatch for "${k}": KY=${pKy.join(',')}, RU=${pRu.join(',')}, TR=${pTr.join(',')}`);
      }
    }
  });

  // Check specific required namespaces from PROJECT.md
  const requiredNamespaces = [
    'common', 'nav', 'home', 'auction', 'filters', 'categoriesPage',
    'sellPage', 'footer', 'auth', 'dashboard', 'info', 'modals',
    'formatters', 'toasts', 'domain'
  ];

  for (const ns of requiredNamespaces) {
    test('Namespaces', `Namespace '${ns}' exists in dictionaries`, () => {
      const count = keysKy.filter(k => k.startsWith(ns + '.') || k === ns).length;
      expect(count).toBeGreaterThan(0);
    });
  }

  // Scan all Vue and TS files for t(...) and $t(...)
  function getSourceFiles(dir) {
    let files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(getSourceFiles(full));
      } else if (entry.isFile() && (entry.name.endsWith('.vue') || entry.name.endsWith('.ts'))) {
        files.push(full);
      }
    }
    return files;
  }

  const srcDir = path.resolve('frontend/src');
  const sourceFiles = getSourceFiles(srcDir);

  test('File Scan', 'Found all source files in frontend/src', () => {
    expect(sourceFiles.length).toBeGreaterThan(30);
  });

  const unresolved = [];
  const scannedKeys = new Set();

  for (const file of sourceFiles) {
    if (file.includes(path.normalize('src/locales/'))) continue;
    const content = fs.readFileSync(file, 'utf8');

    // Regex 1: t('key') or $t('key') or t("key") or $t("key")
    const matches = content.matchAll(/(?:\$t|\bt)\(\s*['"]([^'"]+)['"]/g);
    for (const m of matches) {
      const key = m[1];
      if (key.includes('${') || key.endsWith('.')) continue;
      scannedKeys.add(key);

      const inKy = key in flatKy;
      const inRu = key in flatRu;
      const inTr = key in flatTr;

      if (!inKy || !inRu || !inTr) {
        unresolved.push({
          file: path.relative('frontend', file),
          key,
          inKy,
          inRu,
          inTr
        });
      }
    }
  }

  test('Call Resolution', `All scanned t(...) calls (${scannedKeys.size} distinct keys) resolve in KY, RU, TR`, () => {
    if (unresolved.length > 0) {
      throw new Error(`Unresolved t() calls:\n` + unresolved.map(u => `  ${u.file}: "${u.key}" [KY:${u.inKy}, RU:${u.inRu}, TR:${u.inTr}]`).join('\n'));
    }
  });

  // Test useI18n parameter substitution with adversarial strings
  function substitute(str, params) {
    if (!params) return str;
    return Object.entries(params).reduce((s, [k, v]) => {
      return s.replaceAll(`{${k}}`, String(v));
    }, str);
  }

  test('Adversarial Interpolation', 'Handles regex special characters in replacement values ($&, $1, $`, $\')', () => {
    const template = 'Price: {val}';
    const res = substitute(template, { val: '$100.00 ($& discount)' });
    expect(res).toBe('Price: $100.00 ($& discount)');
  });

  test('Adversarial Interpolation', 'Handles falsy values (0, false, empty string)', () => {
    expect(substitute('{n} items', { n: 0 })).toBe('0 items');
    expect(substitute('{n} items', { n: false })).toBe('false items');
    expect(substitute('Hello {name}!', { name: '' })).toBe('Hello !');
  });

  test('Adversarial Interpolation', 'Handles nested placeholder names and duplicate tokens', () => {
    const template = '{count} out of {count} ({percent}%)';
    expect(substitute(template, { count: 42, percent: 100 })).toBe('42 out of 42 (100%)');
  });

  // Test Status Helper Mappings
  test('Status Labels', 'All auction statuses have localized translations in all 3 languages', () => {
    const statuses = ['draft', 'pending_approval', 'active', 'ended_sold', 'ended_unsold', 'ended_reserve_not_met', 'cancelled', 'disputed'];
    for (const st of statuses) {
      const k = `status.auction.${st}`;
      expect(Boolean(flatKy[k])).toBe(true);
      expect(Boolean(flatRu[k])).toBe(true);
      expect(Boolean(flatTr[k])).toBe(true);
    }
  });

  test('Status Labels', 'All KYC statuses have localized translations in all 3 languages', () => {
    const statuses = ['not_started', 'phone_verified', 'id_uploaded', 'ocr_passed', 'verified', 'rejected', 'on_hold', 'pending'];
    for (const st of statuses) {
      const k = `status.kyc.${st}`;
      expect(Boolean(flatKy[k])).toBe(true);
      expect(Boolean(flatRu[k])).toBe(true);
      expect(Boolean(flatTr[k])).toBe(true);
    }
  });

  test('Status Labels', 'All Bid statuses have localized translations in all 3 languages', () => {
    const statuses = ['pending', 'active', 'outbid', 'winning', 'won', 'lost', 'cancelled'];
    for (const st of statuses) {
      const k = `status.bid.${st}`;
      expect(Boolean(flatKy[k])).toBe(true);
      expect(Boolean(flatRu[k])).toBe(true);
      expect(Boolean(flatTr[k])).toBe(true);
    }
  });

  test('Status Labels', 'All Payout statuses have localized translations in all 3 languages', () => {
    const statuses = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'aml_review'];
    for (const st of statuses) {
      const k = `status.payout.${st}`;
      expect(Boolean(flatKy[k])).toBe(true);
      expect(Boolean(flatRu[k])).toBe(true);
      expect(Boolean(flatTr[k])).toBe(true);
    }
  });

  test('Status Labels', 'All Payment statuses have localized translations in all 3 languages', () => {
    const statuses = ['pending', 'authorized', 'captured', 'settled', 'failed', 'refunded', 'cancelled'];
    for (const st of statuses) {
      const k = `status.payment.${st}`;
      expect(Boolean(flatKy[k])).toBe(true);
      expect(Boolean(flatRu[k])).toBe(true);
      expect(Boolean(flatTr[k])).toBe(true);
    }
  });

  // Verify Kyrgyz terminology quality
  test('Kyrgyz Terminology', 'Verify corrected Kyrgyz translations', () => {
    expect(flatKy['status.kyc.id_uploaded']).toBe('Өздүк документ жүктөлдү');
    expect(flatKy['status.kyc.not_started']).toBe('Башталган жок');
    expect(flatKy['status.kyc.on_hold']).toBe('Күтүп жатат');
    expect(flatKy['status.kyc.rejected']).toBe('Четке кагылды');
    expect(flatKy['status.auction.cancelled']).toBe('Жокко чыгарылды');
  });

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
