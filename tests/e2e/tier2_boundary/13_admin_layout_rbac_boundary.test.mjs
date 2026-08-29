/**
 * Tier 2: Feature 13 Boundary - Admin Layout & RBAC Guard (R3, F15)
 * 5 boundary tests covering forged admin tokens, suspended admin access, unauthenticated probing, unsupported methods, and self-demotion protection.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'Admin Layout & RBAC Boundary');

describe('Tier 2: Feature 13 - Admin Layout & RBAC Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.13.01: Forged token claiming admin role without server signature is blocked with 401/403', async () => {
    env.client.setToken('forged-admin-jwt-token-without-signature');
    const res = await env.client.getAdminOverview();
    assert([401, 403].includes(res.status));
  });

  it('T2.13.02: Probing all admin sub-endpoints while unauthenticated returns 401', async () => {
    env.client.clearToken();
    const adminEndpoints = [
      '/api/admin/overview',
      '/api/admin/users',
      '/api/admin/listings',
      '/api/admin/disputes',
      '/api/admin/kyc',
      '/api/admin/financials',
      '/api/admin/monitoring',
      '/api/admin/analytics'
    ];

    for (const ep of adminEndpoints) {
      const res = await env.client.get(ep);
      assertEqual(res.status, 401, `Expected 401 for unauthenticated call to ${ep}`);
    }
  });

  it('T2.13.03: Probing admin sub-endpoints as buyer returns 403 Forbidden for all modules', async () => {
    await env.client.loginAsBuyer();
    const adminEndpoints = [
      '/api/admin/users',
      '/api/admin/listings',
      '/api/admin/disputes',
      '/api/admin/kyc',
      '/api/admin/financials'
    ];

    for (const ep of adminEndpoints) {
      const res = await env.client.get(ep);
      assertEqual(res.status, 403, `Expected 403 for buyer on ${ep}`);
    }
  });

  it('T2.13.04: Attempting to ban own active admin session returns 400 Bad Request', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.setAdminUserStatus('user-admin-001', 'banned');
    assertEqual(res.status, 400);
    assert(!res.data.success);
  });

  it('T2.13.05: Accessing admin route with invalid HTTP method returns 404 or 405', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.request('DELETE', '/api/admin/overview');
    assert([404, 405].includes(res.status));
  });
});
