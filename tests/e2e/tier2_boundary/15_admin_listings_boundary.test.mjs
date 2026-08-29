/**
 * Tier 2: Feature 15 Boundary - Admin Listings Management (R3, F17)
 * 5 boundary tests covering non-existent lot status change, non-existent lot featured toggle, empty categories, invalid status codes, and empty flag payloads.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'Admin Listings Boundary');

describe('Tier 2: Feature 15 - Admin Listings Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.15.01: Modifying status on non-existent auction ID returns 404 Not Found', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.setAdminListingStatus('lot-non-existent-999', 'active');
    assertEqual(res.status, 404);
  });

  it('T2.15.02: Modifying featured spotlight flag on non-existent auction ID returns 404', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.setAdminListingFeatured('lot-non-existent-999', { is_featured: true });
    assertEqual(res.status, 404);
  });

  it('T2.15.03: Filtering admin listings catalog by non-existent status returns empty list', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminListings({ status: 'teleported' });
    assertEqual(res.status, 200);
    assertEqual(res.data.data.length, 0);
  });

  it('T2.15.04: Repeated status transition to same status is handled idempotently', async () => {
    await env.client.loginAsAdmin();
    const res1 = await env.client.setAdminListingStatus('lot-101', 'active');
    assertEqual(res1.status, 200);

    const res2 = await env.client.setAdminListingStatus('lot-101', 'active');
    assertEqual(res2.status, 200);
    assertEqual(res2.data.data.status, 'active');
  });

  it('T2.15.05: Featured toggle with empty payload preserves existing flags', async () => {
    await env.client.loginAsAdmin();
    const initial = (await env.client.getAuction('lot-101')).data.data;
    const res = await env.client.setAdminListingFeatured('lot-101', {});
    assertEqual(res.status, 200);
    assertEqual(res.data.data.is_featured, initial.is_featured);
  });
});
