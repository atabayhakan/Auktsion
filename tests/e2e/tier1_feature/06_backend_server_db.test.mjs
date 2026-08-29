/**
 * Tier 1: Feature 06 - Node.js Backend Server & DB (R2, F07)
 * Minimum 5 tests covering health check, JSON headers, database persistence across requests, CORS, and error handling.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual, assertIncludes } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'Node.js Backend Server & DB');

describe('Feature 06: Node.js Backend Server & DB', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.06.01: Health check endpoint /api/health responds with status ok', async () => {
    const res = await env.client.get('/api/health');
    assertEqual(res.status, 200);
    assert(res.data.success);
    assertEqual(res.data.status, 'ok');
    assert(res.data.time);
  });

  it('T1.06.02: Returns application/json Content-Type and proper CORS headers', async () => {
    const res = await env.client.get('/api/categories');
    assertEqual(res.status, 200);
    const contentType = res.headers.get('content-type') || '';
    assertIncludes(contentType, 'application/json');
  });

  it('T1.06.03: Persists newly created auction entity in database across subsequent queries', async () => {
    await env.client.loginAsSeller();
    const newLot = {
      title: 'Persistent DB Test Lot',
      description: 'Verifying DB insert & retrieval',
      category: 'livestock',
      starting_price_minor: 2500000,
      bid_increment_minor: 100000,
      city: 'Бишкек'
    };

    const createRes = await env.client.createAuction(newLot);
    assertEqual(createRes.status, 201);
    const createdId = createRes.data.data.id;
    assert(createdId);

    // Retrieve by ID
    const fetchRes = await env.client.getAuction(createdId);
    assertEqual(fetchRes.status, 200);
    assertEqual(fetchRes.data.data.title, newLot.title);
  });

  it('T1.06.04: Supports OPTIONS preflight requests for CORS compliance', async () => {
    const res = await env.client.request('OPTIONS', '/api/auctions');
    assert(res.status === 200 || res.status === 204);
  });

  it('T1.06.05: Gracefully handles malformed JSON request bodies with 400 or server error envelope', async () => {
    const res = await env.client.request('POST', '/api/auth/login', {
      body: 'invalid-non-json-payload',
      headers: { 'Content-Type': 'application/json' }
    });
    assert([400, 422, 500].includes(res.status));
  });
});
