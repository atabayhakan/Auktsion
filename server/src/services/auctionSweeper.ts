import { getDatabase } from '../config/database.js';
import { broadcastEvent } from './websocketService.js';

const SWEEP_INTERVAL_MS = 30_000;

/**
 * Finalizes every active auction whose ends_at is in the past:
 *  - with a winning bid (and reserve met, if any) → ended_sold + escrow payment + notifications
 *  - reserve not met → ended_reserve_not_met
 *  - no bids → ended_unsold
 * Also marks the winning bid 'won' and superseded bids 'lost'/'outbid' as needed.
 * Returns the count of auctions finalized.
 */
export function finalizeExpiredAuctions(): number {
  const db = getDatabase();

  const expired = db
    .prepare(`SELECT id FROM auctions WHERE status = 'active' AND datetime(ends_at) <= datetime('now')`)
    .all() as { id: string }[];

  if (expired.length === 0) return 0;
  let finalized = 0;

  const tx = db.transaction(() => {
    for (const { id } of expired) {
      const auction = db.prepare('SELECT * FROM auctions WHERE id = ?').get(id) as any;
      if (!auction || auction.status !== 'active') continue;

      const winning = db
        .prepare(`SELECT * FROM bids WHERE auction_id = ? AND is_winning = 1 LIMIT 1`)
        .get(id) as any | undefined;

      if (winning) {
        const reserve = auction.reserve_price_minor as number | null;
        if (reserve != null && winning.amount_minor < reserve) {
          db.prepare(
            `UPDATE auctions SET status = 'ended_reserve_not_met', updated_at = datetime('now') WHERE id = ?`
          ).run(id);
          db.prepare(`UPDATE bids SET status = 'lost' WHERE auction_id = ?`).run(id);
          db.prepare(
            `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
             VALUES (?, ?, ?, ?, 'system', 0, datetime('now'))`
          ).run(
            `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            auction.seller_id,
            'Резерв баасы жеткен жок (Reserve not met)',
            `"${auction.title}" — эң жогорку коюм ${winning.amount_minor / 100} сом резерв ${reserve / 100} сомго жеткен жок.`
          );
        } else {
          db.prepare(
            `UPDATE auctions SET status = 'ended_sold', winner_id = ?, final_price_minor = ?, updated_at = datetime('now') WHERE id = ?`
          ).run(winning.bidder_id, winning.amount_minor, id);
          db.prepare(`UPDATE bids SET status = 'won' WHERE id = ?`).run(winning.id);
          db.prepare(`UPDATE bids SET status = 'lost' WHERE auction_id = ? AND id != ?`).run(id, winning.id);

          const paymentId = `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          db.prepare(
            `INSERT INTO payments (id, user_id, auction_id, amount_minor, currency, gateway, status, metadata_json, created_at)
             VALUES (?, ?, ?, ?, 'KGS', 'mbank', 'pending', ?, datetime('now'))`
          ).run(
            paymentId,
            winning.bidder_id,
            id,
            winning.amount_minor,
            JSON.stringify({ type: 'escrow_hold', method: 'sweeper_finalize' })
          );

          for (const [uid, title, msg, type] of [
            [
              winning.bidder_id,
              'Сиз аукционду уттуңуз! (You won!)',
              `"${auction.title}" — ${winning.amount_minor / 100} сом. Эскроу эсебинде сакталды.`,
              'won',
            ],
            [
              auction.seller_id,
              'Лотуңуз сатылды (Your lot was sold)',
              `"${auction.title}" — ${winning.amount_minor / 100} сом. Эскроу эсебинде сакталды.`,
              'sold',
            ],
          ] as const) {
            db.prepare(
              `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
               VALUES (?, ?, ?, ?, ?, 0, datetime('now'))`
            ).run(`notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`, uid, title, msg, type);
          }
        }
      } else {
        db.prepare(`UPDATE auctions SET status = 'ended_unsold', updated_at = datetime('now') WHERE id = ?`).run(
          id
        );
        db.prepare(
          `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
           VALUES (?, ?, ?, ?, 'system', 0, datetime('now'))`
        ).run(
          `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          auction.seller_id,
          'Аукцион аяктады: сатып алуучу табылган жок',
          `"${auction.title}" — бир да коюм болгон жок.`
        );
      }

      // Post-transaction broadcast happens below after commit.
      finalized++;
    }
  });

  tx();

  for (const { id } of expired) {
    const row = getDatabase().prepare('SELECT status FROM auctions WHERE id = ?').get(id) as
      | { status: string }
      | undefined;
    if (row) broadcastEvent('auction.status_changed', { auctionId: id, status: row.status });
  }

  if (finalized > 0) console.log(`⏰ Sweeper finalized ${finalized} expired auction(s)`);
  return finalized;
}

let timer: ReturnType<typeof setInterval> | null = null;

export function startAuctionSweeper(): void {
  if (timer) return;
  // Run once shortly after boot so a long-dormant DB self-heals fast
  setTimeout(() => finalizeExpiredAuctions(), 3_000);
  timer = setInterval(finalizeExpiredAuctions, SWEEP_INTERVAL_MS);
  // Let the process exit in tests without explicit clear
  if (timer && typeof (timer as any).unref === 'function') (timer as any).unref();
  console.log(`⏰ Auction sweeper armed (every ${SWEEP_INTERVAL_MS / 1000}s)`);
}

export function stopAuctionSweeper(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
