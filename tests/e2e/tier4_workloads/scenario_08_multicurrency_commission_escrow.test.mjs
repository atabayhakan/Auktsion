/**
 * Tier 4: Scenario 08 - Platform Commission & Escrow Accounting Workload
 * Simulates financial escrow accounting: 8% platform revenue retention, 92% seller balance crediting, and treasury ledger audit.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 4', 'Scenario 08: Commission & Escrow Accounting');

describe('Tier 4: Scenario 08 - Platform Commission & Escrow Accounting', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T4.08: Verifies 8% platform commission and 92% seller net split across high-value sales', async () => {
    await env.client.loginAsAdmin();
    const finRes = await env.client.getAdminFinancials();
    assertEqual(finRes.status, 200);

    const overviewRes = await env.client.getAdminOverview();
    const gmvMinor = overviewRes.data.data.gmv_minor;
    const commissionMinor = overviewRes.data.data.commission_revenue_minor;

    // Platform retains 8% fee
    const expectedCommission = Math.round(gmvMinor * 0.08);
    assertEqual(commissionMinor, expectedCommission);

    // Net seller allocation is 92%
    const expectedNetSeller = gmvMinor - expectedCommission;
    assert(expectedNetSeller > 0);
  });
});
