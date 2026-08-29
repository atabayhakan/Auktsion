// scripts/scan_param_calls.mjs
import fs from 'fs';
import path from 'path';

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

const files = walk('frontend/src');
console.log(`Scanning ${files.length} files for parameterized t(...) calls...\n`);

const callsWithParams = [];

for (const file of files) {
  if (file.includes('src/locales/')) continue;
  const content = fs.readFileSync(file, 'utf8');
  // Match t('...', { ... }) across single or multiline
  const regex = /(?:\$t|\bt)\(\s*(['"`][^'"`]+['"`])\s*,\s*(\{[\s\S]*?\})\s*\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    callsWithParams.push({
      file: path.relative('frontend', file),
      key: match[1],
      paramObj: match[2].replace(/\s+/g, ' ').trim()
    });
  }
}

console.log(`Found ${callsWithParams.length} parameterized t() calls:`);
callsWithParams.forEach(c => {
  console.log(`- ${c.file}: t(${c.key}, ${c.paramObj})`);
});
