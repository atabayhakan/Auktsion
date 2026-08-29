import crypto from 'crypto';
import path from 'path';
import { config } from '../config/env.js';

const SIGNATURE_TTL_SECONDS = 300;

/**
 * Signatures bind filename + owner userId + expiry, so a leaked signed URL is
 * useless to anyone except its intended viewer (or staff, see serveKycFile).
 */
function computeSignature(filename: string, ownerId: string, exp: number): string {
  return crypto
    .createHmac('sha256', config.jwtSecret)
    .update(`${filename}:${ownerId}:${exp}`)
    .digest('hex')
    .slice(0, 40);
}

export function signKycFilename(filename: string, ownerId: string): { st: string; exp: number } {
  const exp = Math.floor(Date.now() / 1000) + SIGNATURE_TTL_SECONDS;
  return { st: computeSignature(filename, ownerId, exp), exp };
}

export function verifyKycSignature(
  filename: string,
  st: unknown,
  expRaw: unknown,
  ownerId: string
): boolean {
  const exp = Number(expRaw);
  if (typeof st !== 'string' || !Number.isFinite(exp)) return false;
  if (exp * 1000 < Date.now()) return false;
  const expected = computeSignature(filename, ownerId, exp);
  try {
    return crypto.timingSafeEqual(Buffer.from(st), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Rewrites a stored `/uploads/kyc/<file>` path into a short-lived signed,
 * auth-gated URL bound to the KYC record's owner. Stored paths in the database
 * stay canonical; every API response mints a fresh signature so <img src>
 * links keep working without sending Authorization headers.
 */
export function toSignedKycUrl(url: string | null | undefined, ownerId: string): string | null | undefined {
  if (!url || !url.startsWith('/uploads/kyc/')) return url;
  const filename = path.basename(url);
  const { st, exp } = signKycFilename(filename, ownerId);
  return `/api/uploads/kyc/${filename}?st=${st}&exp=${exp}`;
}
