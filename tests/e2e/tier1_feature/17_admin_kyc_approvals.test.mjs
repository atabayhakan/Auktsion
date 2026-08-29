/**
 * Tier 1: Feature 17 - Admin KYC Approvals (R3, F19)
 * Minimum 5 tests covering KYC review queue, document inspection, KYC approval, KYC rejection, and user status sync.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { validateKycContract } from '../harness/contractValidators.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'Admin KYC Approvals');

describe('Feature 17: Admin KYC Approvals', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.17.01: GET /api/admin/kyc returns all pending KYC identity verification submissions', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminKyc();
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(Array.isArray(res.data.data));
    assert(res.data.data.length >= 1);
    validateKycContract(res.data.data[0], 'KYC Review Item');
  });

  it('T1.17.02: KYC submission record contains valid 14-digit Kyrgyz INN and passport document references', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminKyc();
    const kyc = res.data.data[0];
    assertEqual(kyc.id, 'kyc-001');
    assertEqual(kyc.inn.length, 14);
    assert(kyc.document_url);
    assert(kyc.selfie_url);
  });

  it('T1.17.03: Approves KYC submission and updates user status to verified', async () => {
    await env.client.loginAsAdmin();
    const reviewRes = await env.client.reviewAdminKyc('kyc-001', { action: 'approve' });
    assertEqual(reviewRes.status, 200);
    assert(reviewRes.data.success);
    assertEqual(reviewRes.data.data.status, 'approved');

    // Verify buyer account now has kyc_status verified
    const usersRes = await env.client.getAdminUsers({ search: 'Бакыт' });
    assertEqual(usersRes.data.data[0].kyc_status, 'verified');
  });

  it('T1.17.04: Rejects KYC submission with structured rejection feedback notes', async () => {
    await env.client.loginAsAdmin();
    const reviewRes = await env.client.reviewAdminKyc('kyc-001', {
      action: 'reject',
      rejection_reason: 'Passport photo is blurry. Please re-upload clear ID.'
    });
    assertEqual(reviewRes.status, 200);
    assertEqual(reviewRes.data.data.status, 'rejected');
    assertEqual(reviewRes.data.data.rejection_reason, 'Passport photo is blurry. Please re-upload clear ID.');
  });

  it('T1.17.05: User profile reflects newly approved KYC status upon querying /api/user/kyc', async () => {
    // Admin approves
    await env.client.loginAsAdmin();
    await env.client.reviewAdminKyc('kyc-001', { action: 'approve' });

    // Buyer checks status
    await env.client.loginAsBuyer();
    const buyerKyc = await env.client.getKyc();
    assertEqual(buyerKyc.status, 200);
    assertEqual(buyerKyc.data.status, 'verified');
  });
});
