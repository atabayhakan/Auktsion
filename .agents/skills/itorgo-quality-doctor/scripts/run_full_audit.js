import { run as runI18n } from './check_i18n_parity.js';
import { run as runOverflow } from './check_mobile_overflow.js';
import { run as runDataIntegrity } from './check_data_integrity.js';
import { run as runModals } from './check_modal_contracts.js';
import { fileURLToPath } from 'url';

export async function runFullAudit() {
  console.log('====================================================');
  console.log('🛡️  ITORGO QUALITY DOCTOR — FULL HEALTH & REGRESSION AUDIT');
  console.log('====================================================\n');

  let results = {
    i18n: false,
    overflow: false,
    dataIntegrity: false,
    modals: false
  };

  try {
    const i18nRes = await runI18n();
    results.i18n = i18nRes.passed;
  } catch (e) {
    console.error('❌ i18n check failed with error:', e.message);
  }

  console.log('\n----------------------------------------------------');
  try {
    const overflowRes = runOverflow();
    results.overflow = overflowRes.passed;
  } catch (e) {
    console.error('❌ Overflow check failed with error:', e.message);
  }

  console.log('\n----------------------------------------------------');
  try {
    const dataRes = runDataIntegrity();
    results.dataIntegrity = dataRes.passed;
  } catch (e) {
    console.error('❌ Data integrity check failed with error:', e.message);
  }

  console.log('\n----------------------------------------------------');
  try {
    const modalRes = runModals();
    results.modals = modalRes.passed;
  } catch (e) {
    console.error('❌ Modal contract check failed with error:', e.message);
  }

  console.log('\n====================================================');
  console.log('📊 AUDIT SUMMARY SCORECARD:');
  console.log(`   1. Multilingual i18n Key Parity:       ${results.i18n ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   2. Mobile Overflow & Viewport Bounds:  ${results.overflow ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   3. Real SQLite Data Integrity (No Mock): ${results.dataIntegrity ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   4. Modal Event & v-model Contracts:     ${results.modals ? '✅ PASS' : '❌ FAIL'}`);
  console.log('====================================================');

  const allPassed = Object.values(results).every(Boolean);
  if (allPassed) {
    console.log('🎉 100% HEALTHY: All 4 quality pillars passed verification!');
  } else {
    console.warn('⚠️ Some checks failed or produced warnings. Review the log above.');
  }

  return { allPassed, results };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runFullAudit().then((res) => {
    process.exit(res.allPassed ? 0 : 1);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
