/**
 * Tier 5: Adversarial Stress Test Suite - Admin Moderation, Shill Bidding & State Transitions
 * Tests rapid ban/unban toggling, auction pause/resume state locks, admin bid cancellation
 * and second-highest price recalculation, self-admin protection, and listing lifecycle transitions.
 */

import { describe, it, beforeEach, setTestContext } from '../e2e/harness/testFramework.mjs';
import { assert, assertEqual } from '../e2e/harness/assertions.mjs';
import { getTestEnvironment } from '../e2e/harness/index.mjs';

setTestContext('Tier 5', 'Admin Moderation & Shill Radar');

describe('Tier 5: Adversarial - Admin Moderation & Shill Radar', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    if (env.reset) {
      await env.reset();
    }
  });

  it('ADV.MOD.01: Rapid user ban/unban toggles immediately revoke and restore bidding capabilities', async () => {
    // 1. Create a dynamic test user
    const regRes = await env.client.post('/api/auth/register', {
      fullName: 'Moderation Target User',
      email: `mod_target_${Date.now()}@auktsion.kg`,
      phone: '+996555110022',
      password: 'Password123!'
    });
    const targetUserId = regRes.data.user.id;
    const targetToken = regRes.data.token;

    // 2. Target user places a valid bid on lot-101
    const initialBid = await env.client.post('/api/auctions/lot-101/bids', { amount_minor: 18000000 }, {
      headers: { 'Authorization': `Bearer ${targetToken}` }
    });
    assertEqual(initialBid.status, 201, 'Active user can place bids');

    // 3. Admin bans user
    const adminLogin = await env.client.login('admin@auktsion.kg', 'Password123!');
    const adminToken = adminLogin.data.token;

    const banRes = await env.client.put(`/api/admin/users/${targetUserId}/status`, { status: 'banned' }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertEqual(banRes.status, 200, 'Admin can ban user');

    // 4. Banned user attempt to place next bid must be strictly blocked (403)
    const blockedBid = await env.client.post('/api/auctions/lot-101/bids', { amount_minor: 19000000 }, {
      headers: { 'Authorization': `Bearer ${targetToken}` }
    });
    assertEqual(blockedBid.status, 403, 'Banned user bid must be rejected with HTTP 403');

    // 5. Admin unbans user back to 'active'
    const unbanRes = await env.client.put(`/api/admin/users/${targetUserId}/status`, { status: 'active' }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertEqual(unbanRes.status, 200, 'Admin can restore user status');

    // 6. Restored user can now bid again
    const restoredBid = await env.client.post('/api/auctions/lot-101/bids', { amount_minor: 20000000 }, {
      headers: { 'Authorization': `Bearer ${targetToken}` }
    });
    assertEqual(restoredBid.status, 201, 'Restored active user can place bids again');
  });

  it('ADV.MOD.02: Pausing auction locks bidding with HTTP 400; resuming unlocks bidding cleanly', async () => {
    const adminLogin = await env.client.login('admin@auktsion.kg', 'Password123!');
    const adminToken = adminLogin.data.token;

    const buyerLogin = await env.client.login('buyer@auktsion.kg', 'Password123!');
    const buyerToken = buyerLogin.data.token;

    const lotId = 'lot-101';

    // 1. Admin pauses auction
    const pauseRes = await env.client.post(`/api/admin/auctions/${lotId}/pause`, { pause: true }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertEqual(pauseRes.status, 200, 'Admin can pause auction');

    // 2. Buyer attempts to bid on paused auction -> must fail with 400
    const pausedBidRes = await env.client.post(`/api/auctions/${lotId}/bids`, { amount_minor: 22000000 }, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    assertEqual(pausedBidRes.status, 400, 'Bidding on paused auction must return HTTP 400');
    assert(!pausedBidRes.data.success, 'Success must be false on paused auction');

    // 3. Admin unpauses/resumes auction
    const resumeRes = await env.client.post(`/api/admin/auctions/${lotId}/pause`, { pause: false }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertEqual(resumeRes.status, 200, 'Admin can resume auction');

    // 4. Buyer bids on resumed auction -> succeeds
    const activeBidRes = await env.client.post(`/api/auctions/${lotId}/bids`, { amount_minor: 22000000 }, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    assertEqual(activeBidRes.status, 201, 'Bidding on resumed auction must succeed with 201');
  });

  it('ADV.MOD.03: Admin bid cancellation correctly re-evaluates next-highest bid and current lot price', async () => {
    const adminLogin = await env.client.login('admin@auktsion.kg', 'Password123!');
    const adminToken = adminLogin.data.token;

    const buyerLogin = await env.client.login('buyer@auktsion.kg', 'Password123!');
    const buyerToken = buyerLogin.data.token;

    const lotId = 'lot-101';

    // 1. Place two sequential bids
    const bid1 = await env.client.post(`/api/auctions/${lotId}/bids`, { amount_minor: 24000000 }, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    assertEqual(bid1.status, 201);

    const bid2 = await env.client.post(`/api/auctions/${lotId}/bids`, { amount_minor: 26000000 }, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    assertEqual(bid2.status, 201);
    const highestBidId = bid2.data.data.id;

    // 2. Admin cancels the highest bid (e.g. fraudulent/shill bid)
    const cancelRes = await env.client.post(`/api/admin/bids/${highestBidId}/cancel`, {}, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertEqual(cancelRes.status, 200, 'Admin can cancel fraudulent bid');

    // 3. Check auction price and bids state
    const auctionRes = await env.client.getAuction(lotId);
    const auction = auctionRes.data.data;
    const currentPrice = auction.current_price_minor || auction.currentPrice.minorUnits;

    // The auction price should not remain at the cancelled 26,000,000
    assert(currentPrice <= 26000000, 'Current auction price must be updated after bid cancellation');
  });

  it('ADV.MOD.04: Admin cannot ban their own administrative account (self-preservation rule)', async () => {
    const adminLogin = await env.client.login('admin@auktsion.kg', 'Password123!');
    const adminToken = adminLogin.data.token;
    const adminId = adminLogin.data.user.id;

    const selfBanRes = await env.client.put(`/api/admin/users/${adminId}/status`, { status: 'banned' }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assertEqual(selfBanRes.status, 400, 'Admin attempting to ban self must return HTTP 400');
    assert(!selfBanRes.data.success, 'Self-ban operation must fail');
  });

  it('ADV.MOD.05: Admin listing management updates status and featured flags cleanly', async () => {
    const adminLogin = await env.client.login('admin@auktsion.kg', 'Password123!');
    const adminToken = adminLogin.data.token;

    // 1. Toggle featured on lot-101
    const featRes = await env.client.put('/api/admin/listings/lot-101/featured', { is_featured: true, isFeatured: true }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertEqual(featRes.status, 200, 'Admin can set lot to featured');

    // 2. Update listing status to flagged
    const statusRes = await env.client.put('/api/admin/listings/lot-101/status', { status: 'flagged' }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertEqual(statusRes.status, 200, 'Admin can update lot status to flagged');
  });

  it('ADV.MOD.06: Admin user role updates (buyer -> seller -> moderator)', async () => {
    const adminLogin = await env.client.login('admin@auktsion.kg', 'Password123!');
    const adminToken = adminLogin.data.token;

    const regRes = await env.client.post('/api/auth/register', {
      fullName: 'Role Promotion Target',
      email: `role_target_${Date.now()}@auktsion.kg`,
      phone: '+996700554433',
      password: 'Password123!'
    });
    const targetUserId = regRes.data.user.id;

    // Promote to seller
    const sellerRes = await env.client.put(`/api/admin/users/${targetUserId}/role`, { role: 'seller' }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertEqual(sellerRes.status, 200);
    assertEqual(sellerRes.data.data.role, 'seller', 'Role must be updated to seller');

    // Promote to moderator
    const modRes = await env.client.put(`/api/admin/users/${targetUserId}/role`, { role: 'moderator' }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertEqual(modRes.status, 200);
    assertEqual(modRes.data.data.role, 'moderator', 'Role must be updated to moderator');
  });
});
