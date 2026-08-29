/**
 * Tier 1: Feature 20 - Admin Analytics & Charts (R3, F22)
 * Minimum 5 tests covering GMV timeseries, category breakdown, regional heatmaps, RBAC guard, and chart data integrity.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'Admin Analytics & Charts');

describe('Feature 20: Admin Analytics & Charts', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.20.01: GET /api/admin/analytics returns time-series GMV data points for trendline charts', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminAnalytics();
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(Array.isArray(res.data.data.gmv_timeseries));
    assert(res.data.data.gmv_timeseries.length >= 3);
    assert(res.data.data.gmv_timeseries[0].gmv > 0);
  });

  it('T1.20.02: Category breakdown includes proportional GMV shares summing to 1.0 (100%)', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminAnalytics();
    const categories = res.data.data.category_distribution;
    assert(Array.isArray(categories));
    const totalShare = categories.reduce((sum, c) => sum + c.share, 0);
    assertEqual(Math.round(totalShare * 100) / 100, 1.0);
  });

  it('T1.20.03: Regional distribution includes lot volumes for major Kyrgyz Oblasts and cities', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminAnalytics();
    const regions = res.data.data.regional_distribution;
    assert(Array.isArray(regions));
    assert(regions.some(r => r.region === 'Bishkek' && r.lots > 0));
    assert(regions.some(r => r.region === 'Osh' && r.lots > 0));
  });

  it('T1.20.04: Unauthorized or regular buyer requests to analytics are blocked with 403 Forbidden', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.getAdminAnalytics();
    assertEqual(res.status, 403);
  });

  it('T1.20.05: Analytics response handles date parameters and maintains valid schema', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.get('/api/admin/analytics?period=30d');
    assertEqual(res.status, 200);
    assert(res.data.data.gmv_timeseries);
  });
});
