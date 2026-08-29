// scripts/inspect_details.mjs
import kyMod from '../frontend/src/locales/ky.ts';
import ruMod from '../frontend/src/locales/ru.ts';
import trMod from '../frontend/src/locales/tr.ts';

const ky = kyMod.default || kyMod;
const ru = ruMod.default || ruMod;
const tr = trMod.default || trMod;

console.log('--- status.payment in KY ---');
console.log(ky.status?.payment);

console.log('--- status.payment in RU ---');
console.log(ru.status?.payment);

console.log('--- status.payment in TR ---');
console.log(tr.status?.payment);
