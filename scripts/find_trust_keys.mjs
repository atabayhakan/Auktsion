// scripts/find_trust_keys.mjs
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

const flat = flatten(ky);
const matches = Object.keys(flat).filter(k => /escrow|nbkr|license|instant|transparent|trust|protection/i.test(k) || /escrow|nbkr|license/i.test(flat[k]));
console.log('Matches:', matches);
matches.forEach(k => console.log(k, '=>', flat[k]));
