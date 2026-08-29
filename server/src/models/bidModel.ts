import { getDatabase } from '../config/database.js';
import { formatAuction, getAuctionById, AuctionRow } from './auctionModel.js';
import { toIsoUtc } from '../utils/dates.js';

export interface BidRow {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount_minor: number;
  currency: string;
  status: string;
  is_winning: number;
  sequence_num: number;
  ip_address: string | null;
  placed_at: string;
  bidder_name?: string;
  bidder_avatar?: string;
  auction_title?: string;
  auction_images?: string;
}

export function formatBid(row: BidRow) {
  let images: string[] = [];
  try {
    images = JSON.parse(row.auction_images || '[]');
  } catch {
    images = [];
  }

  return {
    id: row.id,
    auctionId: row.auction_id,
    auctionTitle: row.auction_title || '',
    auctionImage: images[0] || '',
    bidderId: row.bidder_id,
    bidderName: row.bidder_name || 'Катышуучу',
    amount: {
      amount: (row.amount_minor / 100).toFixed(2),
      minorUnits: row.amount_minor,
      currency: row.currency || 'KGS',
      formatted: `${(row.amount_minor / 100).toLocaleString('ru-RU')} ${row.currency === 'KGS' ? 'сом' : row.currency}`,
    },
    status: row.status,
    isWinning: Boolean(row.is_winning),
    sequence: row.sequence_num,
    placedAt: toIsoUtc(row.placed_at),
  };
}

export function placeBidAtomic(
  auctionId: string,
  bidderId: string,
  amountMinor: number,
  ipAddress?: string
) {
  const db = getDatabase();

  const transaction = db.transaction(() => {
    // 1. Fetch auction for validation
    const auction = db.prepare('SELECT * FROM auctions WHERE id = ?').get(auctionId) as AuctionRow | undefined;
    if (!auction) {
      throw new Error('Аукцион табылган жок (Auction not found)');
    }

    if (auction.status !== 'active') {
      throw new Error('Аукцион активдүү эмес же аяктаган (Auction is not active)');
    }

    const now = Date.now();
    const endsAtTime = new Date(auction.ends_at).getTime();
    if (endsAtTime <= now) {
      // Mark as ended if expired
      db.prepare("UPDATE auctions SET status = 'ended_unsold', updated_at = datetime('now') WHERE id = ?").run(auctionId);
      throw new Error('Аукциондун убактысы бүттү (Auction has already ended)');
    }

    if (auction.seller_id === bidderId) {
      throw new Error('Сатуучу өзүнүн лотуна коюм коё албайт (Seller cannot bid on their own auction)');
    }

    // 2. Validate amount
    const minRequiredMinor = auction.bid_count === 0
      ? auction.starting_price_minor
      : auction.current_price_minor + auction.bid_increment_minor;

    if (amountMinor < minRequiredMinor) {
      throw new Error(
        `Коюм өтө аз. Минималдуу коюм: ${(minRequiredMinor / 100).toLocaleString('ru-RU')} сом (Minimum bid required: ${(minRequiredMinor / 100).toLocaleString('ru-RU')} KGS)`
      );
    }

    // 3. Find previous winning bid to notify
    const prevWinningBid = db.prepare(`
      SELECT * FROM bids WHERE auction_id = ? AND is_winning = 1 LIMIT 1
    `).get(auctionId) as BidRow | undefined;

    // 4. Update previous bids to outbid
    db.prepare(`
      UPDATE bids SET is_winning = 0, status = 'outbid' WHERE auction_id = ? AND is_winning = 1
    `).run(auctionId);

    // 5. Insert new bid
    const bidId = `bid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newSequence = (auction.bid_count || 0) + 1;

    db.prepare(`
      INSERT INTO bids (id, auction_id, bidder_id, amount_minor, currency, status, is_winning, sequence_num, ip_address, placed_at)
      VALUES (?, ?, ?, ?, ?, 'winning', 1, ?, ?, datetime('now'))
    `).run(
      bidId,
      auctionId,
      bidderId,
      amountMinor,
      auction.currency || 'KGS',
      newSequence,
      ipAddress || '127.0.0.1'
    );

    // 6. Anti-Sniping Protection (soft-close): If less than 3 minutes remain, extend by 3 minutes
    let newEndsAt = auction.ends_at;
    let timeExtended = false;
    const remainingMs = endsAtTime - now;
    const ANTI_SNIPING_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes
    const EXTENSION_MS = 3 * 60 * 1000;

    if (remainingMs < ANTI_SNIPING_THRESHOLD_MS) {
      newEndsAt = new Date(now + EXTENSION_MS).toISOString();
      timeExtended = true;
    }

    // 7. Update auction current price and bid count
    db.prepare(`
      UPDATE auctions 
      SET current_price_minor = ?, bid_count = bid_count + 1, ends_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(amountMinor, newEndsAt, auctionId);

    // 8. Create notification for previous bidder if different
    if (prevWinningBid && prevWinningBid.bidder_id !== bidderId) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
        VALUES (?, ?, ?, ?, 'outbid', 0, datetime('now'))
      `).run(
        `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        prevWinningBid.bidder_id,
        'Сиздин коюмуңуз ашып түштү!',
        `"${auction.title}" лотунда жаңы коюм коюлду: ${(amountMinor / 100).toLocaleString('ru-RU')} сом.`
      );
    }

    // Return fresh state
    const insertedBid = db.prepare(`
      SELECT b.*, u.full_name as bidder_name, u.avatar as bidder_avatar
      FROM bids b
      LEFT JOIN users u ON b.bidder_id = u.id
      WHERE b.id = ?
    `).get(bidId) as BidRow;

    const updatedAuction = getAuctionById(auctionId);

    return {
      bid: formatBid(insertedBid),
      auction: updatedAuction,
      previousBidderId: prevWinningBid?.bidder_id,
      timeExtended,
    };
  });

  return transaction();
}

export function getBidsByAuctionId(auctionId: string) {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT b.*, u.full_name as bidder_name, u.avatar as bidder_avatar
    FROM bids b
    LEFT JOIN users u ON b.bidder_id = u.id
    WHERE b.auction_id = ?
    ORDER BY b.placed_at DESC
  `).all(auctionId) as BidRow[];

  return rows.map(formatBid);
}

export function getRecentActivity(limit = 12) {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT b.*, a.title as auction_title, a.images_json as auction_images, u.full_name as bidder_name
    FROM bids b
    LEFT JOIN auctions a ON b.auction_id = a.id
    LEFT JOIN users u ON b.bidder_id = u.id
    ORDER BY b.placed_at DESC
    LIMIT ?
  `).all(limit) as BidRow[];

  return rows.map(formatBid);
}

export function getUserBids(userId: string) {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT b.*, a.title as auction_title, a.images_json as auction_images, u.full_name as bidder_name
    FROM bids b
    LEFT JOIN auctions a ON b.auction_id = a.id
    LEFT JOIN users u ON b.bidder_id = u.id
    WHERE b.bidder_id = ?
    ORDER BY b.placed_at DESC
  `).all(userId) as BidRow[];

  return rows.map(formatBid);
}
