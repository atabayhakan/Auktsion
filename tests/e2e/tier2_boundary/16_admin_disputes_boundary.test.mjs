/**
 * Tier 2: Feature 16 Boundary - Admin Disputes & Claims (R3, F18)
 * 5 boundary tests covering non-existent dispute resolution, zero refund, 100% full refund, repeated dispute resolutions, and resolution decisions.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'Admin Disputes Boundary');

describe('Tier 2: Feature 16 - Admin Disputes Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.16.01: Resolving a non-existent dispute ID returns 404 Not Found', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.resolveAdminDispute('dsp-non-existent-999', { decision: 'refund_buyer' });
    assertEqual(res.status, 404);
  });

  it('T2.16.02: Resolving dispute with 0 refund amount correctly releases full escrow to seller', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.resolveAdminDispute('dsp-001', {
      decision: 'release_seller',
      refund_minor: 0
    });
    assertEqual(res.status, 200);
    assertEqual(res.data.data.refund_minor, 0);
  });

  it('T2.16.03: Resolving dispute with 100% full lot value refund to buyer', async () => {
    await env.client.loginAsAdmin();
    const fullLotPrice = 17500000;
    const res = await env.client.resolveAdminDispute('dsp-001', {
      decision: 'refund_buyer',
      refund_minor: fullLotPrice
    });
    assertEqual(res.status, 200);
    assertEqual(res.data.data.refund_minor, fullLotPrice);
  });

  it('T2.16.04: Repeated resolution calls on already resolved dispute are idempotent', async () => {
    await env.client.loginAsAdmin();
    const res1 = await env.client.resolveAdminDispute('dsp-001', { decision: 'refund_buyer' });
    assertEqual(res1.status, 200);

    const res2 = await env.client.resolveAdminDispute('dsp-001', { decision: 'refund_buyer' });
    assertEqual(res2.status, 200);
  });

  it('T2.16.05: Resolving dispute with empty decision payload applies default resolution', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.resolveAdminDispute('dsp-001', {});
    assertEqual(res.status, 200);
    assert(res.data.data.status === 'resolved');
  });
});
