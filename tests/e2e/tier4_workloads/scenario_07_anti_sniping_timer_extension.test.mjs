/**
 * Tier 4: Scenario 07 - Anti-Sniping Timer Extension Workload
 * Simulates last-minute bid sniper attempt -> automated 120-second timer extension -> fair counter-bidding window.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 4', 'Scenario 07: Anti-Sniping Timer Extension');

describe('Tier 4: Scenario 07 - Anti-Sniping Timer Extension', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T4.07: Automatically extends auction countdown when bid placed in final 120s window', async () => {
    // 1. Create hot auction lot ending in 25 seconds
    await env.client.loginAsSeller();
    const createRes = await env.client.createAuction({
      title: 'Rare Antique Komuz 19th Century',
      category: 'antiques',
      starting_price_minor: 8000000,
      bid_increment_minor: 500000
    });
    const lotId = createRes.data.data.id;

    // Set lot active with ending in 25 seconds
    if (env.server && env.server.state) {
      const lotObj = env.server.state.auctions.find(a => a.id === lotId);
      lotObj.status = 'active';
      lotObj.ends_at = new Date(Date.now() + 25000).toISOString();
    } else {
      await env.client.loginAsAdmin();
      await env.client.setAdminListingStatus(lotId, 'active');
    }

    // 2. Buyer 1 attempts last-second snipe
    await env.client.loginAsBuyer();
    const bid1Res = await env.client.placeBid(lotId, 8500000);
    assertEqual(bid1Res.status, 201);

    // 3. Verify anti-sniping extension triggered (ends_at pushed out by 120s)
    const extendedEndsAtMs = new Date(bid1Res.data.auction.ends_at).getTime();
    assert(extendedEndsAtMs >= Date.now() + 60000, 'Expected countdown extension of >= 60-120 seconds');

    // 4. Competitor Buyer 2 gets fair chance to place counter-bid in extended window
    await env.client.register({
      email: `sniper_counter_${Date.now()}@auktsion.kg`,
      password: 'Password123!',
      full_name: 'Counter Bidder'
    });
    const bid2Res = await env.client.placeBid(lotId, 9000000);
    assertEqual(bid2Res.status, 201);
    assertEqual(bid2Res.data.data.is_winning, true);
    assertEqual(bid2Res.data.auction.current_price_minor, 9000000);
  });
});
