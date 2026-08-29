/**
 * Tier 4: Scenario 05 - KYC Verification & Identity Approval Workload
 * Simulates complete KYC pipeline: User uploads documents + 14-digit INN -> Admin review workbench -> Approval -> Unlocked permissions.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 4', 'Scenario 05: KYC Full Verification');

describe('Tier 4: Scenario 05 - KYC Verification & Identity Approval', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T4.05: Executes end-to-end KYC identity verification workflow for new citizen account', async () => {
    // 1. New citizen registers
    const userEmail = `kyrgyz_citizen_${Date.now()}@auktsion.kg`;
    const regRes = await env.client.register({
      username: 'meerim_kg',
      email: userEmail,
      password: 'CitizenPass123!',
      full_name: 'Мээрим Жумабаева',
      phone: '+996550778899'
    });
    assertEqual(regRes.status, 201);
    assertEqual(regRes.data.user.kyc_status, 'not_started');

    // 2. User submits official documents & 14-digit INN
    const kycSubmission = {
      inn: '12506199300543',
      document_type: 'id_card',
      document_number: 'ID5544332',
      document_url: '/uploads/kyc/meerim_id_front.jpg',
      selfie_url: '/uploads/kyc/meerim_selfie.jpg'
    };

    const submitRes = await env.client.submitKyc(kycSubmission);
    assertEqual(submitRes.status, 201);
    const kycId = submitRes.data.data.id;
    assertEqual(submitRes.data.data.status, 'pending');

    // 3. User verifies KYC state is pending
    const userKycStatus = await env.client.getKyc();
    assertEqual(userKycStatus.data.status, 'pending');

    // 4. Admin opens KYC module and finds pending application
    await env.client.loginAsAdmin();
    const adminQueue = await env.client.getAdminKyc();
    const app = adminQueue.data.data.find(k => k.id === kycId);
    assert(app, 'Expected application in admin review queue');
    assertEqual(app.inn, '12506199300543');

    // 5. Admin approves identity application
    const approveRes = await env.client.reviewAdminKyc(kycId, { action: 'approve' });
    assertEqual(approveRes.status, 200);
    assertEqual(approveRes.data.data.status, 'approved');

    // 6. User refreshes and confirms verified KYC status
    await env.client.login(userEmail, 'CitizenPass123!');
    const verifiedProfile = await env.client.getMe();
    assertEqual(verifiedProfile.data.user.kyc_status, 'verified');
  });
});
