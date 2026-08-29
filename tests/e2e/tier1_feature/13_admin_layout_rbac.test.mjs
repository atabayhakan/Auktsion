/**
 * Tier 1: Feature 13 - Admin Layout & RBAC Guard (R3, F15)
 * Minimum 5 tests covering admin authorization, non-admin rejection, unauthenticated rejection, overview KPIs, and token lifecycle.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { validateAdminOverviewContract } from '../harness/contractValidators.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'Admin Layout & RBAC Guard');

describe('Feature 13: Admin Layout & RBAC Guard', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.13.01: Admin user with role:admin successfully accesses /api/admin/overview', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminOverview();
    assertEqual(res.status, 200);
    assert(res.data.success);
    validateAdminOverviewContract(res.data.data, 'Admin Overview');
  });

  it('T1.13.02: Standard buyer role is rejected with 403 Forbidden on admin routes', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.getAdminOverview();
    assertEqual(res.status, 403, 'Expected 403 Forbidden for non-admin user');
    assert(!res.data.success);
  });

  it('T1.13.03: Seller role is rejected with 403 Forbidden on admin routes', async () => {
    await env.client.loginAsSeller();
    const res = await env.client.getAdminOverview();
    assertEqual(res.status, 403, 'Expected 403 Forbidden for seller');
    assert(!res.data.success);
  });

  it('T1.13.04: Unauthenticated request is rejected with 401 Unauthorized on admin routes', async () => {
    env.client.clearToken();
    const res = await env.client.getAdminOverview();
    assertEqual(res.status, 401);
  });

  it('T1.13.05: Admin overview returns active auctions, total users, GMV, and pending queues', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminOverview();
    assertEqual(res.status, 200);
    const data = res.data.data;
    assert(data.active_auctions >= 1);
    assert(data.total_users >= 3);
    assert(data.gmv_minor > 0);
    assert(typeof data.pending_kyc === 'number');
  });
});
