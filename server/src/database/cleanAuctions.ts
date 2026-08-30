import Database from 'better-sqlite3';
import { getDatabase } from '../config/database.js';
import { config } from '../config/env.js';
import path from 'path';
import fs from 'fs';

export function cleanAuctions(): void {
  const dbPaths = [
    config.dbPath,
    path.resolve(process.cwd(), 'database/auktsion.sqlite'),
    path.resolve(process.cwd(), 'server/database/auktsion.sqlite')
  ];

  const uniquePaths = [...new Set(dbPaths)].filter(p => fs.existsSync(p));

  for (const dbPath of uniquePaths) {
    console.log('🧹 Cleaning database at:', dbPath);
    try {
      const db = new Database(dbPath);
      db.pragma('foreign_keys = OFF');

      const safeRun = (sql: string) => {
        try { return db.prepare(sql).run().changes; } catch (e) { return 0; }
      };

      const bids = safeRun('DELETE FROM bids');
      const watchlists = safeRun('DELETE FROM watchlists');
      const notifications = safeRun('DELETE FROM notifications');
      const activity = safeRun('DELETE FROM activity_logs');
      const auctions = safeRun('DELETE FROM auctions');

      console.log(`✅ [${path.basename(dbPath)}] Deleted ${auctions} auctions, ${bids} bids, ${watchlists} watchlists, ${notifications} notifications, ${activity} activity logs.`);
      db.pragma('foreign_keys = ON');
      db.close();
    } catch (err: any) {
      console.error('⚠️ Error cleaning', dbPath, err?.message);
    }
  }
}

cleanAuctions();

