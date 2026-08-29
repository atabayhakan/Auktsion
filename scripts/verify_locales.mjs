import fs from 'fs';
import path from 'path';

function parseKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const stack = [];
  const keys = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('export default') || trimmed === '{' || trimmed === '};') continue;
    
    // Count leading spaces
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const depth = Math.floor(indent / 2);
    
    // Match property name
    const match = trimmed.match(/^['"]?([a-zA-Z0-9_-]+)['"]?\s*:\s*(.*)/);
    if (match) {
      const keyName = match[1];
      const rest = match[2];
      
      stack[depth - 1] = keyName;
      stack.length = depth;
      
      if (!rest.startsWith('{')) {
        keys.push(stack.join('.'));
      }
    }
  }
  return keys;
}

const kyKeys = parseKeys('frontend/src/locales/ky.ts');
const ruKeys = parseKeys('frontend/src/locales/ru.ts');
const trKeys = parseKeys('frontend/src/locales/tr.ts');

console.log(`Parsed KY keys: ${kyKeys.length}`);
console.log(`Parsed RU keys: ${ruKeys.length}`);
console.log(`Parsed TR keys: ${trKeys.length}`);

const missingInRu = kyKeys.filter(k => !ruKeys.includes(k));
const missingInTr = kyKeys.filter(k => !trKeys.includes(k));
const extraInRu = ruKeys.filter(k => !kyKeys.includes(k));
const extraInTr = trKeys.filter(k => !kyKeys.includes(k));

console.log(`Missing in RU: ${missingInRu.length}`);
if (missingInRu.length) console.log(missingInRu);

console.log(`Missing in TR: ${missingInTr.length}`);
if (missingInTr.length) console.log(missingInTr);

console.log(`Extra in RU: ${extraInRu.length}`);
if (extraInRu.length) console.log(extraInRu);

console.log(`Extra in TR: ${extraInTr.length}`);
if (extraInTr.length) console.log(extraInTr);

if (missingInRu.length === 0 && missingInTr.length === 0 && extraInRu.length === 0 && extraInTr.length === 0) {
  console.log('\nSUCCESS: 100% Locale Parity Verified across Kyrgyz, Russian, and Turkish!');
} else {
  console.error('\nFAILURE: Locale Parity Mismatches Found.');
  process.exit(1);
}
