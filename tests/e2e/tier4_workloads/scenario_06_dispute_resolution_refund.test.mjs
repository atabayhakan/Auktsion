/**
 * Tier 4: Scenario 06 - Buyer-Seller Dispute Resolution Workload
 * Simulates item receipt dispute -> admin evidence desk arbitration -> partial refund settlement -> case closure.
 */

import { describe, it, beforeEach, setTestContext } from '../harness/testFramework.mjs';
import { assert, assertEqual } from '../harness/assertions.mjs';
import { getTestEnvironment } from '../harness/index.mjs';

setTestContext('Tier 4', 'Scenario 06: Dispute Resolution & Refund');

describe('Tier 4: Scenario 06 - Buyer-Seller Dispute Resolution', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    env.reset();
  });

  it('T4.06: Simulates full dispute lifecycle from buyer ticket filing to admin arbitration settlement', async () => {
    // 1. Existing open dispute in initial state
    const disputeId = 'dsp-001';

    // 2. Admin opens Disputes & Claims module
    await env.client.loginAsAdmin();
    const disputeListRes = await env.client.getAdminDisputes();
    assertEqual(disputeListRes.status, 200);
    const dispute = disputeListRes.data.data.find(d => d.id === disputeId);
    assert(dispute, 'Expected dispute in admin resolution desk');
    assertEqual(dispute.status, 'open');

    // 3. Admin arbitrates partial settlement: 50,000 SOM (5,000,000 tiyyn) refund to buyer
    const partialRefundMinor = 5000000;
    const resolveRes = await env.client.resolveAdminDispute(disputeId, {
      decision: 'partial_refund',
      refund_minor: partialRefundMinor,
      notes: 'Seller agreed to 50,000 SOM concession for documentation discrepancy'
    });

    assertEqual(resolveRes.status, 200);
    assert(resolveRes.data.success);
    assertEqual(resolveRes.data.data.status, 'resolved');
    assertEqual(resolveRes.data.data.resolution, 'partial_refund');
    assertEqual(resolveRes.data.data.refund_minor, partialRefundMinor);

    // 4. Verify dispute ticket in queue is now closed
    const updatedList = await env.client.getAdminDisputes();
    const updatedDsp = updatedList.data.data.find(d => d.id === disputeId);
    assertEqual(updatedDsp.status, 'resolved');
  });
});
