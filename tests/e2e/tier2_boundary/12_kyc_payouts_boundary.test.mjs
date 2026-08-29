/**
 * Tier 2: Feature 12 Boundary - User KYC & Payout Methods (R2, F14)
 * 5 boundary tests covering 13-digit INN, 15-digit INN, insufficient balance payout, negative payout, and non-existent payout method deletion.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'User KYC & Payouts Boundary');

describe('Tier 2: Feature 12 - User KYC & Payouts Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.12.01: Submitting 13-digit INN (under 14-digit legal boundary) is rejected with 400', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.submitKyc({ inn: '1234567890123' });
    assertEqual(res.status, 400);
    assert(!res.data.success);
  });

  it('T2.12.02: Submitting 15-digit INN (over 14-digit legal boundary) is rejected with 400', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.submitKyc({ inn: '123456789012345' });
    assertEqual(res.status, 400);
    assert(!res.data.success);
  });

  it('T2.12.03: Requesting payout amount exceeding current wallet balance is rejected with 400', async () => {
    await env.client.loginAsSeller();
    // Seller balance is 500,000 SOM (50,000,000 tiyyn)
    const excessiveAmount = 99999999999;
    const res = await env.client.requestPayout({
      amount_minor: excessiveAmount,
      provider: 'mbank',
      account_number: '+996700112233'
    });
    assertEqual(res.status, 400);
    assert(!res.data.success);
  });

  it('T2.12.04: Requesting 0 or negative payout amount is rejected with 400', async () => {
    await env.client.loginAsSeller();
    const resZero = await env.client.requestPayout({ amount_minor: 0 });
    assertEqual(resZero.status, 400);

    const resNeg = await env.client.requestPayout({ amount_minor: -1000 });
    assertEqual(resNeg.status, 400);
  });

  it('T2.12.05: Deleting non-existent payout method ID is handled without crashing', async () => {
    await env.client.loginAsSeller();
    const res = await env.client.deletePayoutMethod('pm-non-existent-999');
    assert([200, 404].includes(res.status));
  });
});
