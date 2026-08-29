/**
 * Tier 5: Adversarial Stress Test Suite - Escrow Balances & Kyrgyz Payout Gateways
 * Tests overdraft attacks, zero/negative payouts, concurrent double-withdrawal race conditions,
 * Kyrgyz bank gateways (MBank, Optima, DemirBank, ELQR, O!Bank), and admin settlement processing.
 */

import { describe, it, beforeEach, setTestContext } from '../e2e/harness/testFramework.mjs';
import { assert, assertEqual } from '../e2e/harness/assertions.mjs';
import { getTestEnvironment } from '../e2e/harness/index.mjs';

setTestContext('Tier 5', 'Escrow & Kyrgyz Payout Gateways');

describe('Tier 5: Adversarial - Escrow & Kyrgyz Payout Gateways', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    if (env.reset) {
      await env.reset();
    }
  });

  it('ADV.PAY.01: Overdraft protection strictly rejects payout amount exceeding user balance', async () => {
    // Buyer has initial balance: 25,000 SOM (2,500,000 tiyyn)
    const buyerRes = await env.client.login('buyer@auktsion.kg', 'Password123!');
    const token = buyerRes.data.token;

    // Add payout method first
    await env.client.post('/api/user/payout-methods', {
      provider: 'mbank',
      bankCode: 'mbank',
      account_number: '+996700112233',
      accountNumber: '+996700112233',
      accountHolderName: 'Бакыт Садыков'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Attempt withdrawal of 999,999,999 SOM (exceeds balance)
    const overdraftRes = await env.client.post('/api/user/payouts', {
      amount: 999999999,
      amount_minor: 99999999900,
      provider: 'mbank'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    assertEqual(overdraftRes.status, 400, 'Overdraft withdrawal must return HTTP 400 Bad Request');
    assert(!overdraftRes.data.success, 'Success flag must be false for overdraft');
  });

  it('ADV.PAY.02: Rejects zero, negative, null, and non-numeric payout amounts', async () => {
    const buyerRes = await env.client.login('buyer@auktsion.kg', 'Password123!');
    const token = buyerRes.data.token;

    const invalidAmounts = [0, -100, -5000000, null, 'INVALID_AMOUNT'];

    for (const amount of invalidAmounts) {
      const res = await env.client.post('/api/user/payouts', {
        amount,
        amount_minor: typeof amount === 'number' ? amount * 100 : amount
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      assertEqual(res.status, 400, `Payout amount ${amount} must be rejected with 400`);
    }
  });

  it('ADV.PAY.03: Concurrent double-withdrawal requests cannot exceed total available balance', async () => {
    // Register user with initial 25,000 SOM balance (2,500,000 tiyyn)
    const regRes = await env.client.post('/api/auth/register', {
      fullName: 'Race Payout User',
      email: `payout_race_${Date.now()}@auktsion.kg`,
      phone: '+996770112288',
      password: 'Password123!'
    });
    const token = regRes.data.token;

    // Add payout method
    await env.client.post('/api/user/payout-methods', {
      provider: 'mbank',
      bankCode: 'mbank',
      account_number: '+996770112288',
      accountNumber: '+996770112288',
      accountHolderName: 'Race Payout User'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Launch 3 simultaneous payout requests for 20,000 SOM each (total 60,000 SOM > 25,000 SOM balance)
    const promises = Array.from({ length: 3 }).map(() =>
      env.client.post('/api/user/payouts', {
        amount: 20000,
        amount_minor: 2000000,
        provider: 'mbank',
        account_number: '+996770112288'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    );

    const responses = await Promise.all(promises);
    const successful = responses.filter(r => r.status === 201 || (r.data && r.data.success));
    const rejected = responses.filter(r => r.status === 400 || (r.data && !r.data.success));

    // Exactly 1 request of 20,000 SOM can succeed from 25,000 SOM balance; remaining 2 must be rejected
    assertEqual(successful.length, 1, 'Only 1 payout request can succeed before depleting balance');
    assertEqual(rejected.length, 2, 'Subsequent 2 concurrent overdraft payouts must be rejected with 400');
  });

  it('ADV.PAY.04: Supports valid Kyrgyz bank providers (MBank, Optima, DemirBank, ELQR, O!Bank)', async () => {
    const sellerRes = await env.client.login('seller@auktsion.kg', 'Password123!');
    const token = sellerRes.data.token;

    const validBanks = [
      { provider: 'mbank', bankCode: 'mbank', account: '+996700112233', name: 'MBank Wallet' },
      { provider: 'optima', bankCode: 'optima', account: '1180000123456789', name: 'Optima Bank Card' },
      { provider: 'demirbank', bankCode: 'demirbank', account: '1290000987654321', name: 'DemirBank Account' },
      { provider: 'elqr', bankCode: 'elqr', account: 'ELQR-996700112233', name: 'ELQR Merchant' },
      { provider: 'o_nom', bankCode: 'o_nom', account: '+996500112233', name: 'O!Bank Wallet' }
    ];

    for (const bank of validBanks) {
      const res = await env.client.post('/api/user/payout-methods', {
        provider: bank.provider,
        bankCode: bank.bankCode,
        account_number: bank.account,
        accountNumber: bank.account,
        accountHolderName: 'Акылбек Жээнбеков'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      assertEqual(res.status, 201, `Adding ${bank.provider} payout method must succeed with 201`);
      assert(res.data.success, 'Success flag must be true');
    }

    // Verify list contains added payout methods
    const listRes = await env.client.get('/api/user/payout-methods', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assertEqual(listRes.status, 200);
    assert(listRes.data.data.length >= validBanks.length, 'Payout methods list must contain added records');
  });

  it('ADV.PAY.05: Unsupported bank provider or missing account number is rejected with 400', async () => {
    const sellerRes = await env.client.login('seller@auktsion.kg', 'Password123!');
    const token = sellerRes.data.token;

    // 1. Invalid / unsupported bank provider
    const invalidBankRes = await env.client.post('/api/user/payout-methods', {
      provider: 'unsupported_foreign_bank_xyz',
      bankCode: 'unsupported_foreign_bank_xyz',
      account_number: '1234567890'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assertEqual(invalidBankRes.status, 400, 'Unsupported bank provider must be rejected with 400');

    // 2. Missing account number
    const missingAccountRes = await env.client.post('/api/user/payout-methods', {
      provider: 'mbank',
      bankCode: 'mbank',
      account_number: ''
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assertEqual(missingAccountRes.status, 400, 'Missing account number must be rejected with 400');
  });

  it('ADV.PAY.06: Admin payout processing workflow (approve / pay / reject) and RBAC verification', async () => {
    // 1. User requests payout
    const sellerRes = await env.client.login('seller@auktsion.kg', 'Password123!');
    const sellerToken = sellerRes.data.token;

    const payoutReq = await env.client.post('/api/user/payouts', {
      amount: 5000,
      amount_minor: 500000,
      provider: 'mbank',
      account_number: '+996700112233'
    }, {
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });
    assertEqual(payoutReq.status, 201);
    const payoutId = payoutReq.data.data.id;

    // 2. Non-admin attempt to process payout must fail (403)
    const buyerRes = await env.client.login('buyer@auktsion.kg', 'Password123!');
    const buyerToken = buyerRes.data.token;

    const unauthProcess = await env.client.post(`/api/admin/payouts/${payoutId}/process`, {
      action: 'pay',
      status: 'completed'
    }, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    assertEqual(unauthProcess.status, 403, 'Non-admin processing payout must return 403 Forbidden');

    // 3. Admin successfully processes payout
    const adminRes = await env.client.login('admin@auktsion.kg', 'Password123!');
    const adminToken = adminRes.data.token;

    const adminProcess = await env.client.post(`/api/admin/payouts/${payoutId}/process`, {
      action: 'pay',
      status: 'completed',
      admin_notes: 'Төлөм MBank аркылуу которулду (Paid via MBank)'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertEqual(adminProcess.status, 200, 'Admin payout processing must succeed with 200');
    assert(adminProcess.data.success, 'Success must be true');
  });
});
