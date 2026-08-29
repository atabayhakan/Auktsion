// scripts/find_unreferenced_keys.mjs
import fs from 'fs';
import path from 'path';
import kyMod from '../frontend/src/locales/ky.ts';

const ky = kyMod.default || kyMod;

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
const allKeys = Object.keys(flatKy);

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

const srcFiles = walk('frontend/src').filter(f => !f.includes('src/locales/'));
const allCode = srcFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

const unreferenced = [];
for (const k of allKeys) {
  if (!allCode.includes(`'${k}'`) && !allCode.includes(`"${k}"`) && !allCode.includes(`\`${k}\``)) {
    // Also check dynamic status lookups e.g. 'status.auction.' + status
    const parts = k.split('.');
    const prefix = parts.slice(0, -1).join('.') + '.';
    if (allCode.includes(`'${prefix}'`) || allCode.includes(`"${prefix}"`)) {
      continue;
    }
    unreferenced.push(k);
  }
}

console.log(`Total dictionary keys: ${allKeys.length}`);
console.log(`Keys without exact t('path.to.key') usage: ${unreferenced.length}`);
console.log('Unreferenced keys list:');
unreferenced.forEach(k => console.log(`- ${k}: "${flatKy[k]}"`));
