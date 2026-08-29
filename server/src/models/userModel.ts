import { getDatabase } from '../config/database.js';

export interface UserRow {
  id: string;
  username: string | null;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string;
  avatar: string | null;
  city: string;
  district: string | null;
  role: 'buyer' | 'seller' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'banned';
  kyc_status: string;
  inn: string | null;
  balance_minor: number;
  created_at: string;
  updated_at: string;
}

export function formatUser(row: UserRow) {
  const db = getDatabase();
  
  // Fetch KYC documents
  const kyc = db.prepare('SELECT id_front_url, selfie_url, proof_of_address_url FROM kyc_verifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(row.id) as { id_front_url?: string; selfie_url?: string; proof_of_address_url?: string } | undefined;

  // Fetch payout methods
  const payoutMethods = db.prepare(`
    SELECT id, bank_name as bankName, bank_code as bankCode, account_number as accountNumber, is_verified as isVerified, is_default as isDefault, created_at as createdAt
    FROM payout_methods WHERE user_id = ?
  `).all(row.id);

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    phone: row.phone,
    fullName: row.full_name,
    avatar: row.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    city: row.city || 'Бишкек',
    district: row.district,
    role: row.role,
    status: row.status,
    kycStatus: row.kyc_status,
    inn: row.inn,
    balance: {
      amount: (row.balance_minor / 100).toFixed(2),
      minorUnits: row.balance_minor,
      currency: 'KGS',
      formatted: `${(row.balance_minor / 100).toLocaleString()} сом`,
    },
    kycDocuments: {
      idFront: kyc?.id_front_url,
      selfie: kyc?.selfie_url,
      proofOfAddress: kyc?.proof_of_address_url,
    },
    payoutMethods: payoutMethods || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findUserById(id: string): UserRow | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function findUserByEmail(email: string): UserRow | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as UserRow | undefined;
}

export function findUserByUsername(username: string): UserRow | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(username) as UserRow | undefined;
}

export function createUser(data: {
  id: string;
  username?: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  city?: string;
  role?: string;
}): UserRow {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO users (id, username, email, password_hash, full_name, phone, city, role, status, kyc_status, balance_minor, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 'not_started', 0, datetime('now'), datetime('now'))
  `);

  stmt.run(
    data.id,
    data.username || data.email.split('@')[0],
    data.email,
    data.passwordHash,
    data.fullName,
    data.phone,
    data.city || 'Бишкек',
    data.role || 'buyer'
  );

  db.prepare(`
    INSERT INTO user_settings (user_id) VALUES (?)
  `).run(data.id);

  return findUserById(data.id)!;
}

export function updateUserProfile(id: string, updates: {
  fullName?: string;
  phone?: string;
  city?: string;
  district?: string;
  avatar?: string;
  inn?: string;
}): UserRow | undefined {
  const db = getDatabase();
  const fields: string[] = [];
  const params: any[] = [];

  if (updates.fullName !== undefined) { fields.push('full_name = ?'); params.push(updates.fullName); }
  if (updates.phone !== undefined) { fields.push('phone = ?'); params.push(updates.phone); }
  if (updates.city !== undefined) { fields.push('city = ?'); params.push(updates.city); }
  if (updates.district !== undefined) { fields.push('district = ?'); params.push(updates.district); }
  if (updates.avatar !== undefined) { fields.push('avatar = ?'); params.push(updates.avatar); }
  if (updates.inn !== undefined) { fields.push('inn = ?'); params.push(updates.inn); }

  if (fields.length === 0) return findUserById(id);

  fields.push("updated_at = datetime('now')");
  params.push(id);

  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return findUserById(id);
}

export function updateUserPassword(id: string, passwordHash: string): void {
  const db = getDatabase();
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(passwordHash, id);
}

export function getUserSettings(userId: string) {
  const db = getDatabase();
  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as any;
  if (!settings) {
    db.prepare('INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)').run(userId);
    return {
      emailBids: true,
      emailOutbid: true,
      emailWon: true,
      pushBids: true,
      pushLive: true,
      marketing: false,
      twoFactorEnabled: false,
    };
  }
  return {
    emailBids: Boolean(settings.email_bids),
    emailOutbid: Boolean(settings.email_outbid),
    emailWon: Boolean(settings.email_won),
    pushBids: Boolean(settings.push_bids),
    pushLive: Boolean(settings.push_live),
    marketing: Boolean(settings.marketing),
    twoFactorEnabled: Boolean(settings.two_factor_enabled),
  };
}

export function updateUserSettings(userId: string, settings: any) {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO user_settings (user_id, email_bids, email_outbid, email_won, push_bids, push_live, marketing, two_factor_enabled, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      email_bids = excluded.email_bids,
      email_outbid = excluded.email_outbid,
      email_won = excluded.email_won,
      push_bids = excluded.push_bids,
      push_live = excluded.push_live,
      marketing = excluded.marketing,
      two_factor_enabled = excluded.two_factor_enabled,
      updated_at = datetime('now')
  `).run(
    userId,
    settings.emailBids !== undefined ? (settings.emailBids ? 1 : 0) : 1,
    settings.emailOutbid !== undefined ? (settings.emailOutbid ? 1 : 0) : 1,
    settings.emailWon !== undefined ? (settings.emailWon ? 1 : 0) : 1,
    settings.pushBids !== undefined ? (settings.pushBids ? 1 : 0) : 1,
    settings.pushLive !== undefined ? (settings.pushLive ? 1 : 0) : 1,
    settings.marketing !== undefined ? (settings.marketing ? 1 : 0) : 0,
    settings.twoFactorEnabled !== undefined ? (settings.twoFactorEnabled ? 1 : 0) : 0
  );
  return getUserSettings(userId);
}
