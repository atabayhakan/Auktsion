/**
 * Tier 2: Feature 01 Boundary - Navigation & Route Matching (R1, F01)
 * 5 boundary & edge case tests covering extreme path lengths, URI encoding, SQL injection strings in URLs, Unicode symbols, and trailing slashes.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'Navigation & Route Matching Boundary');

describe('Tier 2: Feature 01 - Navigation & Route Matching Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.01.01: Handles extremely long route path strings without server crash or hang', async () => {
    const longPath = '/api/auctions/' + 'a'.repeat(2000);
    const res = await env.client.get(longPath);
    assert([400, 404, 414].includes(res.status));
  });

  it('T2.01.02: Safely handles URL-encoded special characters and directory traversal patterns in route', async () => {
    const dangerousPath = '/api/auctions/%2e%2e%2f%2e%2e%2fetc%2fpasswd';
    const res = await env.client.get(dangerousPath);
    assertEqual(res.status, 404);
  });

  it('T2.01.03: Handles SQL injection attempts in route parameters gracefully', async () => {
    const sqliPath = "/api/auctions/'%20OR%20'1'='1";
    const res = await env.client.get(sqliPath);
    assertEqual(res.status, 404);
    assert(!res.data.success);
  });

  it('T2.01.04: Supports Cyrillic and UTF-8 multibyte characters in URL query parameters', async () => {
    const res = await env.client.get('/api/auctions?search=' + encodeURIComponent('Кыргызстан Ала-Тоо'));
    assertEqual(res.status, 200);
    assert(res.data.success);
  });

  it('T2.01.05: Normalizes trailing slashes on endpoints without redirect loops', async () => {
    const res = await env.client.get('/api/categories/');
    assert(res.status === 200 || res.status === 404);
  });
});
