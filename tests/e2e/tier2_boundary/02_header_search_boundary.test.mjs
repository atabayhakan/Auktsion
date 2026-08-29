/**
 * Tier 2: Feature 02 Boundary - Header Alignment & Search (R1, F02, F03)
 * 5 boundary tests covering empty query, whitespace, extreme length, XSS sanitization, and regex special characters.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'Header Alignment & Search Boundary');

describe('Tier 2: Feature 02 - Header Alignment & Search Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.02.01: Empty search parameter returns standard default catalog list', async () => {
    const res = await env.client.getAuctions({ search: '' });
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(res.data.data.length >= 3);
  });

  it('T2.02.02: Whitespace-only search query is handled cleanly without errors', async () => {
    const res = await env.client.getAuctions({ search: '     ' });
    assertEqual(res.status, 200);
    assert(res.data.success);
  });

  it('T2.02.03: Search query of 1,000+ characters does not crash search engine', async () => {
    const hugeQuery = 'search_keyword_'.repeat(100);
    const res = await env.client.getAuctions({ search: hugeQuery });
    assertEqual(res.status, 200);
    assertEqual(res.data.data.length, 0);
  });

  it('T2.02.04: XSS injection vectors in search parameter are treated as literal text', async () => {
    const xss = '<script>alert("XSS")</script>';
    const res = await env.client.getAuctions({ search: xss });
    assertEqual(res.status, 200);
    assertEqual(res.data.data.length, 0);
  });

  it('T2.02.05: Regex special characters (*, +, ?, ^, $, (, ), [, ], {, }, |) do not break query parsing', async () => {
    const regexQuery = '.*+?^${}()|[]\\';
    const res = await env.client.getAuctions({ search: regexQuery });
    assertEqual(res.status, 200);
    assert(res.data.success);
  });
});
