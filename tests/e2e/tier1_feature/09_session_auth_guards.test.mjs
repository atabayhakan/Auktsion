/**
 * Tier 1: Feature 09 - Session & Auth Guards (R2, F10, F11)
 * Minimum 5 tests covering /api/auth/me, token verification, missing header guard, logout, and protected route access.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'Session & Auth Guards');

describe('Feature 09: Session & Auth Guards', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.09.01: GET /api/auth/me returns authenticated user details with valid Bearer token', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.getMe();
    assertEqual(res.status, 200);
    assert(res.data.success);
    assertEqual(res.data.user.email, 'buyer@auktsion.kg');
  });

  it('T1.09.02: GET /api/auth/me returns 401 Unauthorized with malformed or fake token', async () => {
    env.client.setToken('invalid-forged-token-xyz');
    const res = await env.client.getMe();
    assertEqual(res.status, 401);
    assert(!res.data.success);
  });

  it('T1.09.03: Protected endpoints reject requests when Authorization header is omitted', async () => {
    env.client.clearToken();
    const res = await env.client.getMe();
    assertEqual(res.status, 401);
  });

  it('T1.09.04: POST /api/auth/logout clears client session state', async () => {
    await env.client.loginAsBuyer();
    const logoutRes = await env.client.logout();
    assertEqual(logoutRes.status, 200);
    assert(logoutRes.data.success);

    // After logout client token is cleared
    const meRes = await env.client.getMe();
    assertEqual(meRes.status, 401);
  });

  it('T1.09.05: Token is persistently accepted across consecutive protected API calls', async () => {
    await env.client.loginAsSeller();
    const profileRes = await env.client.getProfile();
    assertEqual(profileRes.status, 200);

    const listingsRes = await env.client.getListings();
    assertEqual(listingsRes.status, 200);

    const settingsRes = await env.client.getSettings();
    assertEqual(settingsRes.status, 200);
  });
});
