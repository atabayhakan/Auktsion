import fs from 'fs';
import path from 'path';

async function main() {
  const kyMod = await import('../frontend/src/locales/ky.ts');
  const ky = kyMod.default;

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
  const missing = [];

  for (const file of files) {
    if (file.includes('src/locales/')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g);
    for (const m of matches) {
      const key = m[1];
      if (key.includes('${') || key.endsWith('.')) continue;
      const val = getVal(ky, key);
      if (val === undefined) {
        missing.push({ file: path.relative('frontend', file), key });
      }
    }
  }

  console.log('Total unresolved t() calls in codebase:', missing.length);
  const byFile = {};
  for (const m of missing) {
    byFile[m.file] = byFile[m.file] || [];
    byFile[m.file].push(m.key);
  }
  for (const f in byFile) {
    console.log('\n--- ' + f + ' (' + byFile[f].length + ' calls) ---');
    console.log(Array.from(new Set(byFile[f])).map(k => `  "${k}"`).join('\n'));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
