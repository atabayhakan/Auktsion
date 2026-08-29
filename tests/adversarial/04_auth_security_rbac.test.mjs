/**
 * Tier 5: Adversarial Stress Test Suite - Auth Security, SQL Injection & RBAC Privilege Escalation
 * Tests SQL injection resilience across login and registration, comprehensive RBAC matrix enforcement,
 * and banned/suspended account isolation.
 */

import { describe, it, beforeEach, setTestContext } from '../e2e/harness/testFramework.mjs';
import { assert, assertEqual } from '../e2e/harness/assertions.mjs';
import { getTestEnvironment } from '../e2e/harness/index.mjs';

setTestContext('Tier 5', 'Auth Security, SQL Injection & RBAC');

describe('Tier 5: Adversarial - Auth Security, SQL Injection & RBAC', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    if (env.reset) {
      await env.reset();
    }
  });

  it('ADV.AUTH.01: Blocks multiple SQL injection authentication bypass payloads on login', async () => {
    const sqliPayloads = [
      { email: "' OR '1'='1", password: "' OR '1'='1" },
      { email: "admin@auktsion.kg' --", password: "any" },
      { email: "' UNION SELECT 1, 'admin@auktsion.kg', 'hash', 'Admin', '+996555123456', 'admin', 'active' --", password: "test" },
      { email: 'admin" OR ""="', password: 'password' },
      { email: "admin@auktsion.kg'; DROP TABLE users; --", password: "test" },
      { email: "admin@auktsion.kg' /*", password: "*/ --" }
    ];

    for (const payload of sqliPayloads) {
      const res = await env.client.post('/api/auth/login', payload);
      assertEqual(res.status, 401, `SQL injection payload (${payload.email}) must be rejected with 401 Unauthorized`);
      assert(!res.data.success, 'Success must be false on injection attempt');
      assert(!res.data.token, 'No token should be issued for SQL injection payload');
    }

    // Verify database users table remains completely intact
    const legitimateAdmin = await env.client.login('admin@auktsion.kg', 'Password123!');
    assertEqual(legitimateAdmin.status, 200, 'Admin table must remain intact after DROP TABLE injection attempts');
  });

  it('ADV.AUTH.02: Safely handles parameterized input with SQL injection payloads on registration', async () => {
    const sqliRegPayload = {
      fullName: "Attacker'; DROP TABLE auctions; --",
      email: `sqli_inject_${Date.now()}@auktsion.kg`,
      phone: "+996700' OR '1'='1",
      password: "SafePassword123!",
      city: "Бишкек'); DELETE FROM users; --"
    };

    const regRes = await env.client.post('/api/auth/register', sqliRegPayload);
    assertEqual(regRes.status, 201, 'Registration with special SQL characters should succeed safely via parameterized statements');
    assert(regRes.data.token, 'Token should be issued');

    // Confirm that auctions catalog was NOT dropped
    const auctionsRes = await env.client.getAuctions();
    assertEqual(auctionsRes.status, 200, 'Auctions table must remain healthy and accessible');
    assert(Array.isArray(auctionsRes.data.data), 'Auctions list must remain valid array');
  });

  it('ADV.AUTH.03: Comprehensive RBAC matrix enforcement (Buyer/Seller forbidden from all admin routes)', async () => {
    // 1. Login as standard buyer
    const buyerLogin = await env.client.login('buyer@auktsion.kg', 'Password123!');
    const buyerToken = buyerLogin.data.token;

    // List of protected admin endpoints
    const adminEndpoints = [
      { method: 'GET', path: '/api/admin/overview' },
      { method: 'GET', path: '/api/admin/users' },
      { method: 'GET', path: '/api/admin/listings' },
      { method: 'GET', path: '/api/admin/kyc' },
      { method: 'GET', path: '/api/admin/financials' },
      { method: 'GET', path: '/api/admin/monitoring' },
      { method: 'GET', path: '/api/admin/analytics' },
      { method: 'POST', path: '/api/admin/auctions/lot-101/pause', body: { pause: true } },
      { method: 'PUT', path: '/api/admin/users/user-seller-001/status', body: { status: 'suspended' } },
      { method: 'PUT', path: '/api/admin/kyc/kyc-001/review', body: { status: 'approved' } }
    ];

    for (const ep of adminEndpoints) {
      let res;
      const opts = { headers: { 'Authorization': `Bearer ${buyerToken}` } };
      if (ep.method === 'GET') {
        res = await env.client.get(ep.path, opts);
      } else if (ep.method === 'POST') {
        res = await env.client.post(ep.path, ep.body || {}, opts);
      } else if (ep.method === 'PUT') {
        res = await env.client.put(ep.path, ep.body || {}, opts);
      }

      assertEqual(res.status, 403, `Non-admin user hitting ${ep.method} ${ep.path} must return HTTP 403 Forbidden`);
      assert(!res.data.success, 'Success must be false on unauthorized admin access attempt');
    }
  });

  it('ADV.AUTH.04: Unauthenticated access to admin and private user routes is rejected with 401', async () => {
    env.client.clearToken();

    const protectedPaths = [
      '/api/admin/overview',
      '/api/admin/users',
      '/api/user/profile',
      '/api/user/settings',
      '/api/user/bids',
      '/api/user/kyc',
      '/api/user/payouts'
    ];

    for (const path of protectedPaths) {
      const res = await env.client.get(path);
      assertEqual(res.status, 401, `Unauthenticated request to ${path} must return HTTP 401`);
    }
  });

  it('ADV.AUTH.05: Banned user account is strictly blocked from login, authenticated APIs and bidding', async () => {
    // 1. Banned user attempting login
    const bannedLogin = await env.client.login('banned@auktsion.kg', 'Password123!');
    assertEqual(bannedLogin.status, 403, 'Banned user login must return HTTP 403 Forbidden');
    assert(!bannedLogin.data.success);

    // 2. Pre-issued banned token attempting to access profile
    const resMe = await env.client.get('/api/auth/me', {
      headers: { 'Authorization': 'Bearer token-banned-123' }
    });
    assertEqual(resMe.status, 403, 'Banned token accessing /api/auth/me must return HTTP 403 Forbidden');

    // 3. Pre-issued banned token attempting to place a bid
    const resBid = await env.client.post('/api/auctions/lot-101/bids', { amount_minor: 25000000 }, {
      headers: { 'Authorization': 'Bearer token-banned-123' }
    });
    assertEqual(resBid.status, 403, 'Banned token placing a bid must return HTTP 403 Forbidden');
  });

  it('ADV.AUTH.06: Password strength and duplicate email validation enforcement', async () => {
    // 1. Password under 6 characters
    const shortPassRes = await env.client.post('/api/auth/register', {
      fullName: 'Short Pass User',
      email: `shortpass_${Date.now()}@auktsion.kg`,
      phone: '+996700123456',
      password: '123'
    });
    assertEqual(shortPassRes.status, 400, 'Password with < 6 chars must return 400');

    // 2. Missing email field
    const missingEmailRes = await env.client.post('/api/auth/register', {
      fullName: 'No Email User',
      phone: '+996700123456',
      password: 'ValidPassword123!'
    });
    assertEqual(missingEmailRes.status, 400, 'Missing email must return 400');

    // 3. Duplicate email registration conflict
    const dupRes = await env.client.post('/api/auth/register', {
      fullName: 'Duplicate User',
      email: 'buyer@auktsion.kg',
      phone: '+996700123456',
      password: 'ValidPassword123!'
    });
    assertEqual(dupRes.status, 409, 'Duplicate email registration must return HTTP 409 Conflict');
  });
});
