/**
 * Tier 3: Pairwise - KYC + Payout Workflows Interaction Tests
 * 5 cross-feature tests exercising KYC submission -> admin approval -> bank method addition -> payout request -> financial execution.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 3', 'KYC + Payout Pairwise');

describe('Tier 3: Pairwise - KYC + Payout Workflows', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T3.03.01: Complete KYC verification pipeline: User submits -> Admin approves -> User unlocked for banking', async () => {
    // User submits KYC
    await env.client.loginAsBuyer();
    const kycRes = await env.client.submitKyc({
      inn: '20504199200456',
      document_type: 'passport',
      document_number: 'ID2045612'
    });
    assertEqual(kycRes.status, 201);
    const kycId = kycRes.data.data.id;

    // Admin verifies
    await env.client.loginAsAdmin();
    const reviewRes = await env.client.reviewAdminKyc(kycId, { action: 'approve' });
    assertEqual(reviewRes.status, 200);

    // User checks profile
    await env.client.loginAsBuyer();
    const meRes = await env.client.getMe();
    assertEqual(meRes.data.user.kyc_status, 'verified');
  });

  it('T3.03.02: KYC rejection -> User re-submits corrected INN -> Admin approves', async () => {
    await env.client.loginAsBuyer();
    const sub1 = await env.client.submitKyc({ inn: '11111111111111' });
    const kycId = sub1.data.data.id;

    // Admin rejects
    await env.client.loginAsAdmin();
    await env.client.reviewAdminKyc(kycId, { action: 'reject', rejection_reason: 'Invalid INN' });

    // Buyer re-submits
    await env.client.loginAsBuyer();
    const sub2 = await env.client.submitKyc({ inn: '20504199200456' });
    assertEqual(sub2.status, 201);
    const newKycId = sub2.data.data.id;

    // Admin approves
    await env.client.loginAsAdmin();
    await env.client.reviewAdminKyc(newKycId, { action: 'approve' });
    const userRes = await env.client.getAdminUsers({ search: 'Бакыт' });
    assertEqual(userRes.data.data[0].kyc_status, 'verified');
  });

  it('T3.03.03: Seller adds Optima payout destination -> Requests 20,000 KGS withdrawal -> Admin approves', async () => {
    await env.client.loginAsSeller();
    // Add Optima card
    await env.client.addPayoutMethod({
      provider: 'optima',
      bank_name: 'Оптима Банк',
      account_number: '4169580099887766',
      account_holder_name: 'Акылбек Жээнбеков'
    });

    // Request payout
    const payoutRes = await env.client.requestPayout({
      amount_minor: 2000000, // 20,000 KGS
      provider: 'optima',
      account_number: '4169580099887766'
    });
    assertEqual(payoutRes.status, 201);
    const payoutId = payoutRes.data.data.id;

    // Admin approves in Financials
    await env.client.loginAsAdmin();
    const adminApprove = await env.client.processAdminPayout(payoutId, 'approve');
    assertEqual(adminApprove.status, 200);
    assertEqual(adminApprove.data.data.status, 'approved');
  });

  it('T3.03.04: Admin settles approved payout via DemirBank -> Marks status as paid', async () => {
    await env.client.loginAsAdmin();
    const payRes = await env.client.processAdminPayout('payout-001', 'pay');
    assertEqual(payRes.status, 200);
    assertEqual(payRes.data.data.status, 'paid');
  });

  it('T3.03.05: User with multiple saved payout methods can select default destination', async () => {
    await env.client.loginAsSeller();
    const methodsRes = await env.client.getPayoutMethods();
    assertEqual(methodsRes.status, 200);
    assert(methodsRes.data.data.length >= 2);
    const defaultMethod = methodsRes.data.data.find(m => m.is_default);
    assert(defaultMethod, 'Expected at least one default payout method');
  });
});
