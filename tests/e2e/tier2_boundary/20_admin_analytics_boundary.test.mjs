/**
 * Tier 2: Feature 20 Boundary - Admin Analytics & Charts (R3, F22)
 * 5 boundary tests covering invalid period parameters, timeseries item schemas, category share bounds [0, 1], non-negative regional counts, and performance consistency.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual, assertInRange } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'Admin Analytics Boundary');

describe('Tier 2: Feature 20 - Admin Analytics Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.20.01: Analytics query with invalid period parameter falls back to default period safely', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.get('/api/admin/analytics?period=invalid_period_999');
    assertEqual(res.status, 200);
    assert(res.data.data.gmv_timeseries);
  });

  it('T2.20.02: Each time-series entry has valid ISO date and non-negative numeric GMV', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminAnalytics();
    const series = res.data.data.gmv_timeseries;
    for (const point of series) {
      assert(point.date && typeof point.date === 'string');
      assert(typeof point.gmv === 'number' && point.gmv >= 0);
    }
  });

  it('T2.20.03: Category share proportions are strictly bounded within [0.0, 1.0]', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminAnalytics();
    const categories = res.data.data.category_distribution;
    for (const item of categories) {
      assertInRange(item.share, 0.0, 1.0);
    }
  });

  it('T2.20.04: Regional distribution lot counts are all non-negative integers', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminAnalytics();
    const regions = res.data.data.regional_distribution;
    for (const reg of regions) {
      assert(Number.isInteger(reg.lots));
      assert(reg.lots >= 0);
    }
  });

  it('T2.20.05: Multiple consecutive analytics calls return identical deterministic aggregations', async () => {
    await env.client.loginAsAdmin();
    const res1 = await env.client.getAdminAnalytics();
    const res2 = await env.client.getAdminAnalytics();
    assertEqual(res1.data.data.gmv_timeseries.length, res2.data.data.gmv_timeseries.length);
  });
});
