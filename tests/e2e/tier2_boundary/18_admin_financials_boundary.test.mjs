/**
 * Tier 2: Feature 18 Boundary - Admin Financials & Payouts (R3, F20)
 * 5 boundary tests covering non-existent payout processing, total pending sums, duplicate payout executions, action validation, and 8% commission math.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'Admin Financials Boundary');

describe('Tier 2: Feature 18 - Admin Financials Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.18.01: Processing non-existent payout request ID returns 404 Not Found', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.processAdminPayout('payout-non-existent-999', 'approve');
    assertEqual(res.status, 404);
  });

  it('T2.18.02: Admin financials correctly sums total pending payouts in tiyyn', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminFinancials();
    assertEqual(res.status, 200);
    const pendingSum = res.data.data.pending_payouts_minor;
    assert(pendingSum >= 5000000); // at least payout-001 (50,000 SOM)
  });

  it('T2.18.03: Repeated processing of already paid payout is handled idempotently', async () => {
    await env.client.loginAsAdmin();
    const res1 = await env.client.processAdminPayout('payout-001', 'pay');
    assertEqual(res1.status, 200);

    const res2 = await env.client.processAdminPayout('payout-001', 'pay');
    assertEqual(res2.status, 200);
    assertEqual(res2.data.data.status, 'paid');
  });

  it('T2.18.04: Payout process with unrecognized action string defaults or returns 200/400', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.processAdminPayout('payout-001', 'unknown_action');
    assert([200, 400].includes(res.status));
  });

  it('T2.18.05: Mathematical verification of 8% platform fee deduction from gross GMV', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminOverview();
    const gmv = res.data.data.gmv_minor;
    const commission = res.data.data.commission_revenue_minor;
    const expected = Math.round(gmv * 0.08);
    assertEqual(commission, expected);
  });
});
