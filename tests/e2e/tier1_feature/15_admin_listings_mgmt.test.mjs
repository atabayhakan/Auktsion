/**
 * Tier 1: Feature 15 - Admin Listings Management (R3, F17)
 * Minimum 5 tests covering listings catalog, moderation queue, approving lots, rejecting lots, and featured toggles.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'Admin Listings Management');

describe('Feature 15: Admin Listings Management', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.15.01: GET /api/admin/listings returns all auction catalog lots across all statuses', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminListings();
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(Array.isArray(res.data.data));
    assert(res.data.meta.total >= 4);
  });

  it('T1.15.02: Filters moderation queue for pending approval listings', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminListings({ status: 'pending_approval' });
    assertEqual(res.status, 200);
    assert(res.data.data.every(l => l.status === 'pending_approval'));
    assert(res.data.data.some(l => l.id === 'lot-104'));
  });

  it('T1.15.03: Approves submitted lot from pending_approval to active status', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.setAdminListingStatus('lot-104', 'active');
    assertEqual(res.status, 200);
    assert(res.data.success);
    assertEqual(res.data.data.status, 'active');

    // Lot is now live in public auctions
    const publicRes = await env.client.getAuction('lot-104');
    assertEqual(publicRes.data.data.status, 'active');
  });

  it('T1.15.04: Rejects/flags violating listing via PUT /api/admin/listings/:id/status', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.setAdminListingStatus('lot-103', 'flagged');
    assertEqual(res.status, 200);
    assertEqual(res.data.data.status, 'flagged');
  });

  it('T1.15.05: Sets featured hero spotlight and blitz auction flags on lot', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.setAdminListingFeatured('lot-103', { is_featured: true, is_blitz: true });
    assertEqual(res.status, 200);
    assertEqual(res.data.data.is_featured, true);
    assertEqual(res.data.data.is_blitz, true);
  });
});
