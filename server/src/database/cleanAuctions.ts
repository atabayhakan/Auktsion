import { getDatabase } from '../config/database.js';

export function cleanAuctions(): void {
  const db = getDatabase();
  console.log('🧹 Starting cleanup of all demo/fake auctions...');

  db.pragma('foreign_keys = OFF');

  try {
    const delBids = db.prepare('DELETE FROM bids').run();
    const delWatchlists = db.prepare('DELETE FROM watchlists').run();
    const delDisputes = db.prepare('DELETE FROM disputes').run();
    const delPayments = db.prepare('DELETE FROM payments').run();
    const delEscrow = db.prepare('DELETE FROM escrow_transactions').run();
    const delAuctions = db.prepare('DELETE FROM auctions').run();

    try { db.prepare('DELETE FROM notifications').run(); } catch (e) {}

    console.log('✅ Cleanup complete: Deleted ' + delAuctions.changes + ' auctions, ' + delBids.changes + ' bids, ' + delWatchlists.changes + ' watchlist items.');
  } finally {
    db.pragma('foreign_keys = ON');
  }
}

cleanAuctions();

