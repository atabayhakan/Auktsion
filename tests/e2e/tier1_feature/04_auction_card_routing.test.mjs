/**
 * Tier 1: Feature 04 - Auction Card & Lot Routing (R1, F05)
 * Minimum 5 tests covering auction card attributes, ID routing, pagination, status badges, and 404 lots.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { validateAuctionContract } from '../harness/contractValidators.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 1', 'Auction Card & Lot Routing');

describe('Feature 04: Auction Card & Lot Routing', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T1.04.01: Auction card item contains all required display attributes and follows contract', async () => {
    const res = await env.client.getAuctions();
    assertEqual(res.status, 200);
    assert(res.data.data.length > 0);
    const card = res.data.data[0];
    validateAuctionContract(card, 'Auction Card');
    assertEqual(card.currency, 'KGS');
    assert(card.current_price_minor > 0);
  });

  it('T1.04.02: Navigates cleanly to lot detail by ID with complete bid history', async () => {
    const lotId = 'lot-101';
    const res = await env.client.getAuction(lotId);
    assertEqual(res.status, 200);
    assert(res.data.success);
    const lot = res.data.data;
    assertEqual(lot.id, lotId);
    assert(Array.isArray(lot.bids));
    assertEqual(lot.seller_id, 'user-seller-001');
  });

  it('T1.04.03: Supports paginated auction card list navigation', async () => {
    const res = await env.client.getAuctions({ page: 1, perPage: 2 });
    assertEqual(res.status, 200);
    assert(res.data.meta);
    assertEqual(res.data.meta.page, 1);
    assertEqual(res.data.meta.perPage, 2);
    assert(res.data.data.length <= 2);
  });

  it('T1.04.04: Correctly returns auction status and featured highlight flags', async () => {
    const res = await env.client.getAuctions();
    const featuredLot = res.data.data.find(a => a.is_featured);
    assert(featuredLot, 'Expected at least one featured lot');
    assertEqual(featuredLot.status, 'active');
  });

  it('T1.04.05: Fetching an invalid/non-existent auction lot returns 404 Not Found', async () => {
    const res = await env.client.getAuction('lot-invalid-99999');
    assertEqual(res.status, 404);
    assert(!res.data.success);
  });
});
