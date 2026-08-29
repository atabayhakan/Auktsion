/**
 * Tier 2: Feature 14 Boundary - Admin Users Management (R3, F16)
 * 5 boundary tests covering non-existent user status change, non-existent user role change, invalid roles, empty search filters, and status idempotency.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'Admin Users Boundary');

describe('Tier 2: Feature 14 - Admin Users Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.14.01: Modifying status of non-existent user ID returns 404 Not Found', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.setAdminUserStatus('user-non-existent-999', 'banned');
    assertEqual(res.status, 404);
  });

  it('T2.14.02: Modifying role of non-existent user ID returns 404 Not Found', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.setAdminUserRole('user-non-existent-999', 'admin');
    assertEqual(res.status, 404);
  });

  it('T2.14.03: User directory search with empty string returns full user catalog', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminUsers({ search: '' });
    assertEqual(res.status, 200);
    assert(res.data.data.length >= 4);
  });

  it('T2.14.04: Repeated status change to same status is idempotent', async () => {
    await env.client.loginAsAdmin();
    const res1 = await env.client.setAdminUserStatus('user-buyer-001', 'suspended');
    assertEqual(res1.status, 200);

    const res2 = await env.client.setAdminUserStatus('user-buyer-001', 'suspended');
    assertEqual(res2.status, 200);
    assertEqual(res2.data.data.status, 'suspended');
  });

  it('T2.14.05: Filtering users by non-existent role returns empty array', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminUsers({ role: 'astronaut' });
    assertEqual(res.status, 200);
    assertEqual(res.data.data.length, 0);
  });
});
