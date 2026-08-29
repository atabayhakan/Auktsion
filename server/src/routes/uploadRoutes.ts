import { Router, Request, Response } from 'express';
import path from 'path';
import { uploadAuction, uploadKyc } from '../middleware/upload.js';
import { authenticateToken } from '../middleware/auth.js';
import { getDatabase } from '../config/database.js';
import { config } from '../config/env.js';
import { signKycFilename, verifyKycSignature } from '../utils/signedUploads.js';

export const uploadRoutes = Router();

// Public asset uploads (auction images) — stored under uploads/auctions which
// is served publicly via express.static.
uploadRoutes.post(
  '/',
  authenticateToken,
  uploadAuction.single('file'),
  (req: Request, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'Файл тандалган жок (No file uploaded)' });
      return;
    }

    const fileUrl = `/uploads/auctions/${req.file.filename}`;

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  }
);

// KYC document uploads — stored under uploads/kyc (NOT publicly mounted).
// The returned URL is short-lived, signed, and bound to the uploader's userId;
// it can only be resolved through GET /api/uploads/kyc/:filename after an
// ownership/admin check.
uploadRoutes.post(
  '/kyc',
  authenticateToken,
  uploadKyc.single('file'),
  (req: Request, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'Файл тандалган жок (No file uploaded)' });
      return;
    }

    const { st, exp } = signKycFilename(req.file.filename, req.user!.id);

    res.json({
      success: true,
      url: `/api/uploads/kyc/${req.file.filename}?st=${st}&exp=${exp}`,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  }
);

/**
 * Auth-gated KYC file serving. Requires ALL of:
 *  1. A valid JWT (any active user),
 *  2. A valid short-lived HMAC signature + expiry in the query string, bound
 *     to either the requester's own id or the KYC record owner's id,
 *  3. Ownership of the file (signature binding), or admin/moderator role for
 *     files already attached to a KYC record.
 */
export function serveKycFile(req: Request, res: Response): void {
  const { filename } = req.params;

  // Defense-in-depth against traversal even though multer already sanitizes.
  if (!/^[\w.-]+$/.test(filename)) {
    res.status(400).json({ success: false, error: 'Жараксыз файл аталышы (Invalid filename)' });
    return;
  }

  // Owner branch: signature was minted for this exact viewer (covers freshly
  // uploaded docs that are not yet attached to a kyc_verifications row).
  if (verifyKycSignature(filename, req.query.st, req.query.exp, req.user!.id)) {
    return sendIfFound(res, filename);
  }

  // Staff branch: admins/moderators may view docs referenced by a KYC record
  // when the signature was minted for the record's owner.
  if (['admin', 'moderator'].includes(req.user!.role)) {
    const like = `%/${filename}`;
    const row = getDatabase()
      .prepare(
        `SELECT user_id FROM kyc_verifications
         WHERE id_front_url LIKE ? OR id_back_url LIKE ? OR selfie_url LIKE ? OR proof_of_address_url LIKE ?
         LIMIT 1`
      )
      .get(like, like, like, like) as { user_id: string } | undefined;

    if (row && verifyKycSignature(filename, req.query.st, req.query.exp, row.user_id)) {
      return sendIfFound(res, filename);
    }
  }

  res.status(403).json({
    success: false,
    error: 'Бул документти көрүүгө уруксат жок (Not allowed to view this document)',
  });
}

function sendIfFound(res: Response, filename: string): void {
  // res.sendFile demands an absolute path — UPLOAD_DIR may be relative (.env).
  res.sendFile(path.resolve(config.uploadDir, 'kyc', filename), (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ success: false, error: 'Файл табылган жок (File not found)' });
    }
  });
}
