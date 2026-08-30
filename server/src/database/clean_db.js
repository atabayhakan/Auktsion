import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../database/auktsion.sqlite');

const db = new Database(dbPath);
db.pragma('foreign_keys = OFF');

const tables = [
  'bids',
  'watchlists',
  'payments',
  'disputes',
  'payout_requests',
  'notifications',
  'auctions'
];

for (const t of tables) {
  try {
    const res = db.prepare(`DELETE FROM ${t}`).run();
    console.log(`Deleted ${res.changes} rows from ${t}`);
  } catch (err) {
    console.warn(`Table ${t} note:`, err.message);
  }
}

const u1 = db.prepare("DELETE FROM payout_methods WHERE user_id != 'admin-001'").run();
console.log(`Deleted ${u1.changes} rows from payout_methods`);

const u2 = db.prepare("DELETE FROM kyc_verifications WHERE user_id != 'admin-001'").run();
console.log(`Deleted ${u2.changes} rows from kyc_verifications`);

const u3 = db.prepare("DELETE FROM user_settings WHERE user_id != 'admin-001'").run();
console.log(`Deleted ${u3.changes} rows from user_settings`);

const u4 = db.prepare("DELETE FROM users WHERE role != 'admin'").run();
console.log(`Deleted ${u4.changes} rows from users`);

db.pragma('foreign_keys = ON');
db.exec('VACUUM');

const auctionCount = db.prepare('SELECT count(*) as count FROM auctions').get();
const userCount = db.prepare('SELECT count(*) as count FROM users').get();
const catCount = db.prepare('SELECT count(*) as count FROM categories').get();

console.log('CLEANUP SUMMARY:', {
  remainingAuctions: auctionCount.count,
  remainingUsers: userCount.count,
  remainingCategories: catCount.count
});
