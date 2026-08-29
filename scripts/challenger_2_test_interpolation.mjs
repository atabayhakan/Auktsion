// scripts/challenger_2_test_interpolation.mjs
import ky from '../frontend/src/locales/ky.js';
// Or dynamically load
import fs from 'fs';

console.log("Testing RegExp behavior:");
const template = "{n} мүнөт мурун";
const params = { n: 5 };

// Current implementation in useI18n.ts:
const currentImpl = Object.entries(params).reduce((str, [k, v]) => {
  return str.replace(new RegExp({}, 'g'), String(v));
}, template);

console.log("Template:", template);
console.log("Current implementation output:", currentImpl);

// Expected implementation:
const fixedImpl = Object.entries(params).reduce((str, [k, v]) => {
  return str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
}, template);

console.log("Fixed implementation output:", fixedImpl);
