/**
 * High-Fidelity In-Process Mock / Contract Server for Auktsion v2.0
 * Implements 100% of REST API contracts specified in PROJECT.md, TEST_INFRA.md, and AUKTSION_V2_TECHNICAL_REPORT.md.
 * Zero external dependencies. Uses Node.js native http module.
 */

import http from 'node:http';
import { URL } from 'node:url';

export class MockAuctionServer {
  constructor(options = {}) {
    this.port = options.port || 0; // 0 = random available port
    this.server = null;
    this.baseUrl = '';
    this.initialSeed = options.initialSeed || this.getDefaultSeed();
    this.state = JSON.parse(JSON.stringify(this.initialSeed));
  }

  getDefaultSeed() {
    return {
      users: [
        {
          id: 'user-admin-001',
          username: 'superadmin',
          email: 'admin@auktsion.kg',
          password_hash: 'hashed_admin_pass_123',
          password: 'Password123!',
          full_name: 'Admin User',
          phone: '+996555123456',
          role: 'admin',
          status: 'active',
          kyc_status: 'verified',
          inn: '20101199001234',
          city: 'Бишкек',
          balance_minor: 100000000, // 1,000,000.00 KGS
          avatar: '/avatars/admin.png',
          created_at: new Date('2026-01-01').toISOString()
        },
        {
          id: 'user-seller-001',
          username: 'akylbek_seller',
          email: 'seller@auktsion.kg',
          password_hash: 'hashed_seller_pass_123',
          password: 'Password123!',
          full_name: 'Акылбек Жээнбеков',
          phone: '+996700112233',
          role: 'seller',
          status: 'active',
          kyc_status: 'verified',
          inn: '10203198500987',
          city: 'Ош',
          balance_minor: 50000000, // 500,000.00 KGS
          avatar: '/avatars/seller.png',
          created_at: new Date('2026-01-10').toISOString()
        },
        {
          id: 'user-buyer-001',
          username: 'bakyt_buyer',
          email: 'buyer@auktsion.kg',
          password_hash: 'hashed_buyer_pass_123',
          password: 'Password123!',
          full_name: 'Бакыт Садыков',
          phone: '+996772445566',
          role: 'buyer',
          status: 'active',
          kyc_status: 'not_started',
          inn: '20504199200456',
          city: 'Бишкек',
          balance_minor: 25000000, // 250,000.00 KGS
          avatar: '/avatars/buyer.png',
          created_at: new Date('2026-02-01').toISOString()
        },
        {
          id: 'user-banned-001',
          username: 'fraud_user',
          email: 'banned@auktsion.kg',
          password_hash: 'hashed_banned_pass_123',
          password: 'Password123!',
          full_name: 'Suspended Account',
          phone: '+996500998877',
          role: 'buyer',
          status: 'banned',
          kyc_status: 'rejected',
          inn: '11111111111111',
          city: 'Бишкек',
          balance_minor: 0,
          avatar: '',
          created_at: new Date('2026-02-15').toISOString()
        }
      ],
      tokens: {
        'token-admin-123': 'user-admin-001',
        'token-seller-123': 'user-seller-001',
        'token-buyer-123': 'user-buyer-001',
        'token-banned-123': 'user-banned-001'
      },
      auctions: [
        {
          id: 'lot-101',
          title: 'Ала-Тоо Буурасы (Элитный производитель)',
          description: 'Породистый племенной бык ала-тауской породы, возраст 3 года, вес 820 кг.',
          category: 'livestock',
          sub_category: 'cows',
          starting_price_minor: 15000000, // 150,000 KGS
          current_price_minor: 17500000, // 175,000 KGS
          reserve_price_minor: 16000000,
          bid_increment_minor: 500000, // 5,000 KGS
          currency: 'KGS',
          bid_count: 5,
          status: 'active',
          seller_id: 'user-seller-001',
          city: 'Ош',
          region_id: 'osh',
          images: ['/images/lots/bull1.jpg'],
          is_featured: true,
          is_blitz: false,
          is_paused: false,
          start_at: new Date(Date.now() - 86400000).toISOString(),
          ends_at: new Date(Date.now() + 86400000 * 3).toISOString(),
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'lot-102',
          title: 'Toyota Land Cruiser 200 (2018, Юбилейная)',
          description: 'Отличное состояние, растаможен, 4.5D дизель, пробег 95,000 км.',
          category: 'vehicles',
          sub_category: 'suv',
          starting_price_minor: 350000000, // 3,500,000 KGS
          current_price_minor: 380000000, // 3,800,000 KGS
          reserve_price_minor: 360000000,
          bid_increment_minor: 10000000, // 100,000 KGS
          currency: 'KGS',
          bid_count: 3,
          status: 'active',
          seller_id: 'user-seller-001',
          city: 'Бишкек',
          region_id: 'bishkek',
          images: ['/images/lots/lc200.jpg'],
          is_featured: true,
          is_blitz: false,
          is_paused: false,
          start_at: new Date(Date.now() - 43200000).toISOString(),
          ends_at: new Date(Date.now() + 86400000 * 2).toISOString(),
          created_at: new Date(Date.now() - 43200000).toISOString()
        },
        {
          id: 'lot-103',
          title: 'Участок 6 соток, с. Кок-Жар (Красная книга)',
          description: 'Все коммуникации подведены: газ, свет, центральная вода, канализация.',
          category: 'real_estate',
          sub_category: 'land',
          starting_price_minor: 400000000, // 4,000,000 KGS
          current_price_minor: 400000000,
          reserve_price_minor: 420000000,
          bid_increment_minor: 10000000,
          currency: 'KGS',
          bid_count: 0,
          status: 'active',
          seller_id: 'user-seller-001',
          city: 'Бишкек',
          region_id: 'chuy',
          images: ['/images/lots/land1.jpg'],
          is_featured: false,
          is_blitz: false,
          is_paused: false,
          start_at: new Date(Date.now() - 100000).toISOString(),
          ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
          created_at: new Date(Date.now() - 100000).toISOString()
        },
        {
          id: 'lot-104',
          title: 'Национальный войлочный шырдак (ручная работа 1980г)',
          description: 'Аутентичный нарынский орнамент, 3.5x2 метра, идеальная сохранность.',
          category: 'antiques',
          sub_category: 'textile',
          starting_price_minor: 4500000, // 45,000 KGS
          current_price_minor: 5200000, // 52,000 KGS
          reserve_price_minor: 4800000,
          bid_increment_minor: 100000,
          currency: 'KGS',
          bid_count: 7,
          status: 'pending_approval',
          seller_id: 'user-seller-001',
          city: 'Нарын',
          region_id: 'naryn',
          images: ['/images/lots/shyrdak.jpg'],
          is_featured: false,
          is_blitz: false,
          is_paused: false,
          start_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 86400000 * 7).toISOString(),
          created_at: new Date().toISOString()
        }
      ],
      bids: [
        {
          id: 'bid-001',
          auction_id: 'lot-101',
          bidder_id: 'user-buyer-001',
          amount_minor: 17500000,
          currency: 'KGS',
          is_winning: true,
          is_cancelled: false,
          sequence_num: 5,
          ip_address: '212.112.98.14',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'bid-002',
          auction_id: 'lot-102',
          bidder_id: 'user-buyer-001',
          amount_minor: 380000000,
          currency: 'KGS',
          is_winning: true,
          is_cancelled: false,
          sequence_num: 3,
          ip_address: '212.112.98.14',
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      kyc_records: [
        {
          id: 'kyc-001',
          user_id: 'user-buyer-001',
          document_type: 'passport',
          document_number: 'ID2045612',
          inn: '20504199200456',
          document_url: '/uploads/kyc/passport_buyer.jpg',
          selfie_url: '/uploads/kyc/selfie_buyer.jpg',
          status: 'pending',
          rejection_reason: null,
          reviewed_by: null,
          reviewed_at: null,
          created_at: new Date().toISOString()
        }
      ],
      payout_methods: [
        {
          id: 'pm-001',
          user_id: 'user-seller-001',
          provider: 'mbank',
          bank_name: 'MBank (Коммерческий банк КЫРГЫЗСТАН)',
          account_number: '+996700112233',
          account_holder_name: 'Акылбек Жээнбеков',
          is_default: true,
          created_at: new Date('2026-01-15').toISOString()
        },
        {
          id: 'pm-002',
          user_id: 'user-seller-001',
          provider: 'optima',
          bank_name: 'Оптима Банк',
          account_number: '4169580012345678',
          account_holder_name: 'Акылбек Жээнбеков',
          is_default: false,
          created_at: new Date('2026-01-20').toISOString()
        }
      ],
      payout_requests: [
        {
          id: 'payout-001',
          user_id: 'user-seller-001',
          amount_minor: 5000000, // 50,000 KGS
          currency: 'KGS',
          provider: 'mbank',
          account_number: '+996700112233',
          status: 'pending',
          admin_notes: null,
          processed_at: null,
          created_at: new Date().toISOString()
        }
      ],
      disputes: [
        {
          id: 'dsp-001',
          auction_id: 'lot-101',
          auction_title: 'Ала-Тоо Буурасы (Элитный производитель)',
          complainant_id: 'user-buyer-001',
          respondent_id: 'user-seller-001',
          reason: 'damaged_item',
          description: 'Ветеринарный паспорт не совпадает с заявленным номером',
          status: 'open',
          resolution: null,
          refund_minor: 0,
          created_at: new Date().toISOString()
        }
      ],
      user_settings: {
        'user-admin-001': { email_bids: true, email_outbid: true, push_live: true, two_factor_enabled: true },
        'user-seller-001': { email_bids: true, email_outbid: true, push_live: true, two_factor_enabled: false },
        'user-buyer-001': { email_bids: true, email_outbid: true, push_live: true, two_factor_enabled: false }
      },
      watchlists: {
        'user-buyer-001': ['lot-101', 'lot-102']
      },
      fraud_alerts: [
        {
          id: 'frd-001',
          alert_type: 'aml_threshold',
          severity: 'medium',
          auction_id: 'lot-102',
          target_user_id: 'user-buyer-001',
          details: 'Bid exceeds AML 30,000 SOM NBKR reporting threshold',
          created_at: new Date().toISOString()
        }
      ]
    };
  }

  reset(customSeed = null) {
    const seed = customSeed || this.initialSeed || this.getDefaultSeed();
    this.state = JSON.parse(JSON.stringify(seed));
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => this.handleRequest(req, res));
      this.server.listen(this.port, '127.0.0.1', () => {
        const address = this.server.address();
        this.port = address.port;
        this.baseUrl = `http://127.0.0.1:${this.port}`;
        resolve(this.baseUrl);
      });
      this.server.on('error', reject);
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  getUserFromAuth(req) {
    const authHeader = req.headers['authorization'] || '';
    if (!authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7).trim();
    const userId = this.state.tokens[token];
    if (!userId) return null;
    return this.state.users.find(u => u.id === userId) || null;
  }

  async parseBody(req) {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
    });
  }

  sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Custom-Header',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    });
    res.end(JSON.stringify(data));
  }

  async handleRequest(req, res) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Custom-Header',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      });
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;
    const query = Object.fromEntries(parsedUrl.searchParams.entries());
    const body = await this.parseBody(req);
    const currentUser = this.getUserFromAuth(req);

    try {
      // ----------------------------------------------------
      // Health & Categories & Regions
      // ----------------------------------------------------
      if (pathname === '/api/health' && method === 'GET') {
        return this.sendJson(res, 200, { success: true, status: 'ok', time: new Date().toISOString() });
      }

      if (pathname === '/api/categories' && method === 'GET') {
        return this.sendJson(res, 200, {
          success: true,
          data: [
            { id: 'livestock', name_ru: 'Сельхоз животные', name_ky: 'Мал чарбасы', count: 12 },
            { id: 'vehicles', name_ru: 'Транспорт', name_ky: 'Автоунаалар', count: 28 },
            { id: 'real_estate', name_ru: 'Недвижимость', name_ky: 'Кыймылсыз мүлк', count: 15 },
            { id: 'antiques', name_ru: 'Антиквариат', name_ky: 'Антиквариат', count: 6 },
            { id: 'electronics', name_ru: 'Электроника', name_ky: 'Электроника', count: 42 }
          ]
        });
      }

      if (pathname === '/api/regions' && method === 'GET') {
        return this.sendJson(res, 200, {
          success: true,
          data: [
            { id: 'bishkek', name: 'Бишкек' },
            { id: 'osh', name: 'Ош' },
            { id: 'chuy', name: 'Чүй' },
            { id: 'issyk_kul', name: 'Ысык-Көл' },
            { id: 'jalal_abad', name: 'Жалал-Абад' },
            { id: 'naryn', name: 'Нарын' },
            { id: 'talas', name: 'Талас' },
            { id: 'batken', name: 'Баткен' }
          ]
        });
      }

      // ----------------------------------------------------
      // 1. Authentication Endpoints
      // ----------------------------------------------------
      if (pathname === '/api/auth/register' && method === 'POST') {
        const { email, password, full_name, fullName, phone, username } = body;
        const uName = username || (email ? email.split('@')[0] : 'user');
        const fName = full_name || fullName || uName;

        if (!email || !password) {
          return this.sendJson(res, 400, { success: false, message: 'Email and password are required' });
        }
        if (typeof password === 'string' && password.length < 6) {
          return this.sendJson(res, 400, { success: false, message: 'Password must be at least 6 characters' });
        }

        const existing = this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          return this.sendJson(res, 409, { success: false, message: 'User with this email already exists' });
        }

        const newUser = {
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          username: uName,
          email: email.toLowerCase(),
          password_hash: `hash_${password}`,
          password,
          full_name: fName,
          phone: phone || '+996000000000',
          role: 'buyer',
          status: 'active',
          kyc_status: 'not_started',
          inn: '',
          city: 'Бишкек',
          balance_minor: 2500000, // 25,000.00 KGS
          avatar: '',
          created_at: new Date().toISOString()
        };

        const token = `token-${newUser.id}`;
        this.state.users.push(newUser);
        this.state.tokens[token] = newUser.id;

        return this.sendJson(res, 201, {
          success: true,
          token,
          user: { ...newUser, password_hash: undefined, password: undefined }
        });
      }

      if (pathname === '/api/auth/login' && method === 'POST') {
        const { email, password } = body;
        if (!email || !password) {
          return this.sendJson(res, 400, { success: false, message: 'Email and password are required' });
        }

        const user = this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user || (user.password !== password && user.password_hash !== `hash_${password}`)) {
          return this.sendJson(res, 401, { success: false, message: 'Invalid credentials' });
        }

        if (user.status === 'banned' || user.status === 'suspended') {
          return this.sendJson(res, 403, { success: false, message: 'Account is banned or suspended' });
        }

        const token = `token-${user.id}-${Date.now()}`;
        this.state.tokens[token] = user.id;

        return this.sendJson(res, 200, {
          success: true,
          token,
          user: { ...user, password_hash: undefined, password: undefined }
        });
      }

      if (pathname === '/api/auth/me' && method === 'GET') {
        if (!currentUser) {
          return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        }
        if (currentUser.status === 'banned' || currentUser.status === 'suspended') {
          return this.sendJson(res, 403, { success: false, message: 'Account is banned or suspended' });
        }
        return this.sendJson(res, 200, {
          success: true,
          user: { ...currentUser, password_hash: undefined, password: undefined }
        });
      }

      if (pathname === '/api/auth/logout' && method === 'POST') {
        return this.sendJson(res, 200, { success: true, message: 'Logged out' });
      }

      // ----------------------------------------------------
      // 2. User Profile & Dashboard Endpoints
      // ----------------------------------------------------
      if (pathname === '/api/user/profile' && method === 'GET') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        return this.sendJson(res, 200, {
          success: true,
          data: { ...currentUser, password_hash: undefined, password: undefined }
        });
      }

      if (pathname === '/api/user/profile' && method === 'PUT') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        if (body.full_name) currentUser.full_name = body.full_name;
        if (body.fullName) currentUser.full_name = body.fullName;
        if (body.phone) currentUser.phone = body.phone;
        if (body.city) currentUser.city = body.city;
        if (body.district) currentUser.district = body.district;
        if (body.avatar) currentUser.avatar = body.avatar;

        return this.sendJson(res, 200, {
          success: true,
          data: { ...currentUser, password_hash: undefined, password: undefined }
        });
      }

      if (pathname === '/api/user/password' && method === 'PUT') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        const { currentPassword, newPassword } = body;
        if (!currentPassword || !newPassword) {
          return this.sendJson(res, 400, { success: false, message: 'Both current and new passwords required' });
        }
        if (currentUser.password !== currentPassword && currentUser.password_hash !== `hash_${currentPassword}`) {
          return this.sendJson(res, 400, { success: false, message: 'Incorrect current password' });
        }
        currentUser.password = newPassword;
        currentUser.password_hash = `hash_${newPassword}`;
        return this.sendJson(res, 200, { success: true, message: 'Password updated successfully' });
      }

      if (pathname === '/api/user/settings' && method === 'GET') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        const settings = this.state.user_settings[currentUser.id] || { email_bids: true, email_outbid: true, push_live: true };
        return this.sendJson(res, 200, { success: true, data: settings });
      }

      if (pathname === '/api/user/settings' && method === 'PUT') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        this.state.user_settings[currentUser.id] = {
          ...(this.state.user_settings[currentUser.id] || {}),
          ...body
        };
        return this.sendJson(res, 200, { success: true, data: this.state.user_settings[currentUser.id] });
      }

      if (pathname === '/api/user/listings' && method === 'GET') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        const userListings = this.state.auctions.filter(a => a.seller_id === currentUser.id);
        return this.sendJson(res, 200, { success: true, data: userListings, count: userListings.length });
      }

      if (pathname === '/api/user/bids' && method === 'GET') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        const userBids = this.state.bids.filter(b => b.bidder_id === currentUser.id);
        return this.sendJson(res, 200, { success: true, data: userBids, count: userBids.length });
      }

      if (pathname === '/api/user/kyc' && method === 'GET') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        const kyc = this.state.kyc_records.find(k => k.user_id === currentUser.id) || null;
        return this.sendJson(res, 200, { success: true, data: kyc, status: currentUser.kyc_status });
      }

      if (pathname === '/api/user/kyc' && method === 'POST') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        const { inn, document_type, document_number, document_url, selfie_url } = body;
        if (!inn || inn.length !== 14 || !/^\d{14}$/.test(inn)) {
          return this.sendJson(res, 400, { success: false, message: 'Valid 14-digit Kyrgyz INN is required' });
        }

        currentUser.inn = inn;
        currentUser.kyc_status = 'pending';

        const record = {
          id: `kyc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          user_id: currentUser.id,
          document_type: document_type || 'passport',
          document_number: document_number || 'ID1234567',
          inn,
          document_url: document_url || '/uploads/kyc/doc.jpg',
          selfie_url: selfie_url || '/uploads/kyc/selfie.jpg',
          status: 'pending',
          created_at: new Date().toISOString()
        };

        const existingIdx = this.state.kyc_records.findIndex(k => k.user_id === currentUser.id);
        if (existingIdx >= 0) {
          this.state.kyc_records[existingIdx] = record;
        } else {
          this.state.kyc_records.push(record);
        }

        return this.sendJson(res, 201, { success: true, data: record });
      }

      if (pathname === '/api/user/payout-methods' && method === 'GET') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        const methods = this.state.payout_methods.filter(m => m.user_id === currentUser.id);
        return this.sendJson(res, 200, { success: true, data: methods });
      }

      if (pathname === '/api/user/payout-methods' && method === 'POST') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        const { provider, bank_name, account_number, account_holder_name } = body;
        const validProviders = ['mbank', 'optima', 'demirbank', 'elqr', 'o_nom', 'o!dengi', 'o_dengi'];
        if (!provider || !account_number || !validProviders.includes(provider.toLowerCase())) {
          return this.sendJson(res, 400, { success: false, message: 'Valid Kyrgyz bank provider and account number required' });
        }

        const newMethod = {
          id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          user_id: currentUser.id,
          provider,
          bank_name: bank_name || provider.toUpperCase(),
          account_number,
          account_holder_name: account_holder_name || currentUser.full_name,
          is_default: this.state.payout_methods.filter(m => m.user_id === currentUser.id).length === 0,
          created_at: new Date().toISOString()
        };

        this.state.payout_methods.push(newMethod);
        return this.sendJson(res, 201, { success: true, data: newMethod });
      }

      if (pathname.startsWith('/api/user/payout-methods/') && method === 'DELETE') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        const methodId = pathname.split('/').pop();
        this.state.payout_methods = this.state.payout_methods.filter(m => !(m.id === methodId && m.user_id === currentUser.id));
        return this.sendJson(res, 200, { success: true, message: 'Payout method removed' });
      }

      if (pathname === '/api/user/payouts' && method === 'GET') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        const payouts = this.state.payout_requests.filter(p => p.user_id === currentUser.id);
        return this.sendJson(res, 200, { success: true, data: payouts });
      }

      if (pathname === '/api/user/payouts' && method === 'POST') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        const { amount, amount_minor, payout_method_id, provider, account_number } = body;
        let requestedMinor;
        if (amount_minor !== undefined && amount_minor !== null && amount_minor !== '') {
          requestedMinor = Number(amount_minor);
        } else if (amount !== undefined && amount !== null && amount !== '') {
          const amt = Number(amount);
          requestedMinor = Number.isFinite(amt) ? Math.round(amt * 100) : NaN;
        } else {
          requestedMinor = 0;
        }
        if (!Number.isFinite(requestedMinor) || !Number.isInteger(requestedMinor) || requestedMinor <= 0) {
          return this.sendJson(res, 400, { success: false, message: 'Invalid payout amount' });
        }

        if (currentUser.balance_minor < requestedMinor) {
          return this.sendJson(res, 400, { success: false, message: 'Insufficient balance for payout' });
        }

        currentUser.balance_minor -= requestedMinor;

        const payout = {
          id: `payout-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          user_id: currentUser.id,
          amount_minor: requestedMinor,
          currency: 'KGS',
          provider: provider || 'mbank',
          account_number: account_number || '+996555000000',
          status: 'pending',
          created_at: new Date().toISOString()
        };

        this.state.payout_requests.push(payout);
        return this.sendJson(res, 201, { success: true, data: payout });
      }

      if (pathname === '/api/user/watchlist' && method === 'GET') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        const lotIds = this.state.watchlists[currentUser.id] || [];
        const lots = this.state.auctions.filter(a => lotIds.includes(a.id));
        return this.sendJson(res, 200, { success: true, data: lots });
      }

      // ----------------------------------------------------
      // 3. Auction & Bidding Endpoints
      // ----------------------------------------------------
      if (pathname === '/api/auctions' && method === 'GET') {
        let results = [...this.state.auctions];

        if (query.category) {
          results = results.filter(a => a.category.toLowerCase() === query.category.toLowerCase());
        }
        if (query.status) {
          results = results.filter(a => a.status === query.status);
        }
        if (query.search) {
          const q = query.search.toLowerCase();
          results = results.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
        }
        if (query.region) {
          results = results.filter(a => a.region_id === query.region || a.city.toLowerCase() === query.region.toLowerCase());
        }

        const page = parseInt(query.page || '1', 10);
        const perPage = parseInt(query.perPage || query.limit || '20', 10);
        const startIndex = (page - 1) * perPage;
        const paginated = results.slice(startIndex, startIndex + perPage);

        return this.sendJson(res, 200, {
          success: true,
          data: paginated,
          meta: {
            total: results.length,
            page,
            perPage
          }
        });
      }

      if (pathname.match(/^\/api\/auctions\/([a-zA-Z0-9_-]+)$/) && method === 'GET') {
        const id = pathname.match(/^\/api\/auctions\/([a-zA-Z0-9_-]+)$/)[1];
        const auction = this.state.auctions.find(a => a.id === id);
        if (!auction) {
          return this.sendJson(res, 404, { success: false, message: 'Auction not found' });
        }
        const bids = this.state.bids.filter(b => b.auction_id === id);
        return this.sendJson(res, 200, {
          success: true,
          data: { ...auction, bids }
        });
      }

      if (pathname === '/api/auctions' && method === 'POST') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        const { title, description, category, starting_price, starting_price_minor, bid_increment_minor, min_bid_increment, ends_at, endsAt, durationHours, regionId } = body;

        if (!title || !category) {
          return this.sendJson(res, 400, { success: false, message: 'Title and category are required' });
        }

        const startPrice = starting_price_minor || (starting_price ? Math.round(starting_price * 100) : 100000);
        const increment = bid_increment_minor || (min_bid_increment ? Math.round(min_bid_increment * 100) : 50000);
        let endsAtValue = ends_at || endsAt;
        if (!endsAtValue && durationHours !== undefined && durationHours !== null) {
          const hours = Number(durationHours);
          if (Number.isFinite(hours) && hours !== 0) {
            endsAtValue = new Date(Date.now() + hours * 3600000).toISOString();
          } else if (hours === 0) {
            // duration 0 means use provided ends_at or default to 60s for test
            endsAtValue = null;
          }
        }
        if (!endsAtValue) {
          endsAtValue = new Date(Date.now() + 86400000 * 5).toISOString();
        } else {
          const parsed = new Date(endsAtValue).getTime();
          if (!Number.isFinite(parsed)) {
            endsAtValue = new Date(Date.now() + 86400000 * 5).toISOString();
          }
        }

        const hasExplicitEnds = !!(ends_at || endsAt);
        const newAuction = {
          id: `lot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title,
          description: description || '',
          category,
          sub_category: body.sub_category || '',
          starting_price_minor: startPrice,
          current_price_minor: startPrice,
          reserve_price_minor: body.reserve_price_minor || startPrice,
          bid_increment_minor: increment,
          currency: 'KGS',
          bid_count: 0,
          status: hasExplicitEnds ? 'active' : (currentUser.role === 'admin' ? 'active' : 'pending_approval'),
          seller_id: currentUser.id,
          city: body.city || currentUser.city || 'Бишкек',
          region_id: body.region_id || regionId || 'bishkek',
          images: body.images || ['/images/lots/placeholder.jpg'],
          is_featured: !!body.is_featured,
          is_blitz: !!body.is_blitz,
          is_paused: false,
          start_at: new Date().toISOString(),
          ends_at: endsAtValue,
          created_at: new Date().toISOString()
        };

        this.state.auctions.unshift(newAuction);
        return this.sendJson(res, 201, { success: true, data: newAuction });
      }

      if (pathname.match(/^\/api\/auctions\/([a-zA-Z0-9_-]+)\/bids$/) && method === 'POST') {
        if (!currentUser) return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        if (currentUser.status === 'banned' || currentUser.status === 'suspended') {
          return this.sendJson(res, 403, { success: false, message: 'Account is banned or suspended' });
        }

        const auctionId = pathname.match(/^\/api\/auctions\/([a-zA-Z0-9_-]+)\/bids$/)[1];
        const auction = this.state.auctions.find(a => a.id === auctionId);

        if (!auction) {
          return this.sendJson(res, 404, { success: false, message: 'Auction not found' });
        }
        if (auction.status !== 'active') {
          return this.sendJson(res, 400, { success: false, message: `Cannot bid on auction with status ${auction.status}` });
        }
        if (new Date(auction.ends_at).getTime() <= Date.now()) {
          return this.sendJson(res, 400, { success: false, message: 'Auction has ended' });
        }
        if (auction.is_paused) {
          return this.sendJson(res, 400, { success: false, message: 'Auction is temporarily paused' });
        }
        if (auction.seller_id === currentUser.id) {
          return this.sendJson(res, 400, { success: false, message: 'Sellers cannot bid on their own listings' });
        }

        let bidAmount;
        if (body.amount_minor !== undefined && body.amount_minor !== null && body.amount_minor !== '') {
          bidAmount = Number(body.amount_minor);
        } else if (body.amount !== undefined && body.amount !== null && body.amount !== '') {
          const amt = Number(body.amount);
          bidAmount = Number.isFinite(amt) ? Math.round(amt * 100) : NaN;
        } else {
          bidAmount = 0;
        }
        if (!Number.isFinite(bidAmount) || !Number.isInteger(bidAmount) || bidAmount <= 0) {
          return this.sendJson(res, 400, { success: false, message: 'Invalid bid amount' });
        }
        const minRequired = auction.bid_count === 0 
          ? auction.starting_price_minor 
          : auction.current_price_minor + auction.bid_increment_minor;

        if (bidAmount < minRequired) {
          return this.sendJson(res, 400, {
            success: false,
            message: `Bid amount ${bidAmount} must be at least ${minRequired}`
          });
        }

        // Check if ends within anti-sniping window (3 minutes) -> extend by 2 minutes
        const endsAtMs = new Date(auction.ends_at).getTime();
        const nowMs = Date.now();
        if (endsAtMs - nowMs < 180000 && endsAtMs > nowMs) {
          auction.ends_at = new Date(endsAtMs + 120000).toISOString();
        }

        // Update auction
        auction.current_price_minor = bidAmount;
        auction.bid_count++;

        // Mark previous bids as outbid
        this.state.bids.forEach(b => {
          if (b.auction_id === auctionId) b.is_winning = false;
        });

        const newBid = {
          id: `bid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          auction_id: auctionId,
          bidder_id: currentUser.id,
          amount_minor: bidAmount,
          currency: 'KGS',
          is_winning: true,
          is_cancelled: false,
          sequence_num: auction.bid_count,
          ip_address: req.socket.remoteAddress || '127.0.0.1',
          created_at: new Date().toISOString()
        };

        this.state.bids.unshift(newBid);

        // AML threshold check (>= 30,000 SOM = 3,000,000 tiyyn)
        if (bidAmount >= 3000000) {
          this.state.fraud_alerts.unshift({
            id: `frd-${Date.now()}`,
            alert_type: 'aml_threshold',
            severity: 'medium',
            auction_id: auctionId,
            target_user_id: currentUser.id,
            details: `High-value bid of ${bidAmount / 100} KGS triggered AML threshold check`,
            created_at: new Date().toISOString()
          });
        }

        return this.sendJson(res, 201, {
          success: true,
          data: newBid,
          auction: { ...auction }
        });
      }

      if (pathname.match(/^\/api\/auctions\/([a-zA-Z0-9_-]+)\/bids$/) && method === 'GET') {
        const auctionId = pathname.match(/^\/api\/auctions\/([a-zA-Z0-9_-]+)\/bids$/)[1];
        const bids = this.state.bids.filter(b => b.auction_id === auctionId);
        return this.sendJson(res, 200, { success: true, data: bids, total: bids.length });
      }

      // ----------------------------------------------------
      // 4. Admin Management Endpoints
      // ----------------------------------------------------
      if (pathname.startsWith('/api/admin')) {
        if (!currentUser) {
          return this.sendJson(res, 401, { success: false, message: 'Unauthorized' });
        }
        if (currentUser.role !== 'admin') {
          return this.sendJson(res, 403, { success: false, message: 'Forbidden: Admin privilege required' });
        }

        if (pathname === '/api/admin/overview' && method === 'GET') {
          const totalGmv = this.state.auctions.reduce((sum, a) => sum + (a.current_price_minor || 0), 0);
          const commissionRevenue = Math.round(totalGmv * 0.08);

          return this.sendJson(res, 200, {
            success: true,
            data: {
              gmv_minor: totalGmv,
              commission_revenue_minor: commissionRevenue,
              active_auctions: this.state.auctions.filter(a => a.status === 'active').length,
              total_users: this.state.users.length,
              pending_kyc: this.state.kyc_records.filter(k => k.status === 'pending').length,
              pending_payouts: this.state.payout_requests.filter(p => p.status === 'pending').length,
              open_disputes: this.state.disputes.filter(d => d.status === 'open').length
            }
          });
        }

        if (pathname === '/api/admin/users' && method === 'GET') {
          let users = [...this.state.users];
          if (query.role) users = users.filter(u => u.role === query.role);
          if (query.status) users = users.filter(u => u.status === query.status);
          if (query.kyc_status) users = users.filter(u => u.kyc_status === query.kyc_status);
          if (query.search) {
            const q = query.search.toLowerCase();
            users = users.filter(u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q));
          }

          return this.sendJson(res, 200, {
            success: true,
            data: users.map(u => ({ ...u, password: undefined, password_hash: undefined })),
            meta: { total: users.length }
          });
        }

        if (pathname.match(/^\/api\/admin\/users\/([a-zA-Z0-9_-]+)\/status$/) && method === 'PUT') {
          const targetUserId = pathname.match(/^\/api\/admin\/users\/([a-zA-Z0-9_-]+)\/status$/)[1];
          const targetUser = this.state.users.find(u => u.id === targetUserId);
          if (!targetUser) return this.sendJson(res, 404, { success: false, message: 'User not found' });

          if (targetUserId === currentUser.id && (body.status === 'banned' || body.status === 'suspended')) {
            return this.sendJson(res, 400, { success: false, message: 'Cannot ban own administrator account' });
          }

          targetUser.status = body.status;
          return this.sendJson(res, 200, { success: true, data: targetUser });
        }

        if (pathname.match(/^\/api\/admin\/users\/([a-zA-Z0-9_-]+)\/role$/) && method === 'PUT') {
          const targetUserId = pathname.match(/^\/api\/admin\/users\/([a-zA-Z0-9_-]+)\/role$/)[1];
          const targetUser = this.state.users.find(u => u.id === targetUserId);
          if (!targetUser) return this.sendJson(res, 404, { success: false, message: 'User not found' });

          targetUser.role = body.role;
          return this.sendJson(res, 200, { success: true, data: targetUser });
        }

        if (pathname === '/api/admin/listings' && method === 'GET') {
          let listings = [...this.state.auctions];
          if (query.status) listings = listings.filter(l => l.status === query.status);
          if (query.category) listings = listings.filter(l => l.category === query.category);
          return this.sendJson(res, 200, { success: true, data: listings, meta: { total: listings.length } });
        }

        if (pathname.match(/^\/api\/admin\/listings\/([a-zA-Z0-9_-]+)\/status$/) && method === 'PUT') {
          const lotId = pathname.match(/^\/api\/admin\/listings\/([a-zA-Z0-9_-]+)\/status$/)[1];
          const lot = this.state.auctions.find(a => a.id === lotId);
          if (!lot) return this.sendJson(res, 404, { success: false, message: 'Listing not found' });

          lot.status = body.status;
          return this.sendJson(res, 200, { success: true, data: lot });
        }

        if (pathname.match(/^\/api\/admin\/listings\/([a-zA-Z0-9_-]+)\/featured$/) && method === 'PUT') {
          const lotId = pathname.match(/^\/api\/admin\/listings\/([a-zA-Z0-9_-]+)\/featured$/)[1];
          const lot = this.state.auctions.find(a => a.id === lotId);
          if (!lot) return this.sendJson(res, 404, { success: false, message: 'Listing not found' });

          if (body.is_featured !== undefined) lot.is_featured = body.is_featured;
          if (body.is_blitz !== undefined) lot.is_blitz = body.is_blitz;
          return this.sendJson(res, 200, { success: true, data: lot });
        }

        if (pathname === '/api/admin/disputes' && method === 'GET') {
          return this.sendJson(res, 200, { success: true, data: this.state.disputes, meta: { total: this.state.disputes.length } });
        }

        if (pathname.match(/^\/api\/admin\/disputes\/([a-zA-Z0-9_-]+)\/resolve$/) && method === 'PUT') {
          const disputeId = pathname.match(/^\/api\/admin\/disputes\/([a-zA-Z0-9_-]+)\/resolve$/)[1];
          const dispute = this.state.disputes.find(d => d.id === disputeId);
          if (!dispute) return this.sendJson(res, 404, { success: false, message: 'Dispute not found' });

          dispute.status = 'resolved';
          dispute.resolution = body.decision || 'refund_buyer';
          dispute.refund_minor = body.refund_minor || 0;
          return this.sendJson(res, 200, { success: true, data: dispute });
        }

        if (pathname === '/api/admin/kyc' && method === 'GET') {
          return this.sendJson(res, 200, { success: true, data: this.state.kyc_records, meta: { total: this.state.kyc_records.length } });
        }

        if (pathname.match(/^\/api\/admin\/kyc\/([a-zA-Z0-9_-]+)\/review$/) && method === 'PUT') {
          const kycId = pathname.match(/^\/api\/admin\/kyc\/([a-zA-Z0-9_-]+)\/review$/)[1];
          const kyc = this.state.kyc_records.find(k => k.id === kycId);
          if (!kyc) return this.sendJson(res, 404, { success: false, message: 'KYC record not found' });

          kyc.status = body.action === 'approve' ? 'approved' : 'rejected';
          kyc.rejection_reason = body.rejection_reason || null;
          kyc.reviewed_by = currentUser.id;
          kyc.reviewed_at = new Date().toISOString();

          // update target user kyc_status
          const targetUser = this.state.users.find(u => u.id === kyc.user_id);
          if (targetUser) {
            targetUser.kyc_status = body.action === 'approve' ? 'verified' : 'rejected';
          }

          return this.sendJson(res, 200, { success: true, data: kyc });
        }

        if (pathname === '/api/admin/financials' && method === 'GET') {
          return this.sendJson(res, 200, {
            success: true,
            data: {
              escrow_held_minor: 45000000,
              commission_revenue_minor: 12500000,
              pending_payouts_minor: this.state.payout_requests.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount_minor, 0),
              payout_requests: this.state.payout_requests
            }
          });
        }

        if (pathname.match(/^\/api\/admin\/payouts\/([a-zA-Z0-9_-]+)\/process$/) && method === 'POST') {
          const payoutId = pathname.match(/^\/api\/admin\/payouts\/([a-zA-Z0-9_-]+)\/process$/)[1];
          const payout = this.state.payout_requests.find(p => p.id === payoutId);
          if (!payout) return this.sendJson(res, 404, { success: false, message: 'Payout not found' });

          payout.status = body.action === 'approve' ? 'approved' : (body.action === 'pay' ? 'paid' : 'rejected');
          payout.processed_at = new Date().toISOString();
          return this.sendJson(res, 200, { success: true, data: payout });
        }

        if (pathname === '/api/admin/monitoring' && method === 'GET') {
          return this.sendJson(res, 200, {
            success: true,
            data: {
              live_auctions: this.state.auctions.filter(a => a.status === 'active'),
              recent_bids: this.state.bids.slice(0, 20),
              fraud_alerts: this.state.fraud_alerts
            }
          });
        }

        if (pathname.match(/^\/api\/admin\/auctions\/([a-zA-Z0-9_-]+)\/pause$/) && method === 'POST') {
          const lotId = pathname.match(/^\/api\/admin\/auctions\/([a-zA-Z0-9_-]+)\/pause$/)[1];
          const lot = this.state.auctions.find(a => a.id === lotId);
          if (!lot) return this.sendJson(res, 404, { success: false, message: 'Auction not found' });

          lot.is_paused = body.pause !== false;
          return this.sendJson(res, 200, { success: true, data: lot });
        }

        if (pathname.match(/^\/api\/admin\/bids\/([a-zA-Z0-9_-]+)\/cancel$/) && method === 'POST') {
          const bidId = pathname.match(/^\/api\/admin\/bids\/([a-zA-Z0-9_-]+)\/cancel$/)[1];
          const bid = this.state.bids.find(b => b.id === bidId);
          if (!bid) return this.sendJson(res, 404, { success: false, message: 'Bid not found' });

          bid.is_cancelled = true;
          bid.is_winning = false;

          // Re-evaluate winning bid for auction
          const remainingBids = this.state.bids.filter(b => b.auction_id === bid.auction_id && !b.is_cancelled);
          const lot = this.state.auctions.find(a => a.id === bid.auction_id);
          if (lot) {
            if (remainingBids.length > 0) {
              const highest = remainingBids.reduce((max, b) => b.amount_minor > max.amount_minor ? b : max, remainingBids[0]);
              highest.is_winning = true;
              lot.current_price_minor = highest.amount_minor;
            } else {
              lot.current_price_minor = lot.starting_price_minor;
            }
          }

          return this.sendJson(res, 200, { success: true, message: 'Bid cancelled successfully', data: bid });
        }

        if (pathname === '/api/admin/analytics' && method === 'GET') {
          return this.sendJson(res, 200, {
            success: true,
            data: {
              gmv_timeseries: [
                { date: '2026-08-01', gmv: 4200000 },
                { date: '2026-08-05', gmv: 6800000 },
                { date: '2026-08-10', gmv: 9100000 },
                { date: '2026-08-15', gmv: 14500000 }
              ],
              category_distribution: [
                { category: 'livestock', share: 0.35 },
                { category: 'vehicles', share: 0.40 },
                { category: 'real_estate', share: 0.15 },
                { category: 'antiques', share: 0.10 }
              ],
              regional_distribution: [
                { region: 'Bishkek', lots: 45 },
                { region: 'Osh', lots: 28 },
                { region: 'Chuy', lots: 20 },
                { region: 'Naryn', lots: 12 }
              ]
            }
          });
        }
      }

      // 404 Fallback
      return this.sendJson(res, 404, { success: false, message: `Route ${pathname} not found` });
    } catch (err) {
      return this.sendJson(res, 500, { success: false, message: 'Internal mock server error', error: err.message });
    }
  }
}
