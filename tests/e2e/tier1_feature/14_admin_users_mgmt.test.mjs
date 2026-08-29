/**
 * Tier 1: Feature 14 - Admin Users Management (R3, F16)
 * Minimum 5 tests covering user listing, filtering, user banning, user unbanning, and role elevation.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual, assertIncludes } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'Admin Users Management');

describe('Feature 14: Admin Users Management', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.14.01: GET /api/admin/users lists all registered users with complete meta counts', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminUsers();
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(Array.isArray(res.data.data));
    assert(res.data.meta.total >= 4);
  });

  it('T1.14.02: Filters users by role and search keyword in admin console', async () => {
    await env.client.loginAsAdmin();
    const sellerRes = await env.client.getAdminUsers({ role: 'seller' });
    assertEqual(sellerRes.status, 200);
    assert(sellerRes.data.data.every(u => u.role === 'seller'));

    const searchRes = await env.client.getAdminUsers({ search: 'Акылбек' });
    assertEqual(searchRes.status, 200);
    assert(searchRes.data.data.length >= 1);
    assertIncludes(searchRes.data.data[0].full_name, 'Акылбек');
  });

  it('T1.14.03: Suspends or bans user account via PUT /api/admin/users/:id/status', async () => {
    await env.client.loginAsAdmin();
    const banRes = await env.client.setAdminUserStatus('user-buyer-001', 'banned');
    assertEqual(banRes.status, 200);
    assert(banRes.data.success);
    assertEqual(banRes.data.data.status, 'banned');

    // Verify buyer can no longer log in
    const loginRes = await env.client.login('buyer@auktsion.kg', 'Password123!');
    assertEqual(loginRes.status, 403);
  });

  it('T1.14.04: Reactivates suspended user to active status', async () => {
    await env.client.loginAsAdmin();
    const unbanRes = await env.client.setAdminUserStatus('user-banned-001', 'active');
    assertEqual(unbanRes.status, 200);
    assertEqual(unbanRes.data.data.status, 'active');

    // Verify user can now log in
    const loginRes = await env.client.login('banned@auktsion.kg', 'Password123!');
    assertEqual(loginRes.status, 200);
  });

  it('T1.14.05: Modifies user permission role via PUT /api/admin/users/:id/role', async () => {
    await env.client.loginAsAdmin();
    const roleRes = await env.client.setAdminUserRole('user-buyer-001', 'moderator');
    assertEqual(roleRes.status, 200);
    assertEqual(roleRes.data.data.role, 'moderator');
  });
});
