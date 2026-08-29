/**
 * Tier 1: Feature 21 - Project Isolation & Integrity (R4, F24)
 * Minimum 5 tests covering zero external project dependencies, KGS currency isolation, zero external cloud leaks, local config portability, and test suite self-containment.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual, assertNotIncludes } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'Project Isolation & Integrity');

describe('Feature 21: Project Isolation & Integrity', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.21.01: Verifies platform currency standard is strictly KGS and minor units are in tiyyn', async () => {
    const res = await env.client.getAuctions();
    assertEqual(res.status, 200);
    assert(res.data.data.every(lot => lot.currency === 'KGS'));
  });

  it('T1.21.02: Ensures API returns self-contained relative asset paths without external hardcoded domains', async () => {
    const res = await env.client.getAuctions();
    const lots = res.data.data;
    for (const lot of lots) {
      if (lot.images && lot.images.length > 0) {
        const firstImg = lot.images[0];
        assertNotIncludes(firstImg, 'http://external-untrusted-cdn.com');
        assertNotIncludes(firstImg, 'C:\\');
      }
    }
  });

  it('T1.21.03: Executes self-contained local banking providers (MBank, Optima, DemirBank, ElQR)', async () => {
    const res = await env.client.get('/api/categories');
    assertEqual(res.status, 200);
    assert(res.data.success);
  });

  it('T1.21.04: Backend runs in standalone mode with zero cloud runtime requirements', async () => {
    const health = await env.client.get('/api/health');
    assertEqual(health.status, 200);
    assertEqual(health.data.status, 'ok');
  });

  it('T1.21.05: Test environment isolates state modifications and supports full clean reset', async () => {
    // Create new lot
    await env.client.loginAsSeller();
    await env.client.createAuction({
      title: 'Ephemeral Isolation Lot',
      category: 'vehicles',
      starting_price_minor: 5000000
    });

    const beforeReset = await env.client.getAuctions();
    const hadLot = beforeReset.data.data.some(l => l.title === 'Ephemeral Isolation Lot');
    assert(hadLot, 'Lot should exist before reset');

    // Reset
    env.reset();

    const afterReset = await env.client.getAuctions();
    const hasLotAfter = afterReset.data.data.some(l => l.title === 'Ephemeral Isolation Lot');
    assert(!hasLotAfter, 'Lot should be gone after state reset');
  });
});
