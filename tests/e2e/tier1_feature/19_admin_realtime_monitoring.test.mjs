/**
 * Tier 1: Feature 19 - Admin Real-Time Monitoring (R3, F21)
 * Minimum 5 tests covering live monitoring room, fraud alerts, auction pause, paused bidding block, and bid rollback.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'Admin Real-Time Monitoring');

describe('Feature 19: Admin Real-Time Monitoring', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.19.01: GET /api/admin/monitoring returns live auctions, recent bids, and fraud alerts', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminMonitoring();
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(Array.isArray(res.data.data.live_auctions));
    assert(Array.isArray(res.data.data.recent_bids));
    assert(Array.isArray(res.data.data.fraud_alerts));
  });

  it('T1.19.02: Anti-fraud radar flags transactions exceeding NBKR AML 30,000 SOM threshold', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminMonitoring();
    const alert = res.data.data.fraud_alerts.find(a => a.alert_type === 'aml_threshold');
    assert(alert, 'Expected AML threshold alert');
    assertEqual(alert.severity, 'medium');
  });

  it('T1.19.03: Admin freezes/pauses active auction lot in real time', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.pauseAdminAuction('lot-101', true);
    assertEqual(res.status, 200);
    assert(res.data.success);
    assertEqual(res.data.data.is_paused, true);
  });

  it('T1.19.04: Placing a bid on a paused auction is rejected with 400 Bad Request', async () => {
    // Admin pauses
    await env.client.loginAsAdmin();
    await env.client.pauseAdminAuction('lot-101', true);

    // Buyer attempts bid
    await env.client.loginAsBuyer();
    const res = await env.client.placeBid('lot-101', 20000000);
    assertEqual(res.status, 400);
    assert(!res.data.success);
  });

  it('T1.19.05: Cancels fraudulent bid and rolls back lot current_price to previous leading bid', async () => {
    await env.client.loginAsAdmin();
    // In initial seed: lot-101 current price is 17,500,000 with bid-001
    const res = await env.client.cancelAdminBid('bid-001');
    assertEqual(res.status, 200);
    assert(res.data.success);
    assertEqual(res.data.data.is_cancelled, true);

    // Check auction price reverted to starting price 15,000,000
    const auctionRes = await env.client.getAuction('lot-101');
    assertEqual(auctionRes.data.data.current_price_minor, 15000000);
  });
});
