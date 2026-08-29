import fs from 'fs';
import path from 'path';

const ky = (await import('../frontend/src/locales/ky.ts')).default;
const ru = (await import('../frontend/src/locales/ru.ts')).default;
const tr = (await import('../frontend/src/locales/tr.ts')).default;

function traverseLeaves(obj, prefix = '') {
  const leaves = new Set();
  function walk(curr, pathStr) {
    if (typeof curr === 'object' && curr !== null && !Array.isArray(curr)) {
      for (const key of Object.keys(curr)) {
        walk(curr[key], pathStr ? `${pathStr}.${key}` : key);
      }
    } else {
      leaves.add(pathStr);
    }
  }
  walk(obj, prefix);
  return leaves;
}

const kyLeaves = traverseLeaves(ky);
const ruLeaves = traverseLeaves(ru);
const trLeaves = traverseLeaves(tr);

// Check all files in frontend/src
function getAllFiles(dir, exts = ['.vue', '.ts', '.js']) {
  let files = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = getAllFiles('frontend/src');

// 1. Dynamic t(`...`) calls audit
const dynamicTCalls = [];
for (const file of allFiles) {
  const rel = path.relative('.', file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const regex = /(?:\$t|\bt)\s*\(\s*`([^`]+)`/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      dynamicTCalls.push({
        file: rel,
        line: idx + 1,
        expr: match[1],
        raw: line.trim()
      });
    }
  });
}

console.log(`=== DYNAMIC t(...) CALLS AUDIT (${dynamicTCalls.length} found) ===`);
for (const item of dynamicTCalls) {
  console.log(`- [${item.file}:${item.line}] \`${item.expr}\``);
}

// 2. Check known dynamic patterns
// Check categories keys: `categories.${slug}`
const expectedCategories = ['cars', 'real-estate', 'electronics', 'jewelry', 'art', 'machinery'];
const missingCategoryKeys = [];
for (const cat of expectedCategories) {
  if (!kyLeaves.has(`categories.${cat}`)) missingCategoryKeys.push(`KY: categories.${cat}`);
  if (!ruLeaves.has(`categories.${cat}`)) missingCategoryKeys.push(`RU: categories.${cat}`);
  if (!trLeaves.has(`categories.${cat}`)) missingCategoryKeys.push(`TR: categories.${cat}`);
}
console.log(`\nCategory keys check:`, missingCategoryKeys.length === 0 ? 'All 6 category keys exist in KY, RU, TR ✅' : missingCategoryKeys);

// Check cities keys: `cities.${city}`
const expectedCities = ['bishkek', 'osh', 'jalalAbad', 'karakol', 'naryn', 'talas', 'batken', 'cholponAta', 'kant', 'tokmok'];
const missingCityKeys = [];
for (const c of expectedCities) {
  if (!kyLeaves.has(`cities.${c}`)) missingCityKeys.push(`KY: cities.${c}`);
  if (!ruLeaves.has(`cities.${c}`)) missingCityKeys.push(`RU: cities.${c}`);
  if (!trLeaves.has(`cities.${c}`)) missingCityKeys.push(`TR: cities.${c}`);
}
console.log(`Cities keys check:`, missingCityKeys.length === 0 ? 'All 10 city keys exist in KY, RU, TR ✅' : missingCityKeys);

// Check time units: `time.${unit}`
const expectedTimeUnits = ['days', 'hours', 'minutes', 'seconds', 'ago', 'justNow', 'minutesAgo', 'hoursAgo', 'daysAgo'];
const missingTimeKeys = [];
for (const tu of expectedTimeUnits) {
  if (!kyLeaves.has(`time.${tu}`)) missingTimeKeys.push(`KY: time.${tu}`);
  if (!ruLeaves.has(`time.${tu}`)) missingTimeKeys.push(`RU: time.${tu}`);
  if (!trLeaves.has(`time.${tu}`)) missingTimeKeys.push(`TR: time.${tu}`);
}
console.log(`Time keys check:`, missingTimeKeys.length === 0 ? 'All expected time keys exist in KY, RU, TR ✅' : missingTimeKeys);

// Check status keys
const expectedStatusTypes = ['kyc', 'auction', 'bid', 'payment', 'payout'];
console.log(`Status keys check:`);
for (const st of expectedStatusTypes) {
  console.log(`  - status.${st} in KY has ${Object.keys(ky.status[st] || {}).length} keys, RU has ${Object.keys(ru.status[st] || {}).length} keys, TR has ${Object.keys(tr.status[st] || {}).length} keys`);
}

// 3. Inspect stores for hardcoded alerts / errors
console.log(`\n=== STORES AUDIT (frontend/src/stores/*) ===`);
const storeFiles = getAllFiles('frontend/src/stores');
for (const sf of storeFiles) {
  const rel = path.relative('.', sf).replace(/\\/g, '/');
  const content = fs.readFileSync(sf, 'utf8');
  console.log(`- ${rel}: ${content.length} bytes`);
  // Look for Cyrillic or hardcoded user messages
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/[\u0400-\u04FF]/.test(line)) {
      console.log(`  [CYRILLIC at L${idx+1}]: ${line.trim()}`);
    }
  });
}
