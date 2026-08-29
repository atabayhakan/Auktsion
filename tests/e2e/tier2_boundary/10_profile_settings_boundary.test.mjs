/**
 * Tier 2: Feature 10 Boundary - User Profile & Settings (R2, F12)
 * 5 boundary tests covering partial profile updates, identical old/new passwords, empty new passwords, extra setting fields, and formatted phone numbers.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'User Profile & Settings Boundary');

describe('Tier 2: Feature 10 - User Profile & Settings Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.10.01: Updating only city does not wipe full_name or phone number in profile', async () => {
    await env.client.loginAsBuyer();
    const initial = (await env.client.getProfile()).data.data;

    const res = await env.client.updateProfile({ city: 'Жалал-Абад' });
    assertEqual(res.status, 200);
    assertEqual(res.data.data.city, 'Жалал-Абад');
    assertEqual(res.data.data.full_name, initial.full_name);
    assertEqual(res.data.data.phone, initial.phone);
  });

  it('T2.10.02: Password change allows identical old and new password or handles idempotently', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.updatePassword('Password123!', 'Password123!');
    assert([200, 400].includes(res.status));
  });

  it('T2.10.03: Password change with empty new password is rejected with 400', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.updatePassword('Password123!', '');
    assertEqual(res.status, 400);
  });

  it('T2.10.04: Settings update with extra unknown keys is handled gracefully without crashing', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.updateSettings({ custom_future_option: true, email_bids: true });
    assertEqual(res.status, 200);
  });

  it('T2.10.05: Profile update accepts formatted Kyrgyz landline / mobile phone strings', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.updateProfile({ phone: '+996 (312) 62-45-12' });
    assertEqual(res.status, 200);
    assertEqual(res.data.data.phone, '+996 (312) 62-45-12');
  });
});
