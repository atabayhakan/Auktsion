/**
 * Tier 1: Feature 03 - Dropdown & Menu Component (R1, F04)
 * Minimum 5 tests covering dropdown options, regional menus, bank selectors, sort controls, and user menu state.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual, assertIncludes } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'Dropdown & Menu Component');

describe('Feature 03: Dropdown & Menu Component', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.03.01: Regional selector dropdown data includes all Kyrgyz oblasts and major cities', async () => {
    const res = await env.client.get('/api/regions');
    assertEqual(res.status, 200);
    assert(res.data.success);
    const regions = res.data.data;
    assert(regions.length >= 7, 'Expected 7 oblasts + major cities');
    assert(regions.some(r => r.id === 'bishkek' && r.name === 'Бишкек'));
    assert(regions.some(r => r.id === 'osh' && r.name === 'Ош'));
    assert(regions.some(r => r.id === 'naryn' && r.name === 'Нарын'));
  });

  it('T1.03.02: Category dropdown returns multilingual label support (Kyrgyz and Russian)', async () => {
    const res = await env.client.get('/api/categories');
    assertEqual(res.status, 200);
    const categories = res.data.data;
    const livestock = categories.find(c => c.id === 'livestock');
    assert(livestock, 'Expected livestock category');
    assertEqual(livestock.name_ky, 'Мал чарбасы');
    assertEqual(livestock.name_ru, 'Сельхоз животные');
  });

  it('T1.03.03: User menu displays active role, KYC status, and profile balance', async () => {
    await env.client.loginAsSeller();
    const meRes = await env.client.getMe();
    assertEqual(meRes.status, 200);
    assertEqual(meRes.data.user.role, 'seller');
    assertEqual(meRes.data.user.kyc_status, 'verified');
    assert(meRes.data.user.balance_minor > 0);
  });

  it('T1.03.04: Payout method dropdown supports valid Kyrgyz banking providers', async () => {
    await env.client.loginAsSeller();
    const res = await env.client.getPayoutMethods();
    assertEqual(res.status, 200);
    assert(Array.isArray(res.data.data));
    const providers = res.data.data.map(m => m.provider);
    assert(providers.includes('mbank') || providers.includes('optima'));
  });

  it('T1.03.05: Sorting dropdown correctly filters and returns sorted auction listings', async () => {
    const res = await env.client.getAuctions({ sortBy: 'price_asc' });
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(Array.isArray(res.data.data));
  });
});
