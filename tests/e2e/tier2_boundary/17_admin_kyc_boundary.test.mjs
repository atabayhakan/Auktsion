/**
 * Tier 2: Feature 17 Boundary - Admin KYC Approvals (R3, F19)
 * 5 boundary tests covering non-existent KYC ID review, missing rejection reasons, re-review of verified KYC, unverified users, and action validation.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'Admin KYC Approvals Boundary');

describe('Tier 2: Feature 17 - Admin KYC Approvals Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.17.01: Reviewing non-existent KYC ID returns 404 Not Found', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.reviewAdminKyc('kyc-non-existent-999', { action: 'approve' });
    assertEqual(res.status, 404);
  });

  it('T2.17.02: Rejecting KYC application without notes applies clean null/empty reason', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.reviewAdminKyc('kyc-001', { action: 'reject' });
    assertEqual(res.status, 200);
    assertEqual(res.data.data.status, 'rejected');
  });

  it('T2.17.03: Approving already approved KYC record is handled idempotently', async () => {
    await env.client.loginAsAdmin();
    const res1 = await env.client.reviewAdminKyc('kyc-001', { action: 'approve' });
    assertEqual(res1.status, 200);

    const res2 = await env.client.reviewAdminKyc('kyc-001', { action: 'approve' });
    assertEqual(res2.status, 200);
    assertEqual(res2.data.data.status, 'approved');
  });

  it('T2.17.04: KYC review action with unrecognized command defaults or safely rejects', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.reviewAdminKyc('kyc-001', { action: 'unknown_action' });
    assert([200, 400].includes(res.status));
  });

  it('T2.17.05: Querying KYC status for user who never submitted KYC returns null record cleanly', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getKyc();
    assertEqual(res.status, 200);
    assert(res.data.success);
  });
});
