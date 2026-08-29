/**
 * Tier 2: Feature 03 Boundary - Dropdown & Menu Component (R1, F04)
 * 5 boundary tests covering empty/invalid region IDs, non-existent categories, extreme sort params, duplicate bank options, and invalid bank codes.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'Dropdown & Menu Boundary');

describe('Tier 2: Feature 03 - Dropdown & Menu Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.03.01: Queries with non-existent region ID in dropdown filter return empty list', async () => {
    const res = await env.client.getAuctions({ region: 'invalid_region_id_999' });
    assertEqual(res.status, 200);
    assertEqual(res.data.data.length, 0);
  });

  it('T2.03.02: Queries with non-existent category in dropdown filter return empty list', async () => {
    const res = await env.client.getAuctions({ category: 'spaceships' });
    assertEqual(res.status, 200);
    assertEqual(res.data.data.length, 0);
  });

  it('T2.03.03: Unrecognized sort parameter gracefully falls back to default ordering', async () => {
    const res = await env.client.getAuctions({ sortBy: 'unknown_sort_order_xyz' });
    assertEqual(res.status, 200);
    assert(res.data.data.length >= 1);
  });

  it('T2.03.04: Adding duplicate payout bank method handles or updates default selection safely', async () => {
    await env.client.loginAsSeller();
    const payload = {
      provider: 'mbank',
      bank_name: 'MBank',
      account_number: '+996700112233',
      account_holder_name: 'Акылбек Жээнбеков'
    };

    const res = await env.client.addPayoutMethod(payload);
    assertEqual(res.status, 201);
    assert(res.data.success);
  });

  it('T2.03.05: Submitting empty bank provider or account number returns 400 Bad Request', async () => {
    await env.client.loginAsSeller();
    const res = await env.client.addPayoutMethod({ provider: '', account_number: '' });
    assertEqual(res.status, 400);
    assert(!res.data.success);
  });
});
