/**
 * Tier 5: Adversarial Stress Test Suite - Anti-Sniping & Auction Timers
 * Tests soft-close extension triggers, boundary clock conditions, chained extensions,
 * and post-expiration bid rejection.
 */

import { describe, it, beforeEach, setTestContext } from '../e2e/harness/testFramework.mjs';
import { assert, assertEqual } from '../e2e/harness/assertions.mjs';
import { getTestEnvironment } from '../e2e/harness/index.mjs';

setTestContext('Tier 5', 'Anti-Sniping & Auction Timers');

function getLotEndsAtMs(lot) {
  const endsAt = lot.ends_at || lot.endsAt;
  return new Date(endsAt).getTime();
}

describe('Tier 5: Adversarial - Anti-Sniping & Auction Timers', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    if (env.reset) {
      await env.reset();
    }
  });

  it('ADV.SNIPE.01: Bid placed within soft-close window (< 3 minutes remaining) triggers time extension', async () => {
    // 1. Register a seller
    const sellerReg = await env.client.post('/api/auth/register', {
      fullName: 'AntiSnipe Seller 1',
      email: `snipe_seller_${Date.now()}@auktsion.kg`,
      phone: '+996700119911',
      password: 'Password123!',
      city: 'Бишкек'
    });
    const sellerToken = sellerReg.data.token;

    // Create auction ending in 60 seconds
    const nearExpiryEndsAt = new Date(Date.now() + 60 * 1000).toISOString();
    const lotRes = await env.client.post('/api/auctions', {
      title: 'Near Expiry Soft Close Test Lot',
      description: 'Testing 3-minute anti-sniping soft close extension trigger',
      category: 'livestock',
      startingPrice: 10000,
      starting_price_minor: 1000000,
      bidIncrement: 1000,
      bid_increment_minor: 100000,
      city: 'Бишкек',
      regionId: 'chuy',
      ends_at: nearExpiryEndsAt,
      durationHours: 0.02
    }, {
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });

    const lot = lotRes.data.data;
    const lotId = lot ? lot.id : null;
    assert(lotId, 'Lot must be created successfully');

    // Register a distinct buyer
    const buyerReg = await env.client.post('/api/auth/register', {
      fullName: 'Sniper Buyer 1',
      email: `sniper_buyer_${Date.now()}@auktsion.kg`,
      phone: '+996700228822',
      password: 'Password123!',
      city: 'Бишкек'
    });
    const buyerToken = buyerReg.data.token;

    const beforeBidTime = Date.now();

    // Place valid bid
    const bidRes = await env.client.post(`/api/auctions/${lotId}/bids`, {
      amount: 11000,
      amount_minor: 1100000
    }, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    assertEqual(bidRes.status, 201, 'Bid in soft-close window should succeed');

    // Verify time extension in updated auction
    const updatedAuctionRes = await env.client.getAuction(lotId);
    const updatedAuction = updatedAuctionRes.data.data;
    const newEndsAtMs = getLotEndsAtMs(updatedAuction);

    // New endsAt must be in the future beyond original nearExpiryEndsAt
    assert(newEndsAtMs > new Date(nearExpiryEndsAt).getTime(), 'Auction ends_at must be extended into the future');
    assert(newEndsAtMs >= beforeBidTime + 90 * 1000, 'Auction ends_at must be extended by at least 2-3 minutes');
  });

  it('ADV.SNIPE.02: Bid placed far before expiry (> 1 hour remaining) does NOT extend time', async () => {
    const sellerReg = await env.client.post('/api/auth/register', {
      fullName: 'Standard Seller',
      email: `std_seller_${Date.now()}@auktsion.kg`,
      phone: '+996700337733',
      password: 'Password123!',
      city: 'Ош'
    });
    const sellerToken = sellerReg.data.token;

    const farFutureEndsAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    const lotRes = await env.client.post('/api/auctions', {
      title: 'Far Future Test Lot',
      description: 'Testing standard bidding without soft close trigger',
      category: 'vehicles',
      startingPrice: 50000,
      starting_price_minor: 5000000,
      bidIncrement: 5000,
      bid_increment_minor: 500000,
      city: 'Ош',
      regionId: 'osh',
      ends_at: farFutureEndsAt,
      durationHours: 48
    }, {
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });

    const lotId = lotRes.data.data ? lotRes.data.data.id : null;
    assert(lotId, 'Lot must be created');

    // Initial endsAt
    const initialAuctionRes = await env.client.getAuction(lotId);
    const initialEndsAtMs = getLotEndsAtMs(initialAuctionRes.data.data);

    // Register buyer and place bid
    const buyerReg = await env.client.post('/api/auth/register', {
      fullName: 'Standard Buyer',
      email: `std_buyer_${Date.now()}@auktsion.kg`,
      phone: '+996700446644',
      password: 'Password123!',
      city: 'Бишкек'
    });

    const bidRes = await env.client.post(`/api/auctions/${lotId}/bids`, {
      amount: 55000,
      amount_minor: 5500000
    }, {
      headers: { 'Authorization': `Bearer ${buyerReg.data.token}` }
    });
    assertEqual(bidRes.status, 201);

    const updatedAuctionRes = await env.client.getAuction(lotId);
    const updatedAuction = updatedAuctionRes.data.data;
    const currentEndsAtMs = getLotEndsAtMs(updatedAuction);

    // The ends_at should remain unchanged (within 5 seconds tolerance)
    assert(Math.abs(currentEndsAtMs - initialEndsAtMs) < 5000, 'Auction ends_at should NOT change when bid is placed well before expiry');
  });

  it('ADV.SNIPE.03: Chained consecutive last-second snipes monotonically push countdown outward', async () => {
    const sellerReg = await env.client.post('/api/auth/register', {
      fullName: 'Chained Seller',
      email: `chain_seller_${Date.now()}@auktsion.kg`,
      phone: '+996700555511',
      password: 'Password123!',
      city: 'Бишкек'
    });
    const sellerToken = sellerReg.data.token;

    const lotRes = await env.client.post('/api/auctions', {
      title: 'Chained Sniping Lot',
      description: 'Multiple sequential snipers pushing timer',
      category: 'electronics',
      startingPrice: 20000,
      starting_price_minor: 2000000,
      bidIncrement: 2000,
      bid_increment_minor: 200000,
      city: 'Бишкек',
      regionId: 'bishkek',
      ends_at: new Date(Date.now() + 45 * 1000).toISOString(),
      durationHours: 0.01
    }, {
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });

    const lotId = lotRes.data.data ? lotRes.data.data.id : null;
    assert(lotId, 'Lot must be created');

    // Competing buyers
    const buyer1 = await env.client.post('/api/auth/register', {
      fullName: 'Chained Sniper 1',
      email: `csnip1_${Date.now()}@auktsion.kg`,
      phone: '+996700991101',
      password: 'Password123!',
      city: 'Бишкек'
    });
    const token1 = buyer1.data.token;

    const buyer2 = await env.client.post('/api/auth/register', {
      fullName: 'Chained Sniper 2',
      email: `csnip2_${Date.now()}@auktsion.kg`,
      phone: '+996700991102',
      password: 'Password123!',
      city: 'Бишкек'
    });
    const token2 = buyer2.data.token;

    let previousEndsAtMs = 0;
    let currentBidAmount = 20000;

    // Place 3 sequential snipes
    for (let i = 1; i <= 3; i++) {
      currentBidAmount += 2000;
      const activeToken = i % 2 === 1 ? token1 : token2;

      const bidRes = await env.client.post(`/api/auctions/${lotId}/bids`, {
        amount: currentBidAmount,
        amount_minor: currentBidAmount * 100
      }, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      assertEqual(bidRes.status, 201, `Chained snipe #${i} must succeed`);

      const updatedLot = await env.client.getAuction(lotId);
      const endsAtMs = getLotEndsAtMs(updatedLot.data.data);

      if (previousEndsAtMs > 0) {
        assert(endsAtMs >= previousEndsAtMs, `Snipe #${i} ends_at (${endsAtMs}) must be >= previous ends_at (${previousEndsAtMs})`);
      }
      previousEndsAtMs = endsAtMs;
    }
  });

  it('ADV.SNIPE.04: Placing a bid on an already expired lot is strictly rejected with 400', async () => {
    // Look for ended auction or create one
    const sellerReg = await env.client.post('/api/auth/register', {
      fullName: 'Expired Lot Seller',
      email: `exp_seller_${Date.now()}@auktsion.kg`,
      phone: '+996700661100',
      password: 'Password123!',
      city: 'Нарын'
    });

    const expiredEndsAt = new Date(Date.now() - 60 * 1000).toISOString();
    const lotRes = await env.client.post('/api/auctions', {
      title: 'Expired Lot',
      description: 'Expired lot test',
      category: 'antiques',
      startingPrice: 10000,
      starting_price_minor: 1000000,
      bidIncrement: 1000,
      bid_increment_minor: 100000,
      city: 'Нарын',
      regionId: 'naryn',
      ends_at: expiredEndsAt,
      durationHours: -1
    }, {
      headers: { 'Authorization': `Bearer ${sellerReg.data.token}` }
    });

    const lotId = lotRes.data.data ? lotRes.data.data.id : null;
    assert(lotId, 'Lot should be created or referenceable');

    // Register buyer and attempt late bid
    const buyerReg = await env.client.post('/api/auth/register', {
      fullName: 'Late Buyer',
      email: `late_buyer_${Date.now()}@auktsion.kg`,
      phone: '+996700882200',
      password: 'Password123!',
      city: 'Бишкек'
    });

    const lateBidRes = await env.client.post(`/api/auctions/${lotId}/bids`, {
      amount: 15000,
      amount_minor: 1500000
    }, {
      headers: { 'Authorization': `Bearer ${buyerReg.data.token}` }
    });

    assertEqual(lateBidRes.status, 400, 'Bid on expired lot must return HTTP 400');
    assert(!lateBidRes.data.success, 'Success must be false');
  });
});
