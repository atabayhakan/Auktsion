// scripts/challenger_3_deep_scanner.mjs
import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('CHALLENGER 3: DEEP AST & REGEX CODEBASE AUDITOR');
console.log('====================================================\n');

// 1. Load locale dictionaries
const kyMod = await import('../frontend/src/locales/ky.ts');
const ruMod = await import('../frontend/src/locales/ru.ts');
const trMod = await import('../frontend/src/locales/tr.ts');

const locales = {
  ky: kyMod.default || kyMod,
  ru: ruMod.default || ruMod,
  tr: trMod.default || trMod,
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

const allFiles = walk('frontend/src');
console.log(`Total Source Files to Audit: ${allFiles.length}\n`);

// 1. Scan for all t(...) keys and check resolution
console.log('--- Scanning all t() and $t() call sites ---');
const allTKeys = new Map(); // key -> list of files
let totalTCalls = 0;

for (const file of allFiles) {
  if (file.includes(path.normalize('src/locales/'))) continue;
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative('frontend', file);

  // Match all static string t() calls
  const matches = content.matchAll(/(?:\$t|\bt)\(\s*['"`]([a-zA-Z0-9_.]+)['"`]/g);
  for (const m of matches) {
    totalTCalls++;
    const key = m[1];
    if (!allTKeys.has(key)) {
      allTKeys.set(key, []);
    }
    allTKeys.get(key).push(relPath);
  }
}

console.log(`Discovered ${totalTCalls} total call sites referencing ${allTKeys.size} distinct static translation keys.\n`);

const unresolved = [];
for (const [key, files] of allTKeys.entries()) {
  const inKy = key in flatKy;
  const inRu = key in flatRu;
  const inTr = key in flatTr;

  if (!inKy || !inRu || !inTr) {
    unresolved.push({ key, files: [...new Set(files)], inKy, inRu, inTr });
  }
}

if (unresolved.length > 0) {
  console.error(`❌ FOUND ${unresolved.length} UNRESOLVED TRANSLATION KEYS:`);
  unresolved.forEach(u => {
    console.error(`  - Key: "${u.key}" [KY: ${u.inKy}, RU: ${u.inRu}, TR: ${u.inTr}] in files: ${u.files.join(', ')}`);
  });
} else {
  console.log('✅ 100% of discovered translation keys resolve across KY, RU, and TR dictionaries!\n');
}

// 2. Scan Vue template text for potential untranslated strings
console.log('--- Scanning Vue Templates for Hardcoded Text ---');
const templateSuspicious = [];

const IGNORED_TAGS = ['script', 'style', 'svg', 'path', 'template'];
const BRAND_NAMES_AND_NUMBERS = [
  'Auktsion', 'AUKTSION', 'Visa', 'Mastercard', 'MBank', 'Optima', 'DemirBank', 'ELQR', 'O!Nom', 'Stripe',
  'QR', 'IBAN', 'KYC', 'AML', '2FA', 'SMS', 'URL', 'ID', 'FAQ', 'API', 'UI', 'UX', 'PDF', 'JPEG', 'PNG',
  'VIP', 'BMW', 'Mercedes-Benz', 'Toyota', 'Apple', 'Rolex', 'Sony', 'PlayStation', 'KG', 'USD', 'RUB', 'KGS',
  'SOM', 'SOM/KG', 'KGS/USD', '©', '—', '•', '|', ':', '...', '>', '<', '&', '/', '\\', '$', '₽', ' сом'
];

for (const file of allFiles) {
  if (!file.endsWith('.vue')) continue;
  const relPath = path.relative('frontend', file);
  const content = fs.readFileSync(file, 'utf8');

  // Extract <template>...</template> content
  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
  if (!templateMatch) continue;
  const templateContent = templateMatch[1];

  // Look for text between > and <
  const textMatches = templateContent.matchAll(/>([^<>{}\n\r]+)</g);
  for (const m of textMatches) {
    const rawText = m[1].trim();
    if (!rawText || rawText.length < 2) continue;

    // Filter out common code expressions, numbers, punctuations, brand names
    if (/^[\d\s.,\-+/*%():$₽€#@!?;'"`|&<>=_—•\\[\]{}]+$/.test(rawText)) continue;
    if (BRAND_NAMES_AND_NUMBERS.includes(rawText)) continue;

    // Check if it looks like raw Cyrillic words
    if (/[а-яА-ЯёЁөӨүҮңҢ]{3,}/.test(rawText)) {
      templateSuspicious.push({
        file: relPath,
        text: rawText,
        type: 'Hardcoded Cyrillic in Template'
      });
    }
  }

  // Look for placeholder="..." or title="..." or alt="..." with Cyrillic text
  const attrMatches = templateContent.matchAll(/(?:placeholder|title|alt|aria-label)=["']([^"']+)["']/g);
  for (const m of attrMatches) {
    const rawText = m[1].trim();
    if (/[а-яА-ЯёЁөӨүҮңҢ]{3,}/.test(rawText)) {
      templateSuspicious.push({
        file: relPath,
        text: rawText,
        type: `Hardcoded Cyrillic Attribute`
      });
    }
  }
}

if (templateSuspicious.length > 0) {
  console.warn(`⚠️ Found ${templateSuspicious.length} potential hardcoded template strings:`);
  templateSuspicious.forEach(s => {
    console.warn(`  - [${s.type}] ${s.file}: "${s.text}"`);
  });
} else {
  console.log('✅ Zero hardcoded Cyrillic strings found across all Vue templates!\n');
}

// 3. Scan TS / Script sections for hardcoded Cyrillic alert / toast / error strings
console.log('--- Scanning TypeScript & Script Sections for Hardcoded Text ---');
const scriptSuspicious = [];

for (const file of allFiles) {
  if (file.includes(path.normalize('src/locales/'))) continue;
  if (file.includes(path.normalize('src/data/mock'))) continue; // mock data is expected to have mock lot names
  const relPath = path.relative('frontend', file);
  const content = fs.readFileSync(file, 'utf8');

  // Match string literals with Cyrillic characters
  const strMatches = content.matchAll(/['"`]([^'"`\n\r]*[а-яА-ЯёЁөӨүҮңҢ]{3,}[^'"`\n\r]*)['"`]/g);
  for (const m of strMatches) {
    const str = m[1].trim();
    // Exclude comments or known mock fixtures
    if (str.startsWith('//') || str.startsWith('/*')) continue;
    scriptSuspicious.push({
      file: relPath,
      text: str,
      type: 'Cyrillic String Literal in Script'
    });
  }
}

if (scriptSuspicious.length > 0) {
  console.warn(`⚠️ Found ${scriptSuspicious.length} Cyrillic strings in scripts (non-mock, non-locale):`);
  scriptSuspicious.forEach(s => {
    console.warn(`  - ${s.file}: "${s.text}"`);
  });
} else {
  console.log('✅ Zero Cyrillic strings in scripts outside locales and mock fixtures!\n');
}

// 4. Parity & Count Summary
console.log('====================================================');
console.log('DICTIONARY PARITY & QUALITY SUMMARY');
console.log('====================================================');
console.log(`- Kyrgyz (ky.ts):   ${Object.keys(flatKy).length} keys`);
console.log(`- Russian (ru.ts):  ${Object.keys(flatRu).length} keys`);
console.log(`- Turkish (tr.ts):  ${Object.keys(flatTr).length} keys`);

const totalErrors = unresolved.length + templateSuspicious.length + scriptSuspicious.length;
console.log(`\nTOTAL DISCREPANCIES DETECTED: ${totalErrors}`);
if (totalErrors === 0) {
  console.log('🎉 AUDIT PASSED WITH 100% PERFECT SCORE!');
}
