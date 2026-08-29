/**
 * Tier 1: Feature 10 - User Profile & Settings (R2, F12)
 * Minimum 5 tests covering profile retrieval, profile update, password change, password validation, and settings update.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'User Profile & Settings');

describe('Feature 10: User Profile & Settings', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.10.01: GET /api/user/profile returns full user profile and wallet balance', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.getProfile();
    assertEqual(res.status, 200);
    assert(res.data.success);
    assertEqual(res.data.data.email, 'buyer@auktsion.kg');
    assertEqual(typeof res.data.data.balance_minor, 'number');
  });

  it('T1.10.02: PUT /api/user/profile updates personal details (full_name, phone, city)', async () => {
    await env.client.loginAsBuyer();
    const updateData = {
      full_name: 'Бакыт Садыков (Обновлено)',
      phone: '+996772998877',
      city: 'Ош',
      district: 'Кара-Суу'
    };

    const res = await env.client.updateProfile(updateData);
    assertEqual(res.status, 200);
    assert(res.data.success);
    assertEqual(res.data.data.full_name, updateData.full_name);
    assertEqual(res.data.data.phone, updateData.phone);
    assertEqual(res.data.data.city, updateData.city);
  });

  it('T1.10.03: PUT /api/user/password updates password when current password matches', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.updatePassword('Password123!', 'NewBrandPassword456!');
    assertEqual(res.status, 200);
    assert(res.data.success);

    // Verify login with new password
    const loginRes = await env.client.login('buyer@auktsion.kg', 'NewBrandPassword456!');
    assertEqual(loginRes.status, 200);
  });

  it('T1.10.04: PUT /api/user/password rejects update when current password is wrong', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.updatePassword('WrongCurrentPass999!', 'NewBrandPassword456!');
    assertEqual(res.status, 400);
    assert(!res.data.success);
  });

  it('T1.10.05: GET and PUT /api/user/settings modifies notification preferences', async () => {
    await env.client.loginAsBuyer();
    const initialRes = await env.client.getSettings();
    assertEqual(initialRes.status, 200);

    const updateRes = await env.client.updateSettings({
      email_bids: false,
      email_outbid: true,
      push_live: false
    });
    assertEqual(updateRes.status, 200);
    assertEqual(updateRes.data.data.email_bids, false);
    assertEqual(updateRes.data.data.push_live, false);
  });
});
