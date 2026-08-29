/**
 * Tier 2: Feature 19 Boundary - Admin Real-Time Monitoring (R3, F21)
 * 5 boundary tests covering non-existent auction pause, non-existent bid cancel, sole bid cancellation price revert, unpause idempotency, and duplicate bid cancellations.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'Admin Real-Time Monitoring Boundary');

describe('Tier 2: Feature 19 - Admin Real-Time Monitoring Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.19.01: Pausing non-existent auction ID returns 404 Not Found', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.pauseAdminAuction('lot-non-existent-999', true);
    assertEqual(res.status, 404);
  });

  it('T2.19.02: Cancelling non-existent bid ID returns 404 Not Found', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.cancelAdminBid('bid-non-existent-999');
    assertEqual(res.status, 404);
  });

  it('T2.19.03: Cancelling the sole bid on an auction resets current_price to starting_price', async () => {
    await env.client.loginAsAdmin();
    // lot-102 has bid-002 (380,000,000) starting at 350,000,000
    const cancelRes = await env.client.cancelAdminBid('bid-002');
    assertEqual(cancelRes.status, 200);

    const lotRes = await env.client.getAuction('lot-102');
    assertEqual(lotRes.data.data.current_price_minor, lotRes.data.data.starting_price_minor);
  });

  it('T2.19.04: Unpausing an active, unpaused auction is handled idempotently', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.pauseAdminAuction('lot-101', false);
    assertEqual(res.status, 200);
    assertEqual(res.data.data.is_paused, false);
  });

  it('T2.19.05: Cancelling an already cancelled bid is handled cleanly', async () => {
    await env.client.loginAsAdmin();
    await env.client.cancelAdminBid('bid-001');
    const res = await env.client.cancelAdminBid('bid-001');
    assertEqual(res.status, 200);
    assertEqual(res.data.data.is_cancelled, true);
  });
});
