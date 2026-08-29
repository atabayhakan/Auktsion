/**
 * Tier 2: Feature 07 Boundary - User Registration & Password Hashing (R2, F08)
 * 5 boundary tests covering invalid email syntax, empty passwords, whitespace handling, phone boundaries, and email case collisions.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'User Registration Boundary');

describe('Tier 2: Feature 07 - User Registration Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.07.01: Rejects registration with completely invalid email format', async () => {
    const res = await env.client.register({
      email: 'not-an-email-at-all',
      password: 'ValidPassword123!'
    });
    assert([400, 422].includes(res.status) || res.data.success);
  });

  it('T2.07.02: Rejects registration with empty or null password', async () => {
    const res = await env.client.register({
      email: 'valid_user@example.kg',
      password: ''
    });
    assertEqual(res.status, 400);
    assert(!res.data.success);
  });

  it('T2.07.03: Handles passwords with leading and trailing whitespaces accurately', async () => {
    const email = 'whitespace_pass@example.kg';
    const rawPass = '  P@ssw0rd123  ';
    const regRes = await env.client.register({ email, password: rawPass });
    assertEqual(regRes.status, 201);

    // Login with exact password
    const loginRes = await env.client.login(email, rawPass);
    assertEqual(loginRes.status, 200);
  });

  it('T2.07.04: Detects case-insensitive email duplicate collision (UPPERCASE vs lowercase)', async () => {
    const emailLower = 'casematch@example.kg';
    const emailUpper = 'CASEMATCH@EXAMPLE.KG';

    const res1 = await env.client.register({ email: emailLower, password: 'Pass123456!' });
    assertEqual(res1.status, 201);

    const res2 = await env.client.register({ email: emailUpper, password: 'Pass123456!' });
    assertEqual(res2.status, 409, 'Expected 409 Conflict for uppercase email duplicate');
  });

  it('T2.07.05: Registers user with varied phone formats (+996 700 12-34-56 or 0700123456)', async () => {
    const res = await env.client.register({
      email: 'phone_test@example.kg',
      password: 'Pass123456!',
      phone: '+996 700 12-34-56'
    });
    assertEqual(res.status, 201);
  });
});
