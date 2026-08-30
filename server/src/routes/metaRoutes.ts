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

// Dynamic Real-time Sitemap Generator for Search Engines
export function getSitemapXml(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const domain = 'https://www.itorgo.kg';
    const now = new Date().toISOString();

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/auctions', priority: '0.9', changefreq: 'hourly' },
      { url: '/categories', priority: '0.8', changefreq: 'daily' },
      { url: '/how-it-works', priority: '0.7', changefreq: 'weekly' },
      { url: '/about', priority: '0.6', changefreq: 'monthly' },
      { url: '/contact', priority: '0.6', changefreq: 'monthly' },
      { url: '/privacy', priority: '0.4', changefreq: 'monthly' },
      { url: '/terms', priority: '0.4', changefreq: 'monthly' },
    ];

    // Fetch active auctions
    let auctionRows: Array<{ id: string; updated_at: string }> = [];
    try {
      auctionRows = db.prepare("SELECT id, updated_at FROM auctions WHERE status = 'active' ORDER BY updated_at DESC LIMIT 500").all() as any[];
    } catch {}

    // Fetch categories
    let categoryRows: Array<{ slug: string }> = [];
    try {
      categoryRows = db.prepare("SELECT slug FROM categories ORDER BY display_order ASC").all() as any[];
    } catch {}

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    // Static pages
    for (const page of staticPages) {
      xml += '  <url>\n';
      xml += `    <loc>${domain}${page.url}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // Category pages
    for (const cat of categoryRows) {
      xml += '  <url>\n';
      xml += `    <loc>${domain}/auctions?category=${cat.slug}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    // Active auction listings
    for (const a of auctionRows) {
      const lastmod = a.updated_at ? new Date(a.updated_at).toISOString() : now;
      xml += '  <url>\n';
      xml += `    <loc>${domain}/auctions/${a.id}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>hourly</changefreq>\n';
      xml += '    <priority>0.9</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err: any) {
    res.status(500).send('Error generating sitemap');
  }
}

export function getRobotsTxt(req: Request, res: Response): void {
  const robots = `# iTorgo Robots.txt — Search Engine Crawling Policy
User-agent: *
Allow: /
Allow: /auctions
Allow: /categories
Allow: /how-it-works
Allow: /about
Allow: /contact
Allow: /privacy
Allow: /terms
Allow: /uploads/auctions/

# Disallow private and administrative areas
Disallow: /admin/
Disallow: /admin
Disallow: /dashboard/
Disallow: /dashboard
Disallow: /api/
Disallow: /uploads/kyc/

# Sitemap Location
Sitemap: https://www.itorgo.kg/sitemap.xml
`;
  res.header('Content-Type', 'text/plain');
  res.send(robots);
}
