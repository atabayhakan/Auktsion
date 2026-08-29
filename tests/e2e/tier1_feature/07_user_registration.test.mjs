/**
 * Tier 1: Feature 07 - User Registration & Password Hashing (R2, F08)
 * Minimum 5 tests covering user registration, token issuance, duplicate rejection, validation, and security.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { validateUserContract } from '../harness/contractValidators.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'User Registration & Password Hashing');

describe('Feature 07: User Registration & Password Hashing', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.07.01: Registers a new user successfully and returns 201, JWT token, and profile', async () => {
    const regPayload = {
      username: 'ernis_user',
      email: 'ernis@example.kg',
      password: 'SecurePassword123!',
      full_name: 'Эрнис Касымов',
      phone: '+996770112233'
    };

    const res = await env.client.register(regPayload);
    assertEqual(res.status, 201);
    assert(res.data.success);
    assert(res.data.token, 'Expected JWT token');
    validateUserContract(res.data.user, 'Registered User');
    assertEqual(res.data.user.email, regPayload.email.toLowerCase());
  });

  it('T1.07.02: Ensures plain text password or raw hash is NEVER exposed in registration response', async () => {
    const res = await env.client.register({
      email: 'secret_user@example.kg',
      password: 'MySecretPassword123!'
    });
    assertEqual(res.status, 201);
    assertEqual(res.data.user.password, undefined);
    assertEqual(res.data.user.password_hash, undefined);
  });

  it('T1.07.03: Rejects duplicate email registration with 409 Conflict', async () => {
    const email = 'duplicate@example.kg';
    const res1 = await env.client.register({ email, password: 'Pass123456!' });
    assertEqual(res1.status, 201);

    const res2 = await env.client.register({ email, password: 'Pass123456!' });
    assertEqual(res2.status, 409);
    assert(!res2.data.success);
  });

  it('T1.07.04: Rejects registration when mandatory fields are missing with 400 Bad Request', async () => {
    const res = await env.client.register({ email: '' });
    assertEqual(res.status, 400);
    assert(!res.data.success);
  });

  it('T1.07.05: Initialized new user with active account status and default unverified KYC', async () => {
    const res = await env.client.register({
      email: 'fresh_buyer@example.kg',
      password: 'Pass123456!'
    });
    assertEqual(res.status, 201);
    assertEqual(res.data.user.status, 'active');
    assertEqual(res.data.user.kyc_status, 'not_started');
  });
});
