import { Router } from 'express';
import {
  getOverview,
  getUsers,
  getUserDetail,
  updateUserStatus,
  updateUserRole,
  resetUserPassword,
  getListings,
  updateListingStatus,
  updateListingFeatured,
  getDisputesList,
  resolveDispute,
  getKycRecordsList,
  reviewKyc,
  getFinancials,
  processPayout,
  getMonitoring,
  pauseAuction,
  cancelBid,
  getAnalytics,
  getMedia,
  createMediaFolder,
  deleteMediaFolder,
  deleteMediaFile,
  addMediaFileDirect,
  getSettings,
  updateSettings,
  getTheme,
  updateTheme,
  getThemePresets,
} from '../controllers/adminController.js';
import {
  getAdminNotificationsController,
  markAdminNotificationReadController,
  markAllAdminNotificationsReadController,
} from '../controllers/notificationController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export const adminRoutes = Router();

// All admin routes require authentication; per-route requireRole() below tiers
// permissions between 'moderator' (Editor: content/ops moderation) and 'admin'
// (Yönetici: full access, incl. staff management & money movement).
adminRoutes.use(authenticateToken);

const staffOnly = requireRole('admin');
const staffOrEditor = requireRole('admin', 'moderator');

// Module 1: Overview
adminRoutes.get('/overview', staffOrEditor, getOverview);

// Module 2: Users Management — Admin-only (role/status changes, incl. staff promotion)
adminRoutes.get('/users', staffOnly, getUsers);
adminRoutes.get('/users/:id', staffOnly, getUserDetail);
adminRoutes.put('/users/:id/status', staffOnly, updateUserStatus);
adminRoutes.put('/users/:id/role', staffOnly, updateUserRole);
adminRoutes.post('/users/:id/reset-password', staffOnly, resetUserPassword);

// Module 3: Listings Management
adminRoutes.get('/listings', staffOrEditor, getListings);
adminRoutes.put('/listings/:id/status', staffOrEditor, updateListingStatus);
adminRoutes.put('/listings/:id/featured', staffOrEditor, updateListingFeatured);

// Module 4: Disputes & Claims
adminRoutes.get('/disputes', staffOrEditor, getDisputesList);
adminRoutes.put('/disputes/:id/resolve', staffOrEditor, resolveDispute);

// Module 5: KYC Approvals
adminRoutes.get('/kyc', staffOrEditor, getKycRecordsList);
adminRoutes.put('/kyc/:id/review', staffOrEditor, reviewKyc);

// Module 6: Financials & Payouts — Admin-only (money movement)
adminRoutes.get('/financials', staffOnly, getFinancials);
adminRoutes.post('/payouts/:id/process', staffOnly, processPayout);

// Module 7: Real-Time Monitoring & Controls
adminRoutes.get('/monitoring', staffOrEditor, getMonitoring);
adminRoutes.post('/auctions/:id/pause', staffOrEditor, pauseAuction);
adminRoutes.post('/bids/:id/cancel', staffOrEditor, cancelBid);

// Module 8: Analytics
adminRoutes.get('/analytics', staffOrEditor, getAnalytics);

// Module 9: iOS / Finder Style Media Library
adminRoutes.get('/media', staffOrEditor, getMedia);
adminRoutes.post('/media/folder', staffOrEditor, createMediaFolder);
adminRoutes.delete('/media/folder/:id', staffOrEditor, deleteMediaFolder);
adminRoutes.delete('/media/file/:id', staffOrEditor, deleteMediaFile);
adminRoutes.post('/media/file', staffOrEditor, addMediaFileDirect);

// Module 10: Platform Settings — Admin-only
adminRoutes.get('/settings', staffOnly, getSettings);
adminRoutes.put('/settings', staffOnly, updateSettings);

// Module 11: Site Design & Live Theme Customizer
adminRoutes.get('/theme', getTheme); // Publicly viewable for storefront sync
adminRoutes.get('/theme/presets', getThemePresets);
adminRoutes.put('/theme', staffOnly, updateTheme);

// Module 12: Real-time Admin Notifications Center
adminRoutes.get('/notifications', staffOrEditor, getAdminNotificationsController);
adminRoutes.put('/notifications/:id/read', staffOrEditor, markAdminNotificationReadController);
adminRoutes.put('/notifications/read-all', staffOrEditor, markAllAdminNotificationsReadController);
