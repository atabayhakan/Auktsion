/**
 * Tier 4: Scenario 11 - User Profile & Security Lifecycle Workload
 * Simulates registration -> profile enrichment -> password rotation -> security preferences -> relogin verification.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 4', 'Scenario 11: Profile & Security Lifecycle');

describe('Tier 4: Scenario 11 - User Profile & Security Lifecycle', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T4.11: Complete user security and profile rotation cycle across multiple authenticated sessions', async () => {
    const userEmail = `security_user_${Date.now()}@auktsion.kg`;
    const initialPass = 'InitialPassword123!';
    const rotatedPass = 'RotatedNewPassword456!';

    // 1. User registers
    const regRes = await env.client.register({
      username: 'security_master',
      email: userEmail,
      password: initialPass,
      full_name: 'Security User Initial'
    });
    assertEqual(regRes.status, 201);

    // 2. User updates profile details
    const profileUpdate = await env.client.updateProfile({
      full_name: 'Айбек Назаров',
      phone: '+996555998811',
      city: 'Бишкек',
      district: 'Первомайский'
    });
    assertEqual(profileUpdate.status, 200);

    // 3. User rotates password
    const passRes = await env.client.updatePassword(initialPass, rotatedPass);
    assertEqual(passRes.status, 200);

    // 4. User updates notification & security settings
    const settingsRes = await env.client.updateSettings({
      email_bids: true,
      email_outbid: true,
      push_live: true,
      two_factor_enabled: true
    });
    assertEqual(settingsRes.status, 200);
    assertEqual(settingsRes.data.data.two_factor_enabled, true);

    // 5. User logs out
    await env.client.logout();

    // 6. Old password fails to authenticate
    const oldLoginRes = await env.client.login(userEmail, initialPass);
    assertEqual(oldLoginRes.status, 401);

    // 7. New password authenticates successfully
    const newLoginRes = await env.client.login(userEmail, rotatedPass);
    assertEqual(newLoginRes.status, 200);
    assertEqual(newLoginRes.data.user.full_name, 'Айбек Назаров');

    // 8. Settings retained across relogin
    const finalSettings = await env.client.getSettings();
    assertEqual(finalSettings.data.data.two_factor_enabled, true);
  });
});
