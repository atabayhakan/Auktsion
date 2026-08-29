import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../config/database.js';
import {
  findUserById,
  updateUserProfile,
  updateUserPassword,
  getUserSettings,
  updateUserSettings,
  formatUser,
} from '../models/userModel.js';
import { getAuctions, formatAuction, AuctionRow } from '../models/auctionModel.js';
import { getUserBids } from '../models/bidModel.js';
import { getKycByUserId, submitKycVerification } from '../models/kycModel.js';
import {
  getPayoutMethods,
  addPayoutMethod as addPayoutMethodModel,
  deletePayoutMethod as deletePayoutMethodModel,
  getPayoutRequests,
  createPayoutRequest,
} from '../models/payoutModel.js';

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = findUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'Колдонуучу табылган жок' });
      return;
    }

    res.json({
      success: true,
      data: formatUser(user),
      user: formatUser(user),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const { fullName, phone, city, district, avatar, inn } = req.body;
    const updated = updateUserProfile(req.user!.id, {
      fullName,
      phone,
      city,
      district,
      avatar,
      inn,
    });

    res.json({
      success: true,
      data: formatUser(updated!),
      user: formatUser(updated!),
      message: 'Профиль ийгиликтүү жаңыртылды (Profile updated successfully)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updatePassword(req: Request, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Учурдагы жана жаңы сыр сөздү жазыңыз (Current and new passwords required)',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Жаңы сыр сөз кеминде 6 символ болушу керек (New password must be at least 6 characters)',
      });
      return;
    }

    const user = findUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'Колдонуучу табылган жок' });
      return;
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: 'Учурдагы сыр сөз туура эмес (Current password is incorrect)',
      });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    updateUserPassword(user.id, newHash);

    res.json({
      success: true,
      message: 'Сыр сөз ийгиликтүү алмаштырылды (Password changed successfully)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getListings(req: Request, res: Response): Promise<void> {
  try {
    const { status, page, perPage } = req.query;
    const result = getAuctions({
      sellerId: req.user!.id,
      status: status ? String(status) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      perPage: perPage ? parseInt(String(perPage), 10) : 50,
    });

    res.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getBids(req: Request, res: Response): Promise<void> {
  try {
    const bids = getUserBids(req.user!.id);
    res.json({
      success: true,
      data: bids,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getWatchlist(req: Request, res: Response): Promise<void> {
  try {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT a.*, u.full_name as seller_name, u.avatar as seller_avatar, u.city as seller_city
      FROM watchlists w
      JOIN auctions a ON w.auction_id = a.id
      LEFT JOIN users u ON a.seller_id = u.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `).all(req.user!.id) as AuctionRow[];

    res.json({
      success: true,
      data: rows.map(formatAuction),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// "For You" — the only personalization signal that actually exists today is
// the watchlist, so recommendations are just "other active auctions in
// categories you're already watching." No browsing-history/ML model exists,
// so we don't fake one. A user watching nothing gets an empty list, and the
// frontend hides the section entirely rather than showing something generic.
export async function getRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const db = getDatabase();
    const watchedCategories = db.prepare(`
      SELECT DISTINCT a.category
      FROM watchlists w
      JOIN auctions a ON w.auction_id = a.id
      WHERE w.user_id = ?
    `).all(req.user!.id) as { category: string }[];

    if (watchedCategories.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const categories = watchedCategories.map(c => c.category);
    const placeholders = categories.map(() => '?').join(', ');
    // Math.max guards against a negative limit (SQLite treats it as
    // unbounded) — same fix as the /api/activity/recent endpoint.
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 8, 20));

    const rows = db.prepare(`
      SELECT a.*, u.full_name as seller_name, u.avatar as seller_avatar, u.city as seller_city
      FROM auctions a
      LEFT JOIN users u ON a.seller_id = u.id
      WHERE a.status = 'active'
        AND a.seller_id != ?
        AND a.category IN (${placeholders})
        AND a.id NOT IN (SELECT auction_id FROM watchlists WHERE user_id = ?)
      ORDER BY a.bid_count DESC
      LIMIT ?
    `).all(req.user!.id, ...categories, req.user!.id, limit) as AuctionRow[];

    res.json({
      success: true,
      data: rows.map(formatAuction),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function toggleWatchlist(req: Request, res: Response): Promise<void> {
  try {
    const auctionId = req.params.id;
    const db = getDatabase();
    const existing = db.prepare('SELECT * FROM watchlists WHERE user_id = ? AND auction_id = ?').get(req.user!.id, auctionId);

    if (existing) {
      db.prepare('DELETE FROM watchlists WHERE user_id = ? AND auction_id = ?').run(req.user!.id, auctionId);
      res.json({ success: true, isWatching: false, message: 'Көзөмөлдөн алынды (Removed from watchlist)' });
    } else {
      db.prepare(`
        INSERT INTO watchlists (id, user_id, auction_id, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(`wl-${Date.now()}`, req.user!.id, auctionId);
      res.json({ success: true, isWatching: true, message: 'Көзөмөлгө кошулду (Added to watchlist)' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getKyc(req: Request, res: Response): Promise<void> {
  try {
    const kyc = getKycByUserId(req.user!.id);
    res.json({
      success: true,
      data: kyc,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function submitKyc(req: Request, res: Response): Promise<void> {
  try {
    const { inn, idFrontUrl, idBackUrl, selfieUrl, proofOfAddressUrl } = req.body;
    if (inn && !/^\d{14}$/.test(String(inn))) {
      res.status(400).json({ success: false, error: 'INN 14 сандан турушу керек (INN must be 14 digits)' });
      return;
    }
    const kyc = submitKycVerification({
      userId: req.user!.id,
      inn,
      idFrontUrl,
      idBackUrl,
      selfieUrl,
      proofOfAddressUrl,
    });

    res.json({
      success: true,
      data: kyc,
      message: 'KYC документтери текшерүүгө жөнөтүлдү (KYC documents submitted for review)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getPayoutMethodsList(req: Request, res: Response): Promise<void> {
  try {
    const methods = getPayoutMethods(req.user!.id);
    res.json({
      success: true,
      data: methods,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function addPayoutMethod(req: Request, res: Response): Promise<void> {
  try {
    const { bankCode, accountNumber, accountHolderName, inn, isDefault } = req.body;

    if (!bankCode || !accountNumber || !accountHolderName) {
      res.status(400).json({
        success: false,
        error: 'Банк, эсеп номери жана ээсинин аты милдеттүү (bankCode, accountNumber, and accountHolderName required)',
      });
      return;
    }
    const allowedBanks = ['mbank', 'optima', 'demirbank', 'elqr', 'o_nom'];
    if (!allowedBanks.includes(String(bankCode).toLowerCase())) {
      res.status(400).json({ success: false, error: 'Жараксыз банк коду (Invalid bankCode)' });
      return;
    }

    const method = addPayoutMethodModel({
      userId: req.user!.id,
      bankCode,
      accountNumber,
      accountHolderName,
      inn,
      isDefault,
    });

    res.status(201).json({
      success: true,
      data: method,
      message: 'Төлөм ыкмасы ийгиликтүү кошулду (Payout method added)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deletePayoutMethod(req: Request, res: Response): Promise<void> {
  try {
    deletePayoutMethodModel(req.params.id, req.user!.id);
    res.json({
      success: true,
      message: 'Төлөм ыкмасы өчүрүлдү (Payout method deleted)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getPayouts(req: Request, res: Response): Promise<void> {
  try {
    const payouts = getPayoutRequests(req.user!.id);
    res.json({
      success: true,
      data: payouts,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function requestPayout(req: Request, res: Response): Promise<void> {
  try {
    const { amount, amount_minor, payoutMethodId } = req.body;

    let amountMinor: number;
    if (amount_minor !== undefined && amount_minor !== null && amount_minor !== '') {
      amountMinor = Number(amount_minor);
      if (!Number.isFinite(amountMinor) || !Number.isInteger(amountMinor) || amountMinor <= 0) {
        res.status(400).json({ success: false, error: 'Туура сумманы жазыңыз (Valid amount required)' });
        return;
      }
    } else if (amount !== undefined && amount !== null && amount !== '') {
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) {
        res.status(400).json({ success: false, error: 'Туура сумманы жазыңыз (Valid amount required)' });
        return;
      }
      amountMinor = Math.round(amt * 100);
    } else {
      res.status(400).json({ success: false, error: 'Туура сумманы жазыңыз (Valid amount required)' });
      return;
    }
    const payout = createPayoutRequest({
      userId: req.user!.id,
      payoutMethodId,
      amountMinor,
    });

    res.status(201).json({
      success: true,
      data: payout,
      message: 'Каражат чыгаруу өтүнүчү кабыл алынды (Payout request submitted)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = getUserSettings(req.user!.id);
    res.json({
      success: true,
      data: settings,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = updateUserSettings(req.user!.id, req.body);
    res.json({
      success: true,
      data: settings,
      message: 'Орнотуулар жаңыртылды (Settings updated)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
