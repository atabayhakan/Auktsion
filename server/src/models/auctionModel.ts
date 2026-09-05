import { getDatabase } from '../config/database.js';
import { toIsoUtc } from '../utils/dates.js';

export interface AuctionRow {
  id: string;
  title: string;
  description: string;
  category: string;
  sub_category: string | null;
  images_json: string;
  starting_price_minor: number;
  current_price_minor: number;
  reserve_price_minor: number | null;
  buy_now_price_minor: number | null;
  bid_increment_minor: number;
  currency: string;
  bid_count: number;
  status: string;
  seller_id: string;
  city: string;
  region_id: string;
  district: string | null;
  views_count: number;
  is_blitz: number;
  is_featured: number;
  start_at: string;
  ends_at: string;
  winner_id: string | null;
  final_price_minor: number | null;
  attributes_json: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  seller_name?: string;
  seller_avatar?: string;
  seller_city?: string;
  seller_kyc_status?: string;
}

function formatMoney(minorUnits: number, currency: string = 'KGS') {
  const amount = (minorUnits / 100).toFixed(2);
  const formatted = `${(minorUnits / 100).toLocaleString('ru-RU')} ${currency === 'KGS' ? 'сом' : currency}`;
  return { amount, minorUnits, currency, formatted };
}

export function formatAuction(row: AuctionRow) {
  let images: string[] = [];
  try {
    images = JSON.parse(row.images_json || '[]');
  } catch {
    images = [];
  }

  let attributes: any = {};
  try {
    attributes = JSON.parse(row.attributes_json || '{}');
  } catch {
    attributes = {};
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    subCategory: row.sub_category || undefined,
    images,
    startingPrice: formatMoney(row.starting_price_minor, row.currency),
    currentPrice: formatMoney(row.current_price_minor, row.currency),
    reservePrice: row.reserve_price_minor ? formatMoney(row.reserve_price_minor, row.currency) : undefined,
    buyNowPrice: row.buy_now_price_minor ? formatMoney(row.buy_now_price_minor, row.currency) : undefined,
    bidIncrement: formatMoney(row.bid_increment_minor, row.currency),
    bidCount: row.bid_count || 0,
    status: row.status,
    sellerId: row.seller_id,
    seller: {
      id: row.seller_id,
      fullName: row.seller_name || 'Сатуучу',
      avatar: row.seller_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      city: row.seller_city || row.city,
      kycStatus: row.seller_kyc_status,
      rating: 4.9,
      totalSales: 10,
    },
    city: row.city,
    regionId: row.region_id,
    district: row.district || undefined,
    startAt: row.start_at,
    endsAt: row.ends_at,
    createdAt: toIsoUtc(row.created_at),
    updatedAt: toIsoUtc(row.updated_at),
    views: row.views_count,
    isBlitz: Boolean(row.is_blitz),
    isFeatured: Boolean(row.is_featured),
    livestock: row.category === 'livestock' ? attributes : undefined,
    vehicle: row.category === 'vehicles' ? attributes : undefined,
    realEstate: row.category === 'real-estate' ? attributes : undefined,
    attributes,
  };
}

export function getAuctions(filters: {
  search?: string;
  category?: string;
  subCategory?: string;
  city?: string;
  regionId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  isFeatured?: boolean;
  sortBy?: 'newest' | 'ending_soon' | 'price_asc' | 'price_desc' | 'most_bids';
  page?: number;
  perPage?: number;
}) {
  const db = getDatabase();
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.search) {
    conditions.push('(LOWER(a.title) LIKE LOWER(?) OR LOWER(a.description) LIKE LOWER(?))');
    const term = `%${filters.search}%`;
    params.push(term, term);
  }

  if (filters.category && filters.category !== 'all') {
    conditions.push('a.category = ?');
    params.push(filters.category);
  }

  if (filters.subCategory && filters.subCategory !== 'all') {
    conditions.push('a.sub_category = ?');
    params.push(filters.subCategory);
  }

  if (filters.city && filters.city !== 'all') {
    conditions.push('LOWER(a.city) = LOWER(?)');
    params.push(filters.city);
  }

  if (filters.regionId && filters.regionId !== 'all') {
    conditions.push('a.region_id = ?');
    params.push(filters.regionId);
  }

  if (filters.status && filters.status !== 'all') {
    conditions.push('a.status = ?');
    params.push(filters.status);
  } else if (!filters.status && !filters.sellerId) {
    conditions.push("a.status IN ('active', 'ended_sold', 'ended_unsold')");
  }

  if (filters.sellerId) {
    conditions.push('a.seller_id = ?');
    params.push(filters.sellerId);
  }

  if (filters.isFeatured !== undefined) {
    conditions.push('a.is_featured = ?');
    params.push(filters.isFeatured ? 1 : 0);
  }

  if (filters.minPrice !== undefined) {
    conditions.push('a.current_price_minor >= ?');
    params.push(Math.round(filters.minPrice * 100));
  }

  if (filters.maxPrice !== undefined) {
    conditions.push('a.current_price_minor <= ?');
    params.push(Math.round(filters.maxPrice * 100));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count total
  const countRow = db.prepare(`
    SELECT COUNT(*) as total FROM auctions a ${whereClause}
  `).get(...params) as { total: number };

  const total = countRow.total;
  const page = Math.max(1, filters.page || 1);
  const perPage = Math.max(1, Math.min(100, filters.perPage || 20));
  const offset = (page - 1) * perPage;

  let orderBy = 'a.created_at DESC';
  if (filters.sortBy === 'ending_soon') {
    orderBy = 'a.ends_at ASC';
  } else if (filters.sortBy === 'price_asc') {
    orderBy = 'a.current_price_minor ASC';
  } else if (filters.sortBy === 'price_desc') {
    orderBy = 'a.current_price_minor DESC';
  } else if (filters.sortBy === 'most_bids') {
    orderBy = 'a.bid_count DESC';
  }

  const rows = db.prepare(`
    SELECT a.*, u.full_name as seller_name, u.avatar as seller_avatar, u.city as seller_city, u.kyc_status as seller_kyc_status
    FROM auctions a
    LEFT JOIN users u ON a.seller_id = u.id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, perPage, offset) as AuctionRow[];

  return {
    data: rows.map(formatAuction),
    meta: {
      currentPage: page,
      lastPage: Math.ceil(total / perPage) || 1,
      perPage,
      total,
    },
  };
}

export function getAuctionById(id: string): any | undefined {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT a.*, u.full_name as seller_name, u.avatar as seller_avatar, u.city as seller_city, u.kyc_status as seller_kyc_status
    FROM auctions a
    LEFT JOIN users u ON a.seller_id = u.id
    WHERE a.id = ?
  `).get(id) as AuctionRow | undefined;

  if (!row) return undefined;

  // Increment views count asynchronously
  db.prepare('UPDATE auctions SET views_count = views_count + 1 WHERE id = ?').run(id);

  return formatAuction(row);
}

export function createAuction(data: {
  id: string;
  title: string;
  description: string;
  category: string;
  subCategory?: string;
  images: string[];
  startingPriceMinor: number;
  reservePriceMinor?: number;
  buyNowPriceMinor?: number;
  bidIncrementMinor: number;
  sellerId: string;
  city: string;
  regionId: string;
  district?: string;
  isBlitz?: boolean;
  isFeatured?: boolean;
  durationHours?: number;
  attributes?: any;
}) {
  const db = getDatabase();
  const startAt = new Date().toISOString();
  const durationHours = data.durationHours || 48;
  const endsAt = new Date(Date.now() + durationHours * 3600000).toISOString();

  const stmt = db.prepare(`
    INSERT INTO auctions (
      id, title, description, category, sub_category, images_json,
      starting_price_minor, current_price_minor, reserve_price_minor, buy_now_price_minor, bid_increment_minor,
      currency, bid_count, status, seller_id, city, region_id, district,
      views_count, is_blitz, is_featured, start_at, ends_at, attributes_json, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'KGS', 0, 'active', ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  stmt.run(
    data.id,
    data.title,
    data.description,
    data.category,
    data.subCategory || null,
    JSON.stringify(data.images || []),
    data.startingPriceMinor,
    data.startingPriceMinor, // current price starts at starting price
    data.reservePriceMinor || null,
    data.buyNowPriceMinor || null,
    data.bidIncrementMinor,
    data.sellerId,
    data.city,
    data.regionId,
    data.district || null,
    data.isBlitz ? 1 : 0,
    data.isFeatured ? 1 : 0,
    startAt,
    endsAt,
    JSON.stringify(data.attributes || {})
  );

  return getAuctionById(data.id);
}

export function updateAuction(id: string, sellerId: string, updates: Partial<{
  title: string;
  description: string;
  category: string;
  subCategory: string;
  images: string[];
  attributes: any;
}>) {
  const db = getDatabase();
  const auction = db.prepare('SELECT * FROM auctions WHERE id = ?').get(id) as AuctionRow | undefined;
  if (!auction) throw new Error('Аукцион табылган жок (Auction not found)');
  if (auction.seller_id !== sellerId) throw new Error('Өзгөртүүгө уруксат жок (Not authorized)');

  const fields: string[] = [];
  const params: any[] = [];

  if (updates.title !== undefined) { fields.push('title = ?'); params.push(updates.title); }
  if (updates.description !== undefined) { fields.push('description = ?'); params.push(updates.description); }
  if (updates.category !== undefined) { fields.push('category = ?'); params.push(updates.category); }
  if (updates.subCategory !== undefined) { fields.push('sub_category = ?'); params.push(updates.subCategory); }
  if (updates.images !== undefined) { fields.push('images_json = ?'); params.push(JSON.stringify(updates.images)); }
  if (updates.attributes !== undefined) { fields.push('attributes_json = ?'); params.push(JSON.stringify(updates.attributes)); }

  if (fields.length === 0) return getAuctionById(id);

  fields.push("updated_at = datetime('now')");
  params.push(id);

  db.prepare(`UPDATE auctions SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return getAuctionById(id);
}

export function deleteAuction(id: string, sellerId: string) {
  const db = getDatabase();
  const auction = db.prepare('SELECT * FROM auctions WHERE id = ?').get(id) as AuctionRow | undefined;
  if (!auction) throw new Error('Аукцион табылган жок (Auction not found)');
  if (auction.seller_id !== sellerId) throw new Error('Өчүрүүгө уруксат жок (Not authorized)');

  if (auction.bid_count > 0) {
    // If bids exist, mark cancelled instead of hard delete
    db.prepare("UPDATE auctions SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(id);
  } else {
    db.prepare('DELETE FROM auctions WHERE id = ?').run(id);
  }

  return { success: true };
}

export function buyNowAuction(auctionId: string, buyerId: string) {
  const db = getDatabase();

  const tx = db.transaction(() => {
    const auction = db.prepare('SELECT * FROM auctions WHERE id = ?').get(auctionId) as AuctionRow | undefined;
    if (!auction) throw new Error('Аукцион табылган жок (Auction not found)');
    if (auction.status !== 'active') throw new Error('Аукцион активдүү эмес (Auction is not active)');
    if (auction.seller_id === buyerId) throw new Error('Өз лотуңузду сатып ала албайсыз (Cannot buy your own lot)');
    if (!auction.buy_now_price_minor) throw new Error('Дароо сатып алуу жеткиликсиз (Buy Now is not available for this lot)');
    if (auction.winner_id) throw new Error('Лот буга чейин сатылган (Already sold)');
    const now = Date.now();
    if (new Date(auction.ends_at).getTime() <= now) throw new Error('Аукциондун убактысы бүттү (Auction has already ended)');

    // Demote any existing winning bid(s)
    db.prepare("UPDATE bids SET is_winning = 0, status = 'outbid' WHERE auction_id = ? AND is_winning = 1").run(
      auctionId
    );

    const price = auction.buy_now_price_minor;
    // Mark auction sold via buy-now
    db.prepare(
      `UPDATE auctions SET status = 'ended_sold', winner_id = ?, final_price_minor = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(buyerId, price, auctionId);

    // Escrow hold record (payment pending until delivery confirmed)
    const paymentId = `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    db.prepare(
      `INSERT INTO payments (id, user_id, auction_id, amount_minor, currency, gateway, status, metadata_json, created_at)
       VALUES (?, ?, ?, ?, 'KGS', 'mbank', 'pending', ?, datetime('now'))`
    ).run(paymentId, buyerId, auctionId, price, JSON.stringify({ type: 'escrow_hold', method: 'buy_now' }));

    // Notifications
    db.prepare(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
       VALUES (?, ?, ?, ?, 'won', 0, datetime('now'))`
    ).run(
      `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      buyerId,
      'Сиз лотту сатып алдыңыз! (You bought the lot)',
      `"${auction.title}" — ${price / 100} сом. Эскроу эсебинде сакталды.`
    );
    db.prepare(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
       VALUES (?, ?, ?, ?, 'sold', 0, datetime('now'))`
    ).run(
      `notif-${Date.now()}-${Math.floor(Math.random() * 1000) + 1}`,
      auction.seller_id,
      'Лотуңуз сатылды (Your lot was sold)',
      `"${auction.title}" — дароо сатып алуу: ${price / 100} сом. Эскроу эсебинде сакталды.`
    );

    return { paymentId, price, auction: getAuctionById(auctionId) };
  });

  return tx();
}
