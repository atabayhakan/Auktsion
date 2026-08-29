/**
 * Tier 4: Scenario 09 - Shill Bidding Detection & Price Recalculation Workload
 * Simulates shill bidding alert in live operations war room -> admin nullification -> accurate rollback of auction winning leader.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 4', 'Scenario 09: Shill Bidding Cancellation');

describe('Tier 4: Scenario 09 - Shill Bidding Detection & Cancellation', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T4.09: Live war room shill bidding intervention: Admin voids top rogue bid and restores true winner', async () => {
    const lotId = 'lot-101'; // initial: 17,500,000 SOM (bid-001 by user-buyer-001)

    // 1. Legitimate Buyer 1 places bid at 18,000,000
    await env.client.loginAsBuyer();
    const legitBidRes = await env.client.placeBid(lotId, 18000000);
    assertEqual(legitBidRes.status, 201);
    const legitBidId = legitBidRes.data.data.id;

    // 2. Shill bidder account artificially inflates price to 30,000,000
    await env.client.register({
      email: `shill_bot_${Date.now()}@auktsion.kg`,
      password: 'BotPassword123!',
      full_name: 'Shill Bot 007'
    });
    const shillBidRes = await env.client.placeBid(lotId, 30000000);
    assertEqual(shillBidRes.status, 201);
    const shillBidId = shillBidRes.data.data.id;

    // 3. Admin opens live monitoring feed & detects shill spike
    await env.client.loginAsAdmin();
    const monRes = await env.client.getAdminMonitoring();
    assertEqual(monRes.status, 200);

    // 4. Admin cancels the fraudulent shill bid
    const cancelRes = await env.client.cancelAdminBid(shillBidId);
    assertEqual(cancelRes.status, 200);

    // 5. Verify auction price reverted back to legitimate 18,000,000 and Buyer 1 is winning again
    const lotAfter = (await env.client.getAuction(lotId)).data.data;
    assertEqual(lotAfter.current_price_minor, 18000000);

    const winningBid = lotAfter.bids.find(b => b.id === legitBidId);
    assertEqual(winningBid.is_winning, true);
  });
});
