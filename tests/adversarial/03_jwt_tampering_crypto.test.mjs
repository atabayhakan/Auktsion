/**
 * Tier 5: Adversarial Stress Test Suite - JWT Tampering & Crypto Attacks
 * Tests signature stripping, 'none' algorithm bypass, signature bit-flipping,
 * token expiration, forged role claims in payload, and malformed header injections.
 */

import { describe, it, beforeEach, setTestContext } from '../e2e/harness/testFramework.mjs';
import { assert, assertEqual } from '../e2e/harness/assertions.mjs';
import { getTestEnvironment } from '../e2e/harness/index.mjs';

setTestContext('Tier 5', 'JWT Tampering & Crypto Security');

describe('Tier 5: Adversarial - JWT Tampering & Crypto Security', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    if (env.reset) {
      await env.reset();
    }
  });

  it('ADV.JWT.01: Token with "alg": "none" attack is strictly rejected with 401 Unauthorized', async () => {
    // Construct unsigned token with {"alg":"none","typ":"JWT"} and admin role payload
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ id: 'user-admin-001', email: 'admin@auktsion.kg', role: 'admin' })).toString('base64url');
    const forgedUnsignedToken = `${header}.${payload}.`;

    const res = await env.client.get('/api/admin/overview', {
      headers: { 'Authorization': `Bearer ${forgedUnsignedToken}` }
    });

    assertEqual(res.status, 401, 'Unsigned "alg": "none" token must return HTTP 401');
    assert(!res.data.success, 'Success flag must be false');
  });

  it('ADV.JWT.02: Forged token with invalid/tampered cryptographic signature is strictly rejected with 401', async () => {
    const userReg = await env.client.post('/api/auth/register', {
      fullName: 'Crypto Test User',
      email: `crypto_${Date.now()}@auktsion.kg`,
      phone: '+996700889988',
      password: 'Password123!',
      city: 'Бишкек'
    });
    const validToken = userReg.data.token;

    if (validToken && validToken.includes('.')) {
      const parts = validToken.split('.');
      // Tamper signature by flipping characters
      const tamperedSignature = parts[2].split('').reverse().join('');
      const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSignature}`;

      const res = await env.client.get('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${tamperedToken}` }
      });

      assertEqual(res.status, 401, 'Tampered signature token must return HTTP 401');
    } else {
      // For mock token format, test random invalid string
      const res = await env.client.get('/api/auth/me', {
        headers: { 'Authorization': 'Bearer token-tampered-fake-sig' }
      });
      assertEqual(res.status, 401);
    }
  });

  it('ADV.JWT.03: Forged payload elevating buyer ID to admin role with invalid secret signature fails', async () => {
    const buyerReg = await env.client.post('/api/auth/register', {
      fullName: 'Tamper Escalate Buyer',
      email: `tamper_esc_${Date.now()}@auktsion.kg`,
      phone: '+996700778811',
      password: 'Password123!',
      city: 'Бишкек'
    });
    const buyerToken = buyerReg.data.token;

    if (buyerToken && buyerToken.includes('.')) {
      const [h, p, s] = buyerToken.split('.');
      const decodedPayload = JSON.parse(Buffer.from(p, 'base64url').toString());
      // Tamper role from buyer to admin
      decodedPayload.role = 'admin';
      const tamperedPayloadB64 = Buffer.from(JSON.stringify(decodedPayload)).toString('base64url');
      const forgedBuyerToAdminToken = `${h}.${tamperedPayloadB64}.${s}`;

      const res = await env.client.get('/api/admin/overview', {
        headers: { 'Authorization': `Bearer ${forgedBuyerToAdminToken}` }
      });

      assertEqual(res.status, 401, 'Tampered role payload with mismatched signature must return HTTP 401');
    } else {
      const res = await env.client.get('/api/admin/overview', {
        headers: { 'Authorization': 'Bearer token-buyer-as-admin' }
      });
      assertEqual(res.status, 401);
    }
  });

  it('ADV.JWT.04: Expired token timestamp (exp in the past) is strictly rejected with 401', async () => {
    // Build token with past expiration
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const payload = Buffer.from(JSON.stringify({ id: 'user-buyer-001', email: 'buyer@auktsion.kg', exp: pastExp })).toString('base64url');
    const expiredToken = `${header}.${payload}.FakeSignature12345`;

    const res = await env.client.get('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${expiredToken}` }
    });

    assertEqual(res.status, 401, 'Expired token must return HTTP 401');
  });

  it('ADV.JWT.05: Completely malformed or empty Bearer headers are handled safely without crashing', async () => {
    const malformedHeaders = [
      'Bearer ',
      'Bearer null',
      'Bearer undefined',
      'Bearer ....',
      'Bearer 12345',
      'Basic admin:password',
      'InvalidScheme token123',
      '',
    ];

    for (const authHeader of malformedHeaders) {
      const res = await env.client.get('/api/auth/me', {
        headers: authHeader ? { 'Authorization': authHeader } : {}
      });

      assertEqual(res.status, 401, `Malformed auth header "${authHeader}" must return 401`);
      assert(!res.data.success, 'Success must be false for malformed token');
    }
  });
});
