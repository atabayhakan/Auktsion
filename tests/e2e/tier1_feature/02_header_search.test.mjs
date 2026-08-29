/**
 * Tier 1: Feature 02 - Header Alignment & Search (R1, F02, F03)
 * Minimum 5 tests covering search filtering, empty queries, combined filters, case-insensitivity, and category bar.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual, assertIncludes } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'Header Alignment & Search');

describe('Feature 02: Header Alignment & Search', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.02.01: Header search returns matching auction lots for title keyword', async () => {
    const res = await env.client.getAuctions({ search: 'Буурасы' });
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(res.data.data.length >= 1, 'Expected at least 1 matching auction for keyword');
    assertIncludes(res.data.data[0].title, 'Буурасы');
  });

  it('T1.02.02: Search query with non-existent keyword returns clean empty array', async () => {
    const res = await env.client.getAuctions({ search: 'ZzzNonExistentKeyword999' });
    assertEqual(res.status, 200);
    assert(res.data.success);
    assertEqual(res.data.data.length, 0);
    assertEqual(res.data.meta.total, 0);
  });

  it('T1.02.03: Search query combined with category filter narrows results correctly', async () => {
    const res = await env.client.getAuctions({ search: 'Toyota', category: 'vehicles' });
    assertEqual(res.status, 200);
    assert(res.data.success);
    assertEqual(res.data.data.length, 1);
    assertEqual(res.data.data[0].category, 'vehicles');
    assertIncludes(res.data.data[0].title, 'Toyota');
  });

  it('T1.02.04: Search filtering performs case-insensitive matching', async () => {
    const resLower = await env.client.getAuctions({ search: 'toyota' });
    const resUpper = await env.client.getAuctions({ search: 'TOYOTA' });

    assertEqual(resLower.status, 200);
    assertEqual(resUpper.status, 200);
    assertEqual(resLower.data.data.length, resUpper.data.data.length);
    assert(resLower.data.data.length > 0);
  });

  it('T1.02.05: Category navigation bar retrieves structured list with localized names', async () => {
    const res = await env.client.get('/api/categories');
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(Array.isArray(res.data.data), 'Expected categories list');
    assert(res.data.data.length >= 4, 'Expected multiple categories for header menu');
    assert(res.data.data.some(c => c.id === 'livestock' && c.name_ky));
  });
});
