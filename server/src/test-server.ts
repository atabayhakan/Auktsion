import { app, server } from './index.js';
import http from 'http';

async function request(options: http.RequestOptions, body?: any): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let data: any = raw;
        try {
          data = JSON.parse(raw);
        } catch {}
        resolve({ status: res.statusCode || 500, data, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting iTorgo Backend Automated Verification Tests...');
  const port = 5000;
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request({
      hostname: 'localhost',
      port,
      path: '/api/health',
      method: 'GET',
    });
    assert(health.status === 200 && health.data.status === 'ok', 'Health Check endpoint returns 200 OK');

    // 2. Admin Login
    const adminLogin = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: 'admin@itorgo.kg', password: 'AdminPass123!' });
    assert(adminLogin.status === 200 && !!adminLogin.data.token, 'Admin login succeeds and returns JWT token');
    const adminToken = adminLogin.data.token;
    assert(adminLogin.data.user.role === 'admin', 'Admin user role is "admin"');

    // 3. User Register
    const uniqueEmail = `test_${Date.now()}@itorgo.kg`;
    const regRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      fullName: 'Тест Катышуучу',
      email: uniqueEmail,
      phone: '+996 700 998877',
      password: 'TestPassword123!',
      city: 'Бишкек',
    });
    assert(regRes.status === 201 && !!regRes.data.token, 'New user registration succeeds and returns token');
    const userToken = regRes.data.token;
    const userId = regRes.data.user.id;

    // 4. User /api/auth/me
    const meRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` },
    });
    assert(meRes.status === 200 && meRes.data.user.email === uniqueEmail, 'Auth /me endpoint validates JWT and returns user');

    // 5. User Profile Update
    const updateProfileRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/user/profile',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
    }, {
      city: 'Ош',
      district: 'Сулайман-Тоо',
    });
    assert(updateProfileRes.status === 200 && updateProfileRes.data.user.city === 'Ош', 'Profile update changes city to Ош');

    // 6. User Settings
    const settingsRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/user/settings',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
    }, {
      emailBids: false,
      marketing: true,
    });
    assert(settingsRes.status === 200 && settingsRes.data.data.marketing === true, 'Settings update persists preferences');

    // 7. Auction catalog listing & lot creation if empty
    let auctionsRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/auctions',
      method: 'GET',
    });

    let firstAuction = auctionsRes.data?.data?.[0];

    // If catalog is empty (e.g. dummy lots deleted), create a test auction
    if (!firstAuction) {
      const createAucRes = await request({
        hostname: 'localhost',
        port,
        path: '/api/auctions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
      }, {
        title: 'Тесттик Лот: Смартфон Galaxy S24 Ultra',
        description: 'Тесттик аукциондук лот сүрөттөмөсү',
        category: 'electronics',
        startingPrice: 50000,
        bidIncrement: 1000,
        city: 'Бишкек',
        regionId: 'bishkek',
        durationHours: 48,
      });
      assert(createAucRes.status === 201 && createAucRes.data.success === true, 'Creating auction lot succeeds');
      firstAuction = createAucRes.data.data;
      
      // Refresh catalog
      auctionsRes = await request({
        hostname: 'localhost',
        port,
        path: '/api/auctions',
        method: 'GET',
      });
    }

    assert(auctionsRes.status === 200 && Array.isArray(auctionsRes.data.data) && auctionsRes.data.data.length > 0, 'Auctions catalog lists lots');

    // 8. Place atomic bid
    const minBid = firstAuction.currentPrice.minorUnits + firstAuction.bidIncrement.minorUnits;
    const bidRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/auctions/${firstAuction.id}/bids`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
    }, {
      amount: minBid / 100,
    });
    assert(bidRes.status === 201 && bidRes.data.success === true, 'Placing atomic bid on auction lot succeeds');

    // 9. User KYC submission & Admin Approval
    const kycSubmit = await request({
      hostname: 'localhost',
      port,
      path: '/api/user/kyc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
    }, {
      inn: '20101199500999',
      idFrontUrl: 'https://example.com/id-front.jpg',
      selfieUrl: 'https://example.com/selfie.jpg',
    });
    assert(kycSubmit.status === 200 && kycSubmit.data.data.inn === '20101199500999', 'KYC submission succeeds');
    const kycId = kycSubmit.data.data.id;

    const kycReview = await request({
      hostname: 'localhost',
      port,
      path: `/api/admin/kyc/${kycId}/review`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    }, {
      status: 'approved',
    });
    assert(kycReview.status === 200 && kycReview.data.data.status === 'approved', 'Admin KYC review approval succeeds');

    // 10. Payout method & withdrawal request
    const addPm = await request({
      hostname: 'localhost',
      port,
      path: '/api/user/payout-methods',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
    }, {
      bankCode: 'mbank',
      accountNumber: '1180000999888777',
      accountHolderName: 'Тест Катышуучу',
      inn: '20101199500999',
    });
    assert(addPm.status === 201 && addPm.data.data.bank_code === 'mbank', 'Adding Kyrgyz MBank payout method succeeds');

    const payoutReq = await request({
      hostname: 'localhost',
      port,
      path: '/api/user/payouts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
    }, {
      amount: 5000,
      payoutMethodId: addPm.data.data.id,
    });
    assert(payoutReq.status === 201 && payoutReq.data.data.status === 'pending', 'User payout withdrawal request submitted');

    // 11. Admin Overview & Financials
    const adminOverview = await request({
      hostname: 'localhost',
      port,
      path: '/api/admin/overview',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    assert(adminOverview.status === 200 && adminOverview.data.data.users.total > 0, 'Admin overview returns KPI statistics');

    console.log(`\n📊 Verification Results: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

// Wait 500ms for server to bind then run tests
setTimeout(runTests, 500);
