/**
 * Tier 1: Feature 08 - User Login & JWT Auth (R2, F09)
 * Minimum 5 tests covering login flow, JWT issuance, credential checking, banned account protection, and role payload.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'User Login & JWT Auth');

describe('Feature 08: User Login & JWT Auth', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.08.01: Authenticates user with valid credentials and issues signed token', async () => {
    const res = await env.client.login('buyer@auktsion.kg', 'Password123!');
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(res.data.token, 'Expected token in login response');
    assertEqual(res.data.user.email, 'buyer@auktsion.kg');
  });

  it('T1.08.02: Rejects login with incorrect password with 401 Unauthorized', async () => {
    const res = await env.client.login('buyer@auktsion.kg', 'WrongPassword999!');
    assertEqual(res.status, 401);
    assert(!res.data.success);
  });

  it('T1.08.03: Rejects login for non-existent email with 401 Unauthorized', async () => {
    const res = await env.client.login('ghost_user@auktsion.kg', 'Password123!');
    assertEqual(res.status, 401);
    assert(!res.data.success);
  });

  it('T1.08.04: Rejects login for banned or suspended accounts with 403 Forbidden', async () => {
    const res = await env.client.login('banned@auktsion.kg', 'Password123!');
    assertEqual(res.status, 403);
    assert(!res.data.success);
  });

  it('T1.08.05: Returned user payload includes assigned role (buyer/seller/admin) without password', async () => {
    const res = await env.client.login('admin@auktsion.kg', 'Password123!');
    assertEqual(res.status, 200);
    assertEqual(res.data.user.role, 'admin');
    assertEqual(res.data.user.password, undefined);
  });
});
