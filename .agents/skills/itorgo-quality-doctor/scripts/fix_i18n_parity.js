import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let currentDir = __dirname;
let ROOT = currentDir;
while (currentDir !== path.dirname(currentDir)) {
  if (fs.existsSync(path.join(currentDir, 'frontend/src/locales/ru.ts'))) {
    ROOT = currentDir;
    break;
  }
  currentDir = path.dirname(currentDir);
}

const LOCALES_DIR = path.join(ROOT, 'frontend/src/locales');

function deepMergeMissing(target, source) {
  let addedCount = 0;
  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    if (!(key in target)) {
      target[key] = source[key];
      addedCount++;
    } else if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      if (typeof target[key] !== 'object' || target[key] === null) {
        target[key] = {};
      }
      addedCount += deepMergeMissing(target[key], source[key]);
    }
  }
  return addedCount;
}

export async function run() {
  console.log('🔧 [i18n Auto-Fix] Syncing missing keys from ru.ts into ky.ts and tr.ts...');

  const ruUrl = new URL(`file://${path.join(LOCALES_DIR, 'ru.ts').replace(/\\/g, '/')}`);
  const kyUrl = new URL(`file://${path.join(LOCALES_DIR, 'ky.ts').replace(/\\/g, '/')}`);
  const trUrl = new URL(`file://${path.join(LOCALES_DIR, 'tr.ts').replace(/\\/g, '/')}`);

  const ruMod = await import(ruUrl.href);
  const kyMod = await import(kyUrl.href);
  const trMod = await import(trUrl.href);

  const ru = ruMod.default || ruMod.ru || ruMod;
  const ky = kyMod.default || kyMod.ky || kyMod;
  const tr = trMod.default || trMod.tr || trMod;

  const addedKy = deepMergeMissing(ky, ru);
  const addedTr = deepMergeMissing(tr, ru);

  if (addedKy > 0) {
    const kyContent = `export default ${JSON.stringify(ky, null, 2)};\n`;
    fs.writeFileSync(path.join(LOCALES_DIR, 'ky.ts'), kyContent, 'utf8');
    console.log(`✅ Added ${addedKy} missing keys into ky.ts`);
  } else {
    console.log('✅ ky.ts is already in 100% parity with ru.ts');
  }

  if (addedTr > 0) {
    const trContent = `export default ${JSON.stringify(tr, null, 2)};\n`;
    fs.writeFileSync(path.join(LOCALES_DIR, 'tr.ts'), trContent, 'utf8');
    console.log(`✅ Added ${addedTr} missing keys into tr.ts`);
  } else {
    console.log('✅ tr.ts is already in 100% parity with ru.ts');
  }

  return { addedKy, addedTr };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
