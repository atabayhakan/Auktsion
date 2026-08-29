/**
 * Tier 4: Scenario 03 - Admin Moderation & User Ban Workload
 * Simulates rogue user detection -> live war room inspection -> lot pausing -> bid cancellation -> user banning -> security lockout.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 4', 'Scenario 03: Admin Moderation & Ban');

describe('Tier 4: Scenario 03 - Admin Moderation & User Ban', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T4.03: Complete moderation flow: fraud detection -> auction pause -> bid nullification -> account ban', async () => {
    // 1. Rogue seller creates counterfeit lot
    const rogueEmail = `rogue_seller_${Date.now()}@auktsion.kg`;
    const regRes = await env.client.register({
      email: rogueEmail,
      password: 'RoguePassword123!',
      full_name: 'Fake Dealer'
    });
    const rogueId = regRes.data.user.id;

    const lotRes = await env.client.createAuction({
      title: 'Counterfeit Rolex Watch 2026',
      category: 'antiques',
      starting_price_minor: 10000000
    });
    const lotId = lotRes.data.data.id;

    // Approve lot to active state via Admin API
    await env.client.loginAsAdmin();
    await env.client.setAdminListingStatus(lotId, 'active');

    // 2. Unsuspecting buyer bids
    await env.client.loginAsBuyer();
    const bidRes = await env.client.placeBid(lotId, 12000000);
    assertEqual(bidRes.status, 201);
    const bidId = bidRes.data.data.id;

    // 3. Admin opens monitoring room & spots fraud alert
    await env.client.loginAsAdmin();
    const monRes = await env.client.getAdminMonitoring();
    assertEqual(monRes.status, 200);

    // 4. Admin pauses the counterfeit auction lot
    const pauseRes = await env.client.pauseAdminAuction(lotId, true);
    assertEqual(pauseRes.data.data.is_paused, true);

    // 5. Admin cancels the buyer's bid to protect their funds
    const cancelBidRes = await env.client.cancelAdminBid(bidId);
    assertEqual(cancelBidRes.status, 200);

    // 6. Admin flags the listing as prohibited
    const flagLotRes = await env.client.setAdminListingStatus(lotId, 'flagged');
    assertEqual(flagLotRes.data.data.status, 'flagged');

    // 7. Admin permanently bans the rogue seller account
    const banUserRes = await env.client.setAdminUserStatus(rogueId, 'banned');
    assertEqual(banUserRes.data.data.status, 'banned');

    // 8. Verify rogue seller cannot log in or create listings
    const rogueLogin = await env.client.login(rogueEmail, 'RoguePassword123!');
    assertEqual(rogueLogin.status, 403);
  });
});
