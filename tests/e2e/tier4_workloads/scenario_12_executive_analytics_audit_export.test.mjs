/**
 * Tier 4: Scenario 12 - Executive Analytics Audit & GMV Reporting Workload
 * Simulates executive analytics review -> GMV calculations -> category proportions -> regional coverage audit -> export verification.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual, assertInRange } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 4', 'Scenario 12: Executive Analytics Audit');

describe('Tier 4: Scenario 12 - Executive Analytics Audit & GMV Reporting', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T4.12: Validates executive analytics reporting integrity, GMV time-series, and regional distributions', async () => {
    // 1. Admin logs into executive suite
    await env.client.loginAsAdmin();

    // 2. Fetch Executive Overview KPIs
    const overviewRes = await env.client.getAdminOverview();
    assertEqual(overviewRes.status, 200);
    const kpi = overviewRes.data.data;
    assert(kpi.gmv_minor > 0);
    assert(kpi.commission_revenue_minor > 0);
    assert(kpi.active_auctions >= 1);

    // 3. Fetch Time-Series Analytics
    const analyticsRes = await env.client.getAdminAnalytics();
    assertEqual(analyticsRes.status, 200);
    const analytics = analyticsRes.data.data;

    // 4. Validate GMV timeseries trendline
    assert(Array.isArray(analytics.gmv_timeseries));
    for (const point of analytics.gmv_timeseries) {
      assert(point.date && point.gmv >= 0);
    }

    // 5. Validate Category GMV shares
    assert(Array.isArray(analytics.category_distribution));
    const totalShare = analytics.category_distribution.reduce((acc, c) => acc + c.share, 0);
    assertEqual(Math.round(totalShare * 100) / 100, 1.0);

    // 6. Validate Regional Distribution coverage across Kyrgyzstan
    assert(Array.isArray(analytics.regional_distribution));
    const bishkek = analytics.regional_distribution.find(r => r.region === 'Bishkek');
    assert(bishkek && bishkek.lots > 0);
    const osh = analytics.regional_distribution.find(r => r.region === 'Osh');
    assert(osh && osh.lots > 0);
  });
});
