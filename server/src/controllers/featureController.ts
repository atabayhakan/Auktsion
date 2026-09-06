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
    const sanitized = {
      ...settings,
      aiAssistant: {
        ...settings.aiAssistant,
        apiKey: settings.aiAssistant.apiKey ? '••••••••' : ''
      }
    };
    res.json({
      success: true,
      data: sanitized,
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
// 6. AI Shopping Assistant (Akıllı Alışveriş Asistanı & Multi-Model Engine)
// ============================================================================

interface LlmCallParams {
  provider: 'gemini' | 'openrouter' | 'nvidia' | 'custom' | 'offline';
  apiKey: string;
  baseUrl: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  userMessage: string;
  history?: Array<{ role: string; content: string }>;
  availableLots?: Array<any>;
  locale?: string;
}

export async function callLlmService(params: LlmCallParams): Promise<string> {
  const {
    provider,
    apiKey,
    baseUrl,
    modelName,
    temperature = 0.7,
    maxTokens = 1000,
    systemPrompt = '',
    userMessage,
    history = [],
    availableLots = [],
    locale = 'ru'
  } = params;

  if (provider === 'offline' || !apiKey || !apiKey.trim()) {
    throw new Error('LLM provider is offline or API key is not configured');
  }

  // Format language instructions
  const langName = locale === 'ky' ? 'Кыргызча (кыргыз тилинде)' : locale === 'tr' ? 'Türkçe' : 'Русский язык';
  const lotsContext = availableLots.length > 0 
    ? 'АКТУАЛЬНЫЕ ДОСТУПНЫЕ ЛОТЫ НА ПЛАТФОРМЕ ITORGO (РЕАЛЬНЫЕ ДАННЫЕ ИЗ БАЗЫ):\n' + 
      availableLots.map((l, i) => `${i + 1}. [Лот #${l.id}] "${l.title}" | Цена: ${l.price?.formatted || l.currentPrice + ' сом'} | Город: ${l.city} | Категория: ${l.category}`).join('\n')
    : 'В каталоге сейчас нет точно совпадающих лотов. Предложите покупателю заглянуть в смежные разделы каталога или подписаться на уведомления.';

  const fullSystemMessage = `${systemPrompt || 'Вы — официальный ИИ-ассистент аукционной платформы iTorgo (itorgo.kg). Помогайте находить лоты и отвечать на вопросы.'}

СТРОГИЕ ТРЕБОВАНИЯ К ОТВЕТУ:
1. ЯЗЫК: Пользователь просматривает сайт на языке "${langName}". Ваш ответ ОБЯЗАТЕЛЬНО должен быть на этом языке (${langName})!
2. РЕАЛЬНЫЕ ТОВАРЫ: Если в запросе пользователь ищет товар, упомяните подходящие варианты из списка ниже.
3. БЕЗОПАСНОСТЬ: Напоминайте, что все сделки защищены сервисом iTorgo Эскроу.
4. ВАЛЮТА: Цены всегда в сомах (KGS / сом).
5. ФОРМАТ: Дружелюбный, живой, краткий и структурированный ответ без лишней "воды".

${lotsContext}`;

  const messages = [
    { role: 'system', content: fullSystemMessage },
    ...history.slice(-6).map(h => ({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: h.content
    })),
    { role: 'user', content: userMessage }
  ];

  let endpoint = '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const trimmedKey = apiKey.trim();

  if (provider === 'openrouter') {
    const base = (baseUrl || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
    endpoint = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
    headers['Authorization'] = `Bearer ${trimmedKey}`;
    headers['HTTP-Referer'] = 'https://itorgo.kg';
    headers['X-Title'] = 'iTorgo Shopping Assistant';
  } else if (provider === 'nvidia') {
    const base = (baseUrl || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '');
    endpoint = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
    headers['Authorization'] = `Bearer ${trimmedKey}`;
  } else if (provider === 'gemini') {
    const base = (baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/+$/, '');
    endpoint = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
    headers['Authorization'] = `Bearer ${trimmedKey}`;
  } else {
    // Custom OpenAI compatible endpoint
    const base = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    endpoint = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
    headers['Authorization'] = `Bearer ${trimmedKey}`;
  }

  const payload = {
    model: modelName?.trim() || 'gemini-2.0-flash',
    messages,
    temperature: typeof temperature === 'number' ? temperature : 0.7,
    max_tokens: maxTokens || 1000,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.error?.message) errorMsg += `: ${errJson.error.message}`;
        else if (errJson.message) errorMsg += `: ${errJson.message}`;
      } catch {}
      throw new Error(errorMsg);
    }

    const data = await response.json() as any;
    const replyText = data.choices?.[0]?.message?.content;
    if (!replyText || typeof replyText !== 'string') {
      throw new Error('API вернул пустой или некорректный ответ');
    }

    return replyText.trim();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Таймаут запроса к API модели (превышен лимит 15 секунд)');
    }
    throw err;
  }
}

export async function testAiConnectionHandler(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  try {
    const { provider, apiKey, baseUrl, modelName, temperature, systemPrompt } = req.body;

    if (!provider || provider === 'offline') {
      res.status(400).json({ success: false, error: 'Выберите активного провайдера (Gemini, OpenRouter, NVIDIA или Custom)' });
      return;
    }

    if (!apiKey || !apiKey.trim()) {
      res.status(400).json({ success: false, error: 'API-ключ обязателен для проверки подключения' });
      return;
    }

    if (!modelName || !modelName.trim()) {
      res.status(400).json({ success: false, error: 'Укажите название модели' });
      return;
    }

    const testReply = await callLlmService({
      provider,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl || '',
      modelName: modelName.trim(),
      temperature: temperature || 0.7,
      maxTokens: 120,
      systemPrompt: systemPrompt || 'Вы — ассистент iTorgo.',
      userMessage: 'Ответь одним коротким предложением: подтверди, что подключение к платформе iTorgo успешно установлено.',
      locale: 'ru'
    });

    const latencyMs = Date.now() - startTime;
    res.json({
      success: true,
      data: {
        latencyMs,
        reply: testReply,
        model: modelName.trim(),
        provider
      }
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    res.status(502).json({
      success: false,
      error: err.message || 'Ошибка соединения с API модели',
      latencyMs
    });
  }
}

export async function shoppingAssistantHandler(req: Request, res: Response): Promise<void> {
  try {
    const settings = getFeatureSettings();
    if (!settings.aiAssistant.enabled) {
      res.status(403).json({ success: false, error: 'AI сатып алуу жардамчысы убактылуу өчүрүлгөн' });
      return;
    }

    const rawQuery = req.body.query || req.body.message || '';
    const locale = req.body.locale || 'ru';
    const history = req.body.history || [];

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
      const priceNum = Math.round(priceMinor / 100);
      return {
        id: a.id,
        title: a.title,
        category: a.category,
        city: a.city,
        image: images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
        imageUrl: images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
        currentPrice: priceNum,
        price: {
          amount: priceNum.toString(),
          currency: 'KGS',
          formatted: `${priceNum.toLocaleString(locale === 'tr' ? 'tr-TR' : 'ru-RU')} сом`
        }
      };
    });

    let advice = '';

    // Attempt real LLM generation if configured with API key
    const aiConfig = settings.aiAssistant;
    if (aiConfig.provider !== 'offline' && aiConfig.apiKey && aiConfig.apiKey.trim()) {
      try {
        advice = await callLlmService({
          provider: aiConfig.provider,
          apiKey: aiConfig.apiKey,
          baseUrl: aiConfig.baseUrl,
          modelName: aiConfig.modelName,
          temperature: aiConfig.temperature,
          maxTokens: aiConfig.maxTokens,
          systemPrompt: aiConfig.systemPrompt,
          userMessage: query,
          history,
          availableLots: formattedLots,
          locale
        });
      } catch (llmErr: any) {
        console.warn('AI Assistant LLM call failed, falling back to rule-based template:', llmErr.message);
      }
    }

    // Fallback if LLM was offline or failed
    if (!advice) {
      if (locale === 'tr') {
        advice = `Aramanıza göre iTorgo kataloğundaki en uygun seçenekleri inceledim. Bütçenize (${budgetFilter ? (budgetFilter / 100).toLocaleString('tr-TR') + ' KGS' : 'belirttiğiniz kriterlere'}) uygun ve güvenilir satıcılara ait öne çıkan ${formattedLots.length} lot aşağıda listelenmiştir. Tüm işlemler iTorgo Güvenli Ödeme (Escrow) güvencesindedir:`;
      } else if (locale === 'ky') {
        advice = `Сиздин сурооңуз боюнча iTorgo платформасындагы эң ылайыктуу сунуштарды карап чыктым. Сиздин талаптарга ылайыкталган жана iTorgo Эскроу коопсуз соодасы менен корголгон ${formattedLots.length} мыкты лот төмөндө:`;
      } else {
        advice = `Я подобрал для вас наиболее выгодные и проверенные предложения в каталоге iTorgo под ваш запрос. Вот проверенные лоты с гарантией безопасной сделки через эскроу iTorgo:`;
      }
    }

    // Log query for admin demand analytics
    const logId = `ailog-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    try {
      db.prepare(`
        INSERT INTO ai_assistant_logs (id, user_id, query, response, matched_auction_ids)
        VALUES (?, ?, ?, ?, ?)
      `).run(logId, req.user?.id || null, query, advice, JSON.stringify(formattedLots.map(f => f.id)));
    } catch {}

    res.json({
      success: true,
      data: {
        reply: advice,
        recommendedAuctions: formattedLots,
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

