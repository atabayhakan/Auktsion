import { Router, Request, Response } from 'express';
import { getDatabase } from '../config/database.js';
import { getRecentActivity } from '../models/bidModel.js';

export const metaRoutes = Router();

// Cross-auction "what's happening right now" feed — real bids only, no
// fabricated watcher counts or trending scores. Public, matching the other
// routes in this file (no auth gate, same as the WebSocket broadcast itself).
metaRoutes.get('/activity/recent', (req: Request, res: Response): void => {
  try {
    // Math.max guards against a negative limit — SQLite treats a negative
    // LIMIT as "unbounded," which would defeat the cap entirely on this
    // public, unauthenticated endpoint (e.g. ?limit=-1 returning every bid
    // ever placed, site-wide).
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 12, 30));
    const activity = getRecentActivity(limit);
    res.json({ success: true, data: activity });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

metaRoutes.get('/categories', (req: Request, res: Response): void => {
  try {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM auctions a WHERE a.category = c.id AND a.status = 'active') as active_count
      FROM categories c
      ORDER BY c.display_order ASC
    `).all() as any[];

    const categories = rows.map((r) => {
      let subCategories: string[] = [];
      try {
        subCategories = JSON.parse(r.sub_categories_json || '[]');
      } catch {
        subCategories = [];
      }

      return {
        id: r.id,
        slug: r.slug,
        name: r.name_ky,
        nameKy: r.name_ky,
        nameRu: r.name_ru,
        nameTr: r.name_tr,
        icon: r.icon,
        count: r.active_count || 0,
        subCategories,
      };
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

metaRoutes.get('/regions', (req: Request, res: Response): void => {
  const regions = [
    { id: 'bishkek', name: 'Бишкек шаары', slug: 'bishkek', districts: ['Биринчи Май', 'Ленин', 'Октябрь', 'Свердлов'] },
    { id: 'osh_city', name: 'Ош шаары', slug: 'osh-city', districts: ['Сулайман-Тоо', 'Курманжан Датка', 'Амир Темур'] },
    { id: 'chuy', name: 'Чүй облусу', slug: 'chuy', districts: ['Аламүдүн', 'Сокулук', 'Ысык-Ата', 'Токмок', 'Кант', 'Кара-Балта'] },
    { id: 'osh', name: 'Ош облусу', slug: 'osh', districts: ['Кара-Суу', 'Ноокат', 'Өзгөн', 'Алай', 'Араван'] },
    { id: 'jalal_abad', name: 'Жалал-Абад облусу', slug: 'jalal-abad', districts: ['Сузак', 'Базар-Коргон', 'Ноокен', 'Токтогул'] },
    { id: 'issyk_kul', name: 'Ысык-Көл облусу', slug: 'issyk-kul', districts: ['Каракол', 'Балыкчы', 'Ысык-Көл', 'Түп', 'Жети-Өгүз'] },
    { id: 'naryn', name: 'Нарын облусу', slug: 'naryn', districts: ['Нарын', 'Кочкор', 'Ат-Башы', 'Жумгал', 'Ак-Талаа'] },
    { id: 'talas', name: 'Талас облусу', slug: 'talas', districts: ['Талас', 'Бакай-Ата', 'Кара-Буура', 'Манас'] },
    { id: 'batken', name: 'Баткен облусу', slug: 'batken', districts: ['Баткен', 'Кадамжай', 'Лейлек', 'Кызыл-Кыя'] },
  ];

  res.json({
    success: true,
    data: regions,
  });
});
