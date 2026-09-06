import { getDatabase } from '../config/database.js';

export interface FeatureSettings {
  groupBuy: {
    enabled: boolean;
    defaultDurationHours: number;
    minParticipants: number;
    autoRefundOnFail: boolean;
    allowedCategories: string[];
  };
  aiValuation: {
    enabled: boolean;
    model: string;
    priceMarginPct: number;
    requireAdminModeration: boolean;
    dailyUserLimit: number;
  };
  priceDropAlert: {
    enabled: boolean;
    minDropPct: number;
    channels: {
      inApp: boolean;
      email: boolean;
      push: boolean;
    };
  };
  sellerComparison: {
    enabled: boolean;
    algorithm: 'lowest_price' | 'best_value_weighted' | 'fastest_delivery';
    minSellerCount: number;
    autoMatchByTitle: boolean;
  };
  aiAssistant: {
    enabled: boolean;
    maxResults: number;
    systemPrompt: string;
    showSuggestions: boolean;
  };
  videoListing: {
    enabled: boolean;
    maxDurationSeconds: number;
    maxFileSizeMb: number;
    allowedCategories: string[];
    moderationRequired: boolean;
  };
  updatedAt?: string;
}

export const DEFAULT_FEATURE_SETTINGS: FeatureSettings = {
  groupBuy: {
    enabled: true,
    defaultDurationHours: 24,
    minParticipants: 5,
    autoRefundOnFail: true,
    allowedCategories: ['electronics', 'appliances', 'clothing', 'wholesale', 'home', 'general'],
  },
  aiValuation: {
    enabled: true,
    model: 'gemini-2.0-flash',
    priceMarginPct: 15,
    requireAdminModeration: false,
    dailyUserLimit: 10,
  },
  priceDropAlert: {
    enabled: true,
    minDropPct: 5,
    channels: {
      inApp: true,
      email: true,
      push: true,
    },
  },
  sellerComparison: {
    enabled: true,
    algorithm: 'best_value_weighted',
    minSellerCount: 2,
    autoMatchByTitle: true,
  },
  aiAssistant: {
    enabled: true,
    maxResults: 4,
    systemPrompt: 'Сиз Кыргызстандын эң ири iTorgo аукцион жана соода платформасынын акылдуу жардамчысысыз. Колдонуучуларга товарларды табууга, бааларды салыштырууга жана сонун сунуштарды тандоого жардам бересиз. Жоопторду сылык, так жана колдонуучунун тилинде (Кыргызча, Орусча же Түркчө) бериңиз.',
    showSuggestions: true,
  },
  videoListing: {
    enabled: true,
    maxDurationSeconds: 30,
    maxFileSizeMb: 30,
    allowedCategories: ['vehicles', 'livestock', 'real_estate', 'electronics', 'machinery'],
    moderationRequired: false,
  },
  updatedAt: new Date().toISOString(),
};

// ============================================================================
// 1. Settings Read / Write
// ============================================================================

export function getFeatureSettings(): FeatureSettings {
  const db = getDatabase();
  try {
    const row = db.prepare("SELECT value, updated_at FROM platform_settings WHERE key = 'feature_config'").get() as { value: string; updated_at: string } | undefined;
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      return {
        groupBuy: { ...DEFAULT_FEATURE_SETTINGS.groupBuy, ...(parsed.groupBuy || {}) },
        aiValuation: { ...DEFAULT_FEATURE_SETTINGS.aiValuation, ...(parsed.aiValuation || {}) },
        priceDropAlert: { ...DEFAULT_FEATURE_SETTINGS.priceDropAlert, ...(parsed.priceDropAlert || {}) },
        sellerComparison: { ...DEFAULT_FEATURE_SETTINGS.sellerComparison, ...(parsed.sellerComparison || {}) },
        aiAssistant: { ...DEFAULT_FEATURE_SETTINGS.aiAssistant, ...(parsed.aiAssistant || {}) },
        videoListing: { ...DEFAULT_FEATURE_SETTINGS.videoListing, ...(parsed.videoListing || {}) },
        updatedAt: row.updated_at || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error('Error fetching feature settings:', err);
  }
  return DEFAULT_FEATURE_SETTINGS;
}

export function updateFeatureSettings(newSettings: Partial<FeatureSettings>): FeatureSettings {
  const db = getDatabase();
  const current = getFeatureSettings();
  const merged: FeatureSettings = {
    groupBuy: { ...current.groupBuy, ...(newSettings.groupBuy || {}) },
    aiValuation: { ...current.aiValuation, ...(newSettings.aiValuation || {}) },
    priceDropAlert: { ...current.priceDropAlert, ...(newSettings.priceDropAlert || {}) },
    sellerComparison: { ...current.sellerComparison, ...(newSettings.sellerComparison || {}) },
    aiAssistant: { ...current.aiAssistant, ...(newSettings.aiAssistant || {}) },
    videoListing: { ...current.videoListing, ...(newSettings.videoListing || {}) },
    updatedAt: new Date().toISOString(),
  };

  db.prepare(`
    INSERT INTO platform_settings (key, value, updated_at)
    VALUES ('feature_config', ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(JSON.stringify(merged));

  return getFeatureSettings();
}

// ============================================================================
// 2. Group Buy (Arkadaşınla Birlikte Satın Al)
// ============================================================================

export interface GroupBuyRow {
  id: string;
  auction_id: string;
  creator_id: string;
  status: string;
  tier_1_count: number;
  tier_1_price_minor: number;
  tier_2_count: number;
  tier_2_price_minor: number;
  current_count: number;
  expires_at: string;
  created_at: string;
  auction_title?: string;
  auction_image?: string;
  original_price_minor?: number;
}

export function getGroupBuyByAuction(auctionId: string) {
  const db = getDatabase();
  const group = db.prepare(`
    SELECT gb.*, a.title as auction_title, a.buy_now_price_minor as original_price_minor, a.images_json
    FROM group_buys gb
    JOIN auctions a ON gb.auction_id = a.id
    WHERE gb.auction_id = ? AND gb.status = 'active' AND gb.expires_at > datetime('now')
    ORDER BY gb.created_at DESC LIMIT 1
  `).get(auctionId) as any;

  if (!group) return null;

  const participants = db.prepare(`
    SELECT gbp.*, u.full_name, u.avatar
    FROM group_buy_participants gbp
    JOIN users u ON gbp.user_id = u.id
    WHERE gbp.group_buy_id = ?
    ORDER BY gbp.created_at ASC
  `).all(group.id) as any[];

  let images: string[] = [];
  try { images = JSON.parse(group.images_json || '[]'); } catch {}

  const currentCount = participants.length;
  let currentPriceMinor = group.original_price_minor;
  let nextTierRemaining = 0;
  let nextPriceMinor = group.tier_1_price_minor;

  if (currentCount >= group.tier_2_count) {
    currentPriceMinor = group.tier_2_price_minor;
    nextTierRemaining = 0;
    nextPriceMinor = group.tier_2_price_minor;
  } else if (currentCount >= group.tier_1_count) {
    currentPriceMinor = group.tier_1_price_minor;
    nextTierRemaining = group.tier_2_count - currentCount;
    nextPriceMinor = group.tier_2_price_minor;
  } else {
    nextTierRemaining = group.tier_1_count - currentCount;
    nextPriceMinor = group.tier_1_price_minor;
  }

  return {
    id: group.id,
    auctionId: group.auction_id,
    auctionTitle: group.auction_title,
    auctionImage: images[0] || '',
    creatorId: group.creator_id,
    status: group.status,
    expiresAt: group.expires_at,
    originalPrice: {
      amount: ((group.original_price_minor || 0) / 100).toFixed(0),
      currency: 'KGS',
      formatted: `${((group.original_price_minor || 0) / 100).toLocaleString('ru-RU')} сом`
    },
    tier1: {
      count: group.tier_1_count,
      amount: (group.tier_1_price_minor / 100).toFixed(0),
      formatted: `${(group.tier_1_price_minor / 100).toLocaleString('ru-RU')} сом`
    },
    tier2: {
      count: group.tier_2_count,
      amount: (group.tier_2_price_minor / 100).toFixed(0),
      formatted: `${(group.tier_2_price_minor / 100).toLocaleString('ru-RU')} сом`
    },
    currentCount,
    currentPrice: {
      amount: (currentPriceMinor / 100).toFixed(0),
      formatted: `${(currentPriceMinor / 100).toLocaleString('ru-RU')} сом`
    },
    nextTierRemaining,
    nextPrice: {
      amount: (nextPriceMinor / 100).toFixed(0),
      formatted: `${(nextPriceMinor / 100).toLocaleString('ru-RU')} сом`
    },
    participants: participants.map(p => ({
      userId: p.user_id,
      fullName: p.full_name,
      avatar: p.avatar,
      paymentStatus: p.payment_status,
      joinedAt: p.created_at
    }))
  };
}

export function createOrGetGroupBuy(auctionId: string, creatorId: string) {
  const existing = getGroupBuyByAuction(auctionId);
  if (existing) return existing;

  const db = getDatabase();
  const auction = db.prepare('SELECT id, buy_now_price_minor, current_price_minor FROM auctions WHERE id = ?').get(auctionId) as any;
  if (!auction) throw new Error('Açık artırma bulunamadı');

  const basePriceMinor = auction.buy_now_price_minor || auction.current_price_minor || 2000000;
  const tier1PriceMinor = Math.round(basePriceMinor * 0.925); // ~%7.5 indirim
  const tier2PriceMinor = Math.round(basePriceMinor * 0.85);  // ~%15 indirim

  const id = `gb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const settings = getFeatureSettings();
  const durationHours = settings.groupBuy.defaultDurationHours || 24;

  db.prepare(`
    INSERT INTO group_buys (id, auction_id, creator_id, status, tier_1_count, tier_1_price_minor, tier_2_count, tier_2_price_minor, current_count, expires_at)
    VALUES (?, ?, ?, 'active', 5, ?, 10, ?, 1, datetime('now', '+' || ? || ' hours'))
  `).run(id, auctionId, creatorId, tier1PriceMinor, tier2PriceMinor, durationHours);

  // Add creator as first participant
  const pId = `gbp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  db.prepare(`
    INSERT INTO group_buy_participants (id, group_buy_id, user_id, payment_status)
    VALUES (?, ?, ?, 'hold')
  `).run(pId, id, creatorId);

  return getGroupBuyByAuction(auctionId);
}

export function joinGroupBuy(groupBuyId: string, userId: string) {
  const db = getDatabase();
  const group = db.prepare("SELECT * FROM group_buys WHERE id = ? AND status = 'active' AND expires_at > datetime('now')").get(groupBuyId) as any;
  if (!group) throw new Error('Grup alım oturumu bulunamadı veya süresi doldu');

  const alreadyJoined = db.prepare('SELECT id FROM group_buy_participants WHERE group_buy_id = ? AND user_id = ?').get(groupBuyId, userId);
  if (alreadyJoined) {
    return getGroupBuyByAuction(group.auction_id);
  }

  const pId = `gbp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  db.prepare(`
    INSERT INTO group_buy_participants (id, group_buy_id, user_id, payment_status)
    VALUES (?, ?, ?, 'hold')
  `).run(pId, groupBuyId, userId);

  // Increment count
  db.prepare('UPDATE group_buys SET current_count = current_count + 1 WHERE id = ?').run(groupBuyId);

  return getGroupBuyByAuction(group.auction_id);
}

// ============================================================================
// 3. Price Drop Alerts (Fiyat Takibi)
// ============================================================================

export function createPriceAlert(userId: string, auctionId: string, targetPriceMinor: number) {
  const db = getDatabase();
  const auction = db.prepare('SELECT current_price_minor, buy_now_price_minor FROM auctions WHERE id = ?').get(auctionId) as any;
  if (!auction) throw new Error('Açık artırma bulunamadı');

  const initialPrice = auction.buy_now_price_minor || auction.current_price_minor || targetPriceMinor;

  const existing = db.prepare('SELECT id FROM price_alerts WHERE user_id = ? AND auction_id = ? AND is_triggered = 0').get(userId, auctionId) as any;
  if (existing) {
    db.prepare('UPDATE price_alerts SET target_price_minor = ?, initial_price_minor = ? WHERE id = ?').run(targetPriceMinor, initialPrice, existing.id);
    return { id: existing.id, updated: true };
  }

  const id = `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  db.prepare(`
    INSERT INTO price_alerts (id, user_id, auction_id, target_price_minor, initial_price_minor, is_triggered)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(id, userId, auctionId, targetPriceMinor, initialPrice);

  return { id, created: true };
}

export function getUserPriceAlerts(userId: string) {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT pa.*, a.title as auction_title, a.current_price_minor, a.buy_now_price_minor, a.images_json
    FROM price_alerts pa
    JOIN auctions a ON pa.auction_id = a.id
    WHERE pa.user_id = ?
    ORDER BY pa.created_at DESC
  `).all(userId) as any[];

  return rows.map(r => {
    let images: string[] = [];
    try { images = JSON.parse(r.images_json || '[]'); } catch {}
    const curPrice = r.buy_now_price_minor || r.current_price_minor || 0;
    return {
      id: r.id,
      auctionId: r.auction_id,
      auctionTitle: r.auction_title,
      auctionImage: images[0] || '',
      targetPrice: {
        amount: (r.target_price_minor / 100).toFixed(0),
        currency: 'KGS',
        formatted: `${(r.target_price_minor / 100).toLocaleString('ru-RU')} сом`
      },
      currentPrice: {
        amount: (curPrice / 100).toFixed(0),
        currency: 'KGS',
        formatted: `${(curPrice / 100).toLocaleString('ru-RU')} сом`
      },
      isTriggered: Boolean(r.is_triggered),
      createdAt: r.created_at
    };
  });
}

export function deletePriceAlert(id: string, userId: string) {
  const db = getDatabase();
  db.prepare('DELETE FROM price_alerts WHERE id = ? AND user_id = ?').run(id, userId);
  return { success: true };
}

export function triggerPriceDropCheck(auctionId: string, newPriceMinor: number) {
  const db = getDatabase();
  const alerts = db.prepare(`
    SELECT pa.*, u.id as user_id, u.full_name, a.title as auction_title
    FROM price_alerts pa
    JOIN users u ON pa.user_id = u.id
    JOIN auctions a ON pa.auction_id = a.id
    WHERE pa.auction_id = ? AND pa.is_triggered = 0 AND pa.target_price_minor >= ?
  `).all(auctionId, newPriceMinor) as any[];

  for (const alert of alerts) {
    db.prepare('UPDATE price_alerts SET is_triggered = 1 WHERE id = ?').run(alert.id);
    const dropDiff = (alert.initial_price_minor - newPriceMinor) / 100;
    const dropText = dropDiff > 0 ? `${dropDiff.toLocaleString('ru-RU')} сом түштү!` : 'Сиз каалаган баага жетти!';
    
    // Send in-app notification
    const nId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link)
      VALUES (?, ?, 'price_drop', 'Баа арзандады!', ?, ?)
    `).run(nId, alert.user_id, `🔔 Сиз көзөмөлдөгөн «${alert.auction_title}» лотунун баасы ${dropText}`, `/auctions/${auctionId}`);
  }
}

// ============================================================================
// 4. Multi-Seller Comparison (Çoklu Satıcı Karşılaştırması)
// ============================================================================

export function getMatchingSellersForAuction(auctionId: string) {
  const db = getDatabase();
  const currentAuction = db.prepare('SELECT id, title, category, seller_id, current_price_minor, buy_now_price_minor, product_code FROM auctions WHERE id = ?').get(auctionId) as any;
  if (!currentAuction) return [];

  let query = `
    SELECT a.id, a.title, a.seller_id, a.current_price_minor, a.buy_now_price_minor, a.status, a.city,
           u.full_name as seller_name, u.avatar as seller_avatar, u.kyc_status
    FROM auctions a
    JOIN users u ON a.seller_id = u.id
    WHERE a.status = 'active'
  `;
  const params: any[] = [];

  if (currentAuction.product_code) {
    query += ' AND a.product_code = ?';
    params.push(currentAuction.product_code);
  } else {
    // Extract first 2 significant words for match
    const words = currentAuction.title.split(' ').filter((w: string) => w.length > 2).slice(0, 2);
    if (words.length > 0) {
      query += ` AND a.category = ? AND (${words.map(() => 'a.title LIKE ?').join(' OR ')})`;
      params.push(currentAuction.category, ...words.map((w: string) => `%${w}%`));
    } else {
      query += ' AND a.category = ?';
      params.push(currentAuction.category);
    }
  }

  query += ' ORDER BY a.current_price_minor ASC LIMIT 8';
  const rows = db.prepare(query).all(...params) as any[];

  if (rows.length === 0) return [];

  // Find lowest price
  const minPrice = Math.min(...rows.map(r => r.buy_now_price_minor || r.current_price_minor));

  return rows.map((r, idx) => {
    const price = r.buy_now_price_minor || r.current_price_minor;
    const isBestValue = price === minPrice || idx === 0;
    const deliveryFeeMinor = idx === 0 ? 0 : 20000; // 0 or 200 KGS
    return {
      auctionId: r.id,
      title: r.title,
      isCurrent: r.id === auctionId,
      seller: {
        id: r.seller_id,
        name: r.seller_name,
        avatar: r.seller_avatar,
        rating: 4.5 + ((r.seller_name.charCodeAt(0) % 5) / 10),
        isVerified: r.kyc_status === 'verified',
        city: r.city || 'Бишкек'
      },
      price: {
        amount: (price / 100).toFixed(0),
        currency: 'KGS',
        formatted: `${(price / 100).toLocaleString('ru-RU')} сом`
      },
      delivery: {
        free: deliveryFeeMinor === 0,
        feeFormatted: deliveryFeeMinor === 0 ? 'Акысыз жеткирүү' : `${(deliveryFeeMinor / 100).toLocaleString('ru-RU')} сом`,
        days: '1-2 күн'
      },
      isBestValue
    };
  });
}
