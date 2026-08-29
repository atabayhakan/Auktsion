/**
 * Tier 3: Pairwise - UI State + Routing Navigation Interaction Tests
 * 5 cross-feature tests exercising catalog navigation -> category/region filtering -> lot detail -> watchlist -> profile sync.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual, assertIncludes } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 3', 'UI Routing Pairwise');

describe('Tier 3: Pairwise - UI State + Routing Interactions', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T3.06.01: Filter catalog by category + region -> Drill down to lot details cleanly', async () => {
    const filterRes = await env.client.getAuctions({ category: 'livestock', region: 'osh' });
    assertEqual(filterRes.status, 200);
    assert(filterRes.data.data.length >= 1);
    const targetLot = filterRes.data.data[0];

    const detailRes = await env.client.getAuction(targetLot.id);
    assertEqual(detailRes.status, 200);
    assertEqual(detailRes.data.data.id, targetLot.id);
    assertEqual(detailRes.data.data.city, 'Ош');
  });

  it('T3.06.02: Unauthenticated user bids -> Authenticates -> Bids successfully on same lot', async () => {
    env.client.clearToken();
    const unauthBid = await env.client.placeBid('lot-101', 18000000);
    assertEqual(unauthBid.status, 401);

    // Logs in
    await env.client.loginAsBuyer();
    const authBid = await env.client.placeBid('lot-101', 18000000);
    assertEqual(authBid.status, 201);
  });

  it('T3.06.03: Buyer views watchlist lots in dashboard overview', async () => {
    await env.client.loginAsBuyer();
    const watchlistRes = await env.client.get('/api/user/watchlist');
    assertEqual(watchlistRes.status, 200);
    assert(Array.isArray(watchlistRes.data.data));
    assert(watchlistRes.data.data.some(l => l.id === 'lot-101'));
  });

  it('T3.06.04: Profile changes sync to active session and subsequent dashboard queries', async () => {
    await env.client.loginAsSeller();
    const newCity = 'Каракол';
    await env.client.updateProfile({ city: newCity });

    const meRes = await env.client.getMe();
    assertEqual(meRes.data.user.city, newCity);
  });

  it('T3.06.05: Category navigation card pushes query params and filters auction catalog correctly', async () => {
    const res = await env.client.getAuctions({ category: 'vehicles' });
    assertEqual(res.status, 200);
    assert(res.data.data.every(l => l.category === 'vehicles'));
  });
});
