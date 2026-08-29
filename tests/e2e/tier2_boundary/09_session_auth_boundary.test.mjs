/**
 * Tier 2: Feature 09 Boundary - Session & Auth Guards (R2, F10, F11)
 * 5 boundary tests covering malformed auth headers, control characters in tokens, expired tokens, unauthenticated logout, and concurrent token use.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'Session & Auth Guards Boundary');

describe('Tier 2: Feature 09 - Session & Auth Guards Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.09.01: Rejects requests with non-Bearer Authorization scheme (e.g. Basic ...)', async () => {
    const res = await env.client.get('/api/auth/me', {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' }
    });
    assertEqual(res.status, 401);
  });

  it('T2.09.02: Rejects token containing null bytes or invalid ASCII characters', async () => {
    try {
      const res = await env.client.get('/api/auth/me', {
        headers: { Authorization: 'Bearer token-with-null\0byte' }
      });
      assertEqual(res.status, 401);
    } catch (err) {
      assert(err instanceof TypeError || String(err).includes('invalid header'));
    }
  });

  it('T2.09.03: Rejects expired or invalidated token with 401 Unauthorized', async () => {
    env.client.setToken('token-expired-99999');
    const res = await env.client.get('/api/auth/me');
    assertEqual(res.status, 401);
  });

  it('T2.09.04: Calling logout while unauthenticated returns 200 clean exit without exceptions', async () => {
    env.client.clearToken();
    const res = await env.client.logout();
    assertEqual(res.status, 200);
  });

  it('T2.09.05: Allows concurrent parallel requests with the same valid JWT token', async () => {
    await env.client.loginAsBuyer();
    const promises = Array.from({ length: 10 }, () => env.client.getMe());
    const responses = await Promise.all(promises);
    assert(responses.every(r => r.status === 200));
  });
});
