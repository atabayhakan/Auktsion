/**
 * API Test Client for Auktsion v2.0 E2E & Integration Tests
 */

export class ApiTestClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = null;
    this.currentUser = null;
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
    this.currentUser = null;
  }

  async request(method, path, options = {}) {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const fetchOptions = {
      method,
      headers
    };

    if (options.body && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);
    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      statusCode: response.status,
      ok: response.ok,
      headers: response.headers,
      data
    };
  }

  get(path, options = {}) {
    return this.request('GET', path, options);
  }

  post(path, body = {}, options = {}) {
    return this.request('POST', path, { ...options, body });
  }

  put(path, body = {}, options = {}) {
    return this.request('PUT', path, { ...options, body });
  }

  delete(path, options = {}) {
    return this.request('DELETE', path, options);
  }

  // --- Auth Shortcuts ---
  async register(userData) {
    const res = await this.post('/api/auth/register', userData);
    if (res.ok && res.data && res.data.token) {
      this.token = res.data.token;
      this.currentUser = res.data.user;
    }
    return res;
  }

  async login(email, password) {
    const res = await this.post('/api/auth/login', { email, password });
    if (res.ok && res.data && res.data.token) {
      this.token = res.data.token;
      this.currentUser = res.data.user;
    }
    return res;
  }

  async loginAsAdmin() {
    return this.login('admin@auktsion.kg', 'Password123!');
  }

  async loginAsSeller() {
    return this.login('seller@auktsion.kg', 'Password123!');
  }

  async loginAsBuyer() {
    return this.login('buyer@auktsion.kg', 'Password123!');
  }

  async getMe() {
    return this.get('/api/auth/me');
  }

  async logout() {
    const res = await this.post('/api/auth/logout');
    this.clearToken();
    return res;
  }

  // --- User Profile & Dashboard Shortcuts ---
  async getProfile() {
    return this.get('/api/user/profile');
  }

  async updateProfile(profileData) {
    return this.put('/api/user/profile', profileData);
  }

  async updatePassword(currentPassword, newPassword) {
    return this.put('/api/user/password', { currentPassword, newPassword });
  }

  async getSettings() {
    return this.get('/api/user/settings');
  }

  async updateSettings(settings) {
    return this.put('/api/user/settings', settings);
  }

  async getListings() {
    return this.get('/api/user/listings');
  }

  async getBids() {
    return this.get('/api/user/bids');
  }

  async getKyc() {
    return this.get('/api/user/kyc');
  }

  async submitKyc(kycData) {
    return this.post('/api/user/kyc', kycData);
  }

  async getPayoutMethods() {
    return this.get('/api/user/payout-methods');
  }

  async addPayoutMethod(methodData) {
    return this.post('/api/user/payout-methods', methodData);
  }

  async deletePayoutMethod(id) {
    return this.delete(`/api/user/payout-methods/${id}`);
  }

  async getPayouts() {
    return this.get('/api/user/payouts');
  }

  async requestPayout(payoutData) {
    return this.post('/api/user/payouts', payoutData);
  }

  // --- Auctions & Bidding Shortcuts ---
  async getAuctions(params = {}) {
    const searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) searchParams.append(k, v);
    }
    const qs = searchParams.toString();
    return this.get(`/api/auctions${qs ? '?' + qs : ''}`);
  }

  async getAuction(id) {
    return this.get(`/api/auctions/${id}`);
  }

  async createAuction(auctionData) {
    return this.post('/api/auctions', auctionData);
  }

  async placeBid(auctionId, amountMinor) {
    return this.post(`/api/auctions/${auctionId}/bids`, { amount_minor: amountMinor });
  }

  async getAuctionBids(auctionId) {
    return this.get(`/api/auctions/${auctionId}/bids`);
  }

  // --- Admin Shortcuts ---
  async getAdminOverview() {
    return this.get('/api/admin/overview');
  }

  async getAdminUsers(params = {}) {
    const searchParams = new URLSearchParams(params);
    const qs = searchParams.toString();
    return this.get(`/api/admin/users${qs ? '?' + qs : ''}`);
  }

  async setAdminUserStatus(userId, status) {
    return this.put(`/api/admin/users/${userId}/status`, { status });
  }

  async setAdminUserRole(userId, role) {
    return this.put(`/api/admin/users/${userId}/role`, { role });
  }

  async getAdminListings(params = {}) {
    const searchParams = new URLSearchParams(params);
    const qs = searchParams.toString();
    return this.get(`/api/admin/listings${qs ? '?' + qs : ''}`);
  }

  async setAdminListingStatus(lotId, status) {
    return this.put(`/api/admin/listings/${lotId}/status`, { status });
  }

  async setAdminListingFeatured(lotId, flags = {}) {
    return this.put(`/api/admin/listings/${lotId}/featured`, flags);
  }

  async getAdminDisputes() {
    return this.get('/api/admin/disputes');
  }

  async resolveAdminDispute(disputeId, resolutionData) {
    return this.put(`/api/admin/disputes/${disputeId}/resolve`, resolutionData);
  }

  async getAdminKyc() {
    return this.get('/api/admin/kyc');
  }

  async reviewAdminKyc(kycId, reviewData) {
    return this.put(`/api/admin/kyc/${kycId}/review`, reviewData);
  }

  async getAdminFinancials() {
    return this.get('/api/admin/financials');
  }

  async processAdminPayout(payoutId, action) {
    return this.post(`/api/admin/payouts/${payoutId}/process`, { action });
  }

  async getAdminMonitoring() {
    return this.get('/api/admin/monitoring');
  }

  async pauseAdminAuction(lotId, pause = true) {
    return this.post(`/api/admin/auctions/${lotId}/pause`, { pause });
  }

  async cancelAdminBid(bidId) {
    return this.post(`/api/admin/bids/${bidId}/cancel`);
  }

  async getAdminAnalytics() {
    return this.get('/api/admin/analytics');
  }
}
