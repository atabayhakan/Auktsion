import fs from 'fs';
import path from 'path';
import ts from '../frontend/node_modules/typescript/lib/typescript.js';

// Load dictionary keys
const kyModule = (await import('../frontend/src/locales/ky.ts')).default;
const ruModule = (await import('../frontend/src/locales/ru.ts')).default;
const trModule = (await import('../frontend/src/locales/tr.ts')).default;

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

const validKeys = traverseLeaves(kyModule);

// Collect all files in frontend/src
function getAllFiles(dir, exts = ['.vue', '.ts']) {
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

const allSrcFiles = getAllFiles('frontend/src');
console.log(`Found ${allSrcFiles.length} files in frontend/src to audit.\n`);

// 1. Cyrillic scanner across all files EXCEPT frontend/src/locales/*
const cyrillicRegex = /[\u0400-\u04FF]/;
const cyrillicFindings = [];

for (const filePath of allSrcFiles) {
  const relPath = path.relative('.', filePath).replace(/\\/g, '/');
  if (relPath.startsWith('frontend/src/locales/')) {
    continue; // Locales are expected to have Cyrillic for KY/RU
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Check if line contains Cyrillic
    if (cyrillicRegex.test(line)) {
      // Check if it's not a pure comment
      const trimmed = line.trim();
      const isComment = trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
      cyrillicFindings.push({
        file: relPath,
        line: idx + 1,
        content: trimmed,
        isComment
      });
    }
  });
}

console.log(`=== CYRILLIC AUDIT OUTSIDE LOCALES ===`);
console.log(`Total Cyrillic occurrences found: ${cyrillicFindings.length}`);
if (cyrillicFindings.length > 0) {
  console.log(JSON.stringify(cyrillicFindings, null, 2));
} else {
  console.log('✅ No raw Cyrillic strings found outside locales directory!');
}

// 2. Scan t('...') calls and verify against dictionary
const tCalls = [];
const dynamicTCalls = [];
const invalidTCalls = [];

const tCallRegex = /(?:\$t|(?:\buseI18n\(\)\.)?t)\s*\(\s*(['"`])([^'"`\n]+)\1/g;
const templateRegex = /(?:t|\$t)\s*\(\s*(['"`])([^'"`\n]+)\1/g;

for (const filePath of allSrcFiles) {
  const relPath = path.relative('.', filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Look for static t('something')
    let match;
    const lineRegex = /(?:\$t|\bt)\s*\(\s*(['"])([^'"]+)\1/g;
    while ((match = lineRegex.exec(line)) !== null) {
      const key = match[2];
      tCalls.push({ file: relPath, line: idx + 1, key });

      if (!validKeys.has(key)) {
        invalidTCalls.push({ file: relPath, line: idx + 1, key, rawLine: line.trim() });
      }
    }

    // Look for dynamic t(`something.${...}`)
    const dynamicRegex = /(?:\$t|\bt)\s*\(\s*`([^`]+)`/g;
    while ((match = dynamicRegex.exec(line)) !== null) {
      const templateStr = match[1];
      dynamicTCalls.push({ file: relPath, line: idx + 1, templateStr, rawLine: line.trim() });
    }
  });
}

console.log(`\n=== T(...) KEY USAGE AUDIT ===`);
console.log(`Total static t(...) calls analyzed: ${tCalls.length}`);
console.log(`Total dynamic t(...) calls analyzed: ${dynamicTCalls.length}`);
console.log(`Invalid static t(...) calls (not in dictionary): ${invalidTCalls.length}`);

if (invalidTCalls.length > 0) {
  console.log(JSON.stringify(invalidTCalls, null, 2));
} else {
  console.log('✅ All static t(...) calls map to valid dictionary keys!');
}

console.log(`\nDynamic t(...) calls breakdown:`);
for (const dt of dynamicTCalls) {
  console.log(`- [${dt.file}:${dt.line}] \`${dt.templateStr}\` in: ${dt.rawLine}`);
}

// 3. Scan for Hardcoded English text in Vue templates and user-facing attributes
// We check for attributes like placeholder="...", title="...", alt="...", aria-label="..." that are static (not :placeholder, etc.)
const attributeAudit = [];
const staticAttrRegex = /\s(placeholder|title|alt|aria-label)\s*=\s*"([^"]+)"/g;

for (const filePath of allSrcFiles) {
  if (!filePath.endsWith('.vue')) continue;
  const relPath = path.relative('.', filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    let match;
    while ((match = staticAttrRegex.exec(line)) !== null) {
      const attr = match[1];
      const val = match[2];
      // If val is not empty and not pure icon/code/symbol
      if (val.trim() && !val.startsWith('{') && !val.startsWith('/') && !val.startsWith('#')) {
        attributeAudit.push({
          file: relPath,
          line: idx + 1,
          attr,
          val,
          rawLine: line.trim()
        });
      }
    }
  });
}

console.log(`\n=== STATIC ATTRIBUTES AUDIT (placeholder, alt, title, aria-label) ===`);
console.log(`Static user-facing attributes found: ${attributeAudit.length}`);
if (attributeAudit.length > 0) {
  console.log(JSON.stringify(attributeAudit, null, 2));
} else {
  console.log('✅ No hardcoded static user-facing text attributes found!');
}
