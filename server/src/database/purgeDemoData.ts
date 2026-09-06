import { getDatabase } from '../config/database.js';

export function purgeDemoUsers(): { deletedUsers: number, demoUserIds: string[] } {
  const db = getDatabase();
  const demoIds = ['user-001', 'user-201', 'user-202', 'user-203', 'user-204'];

  console.log('🧹 Purging demo/fake users from database:', demoIds);

  const placeholders = demoIds.map(() => '?').join(',');

  // Delete related data first
  const cleanupStatements = [
    `DELETE FROM user_settings WHERE user_id IN (${placeholders})`,
    `DELETE FROM kyc_verifications WHERE user_id IN (${placeholders})`,
    `DELETE FROM payout_methods WHERE user_id IN (${placeholders})`,
    `DELETE FROM notifications WHERE user_id IN (${placeholders})`,
    `DELETE FROM group_buy_participants WHERE user_id IN (${placeholders})`,
    `DELETE FROM price_alerts WHERE user_id IN (${placeholders})`,
    `DELETE FROM bids WHERE bidder_id IN (${placeholders})`,
    `DELETE FROM auctions WHERE seller_id IN (${placeholders})`,
    `DELETE FROM users WHERE id IN (${placeholders})`,
  ];

  let totalDeleted = 0;
  db.transaction(() => {
    for (const sql of cleanupStatements) {
      try {
        const info = db.prepare(sql).run(...demoIds);
        if (sql.startsWith('DELETE FROM users')) {
          totalDeleted = info.changes;
        }
      } catch (e: any) {
        // Table might not exist or empty
      }
    }
  })();

  console.log(`✅ Purged ${totalDeleted} demo users.`);
  return { deletedUsers: totalDeleted, demoUserIds: demoIds };
}

if (process.argv[1]?.endsWith('purgeDemoData.ts') || process.argv[1]?.endsWith('purgeDemoData.js')) {
  purgeDemoUsers();
}
