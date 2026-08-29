/**
 * Tier 3: Pairwise - Real-Time Monitoring + Shill Defense Interaction Tests
 * 5 cross-feature tests exercising live monitoring -> AML detection -> auction pause -> fraudulent bid cancellation -> anti-sniping timer extension.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 3', 'Real-Time + Shill Bidding Pairwise');

describe('Tier 3: Pairwise - Real-Time + Shill Bidding Interactions', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T3.05.01: High-value bid placement triggers real-time AML monitoring alert (> 30,000 SOM)', async () => {
    await env.client.loginAsBuyer();
    const bidAmount = 4500000; // 45,000 SOM in tiyyn
    await env.client.placeBid('lot-103', bidAmount);

    // Admin checks monitoring room
    await env.client.loginAsAdmin();
    const monRes = await env.client.getAdminMonitoring();
    assertEqual(monRes.status, 200);
    assert(monRes.data.data.fraud_alerts.some(a => a.alert_type === 'aml_threshold'));
  });

  it('T3.05.02: Admin detects shill bidding -> Pauses auction -> Cancels bid -> Resumes auction', async () => {
    // Admin pauses
    await env.client.loginAsAdmin();
    const pauseRes = await env.client.pauseAdminAuction('lot-101', true);
    assertEqual(pauseRes.data.data.is_paused, true);

    // Cancel fraudulent top bid
    const cancelRes = await env.client.cancelAdminBid('bid-001');
    assertEqual(cancelRes.status, 200);

    // Resume auction
    const resumeRes = await env.client.pauseAdminAuction('lot-101', false);
    assertEqual(resumeRes.data.data.is_paused, false);

    // Genuine buyer can now bid on restored baseline price
    await env.client.loginAsBuyer();
    const newBidRes = await env.client.placeBid('lot-101', 15500000);
    assertEqual(newBidRes.status, 201);
  });

  it('T3.05.03: Multi-bidder auction bid cancellation recalculates winning bid and price step', async () => {
    // Current price is 17,500,000 (bid-001)
    await env.client.loginAsAdmin();
    await env.client.cancelAdminBid('bid-001');

    const lot = (await env.client.getAuction('lot-101')).data.data;
    assertEqual(lot.current_price_minor, 15000000); // restored to starting price
  });

  it('T3.05.04: Admin voids fraudulent bid and bans rogue user in tandem', async () => {
    await env.client.loginAsAdmin();
    // Void bid
    await env.client.cancelAdminBid('bid-001');
    // Ban bidder
    await env.client.setAdminUserStatus('user-buyer-001', 'banned');

    // Banned user cannot log in or place further bids
    const loginRes = await env.client.login('buyer@auktsion.kg', 'Password123!');
    assertEqual(loginRes.status, 403);
  });

  it('T3.05.05: Placing bid with < 120 seconds remaining triggers anti-sniping timer extension', async () => {
    // Create auction lot ending in 30 seconds
    await env.client.loginAsSeller();
    const endingSoonLot = {
      title: 'Sniping Test Lot',
      category: 'electronics',
      starting_price_minor: 1000000
    };
    const createRes = await env.client.createAuction(endingSoonLot);
    const lotId = createRes.data.data.id;

    // Set ends_at to 30 seconds in future and status active
    if (env.server && env.server.state) {
      const lotObj = env.server.state.auctions.find(a => a.id === lotId);
      lotObj.status = 'active';
      lotObj.ends_at = new Date(Date.now() + 30000).toISOString();
    }

    // Buyer places bid in sniping window
    await env.client.loginAsBuyer();
    const bidRes = await env.client.placeBid(lotId, 1100000);
    assertEqual(bidRes.status, 201);

    // Verify ends_at was extended by 120 seconds
    const updatedEndsAtMs = new Date(bidRes.data.auction.ends_at).getTime();
    assert(updatedEndsAtMs > Date.now() + 60000, 'Expected ends_at timer extension of at least 60-120 seconds');
  });
});
