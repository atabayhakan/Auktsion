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

// ============================================================================
// Module 9: Platform Settings
// ============================================================================

export interface PlatformSettings {
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  commissionRatePct: number;
  antiSnipingMinutes: number;
  antiSnipingTriggerMinutes: number;
  minDepositKgs: number;
  currency: string;
  supportPhone: string;
  supportEmail: string;
  whatsappNumber: string;
  address: string;
  maintenanceMode: boolean;
  autoApproveAuctions: boolean;
  kycRequiredToBid: boolean;
  twoFactorRequired: boolean;
  updatedAt: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  siteName: 'iTorgo',
  siteTitle: 'iTorgo — Кыргызстандын №1 Онлайн Аукцион Платформасы',
  siteDescription: 'Кыргызстандагы реалдуу убакыттагы биринчи ачык аукцион жана соода платформасы.',
  commissionRatePct: 8.0,
  antiSnipingMinutes: 2,
  antiSnipingTriggerMinutes: 2,
  minDepositKgs: 500,
  currency: 'KGS',
  supportPhone: '+996 555 999888',
  supportEmail: 'support@itorgo.kg',
  whatsappNumber: '+996 555 999888',
  address: 'Бишкек ш., Чүй проспекти 114, 3-кабат',
  maintenanceMode: false,
  autoApproveAuctions: false,
  kycRequiredToBid: true,
  twoFactorRequired: false,
  updatedAt: new Date().toISOString(),
};

export function getPlatformSettings(): PlatformSettings {
  const db = getDatabase();
  try {
    const row = db.prepare("SELECT value, updated_at FROM platform_settings WHERE key = 'site_config'").get() as { value: string; updated_at: string } | undefined;
    if (row) {
      const parsed = JSON.parse(row.value);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        updatedAt: row.updated_at || new Date().toISOString(),
      };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function updatePlatformSettings(newSettings: Partial<PlatformSettings>): PlatformSettings {
  const db = getDatabase();
  const current = getPlatformSettings();
  const merged: PlatformSettings = {
    ...current,
    ...newSettings,
    updatedAt: new Date().toISOString(),
  };

  db.prepare(`
    INSERT INTO platform_settings (key, value, updated_at)
    VALUES ('site_config', ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(JSON.stringify(merged));

  return getPlatformSettings();
}

// ============================================================================
// Module 10: iOS / Finder Style Advanced Media Explorer
// ============================================================================

export interface MediaFolderItem {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  icon: string;
  itemCount: number;
  createdAt: string;
}

export interface MediaExplorerFile {
  id: string;
  name: string;
  url: string;
  folderId: string;
  sizeBytes: number;
  mimeType: string;
  dimensions: string;
  source: 'auction' | 'avatar' | 'kyc' | 'asset' | 'upload';
  entityId?: string;
  entityTitle?: string;
  ownerName?: string;
  createdAt: string;
}

export interface MediaExplorerBreadcrumb {
  id: string;
  name: string;
}

export function getMediaExplorer(folderId: string = 'root') {
  const db = getDatabase();

  // 1. Root Built-in System Folders
  const rootSystemFolders: MediaFolderItem[] = [
    {
      id: 'auctions',
      name: 'İlan Görselleri (Auctions)',
      parentId: null,
      color: '#3B82F6',
      icon: 'Gavel',
      itemCount: 0,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'avatars',
      name: 'Kullanıcı Avatarları (Avatars)',
      parentId: null,
      color: '#10B981',
      icon: 'User',
      itemCount: 0,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'kyc',
      name: 'KYC & Kimlik Belgeleri',
      parentId: null,
      color: '#F59E0B',
      icon: 'ShieldCheck',
      itemCount: 0,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'assets',
      name: 'Platform Bannerları & Varlıklar',
      parentId: null,
      color: '#8B5CF6',
      icon: 'Sparkles',
      itemCount: 0,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  // 2. Fetch custom subfolders from media_folders table
  let customFolders: Array<{ id: string; name: string; parent_id: string | null; color: string; icon: string; created_at: string }> = [];
  try {
    customFolders = db.prepare('SELECT * FROM media_folders ORDER BY name ASC').all() as any;
  } catch {}

  // 3. Collect all system files from entities
  const allAuctionFiles: MediaExplorerFile[] = [];
  try {
    const auctions = db.prepare(`
      SELECT a.id, a.title, a.images_json, a.created_at, u.full_name as seller_name
      FROM auctions a LEFT JOIN users u ON a.seller_id = u.id
      ORDER BY a.created_at DESC
    `).all() as any[];

    for (const a of auctions) {
      let imgs: string[] = [];
      try { imgs = JSON.parse(a.images_json || '[]'); } catch {}
      imgs.forEach((url, idx) => {
        const filename = url.split('/').pop() || `auction_${a.id}_${idx + 1}.jpg`;
        allAuctionFiles.push({
          id: `auction_${a.id}_${idx}`,
          name: filename,
          url,
          folderId: 'auctions',
          sizeBytes: 1024 * 1024 * 1.5, // ~1.5MB estimated if remote
          mimeType: 'image/jpeg',
          dimensions: '1600x1200',
          source: 'auction',
          entityId: a.id,
          entityTitle: a.title,
          ownerName: a.seller_name || 'Satıcı',
          createdAt: a.created_at || new Date().toISOString(),
        });
      });
    }
  } catch {}

  const allAvatarFiles: MediaExplorerFile[] = [];
  try {
    const users = db.prepare("SELECT id, full_name, avatar, created_at FROM users WHERE avatar IS NOT NULL AND avatar != ''").all() as any[];
    for (const u of users) {
      const filename = u.avatar.split('/').pop() || `avatar_${u.id}.jpg`;
      allAvatarFiles.push({
        id: `avatar_${u.id}`,
        name: filename,
        url: u.avatar,
        folderId: 'avatars',
        sizeBytes: 1024 * 350,
        mimeType: 'image/jpeg',
        dimensions: '400x400',
        source: 'avatar',
        entityId: u.id,
        entityTitle: u.full_name,
        ownerName: u.full_name,
        createdAt: u.created_at || new Date().toISOString(),
      });
    }
  } catch {}

  const allKycFiles: MediaExplorerFile[] = [];
  try {
    const kycDocs = db.prepare(`
      SELECT k.id, k.user_id, k.id_front_url, k.id_back_url, k.selfie_url, k.created_at, u.full_name
      FROM kyc_verifications k LEFT JOIN users u ON k.user_id = u.id
    `).all() as any[];

    for (const k of kycDocs) {
      const docs = [
        { type: 'ID Ön Yüz', url: k.id_front_url },
        { type: 'ID Arka Yüz', url: k.id_back_url },
        { type: 'Selfie', url: k.selfie_url },
      ];
      docs.forEach((doc, idx) => {
        if (doc.url) {
          const filename = doc.url.split('/').pop()?.split('?')[0] || `kyc_${k.id}_${idx}.jpg`;
          allKycFiles.push({
            id: `kyc_${k.id}_${idx}`,
            name: `${doc.type} - ${k.full_name || k.user_id}`,
            url: doc.url,
            folderId: 'kyc',
            sizeBytes: 1024 * 800,
            mimeType: 'image/jpeg',
            dimensions: '1920x1080',
            source: 'kyc',
            entityId: k.id,
            entityTitle: `KYC: ${k.full_name}`,
            ownerName: k.full_name,
            createdAt: k.created_at || new Date().toISOString(),
          });
        }
      });
    }
  } catch {}

  // 4. Custom media_files uploaded to custom folders
  let customFiles: MediaExplorerFile[] = [];
  try {
    const rows = db.prepare('SELECT * FROM media_files ORDER BY created_at DESC').all() as any[];
    customFiles = rows.map(r => ({
      id: r.id,
      name: r.name,
      url: r.url,
      folderId: r.folder_id || 'assets',
      sizeBytes: r.size_bytes || 0,
      mimeType: r.mime_type || 'image/jpeg',
      dimensions: r.dimensions || '1200x800',
      source: (r.source as any) || 'upload',
      createdAt: r.created_at,
    }));
  } catch {}

  // Update counts for root folders
  rootSystemFolders[0].itemCount = allAuctionFiles.length;
  rootSystemFolders[1].itemCount = allAvatarFiles.length;
  rootSystemFolders[2].itemCount = allKycFiles.length;
  rootSystemFolders[3].itemCount = customFiles.filter(f => f.folderId === 'assets').length;

  // Build breadcrumbs
  const breadcrumbs: MediaExplorerBreadcrumb[] = [{ id: 'root', name: 'Medya Kütüphanesi' }];
  let currentFolderObj: MediaFolderItem | null = null;

  if (folderId !== 'root') {
    const sysFolder = rootSystemFolders.find(f => f.id === folderId);
    if (sysFolder) {
      currentFolderObj = sysFolder;
      breadcrumbs.push({ id: sysFolder.id, name: sysFolder.name });
    } else {
      // Traverse up hierarchy
      let currId: string | null = folderId;
      const pathArr: MediaExplorerBreadcrumb[] = [];
      while (currId && currId !== 'root') {
        const found = customFolders.find(f => f.id === currId);
        if (found) {
          pathArr.unshift({ id: found.id, name: found.name });
          if (found.id === folderId) {
            currentFolderObj = {
              id: found.id,
              name: found.name,
              parentId: found.parent_id,
              color: found.color || '#3B82F6',
              icon: found.icon || 'Folder',
              itemCount: 0,
              createdAt: found.created_at,
            };
          }
          currId = found.parent_id;
        } else {
          break;
        }
      }
      breadcrumbs.push(...pathArr);
    }
  }

  // Filter items in active folder
  let subfolders: MediaFolderItem[] = [];
  let files: MediaExplorerFile[] = [];

  if (folderId === 'root') {
    subfolders = [
      ...rootSystemFolders,
      ...customFolders
        .filter(f => !f.parent_id || f.parent_id === 'root')
        .map(f => ({
          id: f.id,
          name: f.name,
          parentId: null,
          color: f.color || '#3B82F6',
          icon: f.icon || 'Folder',
          itemCount: customFiles.filter(file => file.folderId === f.id).length,
          createdAt: f.created_at,
        })),
    ];
    files = customFiles.filter(f => f.folderId === 'root');
  } else if (folderId === 'auctions') {
    subfolders = customFolders
      .filter(f => f.parent_id === 'auctions')
      .map(f => ({
        id: f.id,
        name: f.name,
        parentId: 'auctions',
        color: f.color || '#3B82F6',
        icon: f.icon || 'Folder',
        itemCount: customFiles.filter(file => file.folderId === f.id).length,
        createdAt: f.created_at,
      }));
    files = [
      ...allAuctionFiles,
      ...customFiles.filter(f => f.folderId === 'auctions'),
    ];
  } else if (folderId === 'avatars') {
    subfolders = customFolders
      .filter(f => f.parent_id === 'avatars')
      .map(f => ({
        id: f.id,
        name: f.name,
        parentId: 'avatars',
        color: f.color || '#10B981',
        icon: f.icon || 'Folder',
        itemCount: customFiles.filter(file => file.folderId === f.id).length,
        createdAt: f.created_at,
      }));
    files = [
      ...allAvatarFiles,
      ...customFiles.filter(f => f.folderId === 'avatars'),
    ];
  } else if (folderId === 'kyc') {
    subfolders = customFolders
      .filter(f => f.parent_id === 'kyc')
      .map(f => ({
        id: f.id,
        name: f.name,
        parentId: 'kyc',
        color: f.color || '#F59E0B',
        icon: f.icon || 'Folder',
        itemCount: customFiles.filter(file => file.folderId === f.id).length,
        createdAt: f.created_at,
      }));
    files = [
      ...allKycFiles,
      ...customFiles.filter(f => f.folderId === 'kyc'),
    ];
  } else if (folderId === 'assets') {
    subfolders = customFolders
      .filter(f => f.parent_id === 'assets')
      .map(f => ({
        id: f.id,
        name: f.name,
        parentId: 'assets',
        color: f.color || '#8B5CF6',
        icon: f.icon || 'Folder',
        itemCount: customFiles.filter(file => file.folderId === f.id).length,
        createdAt: f.created_at,
      }));
    files = customFiles.filter(f => f.folderId === 'assets');
  } else {
    // Custom folder
    subfolders = customFolders
      .filter(f => f.parent_id === folderId)
      .map(f => ({
        id: f.id,
        name: f.name,
        parentId: folderId,
        color: f.color || '#3B82F6',
        icon: f.icon || 'Folder',
        itemCount: customFiles.filter(file => file.folderId === f.id).length,
        createdAt: f.created_at,
      }));
    files = customFiles.filter(f => f.folderId === folderId);
  }

  const totalFilesCount = allAuctionFiles.length + allAvatarFiles.length + allKycFiles.length + customFiles.length;
  const totalSizeBytes = [...allAuctionFiles, ...allAvatarFiles, ...allKycFiles, ...customFiles].reduce((acc, cur) => acc + (cur.sizeBytes || 0), 0);

  return {
    currentFolderId: folderId,
    currentFolder: currentFolderObj,
    breadcrumbs,
    subfolders,
    files,
    stats: {
      totalFiles: totalFilesCount,
      totalFolders: rootSystemFolders.length + customFolders.length,
      totalSizeBytes,
      formattedTotalSize: `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`,
    },
  };
}

export function createMediaFolder(name: string, parentId: string | null = null, color: string = '#3B82F6', icon: string = 'Folder') {
  const db = getDatabase();
  const id = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  db.prepare(`
    INSERT INTO media_folders (id, name, parent_id, color, icon, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(id, name.trim(), parentId === 'root' ? null : parentId, color, icon);

  return {
    id,
    name: name.trim(),
    parentId: parentId === 'root' ? null : parentId,
    color,
    icon,
    itemCount: 0,
    createdAt: new Date().toISOString(),
  };
}

export function deleteMediaFolder(folderId: string) {
  const db = getDatabase();
  // Delete all files inside this folder
  db.prepare('DELETE FROM media_files WHERE folder_id = ?').run(folderId);
  // Delete folder
  db.prepare('DELETE FROM media_folders WHERE id = ?').run(folderId);
  return { success: true };
}

export function deleteMediaFile(fileId: string) {
  const db = getDatabase();

  if (fileId.startsWith('auction_')) {
    // Auction image format: auction_{auctionId}_{index}
    const parts = fileId.split('_');
    const auctionId = parts[1];
    const imgIndex = parseInt(parts[2], 10);
    const auction = db.prepare('SELECT id, images_json FROM auctions WHERE id = ?').get(auctionId) as any;
    if (auction) {
      let images: string[] = [];
      try { images = JSON.parse(auction.images_json || '[]'); } catch {}
      if (images.length > imgIndex) {
        images.splice(imgIndex, 1);
        db.prepare("UPDATE auctions SET images_json = ?, updated_at = datetime('now') WHERE id = ?").run(JSON.stringify(images), auctionId);
      }
    }
  } else if (fileId.startsWith('avatar_')) {
    const userId = fileId.replace('avatar_', '');
    db.prepare("UPDATE users SET avatar = NULL, updated_at = datetime('now') WHERE id = ?").run(userId);
  } else if (fileId.startsWith('kyc_')) {
    // kyc_{id}_{index}
    const parts = fileId.split('_');
    const kycId = parts[1];
    const docIdx = parts[2];
    if (docIdx === '0') db.prepare("UPDATE kyc_verifications SET id_front_url = NULL WHERE id = ?").run(kycId);
    else if (docIdx === '1') db.prepare("UPDATE kyc_verifications SET id_back_url = NULL WHERE id = ?").run(kycId);
    else if (docIdx === '2') db.prepare("UPDATE kyc_verifications SET selfie_url = NULL WHERE id = ?").run(kycId);
  } else {
    // Custom media_files table
    db.prepare('DELETE FROM media_files WHERE id = ?').run(fileId);
  }

  return { success: true };
}

export function addMediaFile(name: string, url: string, folderId: string = 'root', sizeBytes: number = 0, mimeType: string = 'image/jpeg', dimensions: string = '') {
  const db = getDatabase();
  const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  db.prepare(`
    INSERT INTO media_files (id, name, url, folder_id, size_bytes, mime_type, dimensions, source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'upload', datetime('now'))
  `).run(id, name, url, folderId, sizeBytes, mimeType, dimensions);

  return {
    id,
    name,
    url,
    folderId,
    sizeBytes,
    mimeType,
    dimensions,
    source: 'upload',
    createdAt: new Date().toISOString(),
  };
}

