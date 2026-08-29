/**
 * Tier 3: Pairwise - Auth + Bidding Interaction Tests
 * 5 cross-feature tests exercising registration, login, competitive bidding, self-bidding prevention, and session detachment.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 3', 'Auth + Bidding Pairwise');

describe('Tier 3: Pairwise - Auth + Bidding Interactions', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T3.01.01: Register new buyer -> Log in -> Place bid -> Receive winning status', async () => {
    const email = `buyer_flow_${Date.now()}@example.kg`;
    const regRes = await env.client.register({
      email,
      password: 'Pass123456!',
      full_name: 'Flow Buyer'
    });
    assertEqual(regRes.status, 201);

    const bidRes = await env.client.placeBid('lot-101', 18000000);
    assertEqual(bidRes.status, 201);
    assertEqual(bidRes.data.data.is_winning, true);
    assertEqual(bidRes.data.auction.current_price_minor, 18000000);
  });

  it('T3.01.02: Two separate registered buyers compete on lot -> Current price steps up correctly', async () => {
    // Buyer 1 bids 18,000,000
    await env.client.loginAsBuyer();
    const bid1 = await env.client.placeBid('lot-101', 18000000);
    assertEqual(bid1.status, 201);

    // Buyer 2 registers and bids 19,000,000
    const buyer2Email = `buyer2_${Date.now()}@example.kg`;
    await env.client.register({
      email: buyer2Email,
      password: 'Pass123456!',
      full_name: 'Second Competitor'
    });

    const bid2 = await env.client.placeBid('lot-101', 19000000);
    assertEqual(bid2.status, 201);
    assertEqual(bid2.data.data.is_winning, true);
    assertEqual(bid2.data.auction.current_price_minor, 19000000);

    // Verify Buyer 1's bid is now outbid
    const bidsRes = await env.client.getAuctionBids('lot-101');
    const b1Record = bidsRes.data.data.find(b => b.amount_minor === 18000000);
    assertEqual(b1Record.is_winning, false);
  });

  it('T3.01.03: Unauthenticated user is barred from placing bids until authenticated', async () => {
    env.client.clearToken();
    const res = await env.client.placeBid('lot-101', 20000000);
    assertEqual(res.status, 401);
  });

  it('T3.01.04: Newly registered seller creates listing -> cannot shill bid on their own lot', async () => {
    const sellerEmail = `seller_flow_${Date.now()}@example.kg`;
    const regRes = await env.client.register({
      email: sellerEmail,
      password: 'Pass123456!',
      full_name: 'Self Seller'
    });
    assertEqual(regRes.status, 201);

    const lotRes = await env.client.createAuction({
      title: 'Self Bidding Test Lot',
      category: 'vehicles',
      starting_price_minor: 10000000,
      bid_increment_minor: 500000
    });
    assertEqual(lotRes.status, 201);
    const newLotId = lotRes.data.data.id;

    // Approve lot via Admin API
    await env.client.loginAsAdmin();
    await env.client.setAdminListingStatus(newLotId, 'active');

    // Switch back to seller
    await env.client.login(sellerEmail, 'Pass123456!');

    // Attempt to bid on own lot
    const bidRes = await env.client.placeBid(newLotId, 11000000);
    assertEqual(bidRes.status, 400);
    assert(!bidRes.data.success);
  });

  it('T3.01.05: Buyer places bid -> logs out -> logs back in -> sees bid in dashboard', async () => {
    await env.client.loginAsBuyer();
    const bidRes = await env.client.placeBid('lot-101', 18000000);
    assertEqual(bidRes.status, 201);

    await env.client.logout();
    await env.client.login('buyer@auktsion.kg', 'Password123!');

    const myBids = await env.client.getBids();
    assertEqual(myBids.status, 200);
    assert(myBids.data.data.some(b => b.amount_minor === 18000000));
  });
});
