/**
 * Tier 4: Scenario 04 - Kyrgyz Bank Payout Workflow (MBank)
 * Simulates seller fund withdrawal -> MBank phone account link -> wallet balance deduction -> admin financial queue review -> payment execution.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 4', 'Scenario 04: MBank Payout Workflow');

describe('Tier 4: Scenario 04 - Kyrgyz Bank Payout Workflow (MBank)', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T4.04: Executes complete seller 50,000 SOM withdrawal lifecycle via MBank mobile banking', async () => {
    // 1. Seller logs in and verifies existing balance
    await env.client.loginAsSeller();
    const profileBefore = (await env.client.getProfile()).data.data;
    const balanceBefore = profileBefore.balance_minor;
    const withdrawalAmountMinor = 5000000; // 50,000.00 KGS

    // 2. Seller adds MBank P2P/MSISDN account
    const addMethodRes = await env.client.addPayoutMethod({
      provider: 'mbank',
      bank_name: 'MBank (Коммерческий банк КЫРГЫЗСТАН)',
      account_number: '+996700112233',
      account_holder_name: 'Акылбек Жээнбеков'
    });
    assertEqual(addMethodRes.status, 201);
    const methodId = addMethodRes.data.data.id;

    // 3. Seller submits payout withdrawal request
    const payoutReqRes = await env.client.requestPayout({
      amount_minor: withdrawalAmountMinor,
      payout_method_id: methodId,
      provider: 'mbank',
      account_number: '+996700112233'
    });
    assertEqual(payoutReqRes.status, 201);
    const payoutId = payoutReqRes.data.data.id;
    assertEqual(payoutReqRes.data.data.status, 'pending');

    // 4. Verify wallet balance was immediately debited
    const profileAfter = (await env.client.getProfile()).data.data;
    assertEqual(profileAfter.balance_minor, balanceBefore - withdrawalAmountMinor);

    // 5. Admin opens Financials module and inspects pending queue
    await env.client.loginAsAdmin();
    const finRes = await env.client.getAdminFinancials();
    assertEqual(finRes.status, 200);
    assert(finRes.data.data.payout_requests.some(p => p.id === payoutId));

    // 6. Admin approves and triggers MBank transfer
    const processRes = await env.client.processAdminPayout(payoutId, 'pay');
    assertEqual(processRes.status, 200);
    assertEqual(processRes.data.data.status, 'paid');
    assert(processRes.data.data.processed_at);
  });
});
