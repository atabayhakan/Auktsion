/**
 * Tier 1: Feature 11 - User Listings & Bids Flow (R2, F13)
 * Minimum 5 tests covering listing retrieval, bid placing, bid history, outbid status, and seller bid restriction.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { validateBidContract } from '../harness/contractValidators.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'User Listings & Bids Flow');

describe('Feature 11: User Listings & Bids Flow', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.11.01: GET /api/user/listings returns all lots created by authenticated seller', async () => {
    await env.client.loginAsSeller();
    const res = await env.client.getListings();
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(Array.isArray(res.data.data));
    assert(res.data.data.length >= 1);
  });

  it('T1.11.02: Buyer places valid bid and receives updated winning status', async () => {
    await env.client.loginAsBuyer();
    const lotId = 'lot-101'; // current price 17,500,000, increment 500,000
    const bidAmount = 18000000; // 180,000.00 KGS

    const res = await env.client.placeBid(lotId, bidAmount);
    assertEqual(res.status, 201);
    assert(res.data.success);
    validateBidContract(res.data.data, 'Placed Bid');
    assertEqual(res.data.data.amount_minor, bidAmount);
    assertEqual(res.data.data.is_winning, true);
    assertEqual(res.data.auction.current_price_minor, bidAmount);
  });

  it('T1.11.03: GET /api/user/bids returns history of bids placed by user', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.getBids();
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(Array.isArray(res.data.data));
    assert(res.data.data.length >= 1);
  });

  it('T1.11.04: Placing a lower bid than current_price + increment is rejected with 400', async () => {
    await env.client.loginAsBuyer();
    const lotId = 'lot-101'; // current price 17,500,000
    const tooLowBid = 17600000; // below 18,000,000 minimum required

    const res = await env.client.placeBid(lotId, tooLowBid);
    assertEqual(res.status, 400);
    assert(!res.data.success);
  });

  it('T1.11.05: Prevents sellers from bidding on their own listings (shill prevention)', async () => {
    await env.client.loginAsSeller();
    const lotId = 'lot-101'; // seller is user-seller-001
    const res = await env.client.placeBid(lotId, 20000000);
    assertEqual(res.status, 400);
    assert(!res.data.success);
  });
});
