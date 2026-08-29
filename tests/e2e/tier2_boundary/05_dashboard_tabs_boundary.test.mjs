/**
 * Tier 2: Feature 05 Boundary - Dashboard Sub-Tabs (R1, F06)
 * 5 boundary tests covering empty listings state, empty bids state, empty payouts state, empty settings payload, and long text fields.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 2', 'Dashboard Sub-Tabs Boundary');

describe('Tier 2: Feature 05 - Dashboard Sub-Tabs Boundary', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T2.05.01: Brand new user with 0 listings receives clean empty array on listings tab', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.getListings();
    assertEqual(res.status, 200);
    assert(Array.isArray(res.data.data));
    assertEqual(res.data.data.length, 0);
  });

  it('T2.05.02: User with 0 bids receives clean empty array on bids tab', async () => {
    await env.client.loginAsSeller();
    const res = await env.client.getBids();
    assertEqual(res.status, 200);
    assert(Array.isArray(res.data.data));
    assertEqual(res.data.data.length, 0);
  });

  it('T2.05.03: User with 0 payouts receives clean empty array on payouts tab', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.getPayouts();
    assertEqual(res.status, 200);
    assert(Array.isArray(res.data.data));
    assertEqual(res.data.data.length, 0);
  });

  it('T2.05.04: Updating settings with empty payload preserves existing settings', async () => {
    await env.client.loginAsBuyer();
    const initial = await env.client.getSettings();
    const updateRes = await env.client.updateSettings({});
    assertEqual(updateRes.status, 200);
    assertEqual(updateRes.data.data.email_bids, initial.data.data.email_bids);
  });

  it('T2.05.05: Profile update handles long full_name string (500 chars) without database truncation crash', async () => {
    await env.client.loginAsBuyer();
    const longName = 'A'.repeat(500);
    const res = await env.client.updateProfile({ full_name: longName });
    assertEqual(res.status, 200);
  });
});
