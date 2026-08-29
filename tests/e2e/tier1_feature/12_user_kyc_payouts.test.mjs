/**
 * Tier 1: Feature 12 - User KYC & Payout Methods (R2, F14)
 * Minimum 5 tests covering KYC submission, payout method creation, payout retrieval, payout request, and method deletion.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { validateKycContract, validatePayoutMethodContract, validatePayoutRequestContract } from '../harness/contractValidators.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'User KYC & Payout Methods');

describe('Feature 12: User KYC & Payout Methods', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.12.01: Submits 14-digit Kyrgyz INN and passport documents for KYC verification', async () => {
    await env.client.loginAsBuyer();
    const kycPayload = {
      inn: '20101199500123',
      document_type: 'passport',
      document_number: 'ID9876543',
      document_url: '/uploads/kyc/doc123.jpg',
      selfie_url: '/uploads/kyc/selfie123.jpg'
    };

    const res = await env.client.submitKyc(kycPayload);
    assertEqual(res.status, 201);
    assert(res.data.success);
    validateKycContract(res.data.data, 'KYC Record');
    assertEqual(res.data.data.inn, kycPayload.inn);
    assertEqual(res.data.data.status, 'pending');
  });

  it('T1.12.02: Adds MBank Kyrgyz mobile banking payout method', async () => {
    await env.client.loginAsSeller();
    const methodPayload = {
      provider: 'mbank',
      bank_name: 'MBank (Коммерческий банк КЫРГЫЗСТАН)',
      account_number: '+996777889900',
      account_holder_name: 'Акылбек Жээнбеков'
    };

    const res = await env.client.addPayoutMethod(methodPayload);
    assertEqual(res.status, 201);
    assert(res.data.success);
    validatePayoutMethodContract(res.data.data, 'Payout Method');
    assertEqual(res.data.data.provider, 'mbank');
  });

  it('T1.12.03: GET /api/user/payout-methods returns saved bank payout destinations', async () => {
    await env.client.loginAsSeller();
    const res = await env.client.getPayoutMethods();
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(Array.isArray(res.data.data));
    assert(res.data.data.length >= 1);
  });

  it('T1.12.04: Requests withdrawal to verified payout method and deducts wallet balance', async () => {
    await env.client.loginAsSeller();
    const initialProfile = await env.client.getProfile();
    const initialBalance = initialProfile.data.data.balance_minor;

    const payoutPayload = {
      amount_minor: 1000000, // 10,000.00 KGS
      provider: 'mbank',
      account_number: '+996700112233'
    };

    const res = await env.client.requestPayout(payoutPayload);
    assertEqual(res.status, 201);
    assert(res.data.success);
    validatePayoutRequestContract(res.data.data, 'Payout Request');
    assertEqual(res.data.data.status, 'pending');

    const updatedProfile = await env.client.getProfile();
    assertEqual(updatedProfile.data.data.balance_minor, initialBalance - 1000000);
  });

  it('T1.12.05: DELETE /api/user/payout-methods/:id successfully removes bank method', async () => {
    await env.client.loginAsSeller();
    const listRes = await env.client.getPayoutMethods();
    const targetId = listRes.data.data[0].id;

    const deleteRes = await env.client.deletePayoutMethod(targetId);
    assertEqual(deleteRes.status, 200);
    assert(deleteRes.data.success);

    const postDeleteList = await env.client.getPayoutMethods();
    assert(!postDeleteList.data.data.some(m => m.id === targetId));
  });
});
