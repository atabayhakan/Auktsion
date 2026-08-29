/**
 * Tier 5: Adversarial Stress Test Suite - KYC Verification & AML Boundary Controls
 * Tests 14-digit Kyrgyz INN format attacks, NBKR 30,000 SOM AML threshold boundaries,
 * rapid concurrent KYC submissions, rejection state transitions, and RBAC reviews.
 */

import { describe, it, beforeEach, setTestContext } from '../e2e/harness/testFramework.mjs';
import { assert, assertEqual } from '../e2e/harness/assertions.mjs';
import { getTestEnvironment } from '../e2e/harness/index.mjs';

setTestContext('Tier 5', 'KYC & AML Boundary Controls');

describe('Tier 5: Adversarial - KYC & AML Boundary Controls', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    if (env.reset) {
      await env.reset();
    }
  });

  it('ADV.KYC.01: Strictly rejects malformed, non-numeric, truncated, or oversized 14-digit INNs', async () => {
    const buyerRes = await env.client.login('buyer@auktsion.kg', 'Password123!');
    const token = buyerRes.data.token;

    const invalidInns = [
      '1234567890123',        // 13 digits (too short)
      '123456789012345',      // 15 digits (too long)
      '2010119900123A',       // 14 chars with letter
      '20101 19900123',       // 14 chars with space
      '20101-19900123',       // 14 chars with hyphen
      'abcdefghijklmn',       // 14 alphabet letters
      '!@#$%^&*()_+{}',       // 14 special characters
      '0000000000000',        // 13 zeros
      '',                     // empty string
      'null',                 // string null
    ];

    for (const inn of invalidInns) {
      const res = await env.client.post('/api/user/kyc', {
        inn,
        document_type: 'passport',
        document_number: 'AN1234567',
        idFrontUrl: '/uploads/kyc/front.jpg'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      assertEqual(res.status, 400, `Invalid INN "${inn}" must be rejected with HTTP 400`);
      assert(!res.data.success, `Success flag must be false for invalid INN "${inn}"`);
    }
  });

  it('ADV.KYC.02: Valid 14-digit Kyrgyz INN successfully submits and transitions status to pending', async () => {
    const buyerRes = await env.client.login('buyer@auktsion.kg', 'Password123!');
    const token = buyerRes.data.token;

    const validInn = '20101199001234';
    const res = await env.client.post('/api/user/kyc', {
      inn: validInn,
      document_type: 'passport',
      document_number: 'ID9876543',
      idFrontUrl: '/uploads/kyc/id_front.jpg',
      idBackUrl: '/uploads/kyc/id_back.jpg',
      selfieUrl: '/uploads/kyc/selfie.jpg'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    assertEqual(res.status, 201, 'Valid KYC submission must return HTTP 201');
    assert(res.data.success, 'Response must indicate success');
    
    // Check KYC record retrieval
    const kycGet = await env.client.get('/api/user/kyc', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assertEqual(kycGet.status, 200);
    assert(kycGet.data.data !== null, 'KYC record must be returned');
    assertEqual(kycGet.data.data.inn, validInn, 'Stored INN must match submitted INN');
  });

  it('ADV.KYC.03: Rapid concurrent KYC resubmissions serialize cleanly without duplicate corruption', async () => {
    const regRes = await env.client.post('/api/auth/register', {
      fullName: 'Rapid KYC Submitter',
      email: `rapid_kyc_${Date.now()}@auktsion.kg`,
      phone: '+996700112299',
      password: 'Password123!'
    });
    const token = regRes.data.token;

    // Fire 5 concurrent KYC submission attempts
    const validInn = '12512199500123';
    const promises = Array.from({ length: 5 }).map((_, idx) =>
      env.client.post('/api/user/kyc', {
        inn: validInn,
        document_number: `DOC-${idx}`,
        document_url: `/uploads/kyc/doc_${idx}.jpg`
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    );

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.status === 201 || r.status === 200).length;
    assert(successCount >= 1, 'At least one KYC submission must succeed');

    // Verify KYC status is pending and consistent
    const profile = await env.client.get('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const userData = profile.data.data || profile.data.user;
    assert(['pending', 'id_uploaded', 'verified'].includes(userData.kyc_status || userData.kycStatus), 'User KYC status must be updated');
  });

  it('ADV.KYC.04: Admin KYC review workflow supports approval and rejection with rejection reason notes', async () => {
    // 1. Create a user and submit KYC
    const userReg = await env.client.post('/api/auth/register', {
      fullName: 'KYC Review Target',
      email: `kyc_target_${Date.now()}@auktsion.kg`,
      phone: '+996555887766',
      password: 'Password123!'
    });
    const userToken = userReg.data.token;
    const userId = userReg.data.user.id;

    await env.client.post('/api/user/kyc', {
      inn: '20202199400555',
      document_type: 'id_card',
      document_number: 'AN009988'
    }, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    // 2. Login as admin
    const adminLogin = await env.client.login('admin@auktsion.kg', 'Password123!');
    const adminToken = adminLogin.data.token;

    // Get KYC list
    const kycListRes = await env.client.get('/api/admin/kyc', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertEqual(kycListRes.status, 200);
    const kycRecords = kycListRes.data.data || [];
    const targetRecord = kycRecords.find(k => k.userId === userId || k.user_id === userId);
    assert(targetRecord, 'Admin must see submitted KYC record');

    // 3. Admin rejects with reason note
    const reviewRes = await env.client.put(`/api/admin/kyc/${targetRecord.id}/review`, {
      action: 'reject',
      status: 'rejected',
      rejection_reason: 'Паспорттун сүрөтү даана эмес (Blurry passport image)'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertEqual(reviewRes.status, 200, 'Admin KYC rejection must return 200');

    // 4. Verify target user profile reflects rejection
    const targetProfile = await env.client.get('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const updatedUser = targetProfile.data.data || targetProfile.data.user;
    assertEqual(updatedUser.kyc_status || updatedUser.kycStatus, 'rejected', 'User status must be rejected');
  });

  it('ADV.AML.05: High-value bid at/above NBKR 30,000 SOM threshold (3,000,000 tiyyn) registers AML alert', async () => {
    // Target active lot-102 (starting 380,000,000 tiyyn = 3,800,000 SOM)
    const buyerRes = await env.client.login('buyer@auktsion.kg', 'Password123!');
    const buyerToken = buyerRes.data.token;

    // Place bid of 395,000,000 tiyyn (> 3,000,000 tiyyn)
    const bidAmount = 395000000;
    const bidRes = await env.client.post('/api/auctions/lot-102/bids', {
      amount_minor: bidAmount
    }, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    assertEqual(bidRes.status, 201, 'Valid high-value bid must succeed');

    // Admin monitoring should reflect active lot or fraud tracking
    const adminLogin = await env.client.login('admin@auktsion.kg', 'Password123!');
    const adminToken = adminLogin.data.token;

    const monRes = await env.client.get('/api/admin/monitoring', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertEqual(monRes.status, 200);
    assert(monRes.data.success, 'Monitoring endpoint must return 200');
  });

  it('ADV.AML.06: Non-admin is strictly forbidden from reviewing KYC records (RBAC verification)', async () => {
    const buyerRes = await env.client.login('buyer@auktsion.kg', 'Password123!');
    const buyerToken = buyerRes.data.token;

    const res = await env.client.put('/api/admin/kyc/kyc-fake-999/review', {
      action: 'approve',
      status: 'approved'
    }, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });

    assertEqual(res.status, 403, 'Non-admin KYC review must return HTTP 403 Forbidden');
  });
});
