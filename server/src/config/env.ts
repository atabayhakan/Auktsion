import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root or parent
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if ((process.env.NODE_ENV || 'development') === 'production') {
      throw new Error(
        'JWT_SECRET is not set. Refusing to start in production without an explicit secret. Generate one with: openssl rand -hex 48'
      );
    }
    // Development-only fallback so local dev boots without a .env file.
    return 'dev-only-itorgo-jwt-secret-NOT-FOR-PRODUCTION';
  }

  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  return secret;
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  seedDatabase: process.env.SEED_DATABASE !== 'false',
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../../database/auktsion.sqlite'),
  uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
  frontendDist: process.env.FRONTEND_DIST || path.resolve(__dirname, '../../../frontend/dist'),
  // Comma-separated list, e.g. "https://itorgo.kg,https://admin.itorgo.kg" — '*' allows all.
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

export function getCorsOrigin(): boolean | string[] {
  if (config.corsOrigin === '*') return true;
  return config.corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);
}
