import { Database } from 'better-sqlite3';

export function initializeSchema(db: Database): void {
  db.exec(`
    -- 1. Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      avatar TEXT,
      city TEXT DEFAULT 'Бишкек',
      district TEXT,
      role TEXT DEFAULT 'buyer' CHECK(role IN ('buyer', 'seller', 'admin', 'moderator')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'banned')),
      kyc_status TEXT DEFAULT 'not_started' CHECK(kyc_status IN ('not_started', 'phone_verified', 'id_uploaded', 'ocr_passed', 'verified', 'rejected')),
      inn TEXT,
      balance_minor BIGINT DEFAULT 2500000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. KYC Verifications Table
    CREATE TABLE IF NOT EXISTS kyc_verifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      inn TEXT,
      id_front_url TEXT,
      id_back_url TEXT,
      selfie_url TEXT,
      proof_of_address_url TEXT,
      aml_status TEXT DEFAULT 'clean' CHECK(aml_status IN ('clean', 'flagged', 'review')),
      sanctions_status TEXT DEFAULT 'clean' CHECK(sanctions_status IN ('clean', 'match')),
      pep_status TEXT DEFAULT 'none' CHECK(pep_status IN ('none', 'pep_associated')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      rejection_reason TEXT,
      reviewed_by TEXT,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 3. Categories Table
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name_ky TEXT NOT NULL,
      name_ru TEXT NOT NULL,
      name_tr TEXT NOT NULL,
      icon TEXT NOT NULL,
      sub_categories_json TEXT DEFAULT '[]',
      display_order INTEGER DEFAULT 0
    );

    -- 4. Auctions Table
    CREATE TABLE IF NOT EXISTS auctions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT,
      images_json TEXT NOT NULL DEFAULT '[]',
      starting_price_minor BIGINT NOT NULL,
      current_price_minor BIGINT NOT NULL,
      reserve_price_minor BIGINT,
      buy_now_price_minor BIGINT,
      bid_increment_minor BIGINT NOT NULL,
      currency TEXT DEFAULT 'KGS',
      bid_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('draft', 'pending_approval', 'active', 'ended_sold', 'ended_unsold', 'ended_reserve_not_met', 'flagged', 'cancelled')),
      seller_id TEXT NOT NULL,
      city TEXT NOT NULL,
      region_id TEXT NOT NULL,
      district TEXT,
      views_count INTEGER DEFAULT 0,
      is_blitz INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      start_at DATETIME NOT NULL,
      ends_at DATETIME NOT NULL,
      winner_id TEXT,
      final_price_minor BIGINT,
      attributes_json TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (winner_id) REFERENCES users(id)
    );

    -- 5. Bids Table
    CREATE TABLE IF NOT EXISTS bids (
      id TEXT PRIMARY KEY,
      auction_id TEXT NOT NULL,
      bidder_id TEXT NOT NULL,
      amount_minor BIGINT NOT NULL,
      currency TEXT DEFAULT 'KGS',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'winning', 'outbid', 'won', 'lost', 'cancelled')),
      is_winning INTEGER DEFAULT 1,
      sequence_num INTEGER NOT NULL,
      ip_address TEXT,
      placed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
      FOREIGN KEY (bidder_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 6. Watchlists Table
    CREATE TABLE IF NOT EXISTS watchlists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      auction_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, auction_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE
    );

    -- 7. Payout Methods Table
    CREATE TABLE IF NOT EXISTS payout_methods (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      bank_code TEXT NOT NULL CHECK(bank_code IN ('mbank', 'optima', 'demirbank', 'elqr', 'o_nom')),
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_holder_name TEXT NOT NULL,
      inn TEXT,
      is_verified INTEGER DEFAULT 1,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 8. Payout Requests Table
    CREATE TABLE IF NOT EXISTS payout_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      payout_method_id TEXT,
      amount_minor BIGINT NOT NULL,
      currency TEXT DEFAULT 'KGS',
      bank_code TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_holder_name TEXT NOT NULL,
      inn TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
      admin_notes TEXT,
      processed_by TEXT,
      processed_at DATETIME,
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (payout_method_id) REFERENCES payout_methods(id)
    );

    -- 9. Payments Table
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      auction_id TEXT,
      amount_minor BIGINT NOT NULL,
      currency TEXT DEFAULT 'KGS',
      gateway TEXT NOT NULL CHECK(gateway IN ('mbank', 'optima', 'demirbank', 'elqr', 'stripe', 'o_nom')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('initial', 'pending', 'processing', 'success', 'failed', 'refunded', 'cancelled')),
      gateway_tx_id TEXT,
      metadata_json TEXT DEFAULT '{}',
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (auction_id) REFERENCES auctions(id)
    );

    -- 10. Disputes Table
    CREATE TABLE IF NOT EXISTS disputes (
      id TEXT PRIMARY KEY,
      auction_id TEXT NOT NULL,
      complainant_id TEXT NOT NULL,
      respondent_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'under_review', 'resolved', 'rejected')),
      resolution TEXT,
      refund_amount_minor BIGINT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (auction_id) REFERENCES auctions(id),
      FOREIGN KEY (complainant_id) REFERENCES users(id),
      FOREIGN KEY (respondent_id) REFERENCES users(id)
    );

    -- 11. Notifications Table
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'system',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 12. User Settings Table
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      email_bids INTEGER DEFAULT 1,
      email_outbid INTEGER DEFAULT 1,
      email_won INTEGER DEFAULT 1,
      push_bids INTEGER DEFAULT 1,
      push_live INTEGER DEFAULT 1,
      marketing INTEGER DEFAULT 0,
      two_factor_enabled INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
    CREATE INDEX IF NOT EXISTS idx_auctions_category ON auctions(category);
    CREATE INDEX IF NOT EXISTS idx_auctions_seller_id ON auctions(seller_id);
    -- Sweeper hot path: finalize expired active auctions
    CREATE INDEX IF NOT EXISTS idx_auctions_status_ends_at ON auctions(status, ends_at);
    CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON bids(auction_id);
    CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON bids(bidder_id);
    CREATE INDEX IF NOT EXISTS idx_bids_placed_at ON bids(placed_at);
    -- Winning-bid lookups (place-bid + sweeper) use auction_id + is_winning together
    CREATE INDEX IF NOT EXISTS idx_bids_auction_winning ON bids(auction_id, is_winning);
    CREATE INDEX IF NOT EXISTS idx_payout_requests_user_id ON payout_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_watchlists_auction_id ON watchlists(auction_id);
  `);
}
