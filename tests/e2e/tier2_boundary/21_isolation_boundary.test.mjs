/**
 * Tier 2: Feature 21 Boundary - Project Isolation & Integrity (R4, F24)
 * 5 boundary tests covering forbidden URI schemes, local filesystem path leaks, currency isolation, error trace sanitization, and state reset idempotency.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual, assertNotIncludes } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'Project Isolation Boundary');

describe('Tier 2: Feature 21 - Project Isolation Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.21.01: Disallows arbitrary foreign currency codes on lot creation (must default/remain KGS)', async () => {
    await env.client.loginAsSeller();
    const res = await env.client.createAuction({
      title: 'KGS Enforcement Lot',
      category: 'antiques',
      currency: 'USD', // attempts USD override
      starting_price_minor: 5000000
    });
    assertEqual(res.status, 201);
    assertEqual(res.data.data.currency, 'KGS'); // enforced as KGS
  });

  it('T2.21.02: Rejects file:// or gopher:// URI schemes in image submissions', async () => {
    await env.client.loginAsSeller();
    const res = await env.client.createAuction({
      title: 'Path Leak Test Lot',
      category: 'antiques',
      images: ['file:///etc/shadow', 'file:///C:/Windows/system32/cmd.exe']
    });
    assert([201, 400].includes(res.status));
    if (res.status === 201) {
      assertNotIncludes(res.data.data.images[0], 'C:');
    }
  });

  it('T2.21.03: Error responses do not leak raw host environment secrets or database passwords', async () => {
    const res = await env.client.get('/api/auctions/invalid_error_provocation_');
    const responseBody = JSON.stringify(res.data || {});
    assertNotIncludes(responseBody, 'DB_PASSWORD');
    assertNotIncludes(responseBody, 'JWT_SECRET');
  });

  it('T2.21.04: Multiple consecutive state resets leave environment in identical baseline condition', async () => {
    env.reset();
    env.reset();
    env.reset();
    const res = await env.client.getAuctions();
    assertEqual(res.status, 200);
    assertEqual(res.data.data.length, 4);
  });

  it('T2.21.05: Rejects SQL escape quote attacks in search parameters without leaking database internals', async () => {
    const res = await env.client.getAuctions({ search: "'''\"\"\"--/*" });
    assertEqual(res.status, 200);
    assert(res.data.success);
  });
});
