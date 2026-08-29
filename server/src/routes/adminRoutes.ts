import { Router } from 'express';
import {
  getOverview,
  getUsers,
  getUserDetail,
  updateUserStatus,
  updateUserRole,
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
} from '../controllers/adminController.js';
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

// Module 9: Media Library
adminRoutes.get('/media', staffOrEditor, getMedia);
