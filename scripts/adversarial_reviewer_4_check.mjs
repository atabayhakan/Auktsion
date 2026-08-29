// scripts/adversarial_reviewer_4_check.mjs
import fs from 'fs';
import path from 'path';

async function runAdversarialAudit() {
  console.log('================================================================');
  console.log('🛡️ REVIEWER 4 ADVERSARIAL INTEGRITY & STRESS TEST AUDIT');
  console.log('================================================================\n');

  let failureCount = 0;
  let testCount = 0;

  function expect(description, condition, actualInfo) {
    testCount++;
    if (!condition) {
      console.error(`❌ [FAIL] ${description} -> ${actualInfo || 'Condition failed'}`);
      failureCount++;
    } else {
      console.log(`✅ [PASS] ${description}`);
    }
  }

  // 1. Load locale dictionaries
  const kyMod = await import('../frontend/src/locales/ky.ts');
  const ruMod = await import('../frontend/src/locales/ru.ts');
  const trMod = await import('../frontend/src/locales/tr.ts');

  const ky = kyMod.default;
  const ru = ruMod.default;
  const tr = trMod.default;

  // 1.1 Integrity Check: No dummy / placeholder values
  console.log('\n--- 1. Dictionary Integrity & Authenticity Check ---');
  function checkIntegrity(obj, lang, path = '') {
    for (const [k, v] of Object.entries(obj)) {
      const p = path ? `${path}.${k}` : k;
      if (typeof v === 'object' && v !== null) {
        checkIntegrity(v, lang, p);
      } else if (typeof v === 'string') {
        // Check for dummy patterns like "TODO", "LOREM", "XXX", "DUMMY", empty strings
        if (v.trim().length === 0) {
          expect(`Integrity ${lang}:${p} non-empty`, false, `Value is empty`);
        }
        if (/^(TODO|FIXME|XXX|DUMMY|LOREM IPSUM)/i.test(v)) {
          expect(`Integrity ${lang}:${p} not placeholder`, false, `Value: ${v}`);
        }
      }
    }
  }
  checkIntegrity(ky, 'KY');
  checkIntegrity(ru, 'RU');
  checkIntegrity(tr, 'TR');
  expect('Dictionary values have no placeholder/dummy tokens', failureCount === 0, `Failures: ${failureCount}`);

  // 2. Parameter Interpolation Stress Testing
  console.log('\n--- 2. Parameter Interpolation Adversarial Tests ---');
  function tInterpolate(str, params) {
    if (!params) return str;
    return Object.entries(params).reduce((s, [k, v]) => {
      return s.replaceAll(`{${k}}`, String(v));
    }, str);
  }

  // Test cases
  expect('Param with special regex chars in value ($1, $$)', 
    tInterpolate('Price: {p}', { p: '$100 ($1 off)' }) === 'Price: $100 ($1 off)',
    tInterpolate('Price: {p}', { p: '$100 ($1 off)' })
  );

  expect('Multiple occurrences of same placeholder',
    tInterpolate('{x} + {x} = {sum}', { x: 2, sum: 4 }) === '2 + 2 = 4',
    tInterpolate('{x} + {x} = {sum}', { x: 2, sum: 4 })
  );

  expect('Missing param preserves placeholder intact',
    tInterpolate('{name} has {count} items', { name: 'Ali' }) === 'Ali has {count} items',
    tInterpolate('{name} has {count} items', { name: 'Ali' })
  );

  expect('Numeric 0 and boolean false values',
    tInterpolate('Count: {c}, Active: {a}', { c: 0, a: false }) === 'Count: 0, Active: false',
    tInterpolate('Count: {c}, Active: {a}', { c: 0, a: false })
  );

  expect('Null and undefined values converted to string',
    tInterpolate('User: {u}, Val: {v}', { u: null, v: undefined }) === 'User: null, Val: undefined',
    tInterpolate('User: {u}, Val: {v}', { u: null, v: undefined })
  );

  expect('Nested template braces in value',
    tInterpolate('Code: {code}', { code: '{foo}' }) === 'Code: {foo}',
    tInterpolate('Code: {code}', { code: '{foo}' })
  );

  // 3. Status Labels Coverage in Formatters
  console.log('\n--- 3. Status Labels Coverage & Robustness ---');
  const allKyc = ['not_started', 'notStarted', 'phone_verified', 'phoneVerified', 'id_uploaded', 'idUploaded', 'ocr_passed', 'ocrPassed', 'verified', 'rejected', 'on_hold', 'onHold', 'pending'];
  for (const st of allKyc) {
    const key = `status.kyc.${st}`;
    const kyVal = ky.status?.kyc?.[st];
    const ruVal = ru.status?.kyc?.[st];
    const trVal = tr.status?.kyc?.[st];
    expect(`KYC status '${st}' exists in KY, RU, TR`, !!kyVal && !!ruVal && !!trVal, `KY: ${kyVal}, RU: ${ruVal}, TR: ${trVal}`);
  }

  const allAuction = ['draft', 'pending_approval', 'pendingApproval', 'active', 'ended_sold', 'endedSold', 'ended_unsold', 'endedUnsold', 'ended_reserve_not_met', 'endedReserveNotMet', 'cancelled', 'disputed'];
  for (const st of allAuction) {
    const kyVal = ky.status?.auction?.[st];
    const ruVal = ru.status?.auction?.[st];
    const trVal = tr.status?.auction?.[st];
    expect(`Auction status '${st}' exists in KY, RU, TR`, !!kyVal && !!ruVal && !!trVal, `KY: ${kyVal}, RU: ${ruVal}, TR: ${trVal}`);
  }

  const allBid = ['pending', 'active', 'winning', 'outbid', 'won', 'lost', 'cancelled'];
  for (const st of allBid) {
    const kyVal = ky.status?.bid?.[st];
    const ruVal = ru.status?.bid?.[st];
    const trVal = tr.status?.bid?.[st];
    expect(`Bid status '${st}' exists in KY, RU, TR`, !!kyVal && !!ruVal && !!trVal, `KY: ${kyVal}, RU: ${ruVal}, TR: ${trVal}`);
  }

  const allPayment = ['initial', 'pending', 'processing', 'success', 'failed', 'refunded', 'cancelled', 'disputed'];
  for (const st of allPayment) {
    const kyVal = ky.status?.payment?.[st];
    const ruVal = ru.status?.payment?.[st];
    const trVal = tr.status?.payment?.[st];
    expect(`Payment status '${st}' exists in KY, RU, TR`, !!kyVal && !!ruVal && !!trVal, `KY: ${kyVal}, RU: ${ruVal}, TR: ${trVal}`);
  }

  const allPayout = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'aml_review', 'amlReview'];
  for (const st of allPayout) {
    const kyVal = ky.status?.payout?.[st];
    const ruVal = ru.status?.payout?.[st];
    const trVal = tr.status?.payout?.[st];
    expect(`Payout status '${st}' exists in KY, RU, TR`, !!kyVal && !!ruVal && !!trVal, `KY: ${kyVal}, RU: ${ruVal}, TR: ${trVal}`);
  }

  // 4. Scanning for Broken Bindings or Unescaped Mustache in Vue Templates
  console.log('\n--- 4. Scanning Vue Templates for Broken Bindings ---');
  function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(walk(fullPath));
      } else if (file.endsWith('.vue')) {
        results.push(fullPath);
      }
    });
    return results;
  }

  const vueFiles = walk('frontend/src');
  for (const file of vueFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative('frontend/src', file);
    
    // Check for empty mustaches {{ }}
    if (/\{\{\s*\}\}/.test(content)) {
      expect(`No empty mustache {{ }} in ${rel}`, false, 'Found empty mustache');
    }
    
    // Check for undefined helper calls e.g. statusLabels.undefinedMethod(
    const undefinedStatusHelper = content.match(/statusLabels\.(?!auction|bid|payout|kyc|payment|getKycLabel|getAuctionLabel|getPaymentLabel|getBidLabel|getPayoutLabel|getGatewayInfo)[a-zA-Z0-9_]+\(/g);
    if (undefinedStatusHelper) {
      expect(`No invalid statusLabels call in ${rel}`, false, `Found: ${undefinedStatusHelper.join(', ')}`);
    }

    // Check for unclosed template tags
    const openMustaches = (content.match(/\{\{/g) || []).length;
    const closeMustaches = (content.match(/\}\}/g) || []).length;
    if (openMustaches !== closeMustaches) {
      expect(`Balanced mustache braces in ${rel}`, false, `Open: ${openMustaches}, Close: ${closeMustaches}`);
    }
  }
  expect('All Vue components have balanced mustache bindings and valid status helper calls', failureCount === 0, `Failures: ${failureCount}`);

  console.log('\n================================================================');
  console.log(`AUDIT RESULTS: ${testCount} checks executed | ${failureCount} failures`);
  console.log('================================================================\n');

  if (failureCount > 0) {
    process.exit(1);
  }
}

runAdversarialAudit().catch(err => {
  console.error('Fatal error during adversarial audit:', err);
  process.exit(1);
});
