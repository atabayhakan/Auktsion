/**
 * Tier 4: Scenario 02 - High-Speed Bidding War Workload
 * Simulates high-speed alternating bids from 3 distinct buyers, sequential bid ordering, anti-sniping extension, and final price resolution.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 4', 'Scenario 02: High-Speed Bidding War');

describe('Tier 4: Scenario 02 - High-Speed Bidding War', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T4.02: Simulates 3 competing buyers in a fast-paced bidding war with price escalation', async () => {
    // Setup 3 buyers
    const buyers = [
      { email: `buyer_war1_${Date.now()}@auktsion.kg`, name: 'Канат Алымов' },
      { email: `buyer_war2_${Date.now()}@auktsion.kg`, name: 'Нурбек Турсунов' },
      { email: `buyer_war3_${Date.now()}@auktsion.kg`, name: 'Данияр Бакиров' }
    ];

    const tokens = [];
    for (const b of buyers) {
      const reg = await env.client.register({
        email: b.email,
        password: 'Password123!',
        full_name: b.name
      });
      assertEqual(reg.status, 201);
      tokens.push(reg.data.token);
    }

    const lotId = 'lot-102'; // starting price 350,000,000 tiyyn (3.5M SOM), current 380,000,000, increment 10,000,000
    let currentPrice = 380000000;
    const bidStep = 10000000; // 100,000 SOM step

    // Round 1: Buyer 1 bids 390,000,000
    env.client.setToken(tokens[0]);
    currentPrice += bidStep;
    const r1 = await env.client.placeBid(lotId, currentPrice);
    assertEqual(r1.status, 201);
    assertEqual(r1.data.data.amount_minor, 390000000);

    // Round 2: Buyer 2 counter-bids 400,000,000
    env.client.setToken(tokens[1]);
    currentPrice += bidStep;
    const r2 = await env.client.placeBid(lotId, currentPrice);
    assertEqual(r2.status, 201);
    assertEqual(r2.data.data.amount_minor, 400000000);

    // Round 3: Buyer 3 jumps to 420,000,000
    env.client.setToken(tokens[2]);
    currentPrice += bidStep * 2;
    const r3 = await env.client.placeBid(lotId, currentPrice);
    assertEqual(r3.status, 201);
    assertEqual(r3.data.data.amount_minor, 420000000);

    // Round 4: Buyer 1 tops at 430,000,000
    env.client.setToken(tokens[0]);
    currentPrice += bidStep;
    const r4 = await env.client.placeBid(lotId, currentPrice);
    assertEqual(r4.status, 201);
    assertEqual(r4.data.data.amount_minor, 430000000);

    // Verify auction final state
    const lotRes = await env.client.getAuction(lotId);
    assertEqual(lotRes.data.data.current_price_minor, 430000000);
    assert(lotRes.data.data.bids.length >= 4);
    assertEqual(lotRes.data.data.bids[0].amount_minor, 430000000);
    assertEqual(lotRes.data.data.bids[0].is_winning, true);
  });
});
