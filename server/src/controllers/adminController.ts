import { Request, Response } from 'express';
import {
  getAdminOverview,
  getAdminUsers,
  getAdminUserDetail,
  updateUserStatus as updateUserStatusModel,
  updateUserRole as updateUserRoleModel,
  updateListingStatus as updateListingStatusModel,
  updateListingFeatured as updateListingFeaturedModel,
  getLiveMonitoringData,
  getAnalyticsData,
  getMediaLibrary,
  getPlatformSettings,
  updatePlatformSettings as updatePlatformSettingsModel,
  getMediaExplorer,
  createMediaFolder as createMediaFolderModel,
  deleteMediaFolder as deleteMediaFolderModel,
  deleteMediaFile as deleteMediaFileModel,
  addMediaFile as addMediaFileModel,
  resetUserPassword as resetUserPasswordModel,
} from '../models/adminModel.js';
import { getAuctions, getAuctionById } from '../models/auctionModel.js';
import { getAllKycRecords, reviewKycRecord } from '../models/kycModel.js';
import { getPayoutRequests, processPayoutRequest } from '../models/payoutModel.js';
import { getDisputes, resolveDispute as resolveDisputeModel } from '../models/disputeModel.js';
import { getDatabase } from '../config/database.js';
import { broadcastEvent } from '../services/websocketService.js';

export async function getOverview(req: Request, res: Response): Promise<void> {
  try {
    const stats = getAdminOverview();
    res.json({
      success: true,
      data: stats,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const { search, role, status, kycStatus, page, perPage } = req.query;
    const result = getAdminUsers({
      search: search ? String(search) : undefined,
      role: role ? String(role) : undefined,
      status: status ? String(status) : undefined,
      kycStatus: kycStatus ? String(kycStatus) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      perPage: perPage ? parseInt(String(perPage), 10) : 20,
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

export async function getUserDetail(req: Request, res: Response): Promise<void> {
  try {
    const detail = getAdminUserDetail(req.params.id);
    if (!detail) {
      res.status(404).json({ success: false, error: 'Колдонуучу табылган жок (User not found)' });
      return;
    }
    res.json({
      success: true,
      data: detail,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  try {
    const { status, reason } = req.body;
    if (!['active', 'suspended', 'banned'].includes(status)) {
      res.status(400).json({ success: false, error: 'Жараксыз статус (Invalid status)' });
      return;
    }
    if (req.params.id === (req.user as any)?.id && status !== 'active') {
      res.status(400).json({ success: false, error: 'Өз аккаунтуңузду бөгөттөй албайсыз (Cannot ban yourself)' });
      return;
    }

    const updated = updateUserStatusModel(req.params.id, status, reason, (req.user as any)?.id);
    res.json({
      success: true,
      data: updated,
      message: 'Колдонуучунун статусу жаңыртылды (User status updated)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  try {
    const { role } = req.body;
    if (!['buyer', 'seller', 'admin', 'moderator'].includes(role)) {
      res.status(400).json({ success: false, error: 'Жараксыз рол (Invalid role)' });
      return;
    }

    const updated = updateUserRoleModel(req.params.id, role);
    res.json({
      success: true,
      data: updated,
      message: 'Колдонуучунун ролу жаңыртылды (User role updated)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getListings(req: Request, res: Response): Promise<void> {
  try {
    const { search, category, status, sortBy, page, perPage } = req.query;
    const result = getAuctions({
      search: search ? String(search) : undefined,
      category: category ? String(category) : undefined,
      status: status ? String(status) : undefined,
      sortBy: sortBy as any,
      page: page ? parseInt(String(page), 10) : 1,
      perPage: perPage ? parseInt(String(perPage), 10) : 20,
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

export async function updateListingStatus(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.body;
    const updated = updateListingStatusModel(req.params.id, status);
    res.json({
      success: true,
      data: updated,
      message: 'Лоттун статусу жаңыртылды (Listing status updated)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateListingFeatured(req: Request, res: Response): Promise<void> {
  try {
    const { isFeatured } = req.body;
    const updated = updateListingFeaturedModel(req.params.id, Boolean(isFeatured));
    res.json({
      success: true,
      data: updated,
      message: 'Тандалма абалы өзгөртүлдү (Featured status updated)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getDisputesList(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query;
    const disputes = getDisputes(status ? String(status) : undefined);
    res.json({
      success: true,
      data: disputes,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function resolveDispute(req: Request, res: Response): Promise<void> {
  try {
    const { status, resolution, refundAmount } = req.body;
    const refundAmountMinor = refundAmount ? Math.round(Number(refundAmount) * 100) : 0;
    const resolved = resolveDisputeModel(req.params.id, status, resolution, refundAmountMinor);
    res.json({
      success: true,
      data: resolved,
      message: 'Талаш-тартыш чечилди (Dispute resolved)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getKycRecordsList(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query;
    const records = getAllKycRecords(status ? String(status) : undefined);
    res.json({
      success: true,
      data: records,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function reviewKyc(req: Request, res: Response): Promise<void> {
  try {
    const { status, rejectionReasonCode, rejectionNotes } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, error: 'Статус approved же rejected болушу керек' });
      return;
    }
    const rejectionReason = [rejectionReasonCode, rejectionNotes].filter(Boolean).join(': ') || undefined;

    const reviewed = reviewKycRecord(req.params.id, status, rejectionReason, req.user!.id);
    res.json({
      success: true,
      data: reviewed,
      message: `KYC өтүнүчү ${status === 'approved' ? 'жактырылды' : 'четке кагылды'}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getFinancials(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query;
    const payouts = getPayoutRequests(undefined, status ? String(status) : undefined);
    const overview = getAdminOverview();

    res.json({
      success: true,
      data: {
        gmv: overview.gmv,
        commissionRevenue: overview.commissionRevenue,
        pendingPayouts: overview.pendingPayouts,
        payouts,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function processPayout(req: Request, res: Response): Promise<void> {
  try {
    const { status, adminNotes } = req.body;
    if (!['completed', 'failed', 'processing', 'cancelled'].includes(status)) {
      res.status(400).json({ success: false, error: 'Жараксыз төлөм статусу' });
      return;
    }

    const processed = processPayoutRequest(req.params.id, status, adminNotes, req.user!.id);
    res.json({
      success: true,
      data: processed,
      message: 'Төлөм өтүнүчү иштелди (Payout processed)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getMonitoring(req: Request, res: Response): Promise<void> {
  try {
    const data = getLiveMonitoringData();
    res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function pauseAuction(req: Request, res: Response): Promise<void> {
  try {
    const db = getDatabase();
    const auction = getAuctionById(req.params.id);
    if (!auction) {
      res.status(404).json({ success: false, error: 'Аукцион табылган жок' });
      return;
    }

    const newStatus = auction.status === 'active' ? 'draft' : 'active';
    db.prepare("UPDATE auctions SET status = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, req.params.id);

    broadcastEvent('auction.status_changed', { auctionId: req.params.id, status: newStatus });

    res.json({
      success: true,
      status: newStatus,
      message: `Аукцион ${newStatus === 'active' ? 'жандандырылды' : 'токтотулду'}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function cancelBid(req: Request, res: Response): Promise<void> {
  try {
    const db = getDatabase();
    const bidId = req.params.id;
    const bid = db.prepare('SELECT * FROM bids WHERE id = ?').get(bidId) as any;
    if (!bid) {
      res.status(404).json({ success: false, error: 'Коюм табылган жок' });
      return;
    }

    db.prepare("UPDATE bids SET status = 'cancelled', is_winning = 0 WHERE id = ?").run(bidId);

    // Re-evaluate previous winning bid on that auction
    const nextHighest = db.prepare(`
      SELECT * FROM bids WHERE auction_id = ? AND status != 'cancelled' ORDER BY amount_minor DESC LIMIT 1
    `).get(bid.auction_id) as any;

    if (nextHighest) {
      db.prepare("UPDATE bids SET is_winning = 1, status = 'winning' WHERE id = ?").run(nextHighest.id);
      db.prepare("UPDATE auctions SET current_price_minor = ? WHERE id = ?").run(nextHighest.amount_minor, bid.auction_id);
    }

    res.json({
      success: true,
      message: 'Коюм жокко чыгарылды (Bid cancelled by administration)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getMedia(req: Request, res: Response): Promise<void> {
  try {
    const { folderId } = req.query;
    const explorer = getMediaExplorer(folderId ? String(folderId) : 'root');
    res.json({
      success: true,
      data: explorer,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createMediaFolder(req: Request, res: Response): Promise<void> {
  try {
    const { name, parentId, color, icon } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ success: false, error: 'Кластер же папканын аталышын жазыңыз (Folder name required)' });
      return;
    }
    const folder = createMediaFolderModel(name, parentId, color, icon);
    res.status(201).json({
      success: true,
      data: folder,
      message: 'Папка ийгиликтүү түзүлдү (Folder created)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteMediaFolder(req: Request, res: Response): Promise<void> {
  try {
    const folderId = req.params.id;
    deleteMediaFolderModel(folderId);
    res.json({
      success: true,
      message: 'Папка өчүрүлдү (Folder deleted)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteMediaFile(req: Request, res: Response): Promise<void> {
  try {
    const fileId = req.params.id;
    deleteMediaFileModel(fileId);
    res.json({
      success: true,
      message: 'Файл өчүрүлдү (File deleted)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function addMediaFileDirect(req: Request, res: Response): Promise<void> {
  try {
    const { name, url, folderId, sizeBytes, mimeType, dimensions } = req.body;
    if (!url) {
      res.status(400).json({ success: false, error: 'Файлдын URL дареги талап кылынат' });
      return;
    }
    const file = addMediaFileModel(name || 'Uploaded File', url, folderId || 'root', sizeBytes || 0, mimeType || 'image/jpeg', dimensions || '');
    res.status(201).json({
      success: true,
      data: file,
      message: 'Файл кошулду',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = getPlatformSettings();
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
    const updated = updatePlatformSettingsModel(req.body);
    res.json({
      success: true,
      data: updated,
      message: 'Системанын жөндөөлөрү жаңыртылды (Platform settings updated)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const { timeframe } = req.query;
    const data = getAnalyticsData(timeframe ? String(timeframe) : '30d');
    const overview = getAdminOverview();
    res.json({
      success: true,
      data: {
        ...data,
        overview,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function resetUserPassword(req: Request, res: Response): Promise<void> {
  try {
    const { temporaryPassword } = resetUserPasswordModel(req.params.id);
    res.json({
      success: true,
      data: { temporaryPassword },
      message: 'Убактылуу сыр сөз түзүлдү (Temporary password generated). Колдонуучуга жөнөтүңүз.',
    });
  } catch (err: any) {
    const status = err.message === 'User not found' ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
}

