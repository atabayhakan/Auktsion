import bcrypt from 'bcryptjs';
import { getDatabase } from '../config/database.js';
import { formatUser, UserRow } from './userModel.js';
import { formatAuction, AuctionRow } from './auctionModel.js';
import { formatBid, BidRow } from './bidModel.js';
import { toIsoUtc } from '../utils/dates.js';

export function getAdminOverview() {
  const db = getDatabase();

  // 1. GMV and 8% commission calculation from active/sold auctions
  const gmvRow = db.prepare(`
    SELECT 
      COALESCE(SUM(current_price_minor), 0) as total_gmv_minor,
      COUNT(*) as total_auctions
    FROM auctions 
    WHERE status IN ('active', 'ended_sold')
  `).get() as { total_gmv_minor: number; total_auctions: number };

  const totalGmvMinor = gmvRow.total_gmv_minor;
  const commissionRevenueMinor = Math.round(totalGmvMinor * 0.08); // 8% standard commission

  // 2. User metrics
  const userCounts = db.prepare(`
    SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN role = 'seller' THEN 1 ELSE 0 END) as total_sellers,
      SUM(CASE WHEN role = 'buyer' THEN 1 ELSE 0 END) as total_buyers,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
      SUM(CASE WHEN status = 'banned' THEN 1 ELSE 0 END) as banned_users
    FROM users
  `).get() as any;

  // 3. Active lots
  const activeLots = db.prepare(`
    SELECT COUNT(*) as count FROM auctions WHERE status = 'active'
  `).get() as { count: number };

  // 4. Pending KYC
  const pendingKyc = db.prepare(`
    SELECT COUNT(*) as count FROM kyc_verifications WHERE status = 'pending'
  `).get() as { count: number };

  // 5. Pending Payouts
  const pendingPayouts = db.prepare(`
    SELECT 
      COUNT(*) as count,
      COALESCE(SUM(amount_minor), 0) as total_amount_minor
    FROM payout_requests WHERE status = 'pending'
  `).get() as { count: number; total_amount_minor: number };

  // 6. Open Disputes
  const openDisputes = db.prepare(`
    SELECT COUNT(*) as count FROM disputes WHERE status IN ('open', 'under_review')
  `).get() as { count: number };

  // 7. Total Bids Placed
  const totalBids = db.prepare(`
    SELECT COUNT(*) as count FROM bids
  `).get() as { count: number };

  return {
    gmv: {
      amount: (totalGmvMinor / 100).toFixed(2),
      minorUnits: totalGmvMinor,
      currency: 'KGS',
      formatted: `${(totalGmvMinor / 100).toLocaleString('ru-RU')} сом`,
    },
    commissionRevenue: {
      amount: (commissionRevenueMinor / 100).toFixed(2),
      minorUnits: commissionRevenueMinor,
      currency: 'KGS',
      formatted: `${(commissionRevenueMinor / 100).toLocaleString('ru-RU')} сом`,
    },
    users: {
      total: userCounts.total_users || 0,
      sellers: userCounts.total_sellers || 0,
      buyers: userCounts.total_buyers || 0,
      active: userCounts.active_users || 0,
      banned: userCounts.banned_users || 0,
    },
    auctions: {
      total: gmvRow.total_auctions || 0,
      active: activeLots.count || 0,
    },
    bids: {
      total: totalBids.count || 0,
    },
    pendingKycCount: pendingKyc.count || 0,
    pendingPayouts: {
      count: pendingPayouts.count || 0,
      amount: (pendingPayouts.total_amount_minor / 100).toFixed(2),
      formatted: `${(pendingPayouts.total_amount_minor / 100).toLocaleString('ru-RU')} сом`,
    },
    openDisputesCount: openDisputes.count || 0,
  };
}

export interface MediaItem {
  id: string;
  url: string;
  source: 'auction' | 'avatar';
  title: string;
  ownerId: string;
  ownerLabel: string;
  createdAt: string;
}

// Aggregates every image URL the platform currently has on file — listing
// photos and user avatars — into one browsable feed for the admin Media
// Library. There is no dedicated media/uploads table (uploaded files aren't
// tracked anywhere beyond the entity column they're attached to), so this
// reads directly from auctions.images_json and users.avatar rather than a
// single source of truth.
export function getMediaLibrary(filters: { source?: 'auction' | 'avatar' } = {}): MediaItem[] {
  const db = getDatabase();
  const items: MediaItem[] = [];

  if (!filters.source || filters.source === 'auction') {
    const rows = db.prepare(`
      SELECT a.id, a.title, a.images_json, a.seller_id, a.created_at, u.full_name AS seller_name
      FROM auctions a
      JOIN users u ON u.id = a.seller_id
      ORDER BY a.created_at DESC
    `).all() as Array<{ id: string; title: string; images_json: string; seller_id: string; created_at: string; seller_name: string }>;

    for (const row of rows) {
      let images: string[] = [];
      try {
        images = JSON.parse(row.images_json || '[]');
      } catch {
        images = [];
      }
      images.forEach((url, index) => {
        items.push({
          id: `auction-${row.id}-${index}`,
          url,
          source: 'auction',
          title: row.title,
          ownerId: row.seller_id,
          ownerLabel: row.seller_name,
          createdAt: toIsoUtc(row.created_at),
        });
      });
    }
  }

  if (!filters.source || filters.source === 'avatar') {
    const rows = db.prepare(`
      SELECT id, full_name, avatar, created_at
      FROM users
      WHERE avatar IS NOT NULL AND avatar != ''
      ORDER BY created_at DESC
    `).all() as Array<{ id: string; full_name: string; avatar: string; created_at: string }>;

    for (const row of rows) {
      items.push({
        id: `avatar-${row.id}`,
        url: row.avatar,
        source: 'avatar',
        title: row.full_name,
        ownerId: row.id,
        ownerLabel: row.full_name,
        createdAt: toIsoUtc(row.created_at),
      });
    }
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items;
}

export function getAdminUsers(filters: {
  search?: string;
  role?: string;
  status?: string;
  kycStatus?: string;
  page?: number;
  perPage?: number;
}) {
  const db = getDatabase();
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.search) {
    conditions.push('(LOWER(full_name) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?) OR phone LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  if (filters.role && filters.role !== 'all') {
    conditions.push('role = ?');
    params.push(filters.role);
  }

  if (filters.status && filters.status !== 'all') {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  if (filters.kycStatus && filters.kycStatus !== 'all') {
    conditions.push('kyc_status = ?');
    params.push(filters.kycStatus);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const total = (db.prepare(`SELECT COUNT(*) as count FROM users ${where}`).get(...params) as { count: number }).count;

  const page = Math.max(1, filters.page || 1);
  const perPage = Math.max(1, Math.min(100, filters.perPage || 20));
  const offset = (page - 1) * perPage;

  const rows = db.prepare(`
    SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, perPage, offset) as UserRow[];

  return {
    data: rows.map(formatUser),
    meta: {
      currentPage: page,
      lastPage: Math.ceil(total / perPage) || 1,
      perPage,
      total,
    },
  };
}

export function getAdminUserDetail(id: string) {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  if (!row) return undefined;

  const activeListingsCount = (db.prepare(
    "SELECT COUNT(*) as count FROM auctions WHERE seller_id = ? AND status = 'active'"
  ).get(id) as { count: number }).count;

  const activeBidsCount = (db.prepare(`
    SELECT COUNT(*) as count FROM bids b
    JOIN auctions a ON b.auction_id = a.id
    WHERE b.bidder_id = ? AND a.status = 'active'
  `).get(id) as { count: number }).count;

  const recentBidRows = db.prepare(`
    SELECT b.*, a.title as auction_title, a.images_json as auction_images
    FROM bids b
    LEFT JOIN auctions a ON b.auction_id = a.id
    WHERE b.bidder_id = ?
    ORDER BY b.placed_at DESC
    LIMIT 5
  `).all(id) as BidRow[];

  const recentListingRows = db.prepare(`
    SELECT * FROM auctions WHERE seller_id = ? ORDER BY created_at DESC LIMIT 5
  `).all(id) as AuctionRow[];

  return {
    ...formatUser(row),
    activeListingsCount,
    activeBidsCount,
    recentBids: recentBidRows.map(formatBid),
    recentListings: recentListingRows.map(formatAuction),
  };
}

export function updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned', reason?: string, bannedBy?: string) {
  const db = getDatabase();
  if (status === 'banned' || status === 'suspended') {
    db.prepare("UPDATE users SET status = ?, ban_reason = ?, banned_by = ?, banned_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(status, reason || null, bannedBy || null, userId);
  } else {
    db.prepare("UPDATE users SET status = ?, ban_reason = NULL, banned_by = NULL, banned_at = NULL, updated_at = datetime('now') WHERE id = ?").run(status, userId);
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow;
  return formatUser(user);
}

export function resetUserPassword(userId: string): { temporaryPassword: string } {
  const db = getDatabase();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) throw new Error('User not found');
  // Generate secure temp password: 12 chars alphanumeric + symbols
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let temp = '';
  for (let i = 0; i < 12; i++) temp += chars[Math.floor(Math.random() * chars.length)];
  const hash = bcrypt.hashSync(temp, 10);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, userId);
  return { temporaryPassword: temp };
}

export function updateUserRole(userId: string, role: 'buyer' | 'seller' | 'admin' | 'moderator') {
  const db = getDatabase();
  db.prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?").run(role, userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow;
  return formatUser(user);
}

export function updateListingStatus(id: string, status: string) {
  const db = getDatabase();
  db.prepare("UPDATE auctions SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  const auction = db.prepare(`
    SELECT a.*, u.full_name as seller_name, u.avatar as seller_avatar, u.city as seller_city, u.kyc_status as seller_kyc_status
    FROM auctions a
    LEFT JOIN users u ON a.seller_id = u.id
    WHERE a.id = ?
  `).get(id) as AuctionRow;
  return formatAuction(auction);
}

export function updateListingFeatured(id: string, isFeatured: boolean) {
  const db = getDatabase();
  db.prepare("UPDATE auctions SET is_featured = ?, updated_at = datetime('now') WHERE id = ?").run(isFeatured ? 1 : 0, id);
  const auction = db.prepare(`
    SELECT a.*, u.full_name as seller_name, u.avatar as seller_avatar, u.city as seller_city, u.kyc_status as seller_kyc_status
    FROM auctions a
    LEFT JOIN users u ON a.seller_id = u.id
    WHERE a.id = ?
  `).get(id) as AuctionRow;
  return formatAuction(auction);
}

export function getLiveMonitoringData() {
  const db = getDatabase();
  const activeAuctions = db.prepare(`
    SELECT a.*, u.full_name as seller_name, u.avatar as seller_avatar, u.city as seller_city, u.kyc_status as seller_kyc_status
    FROM auctions a
    LEFT JOIN users u ON a.seller_id = u.id
    WHERE a.status = 'active'
    ORDER BY a.bid_count DESC, a.ends_at ASC
    LIMIT 20
  `).all() as AuctionRow[];

  const recentBids = db.prepare(`
    SELECT b.*, a.title as auction_title, u.full_name as bidder_name, u.avatar as bidder_avatar
    FROM bids b
    LEFT JOIN auctions a ON b.auction_id = a.id
    LEFT JOIN users u ON b.bidder_id = u.id
    ORDER BY b.placed_at DESC
    LIMIT 30
  `).all() as BidRow[];

  return {
    activeAuctions: activeAuctions.map(formatAuction),
    recentBids: recentBids.map(formatBid),
  };
}

const CATEGORY_INFO: Record<string, { nameKg: string; color: string }> = {
  electronics: { nameKg: 'Электроника и Гаджеты', color: '#3B82F6' },
  vehicles: { nameKg: 'Автомобили и Транспорт', color: '#8B5CF6' },
  jewelry: { nameKg: 'Ювелирные изделия и Часы', color: '#EC4899' },
  art: { nameKg: 'Искусство, Антиквариат и Традиции', color: '#F59E0B' },
  'real-estate': { nameKg: 'Недвижимость и Торговые точки (Дордой)', color: '#10B981' },
  machinery: { nameKg: 'Спецтехника и Сельхозтехника', color: '#6B7280' },
  livestock: { nameKg: 'Скотный рынок и Сельское хозяйство', color: '#84CC16' },
};

const REGION_INFO: Record<string, string> = {
  bishkek: 'г. Бишкек',
  chuy: 'Чуйская область',
  osh: 'Ошская область и г. Ош',
  jalal_abad: 'Джалал-Абадская область',
  issyk_kul: 'Иссык-Кульская область',
  naryn: 'Нарынская область',
  talas: 'Таласская область',
  batken: 'Баткенская область',
};

const GATEWAY_INFO: Record<string, { name: string; color: string }> = {
  mbank: { name: 'MBank', color: '#0052CC' },
  optima: { name: 'Оптима Банк', color: '#E60012' },
  demirbank: { name: 'Демир Банк', color: '#00A651' },
  elqr: { name: 'ELQR', color: '#FF6B00' },
  stripe: { name: 'Stripe', color: '#635BFF' },
  o_nom: { name: 'О!Деньги', color: '#FFD700' },
};

const TIMEFRAME_DAYS: Record<string, number> = {
  today: 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
  year: 365,
};

export function getAnalyticsData(timeframe: string = '30d') {
  const db = getDatabase();
  const days = TIMEFRAME_DAYS[timeframe] || 30;

  // 1. GMV & revenue time series
  const gmvRows = db.prepare(`
    SELECT
      DATE(created_at) as date,
      COALESCE(SUM(current_price_minor), 0) as gmv_minor,
      COALESCE(SUM(bid_count), 0) as bids_count
    FROM auctions
    WHERE status IN ('active', 'ended_sold') AND created_at >= datetime('now', ?)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(`-${days} days`) as { date: string; gmv_minor: number; bids_count: number }[];

  const gmvTimeSeries = gmvRows.map(r => ({
    date: r.date,
    gmv: Math.round(r.gmv_minor / 100),
    revenue: Math.round((r.gmv_minor / 100) * 0.08),
    bidsCount: r.bids_count,
  }));

  // 2. Category breakdown
  const categoryRows = db.prepare(`
    SELECT category, COUNT(*) as lot_count, COALESCE(SUM(current_price_minor), 0) as gmv_minor
    FROM auctions
    GROUP BY category
  `).all() as { category: string; lot_count: number; gmv_minor: number }[];
  const categoryTotal = categoryRows.reduce((sum, r) => sum + r.gmv_minor, 0) || 1;
  const categoryBreakdown = categoryRows.map(r => ({
    category: r.category,
    nameKg: CATEGORY_INFO[r.category]?.nameKg || r.category,
    gmv: Math.round(r.gmv_minor / 100),
    lotCount: r.lot_count,
    percentage: Math.round((r.gmv_minor / categoryTotal) * 1000) / 10,
    color: CATEGORY_INFO[r.category]?.color || '#94A3B8',
  }));

  // 3. KYC conversion funnel
  const kycCounts = db.prepare(`SELECT kyc_status, COUNT(*) as count FROM users GROUP BY kyc_status`).all() as { kyc_status: string; count: number }[];
  const totalUsers = kycCounts.reduce((sum, r) => sum + r.count, 0);
  const countAtLeast = (stages: string[]) => kycCounts.filter(r => stages.includes(r.kyc_status)).reduce((sum, r) => sum + r.count, 0);
  const activatedBidders = (db.prepare(`SELECT COUNT(DISTINCT bidder_id) as count FROM bids`).get() as { count: number }).count;

  const funnelStages = [
    { stage: 'registered', labelKg: 'Регистрация', usersCount: totalUsers },
    { stage: 'phone_verified', labelKg: 'Телефон подтверждён', usersCount: countAtLeast(['phone_verified', 'id_uploaded', 'ocr_passed', 'verified']) },
    { stage: 'id_uploaded', labelKg: 'Документ загружен', usersCount: countAtLeast(['id_uploaded', 'ocr_passed', 'verified']) },
    { stage: 'verified', labelKg: 'KYC верифицирован', usersCount: countAtLeast(['verified']) },
    { stage: 'active_bidder', labelKg: 'Сделал ставку', usersCount: activatedBidders },
  ];
  const kycConversionFunnel = funnelStages.map(s => ({
    ...s,
    conversionRate: totalUsers > 0 ? Math.round((s.usersCount / totalUsers) * 1000) / 10 : 0,
  }));

  // 4. Payment gateway market share
  const gatewayRows = db.prepare(`
    SELECT gateway, COUNT(*) as tx_count, COALESCE(SUM(amount_minor), 0) as volume_minor
    FROM payments WHERE status = 'success'
    GROUP BY gateway
  `).all() as { gateway: string; tx_count: number; volume_minor: number }[];
  const gatewayTotal = gatewayRows.reduce((sum, r) => sum + r.volume_minor, 0) || 1;
  const gatewayMarketShare = gatewayRows.map(r => ({
    gateway: r.gateway,
    name: GATEWAY_INFO[r.gateway]?.name || r.gateway,
    volumeKgs: Math.round(r.volume_minor / 100),
    sharePct: Math.round((r.volume_minor / gatewayTotal) * 1000) / 10,
    txCount: r.tx_count,
    color: GATEWAY_INFO[r.gateway]?.color || '#94A3B8',
  }));

  // 5. Regional metrics — active-user counts are distinct sellers + distinct
  // bidders transacting in that region's auctions (users have no region_id
  // of their own, only a free-text city, so this proxies activity rather
  // than home address).
  const regionAuctionRows = db.prepare(`
    SELECT region_id, COUNT(*) as lot_count, COALESCE(SUM(current_price_minor), 0) as gmv_minor, COUNT(DISTINCT seller_id) as seller_count
    FROM auctions
    GROUP BY region_id
  `).all() as { region_id: string; lot_count: number; gmv_minor: number; seller_count: number }[];
  const regionBidderRows = db.prepare(`
    SELECT a.region_id, COUNT(DISTINCT b.bidder_id) as bidder_count
    FROM bids b
    JOIN auctions a ON b.auction_id = a.id
    GROUP BY a.region_id
  `).all() as { region_id: string; bidder_count: number }[];
  const regionGmvTotal = regionAuctionRows.reduce((sum, r) => sum + r.gmv_minor, 0) || 1;
  const regionalMetrics = regionAuctionRows.map(r => ({
    region: r.region_id,
    nameKg: REGION_INFO[r.region_id] || r.region_id,
    gmv: Math.round(r.gmv_minor / 100),
    activeLots: r.lot_count,
    userCount: r.seller_count + (regionBidderRows.find(b => b.region_id === r.region_id)?.bidder_count || 0),
    sharePct: Math.round((r.gmv_minor / regionGmvTotal) * 1000) / 10,
  }));

  // 6. Hourly bidding distribution (Bishkek local hour; fills all 24 hours)
  const hourlyRows = db.prepare(`
    SELECT CAST(strftime('%H', placed_at) AS INTEGER) as hour, COUNT(*) as bids_count, COALESCE(SUM(amount_minor), 0) as volume_minor
    FROM bids
    GROUP BY hour
  `).all() as { hour: number; bids_count: number; volume_minor: number }[];
  const hourlyMap = new Map(hourlyRows.map(r => [r.hour, r]));
  const hourlyBiddingDistribution = Array.from({ length: 24 }, (_, hour) => {
    const r = hourlyMap.get(hour);
    return {
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      bidsCount: r?.bids_count || 0,
      volume: Math.round((r?.volume_minor || 0) / 100),
    };
  });

  return {
    timeframe,
    gmvTimeSeries,
    categoryBreakdown,
    kycConversionFunnel,
    gatewayMarketShare,
    regionalMetrics,
    hourlyBiddingDistribution,
  };
}
