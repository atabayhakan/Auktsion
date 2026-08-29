import { getDatabase } from '../config/database.js';
import { toSignedKycUrl } from '../utils/signedUploads.js';

export interface KycRow {
  id: string;
  user_id: string;
  inn: string | null;
  id_front_url: string | null;
  id_back_url: string | null;
  selfie_url: string | null;
  proof_of_address_url: string | null;
  aml_status: string;
  sanctions_status: string;
  pep_status: string;
  status: string;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
  user_city?: string;
  user_phone?: string;
}

export function formatKyc(row: KycRow) {
  const db = getDatabase();
  const duplicateInnAccounts = row.inn
    ? (db.prepare('SELECT id FROM users WHERE inn = ? AND id != ?').all(row.inn, row.user_id) as { id: string }[]).map(r => r.id)
    : [];

  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || undefined,
    userEmail: row.user_email || undefined,
    userAvatar: row.user_avatar || undefined,
    userCity: row.user_city || undefined,
    userPhone: row.user_phone || undefined,
    inn: row.inn,
    idFrontUrl: toSignedKycUrl(row.id_front_url, row.user_id),
    idBackUrl: toSignedKycUrl(row.id_back_url, row.user_id),
    selfieUrl: toSignedKycUrl(row.selfie_url, row.user_id),
    proofOfAddressUrl: toSignedKycUrl(row.proof_of_address_url, row.user_id),
    amlStatus: row.aml_status,
    sanctionsStatus: row.sanctions_status,
    pepStatus: row.pep_status,
    duplicateInnAccounts,
    status: row.status,
    rejectionReason: row.rejection_reason,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

export function getKycByUserId(userId: string) {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT * FROM kyc_verifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(userId) as KycRow | undefined;

  return row ? formatKyc(row) : null;
}

export function submitKycVerification(data: {
  userId: string;
  inn?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  selfieUrl?: string;
  proofOfAddressUrl?: string;
}) {
  const db = getDatabase();
  const id = `kyc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  db.prepare(`
    INSERT INTO kyc_verifications (
      id, user_id, inn, id_front_url, id_back_url, selfie_url, proof_of_address_url,
      aml_status, sanctions_status, pep_status, status, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'clean', 'clean', 'none', 'pending', datetime('now'))
  `).run(
    id,
    data.userId,
    data.inn || null,
    data.idFrontUrl || null,
    data.idBackUrl || null,
    data.selfieUrl || null,
    data.proofOfAddressUrl || null
  );

  // Update user KYC status
  db.prepare(`
    UPDATE users SET kyc_status = 'id_uploaded', inn = COALESCE(?, inn), updated_at = datetime('now') WHERE id = ?
  `).run(data.inn || null, data.userId);

  return getKycByUserId(data.userId);
}

export function getAllKycRecords(status?: string) {
  const db = getDatabase();
  let query = `
    SELECT k.*, u.full_name as user_name, u.email as user_email, u.avatar as user_avatar, u.city as user_city, u.phone as user_phone
    FROM kyc_verifications k
    LEFT JOIN users u ON k.user_id = u.id
  `;
  const params: any[] = [];

  if (status && status !== 'all') {
    query += ' WHERE k.status = ?';
    params.push(status);
  }

  query += ' ORDER BY k.created_at DESC';

  const rows = db.prepare(query).all(...params) as KycRow[];
  return rows.map(formatKyc);
}

export function reviewKycRecord(id: string, status: 'approved' | 'rejected', rejectionReason?: string, reviewerId?: string) {
  const db = getDatabase();
  const kyc = db.prepare('SELECT * FROM kyc_verifications WHERE id = ?').get(id) as KycRow | undefined;
  if (!kyc) throw new Error('KYC кайрылуусу табылган жок (KYC record not found)');

  db.prepare(`
    UPDATE kyc_verifications
    SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = datetime('now')
    WHERE id = ?
  `).run(status, rejectionReason || null, reviewerId || 'admin', id);

  const newKycStatus = status === 'approved' ? 'verified' : 'rejected';
  db.prepare(`
    UPDATE users SET kyc_status = ?, updated_at = datetime('now') WHERE id = ?
  `).run(newKycStatus, kyc.user_id);

  return getKycByUserId(kyc.user_id);
}
