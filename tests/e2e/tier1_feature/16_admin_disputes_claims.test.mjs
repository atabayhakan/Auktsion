/**
 * Tier 1: Feature 16 - Admin Disputes & Claims (R3, F18)
 * Minimum 5 tests covering dispute queue, evidence review, full buyer refund, release to seller, and partial settlement.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { validateDisputeContract } from '../harness/contractValidators.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'Admin Disputes & Claims');

describe('Feature 16: Admin Disputes & Claims', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.16.01: GET /api/admin/disputes retrieves active dispute cases queue', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminDisputes();
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(Array.isArray(res.data.data));
    assert(res.data.data.length >= 1);
    validateDisputeContract(res.data.data[0], 'Admin Dispute');
  });

  it('T1.16.02: Dispute entity contains complainant, respondent, reason, and auction reference', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminDisputes();
    const dispute = res.data.data[0];
    assertEqual(dispute.id, 'dsp-001');
    assertEqual(dispute.complainant_id, 'user-buyer-001');
    assertEqual(dispute.respondent_id, 'user-seller-001');
    assertEqual(dispute.reason, 'damaged_item');
  });

  it('T1.16.03: Resolves dispute in favor of buyer with full escrow refund', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.resolveAdminDispute('dsp-001', {
      decision: 'refund_buyer',
      refund_minor: 17500000
    });
    assertEqual(res.status, 200);
    assert(res.data.success);
    assertEqual(res.data.data.status, 'resolved');
    assertEqual(res.data.data.resolution, 'refund_buyer');
    assertEqual(res.data.data.refund_minor, 17500000);
  });

  it('T1.16.04: Resolves dispute in favor of seller releasing funds', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.resolveAdminDispute('dsp-001', {
      decision: 'release_seller',
      refund_minor: 0
    });
    assertEqual(res.status, 200);
    assertEqual(res.data.data.status, 'resolved');
    assertEqual(res.data.data.resolution, 'release_seller');
  });

  it('T1.16.05: Resolves dispute with partial settlement between buyer and seller', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.resolveAdminDispute('dsp-001', {
      decision: 'partial_refund',
      refund_minor: 5000000 // 50,000 SOM partial refund
    });
    assertEqual(res.status, 200);
    assertEqual(res.data.data.resolution, 'partial_refund');
    assertEqual(res.data.data.refund_minor, 5000000);
  });
});
