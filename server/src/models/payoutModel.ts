import { getDatabase } from '../config/database.js';

export interface PayoutMethodRow {
  id: string;
  user_id: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  inn: string | null;
  is_verified: number;
  is_default: number;
  created_at: string;
}

export interface PayoutRequestRow {
  id: string;
  user_id: string;
  payout_method_id: string | null;
  amount_minor: number;
  currency: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  inn: string | null;
  status: string;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  requested_at: string;
  user_name?: string;
  user_email?: string;
}

export function formatPayoutMethod(row: PayoutMethodRow) {
  return {
    id: row.id,
    userId: row.user_id,
    bankCode: row.bank_code,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountHolderName: row.account_holder_name,
    inn: row.inn,
    isVerified: Boolean(row.is_verified),
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
  };
}

export function formatPayoutRequest(row: PayoutRequestRow) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || undefined,
    userEmail: row.user_email || undefined,
    amount: {
      amount: (row.amount_minor / 100).toFixed(2),
      minorUnits: row.amount_minor,
      currency: row.currency || 'KGS',
      formatted: `${(row.amount_minor / 100).toLocaleString('ru-RU')} ${row.currency === 'KGS' ? 'сом' : row.currency}`,
    },
    bankCode: row.bank_code,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountHolderName: row.account_holder_name,
    inn: row.inn,
    status: row.status,
    adminNotes: row.admin_notes,
    processedBy: row.processed_by,
    processedAt: row.processed_at,
    requestedAt: row.requested_at,
  };
}

export function getPayoutMethods(userId: string) {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM payout_methods WHERE user_id = ? ORDER BY is_default DESC, created_at DESC
  `).all(userId) as PayoutMethodRow[];
  return rows.map(formatPayoutMethod);
}

export function addPayoutMethod(data: {
  userId: string;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
  inn?: string;
  isDefault?: boolean;
}) {
  const db = getDatabase();
  const id = `pm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const bankNames: Record<string, string> = {
    mbank: 'MBank',
    optima: 'Optima Bank',
    demirbank: 'DemirBank',
    elqr: 'ELQR',
    o_nom: 'O!Bank',
  };

  const bankName = bankNames[data.bankCode.toLowerCase()] || data.bankCode;

  // Check if this is the first method, if so make it default
  const existing = db.prepare('SELECT COUNT(*) as count FROM payout_methods WHERE user_id = ?').get(data.userId) as { count: number };
  const isDefault = (data.isDefault || existing.count === 0) ? 1 : 0;

  if (isDefault) {
    db.prepare('UPDATE payout_methods SET is_default = 0 WHERE user_id = ?').run(data.userId);
  }

  db.prepare(`
    INSERT INTO payout_methods (id, user_id, bank_code, bank_name, account_number, account_holder_name, inn, is_verified, is_default, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))
  `).run(id, data.userId, data.bankCode, bankName, data.accountNumber, data.accountHolderName, data.inn || null, isDefault);

  return db.prepare('SELECT * FROM payout_methods WHERE id = ?').get(id) as PayoutMethodRow;
}

export function deletePayoutMethod(id: string, userId: string) {
  const db = getDatabase();
  db.prepare('DELETE FROM payout_methods WHERE id = ? AND user_id = ?').run(id, userId);
  return { success: true };
}

export function getPayoutRequests(userId?: string, status?: string) {
  const db = getDatabase();
  let query = `
    SELECT p.*, u.full_name as user_name, u.email as user_email
    FROM payout_requests p
    LEFT JOIN users u ON p.user_id = u.id
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (userId) {
    conditions.push('p.user_id = ?');
    params.push(userId);
  }

  if (status && status !== 'all') {
    conditions.push('p.status = ?');
    params.push(status);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' ORDER BY p.requested_at DESC';

  const rows = db.prepare(query).all(...params) as PayoutRequestRow[];
  return rows.map(formatPayoutRequest);
}

export function createPayoutRequest(data: {
  userId: string;
  payoutMethodId?: string;
  amountMinor: number;
}) {
  const db = getDatabase();
  let method: PayoutMethodRow | undefined;

  if (data.payoutMethodId) {
    method = db.prepare('SELECT * FROM payout_methods WHERE id = ? AND user_id = ?').get(data.payoutMethodId, data.userId) as PayoutMethodRow | undefined;
  } else {
    method = db.prepare('SELECT * FROM payout_methods WHERE user_id = ? ORDER BY is_default DESC LIMIT 1').get(data.userId) as PayoutMethodRow | undefined;
  }

  if (!method) {
    throw new Error('Төлөм реквизити табылган жок (Payout method not found)');
  }

  const id = `payout-req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  db.prepare(`
    INSERT INTO payout_requests (
      id, user_id, payout_method_id, amount_minor, currency, bank_code, bank_name,
      account_number, account_holder_name, inn, status, requested_at
    )
    VALUES (?, ?, ?, ?, 'KGS', ?, ?, ?, ?, ?, 'pending', datetime('now'))
  `).run(
    id,
    data.userId,
    method.id,
    data.amountMinor,
    method.bank_code,
    method.bank_name,
    method.account_number,
    method.account_holder_name,
    method.inn
  );

  const row = db.prepare(`
    SELECT p.*, u.full_name as user_name, u.email as user_email
    FROM payout_requests p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(id) as PayoutRequestRow;

  return formatPayoutRequest(row);
}

export function processPayoutRequest(id: string, status: 'completed' | 'failed' | 'processing' | 'cancelled', adminNotes?: string, processedBy?: string) {
  const db = getDatabase();
  db.prepare(`
    UPDATE payout_requests
    SET status = ?, admin_notes = ?, processed_by = ?, processed_at = datetime('now')
    WHERE id = ?
  `).run(status, adminNotes || null, processedBy || 'admin', id);

  const row = db.prepare(`
    SELECT p.*, u.full_name as user_name, u.email as user_email
    FROM payout_requests p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(id) as PayoutRequestRow;

  return formatPayoutRequest(row);
}
