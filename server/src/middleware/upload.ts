import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env.js';

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

function makeStorage(subDir: string): multer.StorageEngine {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      const targetDir = path.join(config.uploadDir, subDir);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      cb(null, targetDir);
    },
    filename: (_req, file, cb) => {
      // Original filename is discarded except the extension, which neutralizes
      // path traversal via crafted filenames.
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  });
}

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Колдоого алынбаган файл форматы (Only JPEG, PNG, WEBP, GIF and PDF allowed)'));
  }
};

// Auction images live under uploads/auctions and are served publicly via
// express.static in index.ts.
export const uploadAuction = multer({
  storage: makeStorage('auctions'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

// KYC documents land under uploads/kyc which is NOT publicly mounted — they
// are only reachable through the signed-URL gated endpoint
// (GET /api/uploads/kyc/:filename).
export const uploadKyc = multer({
  storage: makeStorage('kyc'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});
