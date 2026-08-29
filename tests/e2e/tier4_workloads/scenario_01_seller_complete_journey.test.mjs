/**
 * Tier 4: Scenario 01 - Complete Seller Journey Workload
 * End-to-end simulation: Register Seller -> Submit KYC -> Admin Approves KYC -> Seller Creates Lot ->
 * Admin Approves Lot -> Buyers Place Bids -> Auction Completes -> Seller Requests MBank Payout -> Admin Pays.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 4', 'Scenario 01: Complete Seller Journey');

describe('Tier 4: Scenario 01 - Complete Seller Journey', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T4.01: Simulates complete end-to-end seller lifecycle from onboarding to payout settlement', async () => {
    // 1. Seller Registers
    const sellerEmail = `kyrgyz_seller_${Date.now()}@auktsion.kg`;
    const regRes = await env.client.register({
      username: 'ulan_seller',
      email: sellerEmail,
      password: 'SellerSecure123!',
      full_name: 'Улан Осмонов',
      phone: '+996770554433'
    });
    assertEqual(regRes.status, 201);
    const sellerId = regRes.data.user.id;

    // 2. Seller Submits KYC (Passport + 14-digit INN)
    const kycRes = await env.client.submitKyc({
      inn: '21408198800112',
      document_type: 'passport',
      document_number: 'AN0987123',
      document_url: '/uploads/kyc/ulan_passport.jpg'
    });
    assertEqual(kycRes.status, 201);
    const kycId = kycRes.data.data.id;

    // 3. Admin Reviews and Approves KYC
    await env.client.loginAsAdmin();
    const adminKycRes = await env.client.reviewAdminKyc(kycId, { action: 'approve' });
    assertEqual(adminKycRes.status, 200);

    // 4. Seller Logs in and Creates New Livestock Lot
    await env.client.login(sellerEmail, 'SellerSecure123!');
    const createRes = await env.client.createAuction({
      title: 'Тулпар (Арабский скакун 4 года)',
      description: 'Чистокровный скакун с паспортом ВНИИК, победитель скачек.',
      category: 'livestock',
      sub_category: 'horses',
      starting_price_minor: 50000000, // 500,000 SOM
      bid_increment_minor: 2000000, // 20,000 SOM
      city: 'Бишкек',
      region_id: 'bishkek'
    });
    assertEqual(createRes.status, 201);
    const lotId = createRes.data.data.id;

    // 5. Admin Approves the Lot
    await env.client.loginAsAdmin();
    const approveLotRes = await env.client.setAdminListingStatus(lotId, 'active');
    assertEqual(approveLotRes.status, 200);

    // 6. Two Buyers Place Competitive Bids
    await env.client.loginAsBuyer();
    const bid1 = await env.client.placeBid(lotId, 52000000); // 520,000 SOM
    assertEqual(bid1.status, 201);

    // Buyer 2 registers & bids
    await env.client.register({
      email: `buyer_war_${Date.now()}@auktsion.kg`,
      password: 'Password123!',
      full_name: 'Тимур Ибраев'
    });
    const bid2 = await env.client.placeBid(lotId, 55000000); // 550,000 SOM
    assertEqual(bid2.status, 201);
    assertEqual(bid2.data.data.is_winning, true);

    // 7. Seller Adds MBank Payout Method and Requests Withdrawal
    await env.client.login(sellerEmail, 'SellerSecure123!');
    const addBankRes = await env.client.addPayoutMethod({
      provider: 'mbank',
      bank_name: 'MBank',
      account_number: '+996770554433',
      account_holder_name: 'Улан Осмонов'
    });
    assertEqual(addBankRes.status, 201);

    const payoutRes = await env.client.requestPayout({
      amount_minor: 2000000, // 20,000 SOM
      provider: 'mbank',
      account_number: '+996770554433'
    });
    assertEqual(payoutRes.status, 201);
    const payoutId = payoutRes.data.data.id;

    // 8. Admin Processes Payout to Paid Status
    await env.client.loginAsAdmin();
    const settleRes = await env.client.processAdminPayout(payoutId, 'pay');
    assertEqual(settleRes.status, 200);
    assertEqual(settleRes.data.data.status, 'paid');
  });
});
