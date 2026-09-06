import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find project root by locating package.json with workspace dirs
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

function flattenObject(obj, prefix = '') {
  let result = {};
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const propName = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key], propName));
    } else {
      result[propName] = obj[key];
    }
  }
  return result;
}

export async function run() {
  console.log(`🔍 [i18n Parity Check] Locales directory: ${LOCALES_DIR}`);

  const ruUrl = new URL(`file://${path.join(LOCALES_DIR, 'ru.ts').replace(/\\/g, '/')}`);
  const kyUrl = new URL(`file://${path.join(LOCALES_DIR, 'ky.ts').replace(/\\/g, '/')}`);
  const trUrl = new URL(`file://${path.join(LOCALES_DIR, 'tr.ts').replace(/\\/g, '/')}`);

  const ruMod = await import(ruUrl.href);
  const kyMod = await import(kyUrl.href);
  const trMod = await import(trUrl.href);

  const ru = ruMod.default || ruMod.ru || ruMod;
  const ky = kyMod.default || kyMod.ky || kyMod;
  const tr = trMod.default || trMod.tr || trMod;

  const flatRu = flattenObject(ru);
  const flatKy = flattenObject(ky);
  const flatTr = flattenObject(tr);

  const ruKeys = new Set(Object.keys(flatRu));
  const kyKeys = new Set(Object.keys(flatKy));
  const trKeys = new Set(Object.keys(flatTr));

  console.log(`📊 Total keys: RU=${ruKeys.size} | KY=${kyKeys.size} | TR=${trKeys.size}`);

  let missingInKy = [];
  let missingInTr = [];

  for (const k of ruKeys) {
    if (!kyKeys.has(k)) missingInKy.push(k);
    if (!trKeys.has(k)) missingInTr.push(k);
  }

  let passed = true;
  if (missingInKy.length > 0) {
    passed = false;
    console.error(`❌ ${missingInKy.length} keys missing in Kyrgyz (ky.ts):`);
    console.error('   ' + missingInKy.slice(0, 10).join(', ') + (missingInKy.length > 10 ? '...' : ''));
  }
  if (missingInTr.length > 0) {
    passed = false;
    console.error(`❌ ${missingInTr.length} keys missing in Turkish (tr.ts):`);
    console.error('   ' + missingInTr.slice(0, 10).join(', ') + (missingInTr.length > 10 ? '...' : ''));
  }

  if (passed) {
    console.log('✅ All 3 locales have 100% key parity with Russian baseline!');
  }

  return { passed, missingInKy, missingInTr, totalRuKeys: ruKeys.size };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().then((res) => {
    process.exit(res.passed ? 0 : 1);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
