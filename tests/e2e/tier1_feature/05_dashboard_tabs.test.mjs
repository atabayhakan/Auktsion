/**
 * Tier 1: Feature 05 - Dashboard Sub-Tabs (R1, F06)
 * Minimum 5 tests covering profile overview, listings tab, bids tab, KYC tab, and settings tab.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'Dashboard Sub-Tabs');

describe('Feature 05: Dashboard Sub-Tabs', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.05.01: Overview Tab returns complete user profile and current balance in tiyyn', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.getProfile();
    assertEqual(res.status, 200);
    assert(res.data.success);
    const profile = res.data.data;
    assertEqual(profile.email, 'buyer@auktsion.kg');
    assertEqual(typeof profile.balance_minor, 'number');
  });

  it('T1.05.02: Listings Tab returns seller created auction lots', async () => {
    await env.client.loginAsSeller();
    const res = await env.client.getListings();
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(Array.isArray(res.data.data));
    assert(res.data.data.every(lot => lot.seller_id === 'user-seller-001'));
  });

  it('T1.05.03: Bids Tab returns user active and historical bids', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.getBids();
    assertEqual(res.status, 200);
    assert(res.data.success);
    assert(Array.isArray(res.data.data));
    assert(res.data.data.every(bid => bid.bidder_id === 'user-buyer-001'));
  });

  it('T1.05.04: KYC Tab returns current verification status and submitted documents', async () => {
    await env.client.loginAsBuyer();
    const res = await env.client.getKyc();
    assertEqual(res.status, 200);
    assert(res.data.success);
    assertEqual(typeof res.data.status, 'string');
  });

  it('T1.05.05: Settings Tab reads and updates user notification preferences', async () => {
    await env.client.loginAsBuyer();
    const getRes = await env.client.getSettings();
    assertEqual(getRes.status, 200);

    const updateRes = await env.client.updateSettings({ push_live: false, email_bids: true });
    assertEqual(updateRes.status, 200);
    assertEqual(updateRes.data.data.push_live, false);
    assertEqual(updateRes.data.data.email_bids, true);
  });
});
