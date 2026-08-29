/**
 * Tier 3: Pairwise - Admin Moderation + User/Listing Interaction Tests
 * 5 cross-feature tests exercising lot creation -> admin approval, spam rejection, user ban -> bid blocking, unban recovery, and role elevation.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 3', 'Admin Moderation Pairwise');

describe('Tier 3: Pairwise - Admin Moderation Interactions', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T3.02.01: Seller submits lot -> Enters pending queue -> Admin approves -> Lot becomes public', async () => {
    // Seller submits
    await env.client.loginAsSeller();
    const createRes = await env.client.createAuction({
      title: 'Pairwise Moderation Lot',
      category: 'livestock',
      starting_price_minor: 10000000
    });
    assertEqual(createRes.status, 201);
    const lotId = createRes.data.data.id;

    // Admin verifies in moderation queue
    await env.client.loginAsAdmin();
    const queueRes = await env.client.getAdminListings({ status: 'pending_approval' });
    assert(queueRes.data.data.some(l => l.id === lotId));

    // Admin approves
    const approveRes = await env.client.setAdminListingStatus(lotId, 'active');
    assertEqual(approveRes.status, 200);

    // Public catalog check
    env.client.clearToken();
    const pubRes = await env.client.getAuction(lotId);
    assertEqual(pubRes.status, 200);
    assertEqual(pubRes.data.data.status, 'active');
  });

  it('T3.02.02: Seller submits prohibited item -> Admin rejects -> Lot is excluded from public search', async () => {
    await env.client.loginAsSeller();
    const createRes = await env.client.createAuction({
      title: 'Prohibited Item 123',
      category: 'antiques'
    });
    const lotId = createRes.data.data.id;

    // Admin rejects
    await env.client.loginAsAdmin();
    await env.client.setAdminListingStatus(lotId, 'flagged');

    // Verify search excludes it
    const searchRes = await env.client.getAuctions({ search: 'Prohibited Item 123', status: 'active' });
    assertEqual(searchRes.data.data.length, 0);
  });

  it('T3.02.03: Admin bans fraudulent buyer -> Active buyer is rejected on subsequent bid attempt', async () => {
    // 1. Buyer obtains active session token
    await env.client.loginAsBuyer();
    const buyerToken = env.client.token;

    // 2. Admin bans buyer
    await env.client.loginAsAdmin();
    await env.client.setAdminUserStatus('user-buyer-001', 'banned');

    // 3. Buyer with existing token attempts to bid -> rejected with 403
    env.client.setToken(buyerToken);
    const bidRes = await env.client.placeBid('lot-101', 18000000);
    assertEqual(bidRes.status, 403);

    // 4. Buyer attempts to login again -> rejected with 403
    const loginRes = await env.client.login('buyer@auktsion.kg', 'Password123!');
    assertEqual(loginRes.status, 403);
  });

  it('T3.02.04: Admin unbans suspended user -> User can immediately log in and participate', async () => {
    await env.client.loginAsAdmin();
    await env.client.setAdminUserStatus('user-banned-001', 'active');

    // User logs in
    const loginRes = await env.client.login('banned@auktsion.kg', 'Password123!');
    assertEqual(loginRes.status, 200);
    assert(loginRes.data.token);
  });

  it('T3.02.05: Admin elevates user role from buyer to seller -> User can create lots', async () => {
    await env.client.loginAsAdmin();
    const roleRes = await env.client.setAdminUserRole('user-buyer-001', 'seller');
    assertEqual(roleRes.status, 200);
    assertEqual(roleRes.data.data.role, 'seller');

    // Buyer logs in and creates lot
    await env.client.loginAsBuyer();
    const createRes = await env.client.createAuction({
      title: 'First Listing as New Seller',
      category: 'vehicles'
    });
    assertEqual(createRes.status, 201);
  });
});
