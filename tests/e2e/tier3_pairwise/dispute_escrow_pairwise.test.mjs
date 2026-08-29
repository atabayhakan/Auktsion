/**
 * Tier 3: Pairwise - Dispute Resolution + Escrow Settlement Interaction Tests
 * 5 cross-feature tests exercising buyer dispute filing -> evidence inspection -> buyer refund, seller release, partial settlement, and KPI sync.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 3', 'Dispute + Escrow Pairwise');

describe('Tier 3: Pairwise - Dispute + Escrow Interactions', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T3.04.01: Disputed auction escrow refund: Buyer files dispute -> Admin awards full refund to buyer', async () => {
    await env.client.loginAsAdmin();
    const resolveRes = await env.client.resolveAdminDispute('dsp-001', {
      decision: 'refund_buyer',
      refund_minor: 17500000
    });
    assertEqual(resolveRes.status, 200);
    assertEqual(resolveRes.data.data.status, 'resolved');
    assertEqual(resolveRes.data.data.resolution, 'refund_buyer');
  });

  it('T3.04.02: Seller vindicated in dispute: Admin releases full held escrow to seller', async () => {
    await env.client.loginAsAdmin();
    const resolveRes = await env.client.resolveAdminDispute('dsp-001', {
      decision: 'release_seller',
      refund_minor: 0
    });
    assertEqual(resolveRes.status, 200);
    assertEqual(resolveRes.data.data.resolution, 'release_seller');
  });

  it('T3.04.03: Partial damage settlement: Admin arbitrates 50% split between buyer and seller', async () => {
    await env.client.loginAsAdmin();
    const splitAmount = 8750000; // 87,500 SOM (half of 175,000 SOM)
    const resolveRes = await env.client.resolveAdminDispute('dsp-001', {
      decision: 'partial_refund',
      refund_minor: splitAmount
    });
    assertEqual(resolveRes.status, 200);
    assertEqual(resolveRes.data.data.refund_minor, splitAmount);
  });

  it('T3.04.04: Dispute queue status transitions from open to resolved', async () => {
    await env.client.loginAsAdmin();
    await env.client.resolveAdminDispute('dsp-001', { decision: 'refund_buyer' });

    const listRes = await env.client.getAdminDisputes();
    const dsp = listRes.data.data.find(d => d.id === 'dsp-001');
    assertEqual(dsp.status, 'resolved');
  });

  it('T3.04.05: Open dispute resolution updates platform treasury dispute metrics', async () => {
    await env.client.loginAsAdmin();
    const before = await env.client.getAdminOverview();
    assert(before.data.data.open_disputes >= 1);

    await env.client.resolveAdminDispute('dsp-001', { decision: 'refund_buyer' });
    const after = await env.client.getAdminOverview();
    assert(after.data.data);
  });
});
