import { getDatabase } from '../config/database.js';

export interface DisputeRow {
  id: string;
  auction_id: string;
  complainant_id: string;
  respondent_id: string;
  reason: string;
  status: string;
  resolution: string | null;
  refund_amount_minor: number;
  created_at: string;
  updated_at: string;
  auction_title?: string;
  complainant_name?: string;
  respondent_name?: string;
}

export function formatDispute(row: DisputeRow) {
  return {
    id: row.id,
    auctionId: row.auction_id,
    auctionTitle: row.auction_title || '',
    complainantId: row.complainant_id,
    complainantName: row.complainant_name || 'Арыздануучу',
    respondentId: row.respondent_id,
    respondentName: row.respondent_name || 'Жоопкер',
    reason: row.reason,
    status: row.status,
    resolution: row.resolution,
    refundAmount: {
      amount: (row.refund_amount_minor / 100).toFixed(2),
      minorUnits: row.refund_amount_minor,
      currency: 'KGS',
      formatted: `${(row.refund_amount_minor / 100).toLocaleString('ru-RU')} сом`,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getDisputes(status?: string, userId?: string) {
  const db = getDatabase();
  let query = `
    SELECT d.*, a.title as auction_title, u1.full_name as complainant_name, u2.full_name as respondent_name
    FROM disputes d
    LEFT JOIN auctions a ON d.auction_id = a.id
    LEFT JOIN users u1 ON d.complainant_id = u1.id
    LEFT JOIN users u2 ON d.respondent_id = u2.id
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (status && status !== 'all') {
    conditions.push('d.status = ?');
    params.push(status);
  }

  if (userId) {
    conditions.push('(d.complainant_id = ? OR d.respondent_id = ?)');
    params.push(userId, userId);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY d.created_at DESC';

  const rows = db.prepare(query).all(...params) as DisputeRow[];
  return rows.map(formatDispute);
}

export function createDispute(data: {
  auctionId: string;
  complainantId: string;
  respondentId?: string;
  reason: string;
}) {
  const db = getDatabase();
  const id = `disp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Ensure respondent exists to preserve foreign key integrity
  let respondentId = data.respondentId;
  if (respondentId) {
    const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(respondentId);
    if (!userExists) respondentId = undefined;
  }

  if (!respondentId) {
    // If not valid, find auction seller or admin or any admin/system user
    const auction = db.prepare('SELECT seller_id, winner_id FROM auctions WHERE id = ?').get(data.auctionId) as any;
    if (auction) {
      if (auction.seller_id !== data.complainantId && auction.seller_id) {
        respondentId = auction.seller_id;
      } else if (auction.winner_id && auction.winner_id !== data.complainantId) {
        respondentId = auction.winner_id;
      }
    }
    if (!respondentId) {
      const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
      respondentId = admin ? admin.id : data.complainantId;
    }
  }

  db.prepare(`
    INSERT INTO disputes (id, auction_id, complainant_id, respondent_id, reason, status, resolution, refund_amount_minor, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'open', NULL, 0, datetime('now'), datetime('now'))
  `).run(id, data.auctionId, data.complainantId, respondentId, data.reason);

  const row = db.prepare(`
    SELECT d.*, a.title as auction_title, u1.full_name as complainant_name, u2.full_name as respondent_name
    FROM disputes d
    LEFT JOIN auctions a ON d.auction_id = a.id
    LEFT JOIN users u1 ON d.complainant_id = u1.id
    LEFT JOIN users u2 ON d.respondent_id = u2.id
    WHERE d.id = ?
  `).get(id) as DisputeRow;

  return formatDispute(row);
}

export function resolveDispute(id: string, status: 'resolved' | 'rejected' | 'under_review', resolution: string, refundAmountMinor: number = 0) {
  const db = getDatabase();
  db.prepare(`
    UPDATE disputes
    SET status = ?, resolution = ?, refund_amount_minor = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, resolution, refundAmountMinor, id);

  const row = db.prepare(`
    SELECT d.*, a.title as auction_title, u1.full_name as complainant_name, u2.full_name as respondent_name
    FROM disputes d
    LEFT JOIN auctions a ON d.auction_id = a.id
    LEFT JOIN users u1 ON d.complainant_id = u1.id
    LEFT JOIN users u2 ON d.respondent_id = u2.id
    WHERE d.id = ?
  `).get(id) as DisputeRow;

  return formatDispute(row);
}
