/**
 * Tier 1: Feature 18 - Admin Financials & Payouts (R3, F20)
 * Minimum 5 tests covering platform revenue, escrow held, payout queue, payout approval, and payout rejection.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { validatePayoutRequestContract } from '../harness/contractValidators.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'Admin Financials & Payouts');

describe('Feature 18: Admin Financials & Payouts', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.18.01: GET /api/admin/financials returns escrow held, commission revenue, and pending payouts', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminFinancials();
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(res.data.data.escrow_held_minor > 0);
    assert(res.data.data.commission_revenue_minor > 0);
    assert(Array.isArray(res.data.data.payout_requests));
  });

  it('T1.18.02: Payout request queue contains bank provider details and amount in KGS tiyyn', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.getAdminFinancials();
    const payout = res.data.data.payout_requests[0];
    assertEqual(payout.id, 'payout-001');
    assertEqual(payout.provider, 'mbank');
    assertEqual(payout.currency, 'KGS');
    assertEqual(payout.amount_minor, 5000000); // 50,000 SOM
    validatePayoutRequestContract(payout, 'Admin Payout Item');
  });

  it('T1.18.03: Admin approves pending payout request via POST /api/admin/payouts/:id/process', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.processAdminPayout('payout-001', 'approve');
    assertEqual(res.status, 200);
    assert(res.data.success);
    assertEqual(res.data.data.status, 'approved');
  });

  it('T1.18.04: Admin settles and executes payout marking status as paid with timestamp', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.processAdminPayout('payout-001', 'pay');
    assertEqual(res.status, 200);
    assertEqual(res.data.data.status, 'paid');
    assert(res.data.data.processed_at);
  });

  it('T1.18.05: Admin rejects suspicious payout request with status rejected', async () => {
    await env.client.loginAsAdmin();
    const res = await env.client.processAdminPayout('payout-001', 'reject');
    assertEqual(res.status, 200);
    assertEqual(res.data.data.status, 'rejected');
  });
});
