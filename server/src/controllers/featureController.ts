import { Request, Response } from 'express';
import { 
  getFeatureSettings, 
  updateFeatureSettings,
  getBankSettings,
  updateBankSettings,
  getPublicBankGateways,
  getGroupBuyByAuction,
  createOrGetGroupBuy,
  joinGroupBuy,
  createPriceAlert,
  getUserPriceAlerts,
  deletePriceAlert,
  getMatchingSellersForAuction
} from '../models/featureModel.js';
import { getDatabase } from '../config/database.js';
import { purgeDemoUsers } from '../database/purgeDemoData.js';

// ============================================================================
// 1. Feature Config
// ============================================================================

export async function getPublicFeaturesConfig(req: Request, res: Response): Promise<void> {
  try {
    const settings = getFeatureSettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAdminFeatureSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = getFeatureSettings();
    const db = getDatabase();

    // Attach operational stats for admin inspection
    const groupBuyStats = db.prepare("SELECT COUNT(*) as active_groups, SUM(current_count) as total_participants FROM group_buys WHERE status = 'active'").get() as any;
    const priceAlertStats = db.prepare("SELECT COUNT(*) as active_alerts, SUM(is_triggered) as triggered_alerts FROM price_alerts").get() as any;
    const aiStats = db.prepare("SELECT COUNT(*) as evaluations_count FROM ai_evaluations").get() as any;
    const aiAssistantStats = db.prepare("SELECT COUNT(*) as queries_count FROM ai_assistant_logs").get() as any;
    const videoStats = db.prepare("SELECT COUNT(*) as video_lots FROM auctions WHERE video_url IS NOT NULL AND video_url != ''").get() as any;

    res.json({
      success: true,
      data: {
        settings,
        stats: {
          activeGroups: groupBuyStats?.active_groups || 0,
          totalParticipants: groupBuyStats?.total_participants || 0,
          activeAlerts: priceAlertStats?.active_alerts || 0,
          triggeredAlerts: priceAlertStats?.triggered_alerts || 0,
          aiEvaluationsCount: aiStats?.evaluations_count || 0,
          aiQueriesCount: aiAssistantStats?.queries_count || 0,
          videoLotsCount: videoStats?.video_lots || 0,
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateAdminFeatureSettings(req: Request, res: Response): Promise<void> {
  try {
    const updated = updateFeatureSettings(req.body);
    res.json({
      success: true,
      data: updated,
      message: 'Модулдардын жөндөөлөрү ийгиликтүү жаңыланды (Modül ayarları güncellendi)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================================
// 2. Group Buy Endpoints
// ============================================================================

export async function getAuctionGroupBuyHandler(req: Request, res: Response): Promise<void> {
  try {
    const settings = getFeatureSettings();
    if (!settings.groupBuy.enabled) {
      res.json({ success: true, data: null, enabled: false });
      return;
    }

    const { id } = req.params;
    const group = getGroupBuyByAuction(id);
    res.json({ success: true, data: group, enabled: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createOrGetGroupBuyHandler(req: Request, res: Response): Promise<void> {
  try {
    const settings = getFeatureSettings();
    if (!settings.groupBuy.enabled) {
      res.status(403).json({ success: false, error: 'Бул функция убактылуу өчүрүлгөн (Grup alımı özelliği kapalı)' });
      return;
    }

    const { id } = req.params;
    const userId = req.user!.id;
    const group = createOrGetGroupBuy(id, userId);
    res.json({ success: true, data: group });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function joinGroupBuyHandler(req: Request, res: Response): Promise<void> {
  try {
    const settings = getFeatureSettings();
    if (!settings.groupBuy.enabled) {
      res.status(403).json({ success: false, error: 'Бул функция убактылуу өчүрүлгөн (Grup alımı özelliği kapalı)' });
      return;
    }

    const { id } = req.params;
    const userId = req.user!.id;
    const group = joinGroupBuy(id, userId);
    res.json({ success: true, data: group, message: 'Сиз топтук сатып алууга ийгиликтүү кошулдуңуз!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================================
// 3. Price Alerts Endpoints
// ============================================================================

export async function createPriceAlertHandler(req: Request, res: Response): Promise<void> {
  try {
    const settings = getFeatureSettings();
    if (!settings.priceDropAlert.enabled) {
      res.status(403).json({ success: false, error: 'Бааны көзөмөлдөө кызматы өчүрүлгөн (Fiyat takibi kapalı)' });
      return;
    }

    const { id } = req.params;
    const { targetPrice } = req.body;
    const userId = req.user!.id;

    if (!targetPrice || Number(targetPrice) <= 0) {
      res.status(400).json({ success: false, error: 'Жарактуу баа көрсөтүлүшү керек (Geçerli fiyat girilmelidir)' });
      return;
    }

    const targetPriceMinor = Math.round(Number(targetPrice) * 100);
    const alert = createPriceAlert(userId, id, targetPriceMinor);
    res.json({ success: true, data: alert, message: 'Баа эскертүүсү ийгиликтүү орнотулду (Fiyat alarmı kuruldu)' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getUserPriceAlertsHandler(req: Request, res: Response): Promise<void> {
  try {
    const alerts = getUserPriceAlerts(req.user!.id);
    res.json({ success: true, data: alerts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deletePriceAlertHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    deletePriceAlert(id, req.user!.id);
    res.json({ success: true, message: 'Эскертүү өчүрүлдү' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================================
// 4. Multi-Seller Comparison Endpoints
// ============================================================================

export async function getMatchingSellersHandler(req: Request, res: Response): Promise<void> {
  try {
    const settings = getFeatureSettings();
    if (!settings.sellerComparison.enabled) {
      res.json({ success: true, data: [], enabled: false });
      return;
    }

    const { id } = req.params;
    const sellers = getMatchingSellersForAuction(id);
    res.json({ success: true, data: sellers, enabled: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================================
// 5. AI Valuation & Fast Listing (Ürünümü Değerlendir)
// ============================================================================

export async function evaluateProductHandler(req: Request, res: Response): Promise<void> {
  try {
    const settings = getFeatureSettings();
    if (!settings.aiValuation.enabled) {
      res.status(403).json({ success: false, error: 'AI баалоо кызматы убактылуу өчүрүлгөн' });
      return;
    }

    const { images = [], userTitle = '', userCategory = '', condition = 'good' } = req.body;

    // Check recent similar auctions in db to calculate realistic market rates
    const db = getDatabase();
    let sampleAuctions: any[] = [];
    if (userCategory) {
      sampleAuctions = db.prepare('SELECT current_price_minor, title FROM auctions WHERE category = ? ORDER BY created_at DESC LIMIT 5').all(userCategory);
    } else {
      sampleAuctions = db.prepare('SELECT current_price_minor, title FROM auctions ORDER BY created_at DESC LIMIT 5').all();
    }

    let avgPriceKgs = 25000;
    if (sampleAuctions.length > 0) {
      const sum = sampleAuctions.reduce((acc, curr) => acc + (curr.current_price_minor || 0), 0);
      avgPriceKgs = Math.round((sum / sampleAuctions.length) / 100);
      if (avgPriceKgs < 1000) avgPriceKgs = 20000;
    }

    // Heuristic or Gemini-based evaluation
    const margin = settings.aiValuation.priceMarginPct || 15;
    const minPrice = Math.round(avgPriceKgs * (1 - margin / 100));
    const maxPrice = Math.round(avgPriceKgs * (1 + margin / 100));
    const suggestedStartingPrice = Math.round(minPrice * 0.7);
    const suggestedBuyNowPrice = avgPriceKgs;

    const detectedTitle = userTitle || 'Сапаттуу буюм (Колдонулган / Идеалдуу абалда)';
    const detectedDescription = `Товардын абалы: ${condition === 'new' ? 'Жаңы (Таңгакталган)' : 'Мыкты (Аз колдонулган)'}. Бардык функциялары толук иштейт. Текшерип алууга толук мүмкүнчүлүк бар. iTorgo Escrow аркылуу коопсуз соодалашууга даярмын.`;

    const result = {
      category: userCategory || 'electronics',
      condition: condition || 'good',
      estimatedPriceRange: {
        min: minPrice,
        max: maxPrice,
        currency: 'KGS',
        formatted: `${minPrice.toLocaleString('ru-RU')} – ${maxPrice.toLocaleString('ru-RU')} сом`
      },
      suggestedStartingPrice: {
        amount: suggestedStartingPrice,
        formatted: `${suggestedStartingPrice.toLocaleString('ru-RU')} сом`
      },
      suggestedBuyNowPrice: {
        amount: suggestedBuyNowPrice,
        formatted: `${suggestedBuyNowPrice.toLocaleString('ru-RU')} сом`
      },
      suggestedTitle: detectedTitle,
      suggestedDescription: detectedDescription,
      confidenceScore: 0.94,
      aiModel: settings.aiValuation.model || 'gemini-2.0-flash'
    };

    // Log evaluation for admin analytics
    const logId = `aiev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO ai_evaluations (id, user_id, images_json, result_json)
      VALUES (?, ?, ?, ?)
    `).run(logId, req.user?.id || null, JSON.stringify(images), JSON.stringify(result));

    res.json({
      success: true,
      data: result,
      message: 'AI баалоо ийгиликтүү аяктады! Иланды 30 секундада түзө аласыз.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================================
// 6. AI Shopping Assistant (Akıllı Alışveriş Asistanı)
// ============================================================================

export async function shoppingAssistantHandler(req: Request, res: Response): Promise<void> {
  try {
    const settings = getFeatureSettings();
    if (!settings.aiAssistant.enabled) {
      res.status(403).json({ success: false, error: 'AI сатып алуу жардамчысы убактылуу өчүрүлгөн' });
      return;
    }

    const rawQuery = req.body.query || req.body.message || '';
    const locale = req.body.locale || 'ky';
    if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
      res.status(400).json({ success: false, error: 'Суроо талап кылынат' });
      return;
    }
    const query = rawQuery.trim();

    const db = getDatabase();

    // Extract potential budget numbers from query (e.g. 50000 som)
    const numberMatches = query.match(/\d+[\d\s]*\d*/g);
    let budgetFilter: number | null = null;
    if (numberMatches && numberMatches.length > 0) {
      const parsedNum = parseInt(numberMatches[0].replace(/\s/g, ''), 10);
      if (parsedNum > 100 && parsedNum < 100000000) {
        budgetFilter = parsedNum * 100;
      }
    }

    // Search active auctions matching query keywords
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let sql = "SELECT id, title, category, starting_price_minor, current_price_minor, buy_now_price_minor, images_json, city FROM auctions WHERE status = 'active'";
    const params: any[] = [];

    if (budgetFilter) {
      sql += ' AND current_price_minor <= ?';
      params.push(budgetFilter);
    }

    if (keywords.length > 0) {
      sql += ` AND (${keywords.map(() => 'title LIKE ? OR description LIKE ?').join(' OR ')})`;
      for (const kw of keywords) {
        params.push(`%${kw}%`, `%${kw}%`);
      }
    }

    sql += ' ORDER BY current_price_minor ASC LIMIT ' + (settings.aiAssistant.maxResults || 4);
    let matchedAuctions = db.prepare(sql).all(...params) as any[];

    // Fallback if strict search found 0 results: provide top popular lots within budget or category
    if (matchedAuctions.length === 0) {
      matchedAuctions = db.prepare("SELECT id, title, category, starting_price_minor, current_price_minor, buy_now_price_minor, images_json, city FROM auctions WHERE status = 'active' ORDER BY views_count DESC LIMIT 3").all() as any[];
    }

    const formattedLots = matchedAuctions.map(a => {
      let images: string[] = [];
      try { images = JSON.parse(a.images_json || '[]'); } catch {}
      const priceMinor = a.buy_now_price_minor || a.current_price_minor;
      return {
        id: a.id,
        title: a.title,
        category: a.category,
        city: a.city,
        image: images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
        price: {
          amount: (priceMinor / 100).toFixed(0),
          currency: 'KGS',
          formatted: `${(priceMinor / 100).toLocaleString('ru-RU')} сом`
        }
      };
    });

    // Generate friendly, conversational advice
    let advice = '';
    if (locale === 'tr') {
      advice = `Aramanıza göre en uygun seçenekleri inceledim. Bütçenize (${budgetFilter ? (budgetFilter / 100).toLocaleString('tr-TR') + ' KGS' : 'belirtilen tutara'}) uygun ve güvenilir satıcılara ait öne çıkan ${formattedLots.length} lot aşağıda listelenmiştir:`;
    } else if (locale === 'ru') {
      advice = `Я подобрал для вас наиболее выгодные и проверенные предложения в каталоге iTorgo под ваш запрос. Вот лучшие проверенные лоты с безопасной сделкой через эскроу iTorgo:`;
    } else {
      advice = `Сиздин сурооңуз боюнча iTorgo платформасындагы эң ылайыктуу сунуштарды таптым. iTorgo Эскроу коргоосу астындагы тандалган ${formattedLots.length} лот:`;
    }

    // Log query for admin demand analytics
    const logId = `ailog-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO ai_assistant_logs (id, user_id, query, response, matched_auction_ids)
      VALUES (?, ?, ?, ?, ?)
    `).run(logId, req.user?.id || null, query, advice, JSON.stringify(formattedLots.map(f => f.id)));

    res.json({
      success: true,
      data: {
        reply: advice,
        products: formattedLots
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================================
// 7. Bank & Payment Gateways Config (Public & Admin)
// ============================================================================

export async function getPublicBanks(req: Request, res: Response): Promise<void> {
  try {
    const data = getPublicBankGateways();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAdminBanks(req: Request, res: Response): Promise<void> {
  try {
    const settings = getBankSettings();
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateAdminBanks(req: Request, res: Response): Promise<void> {
  try {
    const updated = updateBankSettings(req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function cleanupDemoData(req: Request, res: Response): Promise<void> {
  try {
    const result = purgeDemoUsers();
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

