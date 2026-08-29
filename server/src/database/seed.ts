import bcrypt from 'bcryptjs';
import { Database } from 'better-sqlite3';
import { getDatabase } from '../config/database.js';
import { config } from '../config/env.js';
import { initializeSchema } from './schema.js';

export function seedDatabase(db: Database): void {
  // Initialize schema first
  initializeSchema(db);

  // Production safety: demo seeding must be explicitly opted in with
  // SEED_DATABASE=true; otherwise a fresh production DB starts empty.
  if (config.nodeEnv === 'production' && process.env.SEED_DATABASE !== 'true') {
    console.log('ℹ️ Production mode: skipping demo seed (set SEED_DATABASE=true to force).');
    return;
  }
  if (process.env.SEED_DATABASE === 'false') {
    console.log('ℹ️ SEED_DATABASE=false: skipping seed.');
    return;
  }

  // Check if already seeded
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    console.log('Database already has users, skipping full seed (or updating admin).');
    return;
  }

  console.log('🌱 Seeding iTorgo database with initial data...');

  const salt = bcrypt.genSaltSync(10);
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminPass123!';
  const adminPasswordHash = bcrypt.hashSync(adminPassword, salt);
  const demoPasswordHash = bcrypt.hashSync('DemoPass123!', salt);
  const sellerPasswordHash = bcrypt.hashSync('SellerPass123!', salt);

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, email, password_hash, full_name, phone, avatar, city, district, role, status, kyc_status, inn, balance_minor, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertUserSettings = db.prepare(`
    INSERT INTO user_settings (user_id, email_bids, email_outbid, email_won, push_bids, push_live, marketing, two_factor_enabled)
    VALUES (?, 1, 1, 1, 1, 1, 0, 0)
  `);

  // 1. Admin User
  insertUser.run(
    'admin-001',
    'admin',
    'admin@itorgo.kg',
    adminPasswordHash,
    'Башкы Администратор',
    '+996 555 999888',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    'Бишкек',
    'Биринчи Май району',
    'admin',
    'active',
    'verified',
    '12345678901234',
    100000000, // 1,000,000.00 KGS
    new Date(Date.now() - 30 * 86400000).toISOString()
  );
  insertUserSettings.run('admin-001');
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log('⚠️ Seeded admin password is the default (AdminPass123!) — set SEED_ADMIN_PASSWORD before any real deployment.');
  }

  // 2. Demo Buyer (Ulan Asanov)
  insertUser.run(
    'user-001',
    'ulan',
    'ulan@itorgo.kg',
    demoPasswordHash,
    'Улан Асанов',
    '+996 700 123456',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    'Бишкек',
    'Октябрь району',
    'buyer',
    'active',
    'verified',
    '20101199012345',
    55000000, // 550,000.00 KGS
    new Date(Date.now() - 20 * 86400000).toISOString()
  );
  insertUserSettings.run('user-001');

  // 3. Demo Sellers
  const sellers = [
    {
      id: 'user-201',
      username: 'bakyt_musaev',
      email: 'bakyt@itorgo.kg',
      name: 'Бакытбек Мусаев',
      phone: '+996 702 334455',
      city: 'Нарын',
      district: 'Кочкор р-ну',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      inn: '20101198500111',
    },
    {
      id: 'user-202',
      username: 'azamat_bakirov',
      email: 'azamat@itorgo.kg',
      name: 'Азамат Бакиров',
      phone: '+996 550 778899',
      city: 'Бишкек',
      district: 'Октябрь району',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      inn: '20101198800222',
    },
    {
      id: 'user-203',
      username: 'kuban_sultanov',
      email: 'kuban@itorgo.kg',
      name: 'Кубанычбек Султанов',
      phone: '+996 777 445566',
      city: 'Бишкек',
      district: 'Свердлов району (Дордой)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      inn: '20101198200333',
    },
    {
      id: 'user-204',
      username: 'cholpon_altyn',
      email: 'cholpon@itorgo.kg',
      name: 'Чолпон Жумабекова',
      phone: '+996 500 112233',
      city: 'Ош',
      district: 'Сулайман-Тоо р-ну',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      inn: '10101199200444',
    },
  ];

  for (const s of sellers) {
    insertUser.run(
      s.id,
      s.username,
      s.email,
      sellerPasswordHash,
      s.name,
      s.phone,
      s.avatar,
      s.city,
      s.district,
      'seller',
      'active',
      'verified',
      s.inn,
      120000000,
      new Date(Date.now() - 15 * 86400000).toISOString()
    );
    insertUserSettings.run(s.id);
  }

  // 4. KYC Verifications
  const insertKyc = db.prepare(`
    INSERT INTO kyc_verifications (id, user_id, inn, id_front_url, id_back_url, selfie_url, proof_of_address_url, aml_status, sanctions_status, pep_status, status, reviewed_by, reviewed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertKyc.run(
    'kyc-001',
    'user-001',
    '20101199012345',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80',
    'clean',
    'clean',
    'none',
    'approved',
    'admin-001',
    new Date(Date.now() - 18 * 86400000).toISOString(),
    new Date(Date.now() - 19 * 86400000).toISOString()
  );

  // 5. Payout Methods
  const insertPayoutMethod = db.prepare(`
    INSERT INTO payout_methods (id, user_id, bank_code, bank_name, account_number, account_holder_name, inn, is_verified, is_default, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPayoutMethod.run(
    'pm-001',
    'user-001',
    'mbank',
    'MBank',
    '1180000123456789',
    'Улан Асанов',
    '20101199012345',
    1,
    1,
    new Date().toISOString()
  );

  insertPayoutMethod.run(
    'pm-002',
    'user-001',
    'optima',
    'Optima Bank',
    '1091800098765432',
    'Улан Асанов',
    '20101199012345',
    1,
    0,
    new Date().toISOString()
  );

  // 6. Categories
  const categories = [
    {
      id: 'livestock',
      slug: 'livestock',
      name_ky: 'Мал чарбасы',
      name_ru: 'Сельское хозяйство и скот',
      name_tr: 'Hayvancılık',
      icon: 'Beef',
      sub_categories: ['Саан уйлар', 'Букалар', 'Жылкылар', 'Кой жана кочкорлор', 'Эчкилер', 'Тоют жана жем'],
      order: 1,
    },
    {
      id: 'vehicles',
      slug: 'vehicles',
      name_ky: 'Автоунаалар',
      name_ru: 'Автотранспорт',
      name_tr: 'Araçlar',
      icon: 'Car',
      sub_categories: ['Жеңил автоунаалар', 'Жүк ташуучулар', 'Спецтехника', 'Мототехника', 'Автотетиктер'],
      order: 2,
    },
    {
      id: 'real-estate',
      slug: 'real-estate',
      name_ky: 'Кыймылсыз мүлк',
      name_ru: 'Недвижимость',
      name_tr: 'Gayrimenkul',
      icon: 'Building2',
      sub_categories: ['Батирлер', 'Үйлөр жана жер тилкелери', 'Коммерциялык мүлк / Дордой', 'Кампалар жана өндүрүш'],
      order: 3,
    },
    {
      id: 'electronics',
      slug: 'electronics',
      name_ky: 'Электроника',
      name_ru: 'Электроника',
      name_tr: 'Elektronik',
      icon: 'Laptop',
      sub_categories: ['Смартфондор', 'Ноутбук жана ПК', 'Фото жана видео', 'Тиричилик техникасы'],
      order: 4,
    },
    {
      id: 'antiques',
      slug: 'antiques',
      name_ky: 'Антиквариат жана өнөр',
      name_ru: 'Антиквариат и искусство',
      name_tr: 'Antika ve Sanat',
      icon: 'Crown',
      sub_categories: ['Улуттук жасалгалар', 'Сүрөттөр', 'Нумизматика', 'Килемдер'],
      order: 5,
    },
    {
      id: 'jewelry',
      slug: 'jewelry',
      name_ky: 'Зергерлик буюмдар',
      name_ru: 'Ювелирные изделия',
      name_tr: 'Mücevher',
      icon: 'Gem',
      sub_categories: ['Алтын', 'Күмүш', 'Баалуу таштар', 'Кол сааттар'],
      order: 6,
    },
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (id, slug, name_ky, name_ru, name_tr, icon, sub_categories_json, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of categories) {
    insertCategory.run(c.id, c.slug, c.name_ky, c.name_ru, c.name_tr, c.icon, JSON.stringify(c.sub_categories), c.order);
  }

  // 7. Auctions
  const auctions = [
    {
      id: '1',
      title: 'Ат Чабышка даярдалган Кыргыз күлүгү (5 жашар айгыр)',
      description: 'Ат чабыш жана Көк бөрү оюндары үчүн атайын машыктырылган, 5 жаштагы таза кандуу кыргыз тукумундагы күлүк айгыр. Бир нече жергиликтүү мелдеште байге алган, чуркоо ылдамдыгы жана чыдамкайлыгы жогору. Бардык ветеринардык эмдөөлөрү жасалган, паспорту бар. Нарын облусунун Кочкор районундагы ат базарынан чыгарылды.',
      category: 'livestock',
      sub_category: 'Күлүк жылкылар',
      images: [
        'https://images.unsplash.com/photo-1597119275334-359a0ccb6ae4?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1562566285-e9bc8523c333?auto=format&fit=crop&w=1200&q=80',
      ],
      starting_price_minor: 15000000,
      current_price_minor: 19500000,
      reserve_price_minor: 20000000,
      buy_now_price_minor: 23500000,
      bid_increment_minor: 300000,
      bid_count: 16,
      status: 'active',
      seller_id: 'user-201',
      city: 'Нарын',
      region_id: 'naryn',
      district: 'Кочкор р-ну',
      views_count: 1890,
      is_blitz: 0,
      is_featured: 1,
      start_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      ends_at: new Date(Date.now() + 3600000 * 24).toISOString(),
      attributes: {
        animalType: 'horse',
        breed: 'Кыргыз тукумундагы күлүк',
        ageYears: 5,
        weightKg: 410,
        isVaccinated: true,
        hasVetPassport: true,
        deliveryAvailable: true,
      },
    },
    {
      id: '2',
      title: 'Toyota Camry 70 (2020) 2.5 SE — Бажы төлөнгөн, Таза',
      description: 'АКШдан жаңы келген, бажы төлөмдөрү (растаможка) 100% толук төлөнгөн. Мотор, коробка жана ходовой бөлүгү идеалдуу. Комплектациясы SE: кара тери салон, люк, дистроник, тилкеден чыкпоо тутуму. Карфакс таза.',
      category: 'vehicles',
      sub_category: 'Жеңил автоунаалар',
      images: [
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
      ],
      starting_price_minor: 145000000,
      current_price_minor: 162000000,
      reserve_price_minor: 165000000,
      buy_now_price_minor: 175000000,
      bid_increment_minor: 2000000,
      bid_count: 23,
      status: 'active',
      seller_id: 'user-202',
      city: 'Бишкек',
      region_id: 'bishkek',
      district: 'Октябрь району',
      views_count: 3420,
      is_blitz: 0,
      is_featured: 1,
      start_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      ends_at: new Date(Date.now() + 3600000 * 48).toISOString(),
      attributes: {
        brand: 'Toyota',
        model: 'Camry 70',
        year: 2020,
        mileageKm: 68000,
        steering: 'left',
        fuelType: 'petrol',
        transmission: 'automatic',
        engineVolume: 2.5,
        isCustomsCleared: true,
        condition: 'perfect',
      },
    },
    {
      id: '3',
      title: 'Дордой базары — 2 кабаттуу соода контейнери (Европа өтмөгү)',
      description: 'Дордой базарындагы өтө өтүмдүү 1-катардагы кош контейнер. Учурда иштеп жатат, ай сайын туруктуу 180 000 сом ижара кирешеси бар. Бардык документтери (Кызыл китеп / Техпаспорт) бар. Дароо өз атыңызга өткөрүп берем.',
      category: 'real-estate',
      sub_category: 'Коммерциялык мүлк / Дордой',
      images: [
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      ],
      starting_price_minor: 280000000,
      current_price_minor: 325000000,
      reserve_price_minor: 330000000,
      buy_now_price_minor: 360000000,
      bid_increment_minor: 5000000,
      bid_count: 19,
      status: 'active',
      seller_id: 'user-203',
      city: 'Бишкек',
      region_id: 'bishkek',
      district: 'Свердлов району (Дордой)',
      views_count: 4100,
      is_blitz: 0,
      is_featured: 1,
      start_at: new Date(Date.now() - 3600000 * 30).toISOString(),
      ends_at: new Date(Date.now() + 3600000 * 72).toISOString(),
      attributes: {
        propertyType: 'dordoy_container',
        areaSqm: 48,
        deedType: 'red_book',
        floor: 2,
        totalFloors: 2,
        monthlyRevenue: 180000,
      },
    },
    {
      id: '4',
      title: 'Асыл тукум Кыргыз жылкысы / Күлүк аргымак (3 жаш)',
      description: 'Улак тартышка жана ат чабышка тапталган таза кандуу кыргыз тукумундагы аргымак. Дене түзүлүшү чың, буттары бекем, эч кандай кемчилиги жок. Токмок шаарынан келип көргөнгө болот.',
      category: 'livestock',
      sub_category: 'Жылкылар',
      images: [
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=80',
      ],
      starting_price_minor: 22000000,
      current_price_minor: 28500000,
      reserve_price_minor: 29000000,
      buy_now_price_minor: 32000000,
      bid_increment_minor: 500000,
      bid_count: 14,
      status: 'active',
      seller_id: 'user-201',
      city: 'Чүй',
      region_id: 'chuy',
      district: 'Токмок шаары',
      views_count: 2200,
      is_blitz: 1,
      is_featured: 0,
      start_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      ends_at: new Date(Date.now() + 3600000 * 10).toISOString(),
      attributes: {
        animalType: 'horse',
        breed: 'Кыргыз аргымагы',
        ageYears: 3,
        weightKg: 460,
        isVaccinated: true,
        hasVetPassport: true,
        deliveryAvailable: true,
      },
    },
    {
      id: '5',
      title: 'MacBook Pro 16" M3 Max (36GB / 1TB SSD) Space Black',
      description: 'Идеалдуу абалда, эч кандай чийиги жок. Батарея сыйымдуулугу 99%. Комплектинде оригинал 140W кубаттагычы жана кутусу бар. Бишкек шаары ичинде акысыз жеткирүү.',
      category: 'electronics',
      sub_category: 'Ноутбук жана ПК',
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1200&q=80',
      ],
      starting_price_minor: 16000000,
      current_price_minor: 18500000,
      reserve_price_minor: 19000000,
      buy_now_price_minor: 21000000,
      bid_increment_minor: 500000,
      bid_count: 8,
      status: 'active',
      seller_id: 'user-202',
      city: 'Бишкек',
      region_id: 'bishkek',
      district: 'Биринчи Май р-ну',
      views_count: 980,
      is_blitz: 0,
      is_featured: 0,
      start_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      ends_at: new Date(Date.now() + 3600000 * 36).toISOString(),
      attributes: {},
    },
  ];

  const insertAuction = db.prepare(`
    INSERT INTO auctions (
      id, title, description, category, sub_category, images_json,
      starting_price_minor, current_price_minor, reserve_price_minor, buy_now_price_minor, bid_increment_minor,
      currency, bid_count, status, seller_id, city, region_id, district,
      views_count, is_blitz, is_featured, start_at, ends_at, attributes_json, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const a of auctions) {
    insertAuction.run(
      a.id,
      a.title,
      a.description,
      a.category,
      a.sub_category,
      JSON.stringify(a.images),
      a.starting_price_minor,
      a.current_price_minor,
      a.reserve_price_minor,
      a.buy_now_price_minor,
      a.bid_increment_minor,
      'KGS',
      a.bid_count,
      a.status,
      a.seller_id,
      a.city,
      a.region_id,
      a.district,
      a.views_count,
      a.is_blitz,
      a.is_featured,
      a.start_at,
      a.ends_at,
      JSON.stringify(a.attributes),
      a.start_at,
      new Date().toISOString()
    );
  }

  // 8. Bids for Auction 1 and Auction 5
  const insertBid = db.prepare(`
    INSERT INTO bids (id, auction_id, bidder_id, amount_minor, currency, status, is_winning, sequence_num, ip_address, placed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBid.run(
    'bid-101',
    '1',
    'user-001',
    11800000,
    'KGS',
    'winning',
    1,
    1,
    '127.0.0.1',
    new Date(Date.now() - 3600000 * 2).toISOString()
  );

  insertBid.run(
    'bid-102',
    '5',
    'user-001',
    18500000,
    'KGS',
    'winning',
    1,
    1,
    '127.0.0.1',
    new Date(Date.now() - 3600000 * 1).toISOString()
  );

  // 9. Watchlist for user-001
  const insertWatchlist = db.prepare(`
    INSERT INTO watchlists (id, user_id, auction_id, created_at)
    VALUES (?, ?, ?, ?)
  `);
  insertWatchlist.run('wl-001', 'user-001', '1', new Date().toISOString());
  insertWatchlist.run('wl-002', 'user-001', '2', new Date().toISOString());

  // 10. Sample Payout Request
  const insertPayoutRequest = db.prepare(`
    INSERT INTO payout_requests (id, user_id, payout_method_id, amount_minor, currency, bank_code, bank_name, account_number, account_holder_name, inn, status, requested_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPayoutRequest.run(
    'payout-req-001',
    'user-001',
    'pm-001',
    2500000, // 25,000.00 KGS
    'KGS',
    'mbank',
    'MBank',
    '1180000123456789',
    'Улан Асанов',
    '20101199012345',
    'pending',
    new Date(Date.now() - 3600000 * 5).toISOString()
  );

  // 11. Sample Dispute
  const insertDispute = db.prepare(`
    INSERT INTO disputes (id, auction_id, complainant_id, respondent_id, reason, status, resolution, refund_amount_minor, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertDispute.run(
    'disp-001',
    '1',
    'user-001',
    'user-201',
    'Жеткирүү маалыматы такталбады, сатуучу байланышка чыкпай жатат.',
    'under_review',
    'Администратор сатуучу менен байланышуу аракетинде.',
    0,
    new Date(Date.now() - 86400000).toISOString()
  );

  console.log('✅ Seed completed successfully! Users, auctions, bids, and KYC loaded.');
}

// Standalone execution if run via CLI
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const db = getDatabase();
  seedDatabase(db);
}
