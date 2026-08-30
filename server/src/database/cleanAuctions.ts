import { getDatabase } from '../config/database.js';

export function cleanAuctions(): void {
  const db = getDatabase();
  console.log('🧹 Starting cleanup of all demo/fake auctions...');

  const delBids = db.prepare('DELETE FROM bids').run();
  const delWatchlists = db.prepare('DELETE FROM watchlists').run();
  const delAuctions = db.prepare('DELETE FROM auctions').run();

  try {
    db.prepare('DELETE FROM notifications').run();
  } catch (e) {}

  console.log(\✅ Cleanup complete: Deleted \ auctions, \ bids, \ watchlist items.\);
}

cleanAuctions();

