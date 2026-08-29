/**
 * Tier 2: Feature 08 Boundary - User Login & JWT Auth (R2, F09)
 * 5 boundary tests covering empty credentials, case-insensitive email login, repeated failed attempts, and injection security.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'User Login & JWT Boundary');

describe('Tier 2: Feature 08 - User Login & JWT Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.08.01: Rejects login with empty email field with 400 Bad Request', async () => {
    const res = await env.client.login('', 'Password123!');
    assertEqual(res.status, 400);
  });

  it('T2.08.02: Rejects login with empty password field with 400 Bad Request', async () => {
    const res = await env.client.login('buyer@auktsion.kg', '');
    assertEqual(res.status, 400);
  });

  it('T2.08.03: Authenticates successfully when email is supplied in uppercase', async () => {
    const res = await env.client.login('BUYER@AUKTSION.KG', 'Password123!');
    assertEqual(res.status, 200);
    assert(res.data.token);
  });

  it('T2.08.04: Handles repeated failed login attempts without unhandled rejections', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await env.client.login('buyer@auktsion.kg', `WrongPasswordAttempt_${i}`);
      assertEqual(res.status, 401);
    }
  });

  it('T2.08.05: Blocks SQL injection authentication bypass attempts (" OR 1=1 --)', async () => {
    const res = await env.client.login("' OR '1'='1", "' OR '1'='1");
    assertEqual(res.status, 401);
    assert(!res.data.success);
  });
});
