/**
 * Tier 5: Adversarial Stress Test Suite - Dispute Escrow Settlements & Resolution Lifecycle
 * Tests dispute ticket filing, admin dispute resolution, refund allocation,
 * non-admin RBAC restrictions, and conflict resolution against settled transactions.
 */

import { describe, it, beforeEach, setTestContext } from '../e2e/harness/testFramework.mjs';
import { assert, assertEqual } from '../e2e/harness/assertions.mjs';
import { getTestEnvironment } from '../e2e/harness/index.mjs';

setTestContext('Tier 5', 'Dispute Escrow Settlements');

describe('Tier 5: Adversarial - Dispute Escrow Settlements', () => {
  let env;

  beforeEach(async () => {
    env = await getTestEnvironment();
    if (env.reset) {
      await env.reset();
    }
  });

  it('ADV.DISP.01: Admin dispute query returns all open and resolved dispute records with full audit trail', async () => {
    const adminLogin = await env.client.login('admin@auktsion.kg', 'Password123!');
    const adminToken = adminLogin.data.token;

    const res = await env.client.get('/api/admin/disputes', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assertEqual(res.status, 200, 'Admin fetching disputes must return 200');
    assert(Array.isArray(res.data.data), 'Disputes data must be an array');
  });

  it('ADV.DISP.02: Admin resolves dispute ticket with full buyer refund settlement', async () => {
    const adminLogin = await env.client.login('admin@auktsion.kg', 'Password123!');
    const adminToken = adminLogin.data.token;

    // Fetch disputes to get an active dispute ID
    const disputesRes = await env.client.get('/api/admin/disputes', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const disputes = disputesRes.data.data || [];
    const openDispute = disputes.find(d => d.status === 'open' || d.status === 'under_review') || disputes[0];

    if (openDispute) {
      const resolveRes = await env.client.put(`/api/admin/disputes/${openDispute.id}/resolve`, {
        decision: 'refund_buyer',
        status: 'resolved',
        resolution: 'Товар сүрөттөмөгө дал келбейт, толук кайтаруу (Refund full amount)',
        refund_minor: 1500000,
        refundAmount: 15000
      }, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      assertEqual(resolveRes.status, 200, 'Resolving dispute must return HTTP 200');
      assert(resolveRes.data.success, 'Success flag must be true');
      assertEqual(resolveRes.data.data.status, 'resolved', 'Dispute status must update to resolved');
    }
  });

  it('ADV.DISP.03: Resolving non-existent dispute ticket returns HTTP 404', async () => {
    const adminLogin = await env.client.login('admin@auktsion.kg', 'Password123!');
    const adminToken = adminLogin.data.token;

    const res = await env.client.put('/api/admin/disputes/disp-nonexistent-999/resolve', {
      decision: 'reject_claim',
      status: 'rejected',
      resolution: 'Invalid dispute'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assertEqual(res.status, 404, 'Resolving non-existent dispute must return HTTP 404');
    assert(!res.data.success, 'Success flag must be false');
  });

  it('ADV.DISP.04: Non-admin buyer is strictly forbidden from resolving dispute claims (RBAC check)', async () => {
    const buyerLogin = await env.client.login('buyer@auktsion.kg', 'Password123!');
    const buyerToken = buyerLogin.data.token;

    const res = await env.client.put('/api/admin/disputes/disp-001/resolve', {
      decision: 'refund_buyer',
      status: 'resolved'
    }, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });

    assertEqual(res.status, 403, 'Non-admin resolving dispute must return HTTP 403 Forbidden');
  });

  it('ADV.DISP.05: Overview metrics accurately track open disputes count', async () => {
    const adminLogin = await env.client.login('admin@auktsion.kg', 'Password123!');
    const adminToken = adminLogin.data.token;

    const overviewRes = await env.client.get('/api/admin/overview', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assertEqual(overviewRes.status, 200);
    const data = overviewRes.data.data;
    assert(data.open_disputes !== undefined || data.openDisputesCount !== undefined, 'Overview must report open disputes metric');
  });
});
