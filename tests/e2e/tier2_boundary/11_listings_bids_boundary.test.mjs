/**
 * Tier 2: Feature 11 Boundary - User Listings & Bids Flow (R2, F13)
 * 5 boundary tests covering exact increment threshold, 1-tiyyn deficit rejection, ended lots, zero/negative bids, and non-existent auction bidding.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'User Listings & Bids Boundary');

describe('Tier 2: Feature 11 - User Listings & Bids Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.11.01: Bid placed at EXACT minimum increment boundary (current_price + increment) is accepted', async () => {
    await env.client.loginAsBuyer();
    const lotId = 'lot-101'; // current: 17,500,000, increment: 500,000 -> exact = 18,000,000
    const exactBid = 18000000;

    const res = await env.client.placeBid(lotId, exactBid);
    assertEqual(res.status, 201);
    assertEqual(res.data.data.amount_minor, exactBid);
  });

  it('T2.11.02: Bid placed 1 tiyyn below minimum increment boundary is rejected with 400', async () => {
    await env.client.loginAsBuyer();
    const lotId = 'lot-101'; // minimum = 18,000,000
    const belowBid = 17999999;

    const res = await env.client.placeBid(lotId, belowBid);
    assertEqual(res.status, 400);
    assert(!res.data.success);
  });

  it('T2.11.03: Bidding on a non-active lot (e.g. pending_approval or ended) is rejected with 400', async () => {
    await env.client.loginAsBuyer();
    const lotId = 'lot-104'; // status: pending_approval
    const res = await env.client.placeBid(lotId, 6000000);
    assertEqual(res.status, 400);
    assert(!res.data.success);
  });

  it('T2.11.04: Placing a bid with 0 or negative amount is rejected with 400', async () => {
    await env.client.loginAsBuyer();
    const resZero = await env.client.placeBid('lot-101', 0);
    assertEqual(resZero.status, 400);

    const resNeg = await env.client.placeBid('lot-101', -500000);
    assertEqual(resNeg.status, 400);
  });

  it('T2.11.05: Placing a bid on a non-existent lot ID returns 404 Not Found', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.placeBid('lot-non-existent-999', 5000000);
    assertEqual(res.status, 404);
  });
});
