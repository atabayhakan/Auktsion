/**
 * Tier 5: Adversarial Stress Test Suite - Bidding Concurrency & Race Conditions
 * Tests high-concurrency burst bids, price race conditions, atomic state serialization,
 * zero/negative bids, floating-point precision attacks, self-bidding rejection, and inactive lot bids.
 */

import { describe, it, beforeEach, setTestContext } from '../e2e/harness/testFramework.mjs';
import { assert, assertEqual } from '../e2e/harness/assertions.mjs';
import { getTestEnvironment } from '../e2e/harness/index.mjs';

setTestContext('Tier 5', 'Bidding Concurrency & Race Conditions');

function getLotPrice(lot) {
  if (lot.currentPrice && typeof lot.currentPrice.minorUnits === 'number') {
    return lot.currentPrice.minorUnits;
  }
  return lot.current_price_minor || 0;
}

function getLotIncrement(lot) {
  if (lot.bidIncrement && typeof lot.bidIncrement.minorUnits === 'number') {
    return lot.bidIncrement.minorUnits;
  }
  return lot.bid_increment_minor || 100000;
}

function getLotBidCount(lot) {
  if (lot.bidCount !== undefined) return lot.bidCount;
  if (lot.bid_count !== undefined) return lot.bid_count;
  return 0;
}

function getBidAmountMinor(bid) {
  if (bid.amount && typeof bid.amount.minorUnits === 'number') {
    return bid.amount.minorUnits;
  }
  return bid.amount_minor || 0;
}

describe('Tier 5: Adversarial - Bidding Concurrency & Race Conditions', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    if (env.reset) {
      await env.reset();
    }
  });

  it('ADV.BID.01: High concurrency burst (20 parallel bids) maintains strict serial integrity & monotonic price', async () => {
    // 1. Register distinct competing bidders
    const competitors = [];
    for (let i = 1; i <= 4; i++) {
      const email = `burst_bidder_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}@auktsion.kg`;
      const reg = await env.client.post('/api/auth/register', {
        fullName: `Burst Bidder ${i}`,
        email,
        phone: `+9967000000${i}0`,
        password: 'Password123!',
        city: 'Бишкек'
      });
      competitors.push({ token: reg.data.token, email, id: reg.data.user.id });
    }
    const allTokens = competitors.map(c => c.token);

    // Get an active auction lot
    const auctionsRes = await env.client.getAuctions({ status: 'active' });
    assert(auctionsRes.data && Array.isArray(auctionsRes.data.data) && auctionsRes.data.data.length > 0, 'Must have at least one active auction');
    const targetLot = auctionsRes.data.data[0];
    const lotId = targetLot.id;

    const initialAuctionRes = await env.client.getAuction(lotId);
    const initialAuction = initialAuctionRes.data.data;
    const initialBidCount = getLotBidCount(initialAuction);
    const basePrice = getLotPrice(initialAuction);
    const increment = getLotIncrement(initialAuction);

    // Prepare 20 distinct bid amounts increasing monotonically
    const bidsToFire = [];
    for (let i = 1; i <= 20; i++) {
      const bidAmountMinor = basePrice + (increment * i);
      const token = allTokens[i % allTokens.length];
      bidsToFire.push({ amountMinor: bidAmountMinor, amount: bidAmountMinor / 100, token });
    }

    // Fire all 20 bids concurrently via Promise.all
    const responses = await Promise.all(
      bidsToFire.map(({ amountMinor, amount, token }) =>
        env.client.post(`/api/auctions/${lotId}/bids`, { amount_minor: amountMinor, amount }, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      )
    );

    // Filter successful bids
    const successfulBids = responses.filter(r => r.status === 201 || (r.data && r.data.success));
    assert(successfulBids.length > 0, 'At least one concurrent bid must succeed');

    // Fetch fresh auction state after burst
    const finalAuctionRes = await env.client.getAuction(lotId);
    const finalAuction = finalAuctionRes.data.data;
    const finalPrice = getLotPrice(finalAuction);
    const finalBidCount = getLotBidCount(finalAuction);

    // Verify monotonic price increase: final price must equal the highest successfully placed bid
    const maxSuccessfulAmount = Math.max(...successfulBids.map(r => {
      const b = r.data.data || r.data.bid || {};
      return getBidAmountMinor(b);
    }));

    assertEqual(finalPrice, maxSuccessfulAmount, 'Final auction price must equal the maximum accepted bid amount');
    assertEqual(finalBidCount, initialBidCount + successfulBids.length, 'Total bid count must strictly equal initial + successful bids');

    // Fetch bid history to verify winning flags
    const bidsRes = await env.client.getAuctionBids(lotId);
    const bidHistory = bidsRes.data.data || [];
    assert(bidHistory.length >= successfulBids.length, 'Bid history must contain all accepted bids');

    // Exactly one active winning bid
    const winningBids = bidHistory.filter(b => b.is_winning === true || b.is_winning === 1 || b.isWinning === true);
    assertEqual(winningBids.length, 1, 'There must be exactly one winning bid in the auction after concurrent bidding');
  });

  it('ADV.BID.02: Identical price race collision allows only 1 winner and rejects duplicates with 400', async () => {
    const user1 = await env.client.post('/api/auth/register', {
      fullName: 'Collision User 1',
      email: `col1_${Date.now()}@auktsion.kg`,
      phone: '+996700112233',
      password: 'Password123!',
      city: 'Бишкек'
    });
    const user2 = await env.client.post('/api/auth/register', {
      fullName: 'Collision User 2',
      email: `col2_${Date.now()}@auktsion.kg`,
      phone: '+996700112234',
      password: 'Password123!',
      city: 'Бишкек'
    });

    const auctionsRes = await env.client.getAuctions({ status: 'active' });
    const targetLot = auctionsRes.data.data[0];
    const lotId = targetLot.id;

    const auctionRes = await env.client.getAuction(lotId);
    const currentPrice = getLotPrice(auctionRes.data.data);
    const increment = getLotIncrement(auctionRes.data.data);
    const targetPriceMinor = currentPrice + increment * 2;
    const targetPriceSom = targetPriceMinor / 100;

    // Launch 10 simultaneous bids with the exact same amount
    const tokens = [user1.data.token, user2.data.token];
    const collisionPromises = Array.from({ length: 10 }).map((_, idx) =>
      env.client.post(`/api/auctions/${lotId}/bids`, { amount_minor: targetPriceMinor, amount: targetPriceSom }, {
        headers: { 'Authorization': `Bearer ${tokens[idx % 2]}` }
      })
    );

    const results = await Promise.all(collisionPromises);
    const accepted = results.filter(r => r.status === 201 || (r.data && r.data.success));
    const rejected = results.filter(r => r.status === 400 || (r.data && !r.data.success));

    assertEqual(accepted.length, 1, 'Exactly 1 bid with identical amount must be accepted');
    assertEqual(rejected.length, 9, 'All 9 duplicate amount collisions must be rejected with HTTP 400');
  });

  it('ADV.BID.03: Rapid alternating ping-pong bidding correctly records outbid state for previous winner', async () => {
    const user1 = await env.client.post('/api/auth/register', {
      fullName: 'PingPong User 1',
      email: `pp1_${Date.now()}@auktsion.kg`,
      phone: '+996700556677',
      password: 'Password123!',
      city: 'Бишкек'
    });
    const user2 = await env.client.post('/api/auth/register', {
      fullName: 'PingPong User 2',
      email: `pp2_${Date.now()}@auktsion.kg`,
      phone: '+996700556678',
      password: 'Password123!',
      city: 'Бишкек'
    });

    const auctionsRes = await env.client.getAuctions({ status: 'active' });
    const targetLot = auctionsRes.data.data[0];
    const lotId = targetLot.id;

    const auctionRes = await env.client.getAuction(lotId);
    let currentPrice = getLotPrice(auctionRes.data.data);
    const increment = getLotIncrement(auctionRes.data.data);

    // Run 4 alternating bids
    for (let round = 1; round <= 4; round++) {
      currentPrice += increment;
      const isUser1 = round % 2 === 1;
      const activeToken = isUser1 ? user1.data.token : user2.data.token;

      const bidRes = await env.client.post(`/api/auctions/${lotId}/bids`, {
        amount_minor: currentPrice,
        amount: currentPrice / 100
      }, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });

      assertEqual(bidRes.status, 201, `Round ${round} bid of ${currentPrice} should succeed`);
    }

    // Inspect bids table
    const bidsList = await env.client.getAuctionBids(lotId);
    const bids = bidsList.data.data || [];
    
    // Most recent bid must be winning
    const winningBid = bids.find(b => b.is_winning === true || b.is_winning === 1 || b.isWinning === true);
    assert(winningBid, 'Must have an active winning bid');
    assertEqual(getBidAmountMinor(winningBid), currentPrice);

    // Outbid bids
    const outbidBids = bids.filter(b => b.is_winning === false || b.is_winning === 0 || b.isWinning === false);
    assert(outbidBids.length >= 3, 'All prior bids in the ping-pong round must be marked outbid');
  });

  it('ADV.BID.04: Seller is strictly forbidden from bidding on their own listing (shill prevention)', async () => {
    // Register seller and create lot
    const sellerReg = await env.client.post('/api/auth/register', {
      fullName: 'Shill Test Seller',
      email: `seller_shill_${Date.now()}@auktsion.kg`,
      phone: '+996700334455',
      password: 'Password123!',
      city: 'Бишкек'
    });
    const sellerToken = sellerReg.data.token;

    const lotRes = await env.client.post('/api/auctions', {
      title: 'Shill Prevention Lot',
      description: 'Testing self-bidding prevention',
      category: 'livestock',
      startingPrice: 50000,
      starting_price_minor: 5000000,
      bidIncrement: 5000,
      bid_increment_minor: 500000,
      city: 'Бишкек',
      regionId: 'chuy'
    }, {
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });

    const lotId = lotRes.data.data ? lotRes.data.data.id : null;
    assert(lotId, 'Lot must be created');

    // Seller attempts to bid on own lot
    const bidRes = await env.client.post(`/api/auctions/${lotId}/bids`, {
      amount: 60000,
      amount_minor: 6000000
    }, {
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });

    assertEqual(bidRes.status, 400, 'Seller bidding on own lot must return HTTP 400');
    assert(!bidRes.data.success, 'Success flag must be false');
  });

  it('ADV.BID.05: Rejects zero, negative, NaN, non-numeric, and sub-increment amounts', async () => {
    const buyerReg = await env.client.post('/api/auth/register', {
      fullName: 'Boundary Bidder',
      email: `boundary_bid_${Date.now()}@auktsion.kg`,
      phone: '+996700445566',
      password: 'Password123!',
      city: 'Бишкек'
    });
    const buyerToken = buyerReg.data.token;

    const auctionsRes = await env.client.getAuctions({ status: 'active' });
    const targetLot = auctionsRes.data.data[0];
    const lotId = targetLot.id;

    // 1. Zero amount
    const resZero = await env.client.post(`/api/auctions/${lotId}/bids`, { amount: 0, amount_minor: 0 }, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    assertEqual(resZero.status, 400, 'Zero bid must be rejected');

    // 2. Negative amount
    const resNeg = await env.client.post(`/api/auctions/${lotId}/bids`, { amount: -1000, amount_minor: -100000 }, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    assertEqual(resNeg.status, 400, 'Negative bid must be rejected');

    // 3. String non-numeric amount
    const resNaN = await env.client.post(`/api/auctions/${lotId}/bids`, { amount: 'INVALID_AMOUNT', amount_minor: 'INVALID_AMOUNT' }, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    assertEqual(resNaN.status, 400, 'NaN string bid must be rejected');

    // 4. Empty body bid
    const resNull = await env.client.post(`/api/auctions/${lotId}/bids`, {}, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    assertEqual(resNull.status, 400, 'Empty body bid must be rejected');

    // 5. 1 tiyyn below minimum increment requirement
    const auctionRes = await env.client.getAuction(lotId);
    const currentPrice = getLotPrice(auctionRes.data.data);
    const increment = getLotIncrement(auctionRes.data.data);
    const subIncrementMinor = currentPrice + increment - 1;

    const resSub = await env.client.post(`/api/auctions/${lotId}/bids`, {
      amount: subIncrementMinor / 100,
      amount_minor: subIncrementMinor
    }, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    assertEqual(resSub.status, 400, 'Bid 1 tiyyn below increment must be rejected');
  });

  it('ADV.BID.06: Strictly rejects bidding on non-existent lots', async () => {
    const buyerReg = await env.client.post('/api/auth/register', {
      fullName: 'NonExistent Bidder',
      email: `nonexist_${Date.now()}@auktsion.kg`,
      phone: '+996700778899',
      password: 'Password123!',
      city: 'Бишкек'
    });

    const res404 = await env.client.post('/api/auctions/lot-non-existent-888/bids', {
      amount: 5000,
      amount_minor: 500000
    }, {
      headers: { 'Authorization': `Bearer ${buyerReg.data.token}` }
    });
    assertEqual(res404.status, 404, 'Bidding on non-existent lot must return 404');
  });
});
