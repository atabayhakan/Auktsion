import { getDatabase } from '../config/database.js';

export function cleanAuctions(): void {
  const db = getDatabase();
  console.log('🧹 Starting cleanup of all demo/fake auctions...');

  db.pragma('foreign_keys = OFF');

  const safeRun = (sql: string) => {
    try {
      return db.prepare(sql).run().changes;
    } catch (e) {
      return 0;
    }
  };

  try {
    const bids = safeRun('DELETE FROM bids');
    const watchlists = safeRun('DELETE FROM watchlists');
    const notifications = safeRun('DELETE FROM notifications');
    const activity = safeRun('DELETE FROM activity_logs');
    const auctions = safeRun('DELETE FROM auctions');

    console.log(`✅ Cleanup complete: Deleted ${auctions} auctions, ${bids} bids, ${watchlists} watchlists, ${notifications} notifications, ${activity} activity logs.`);
  } finally {
    db.pragma('foreign_keys = ON');
  }
}

cleanAuctions();

