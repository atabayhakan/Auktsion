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

function parseKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const stack = [];
  const keys = new Set();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('export default') || trimmed === '{' || trimmed === '};') continue;
    
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const depth = Math.floor(indent / 2);
    
    const match = trimmed.match(/^['"]?([a-zA-Z0-9_-]+)['"]?\s*:\s*(.*)/);
    if (match) {
      const keyName = match[1];
      const rest = match[2];
      
      stack[depth - 1] = keyName;
      stack.length = depth;
      
      if (!rest.startsWith('{')) {
        keys.add(stack.join('.'));
      }
    }
  }
  return keys;
}

const kyKeys = parseKeys('frontend/src/locales/ky.ts');
const ruKeys = parseKeys('frontend/src/locales/ru.ts');
const trKeys = parseKeys('frontend/src/locales/tr.ts');

console.log(`Loaded keys: KY=${kyKeys.size}, RU=${ruKeys.size}, TR=${trKeys.size}`);

const files = walk('frontend/src');
const missingKeys = [];

for (const file of files) {
  if (file.includes('src/locales/')) continue;
  const content = fs.readFileSync(file, 'utf8');
  
  const matches = content.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g);
  for (const m of matches) {
    const key = m[1];
    if (key.includes('${') || key.endsWith('.')) continue;
    
    if (!kyKeys.has(key)) {
      missingKeys.push({ file: path.relative('frontend', file), key });
    }
  }
}

console.log(`\nChecked all components and pages.`);
console.log(`Found ${missingKeys.length} missing t() references in code:`);
if (missingKeys.length > 0) {
  missingKeys.forEach(m => console.log(`  - [${m.file}] '${m.key}'`));
} else {
  console.log('ALL t(...) calls reference valid keys in locales!');
}
