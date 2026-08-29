/**
 * Tier 1: Feature 01 - Navigation & Route Matching (R1, F01)
 * Minimum 5 tests covering router mapping, public routes, dynamic routing, auth guards, and 404 fallback.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual, assertIncludes } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'Navigation & Route Matching');

describe('Feature 01: Navigation & Route Matching', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.01.01: Verifies all public core routes exist and return valid responses', async () => {
    const publicRoutes = [
      '/api/health',
      '/api/categories',
      '/api/regions',
      '/api/auctions'
    ];

    for (const route of publicRoutes) {
      const res = await env.client.get(route);
      assert(res.ok, `Expected route ${route} to be accessible with 200 OK, got ${res.status}`);
      assertEqual(res.status, 200);
      assert(res.data && res.data.success === true, `Expected success:true on route ${route}`);
    }
  });

  it('T1.01.02: Resolves dynamic auction route /auctions/:id with lot entity and bids', async () => {
    const res = await env.client.getAuction('lot-101');
    assertEqual(res.status, 200);
    assert(res.data.success);
    assertEqual(res.data.data.id, 'lot-101');
    assertEqual(res.data.data.currency, 'KGS');
    assert(Array.isArray(res.data.data.bids), 'Expected bids array to be present');
  });

  it('T1.01.03: Handles registration and login authentication endpoints', async () => {
    const email = `test_nav_${Date.now()}@example.com`;
    const regRes = await env.client.register({
      email,
      password: 'SecurePassword123!',
      full_name: 'Nav Test User'
    });
    assertEqual(regRes.status, 201);
    assert(regRes.data.token, 'Expected JWT token on registration');

    const meRes = await env.client.getMe();
    assertEqual(meRes.status, 200);
    assertEqual(meRes.data.user.email, email);
  });

  it('T1.01.04: Enforces authentication guard on protected endpoints', async () => {
    env.client.clearToken();
    const profileRes = await env.client.getProfile();
    assertEqual(profileRes.status, 401, 'Protected profile endpoint must return 401 Unauthorized without token');

    const listingsRes = await env.client.getListings();
    assertEqual(listingsRes.status, 401, 'Protected user listings endpoint must return 401 Unauthorized without token');
  });

  it('T1.01.05: Correctly catches and handles unmatched non-existent routes with 404', async () => {
    const res = await env.client.get('/api/non_existent_page_route_xyz_123');
    assertEqual(res.status, 404);
    assert(res.data.message.includes('not found') || !res.data.success);
  });
});
