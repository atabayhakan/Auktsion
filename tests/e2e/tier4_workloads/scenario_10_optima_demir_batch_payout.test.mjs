/**
 * Tier 4: Scenario 10 - Multi-Bank Batch Payout Processing Workload
 * Simulates multiple seller withdrawals across Optima Bank & DemirBank -> admin batch processing -> status settlements.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 4', 'Scenario 10: Multi-Bank Payout Processing');

describe('Tier 4: Scenario 10 - Multi-Bank Batch Payout Processing', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T4.10: Submits and processes multiple seller withdrawal requests across Optima & DemirBank', async () => {
    // 1. Seller 1 requests Optima payout (15,000 SOM)
    await env.client.loginAsSeller();
    const optPayout = await env.client.requestPayout({
      amount_minor: 1500000, // 15,000 SOM
      provider: 'optima',
      account_number: '4169580012345678'
    });
    assertEqual(optPayout.status, 201);
    const optPayoutId = optPayout.data.data.id;

    // 2. Seller 2 registers & requests DemirBank IBAN payout (10,000 SOM from 25,000 SOM balance)
    const seller2Email = `demir_seller_${Date.now()}@auktsion.kg`;
    const regRes = await env.client.register({
      email: seller2Email,
      password: 'Pass123456!',
      full_name: 'Кубат Султанов'
    });
    assertEqual(regRes.status, 201);

    const demirPayout = await env.client.requestPayout({
      amount_minor: 1000000, // 10,000 SOM
      provider: 'demirbank',
      account_number: 'KG12DEMB000012345678'
    });
    assertEqual(demirPayout.status, 201);
    const demirPayoutId = demirPayout.data.data.id;

    // 3. Admin opens Financials and verifies both requests
    await env.client.loginAsAdmin();
    const finRes = await env.client.getAdminFinancials();
    assertEqual(finRes.status, 200);
    const queue = finRes.data.data.payout_requests;
    assert(queue.some(p => p.id === optPayoutId));
    assert(queue.some(p => p.id === demirPayoutId));

    // 4. Admin processes Optima payment
    const optProcess = await env.client.processAdminPayout(optPayoutId, 'pay');
    assertEqual(optProcess.status, 200);
    assertEqual(optProcess.data.data.status, 'paid');

    // 5. Admin processes DemirBank payment
    const demirProcess = await env.client.processAdminPayout(demirPayoutId, 'pay');
    assertEqual(demirProcess.status, 200);
    assertEqual(demirProcess.data.data.status, 'paid');
  });
});
