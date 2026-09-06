import { Router } from 'express';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth.js';
import {
  getPublicFeaturesConfig,
  getAdminFeatureSettings,
  updateAdminFeatureSettings,
  getAuctionGroupBuyHandler,
  createOrGetGroupBuyHandler,
  joinGroupBuyHandler,
  createPriceAlertHandler,
  getUserPriceAlertsHandler,
  deletePriceAlertHandler,
  getMatchingSellersHandler,
  evaluateProductHandler,
  shoppingAssistantHandler,
  testAiConnectionHandler,
  getPublicBanks,
  getAdminBanks,
  updateAdminBanks,
  cleanupDemoData
} from '../controllers/featureController.js';

const router = Router();

// Public Config
router.get('/config/features', getPublicFeaturesConfig);
router.get('/config/banks', getPublicBanks);

// Admin Controls & Inspection
router.get('/admin/features', authenticateToken, requireRole('admin', 'moderator'), getAdminFeatureSettings);
router.put('/admin/features', authenticateToken, requireRole('admin', 'moderator'), updateAdminFeatureSettings);
router.post('/admin/ai/test-connection', authenticateToken, requireRole('admin', 'moderator'), testAiConnectionHandler);
router.get('/admin/banks', authenticateToken, requireRole('admin', 'moderator'), getAdminBanks);
router.put('/admin/banks', authenticateToken, requireRole('admin', 'moderator'), updateAdminBanks);
router.post('/admin/cleanup-demo-data', authenticateToken, requireRole('admin'), cleanupDemoData);


// Group Buys
router.get('/auctions/:id/group-buy', getAuctionGroupBuyHandler);
router.post('/auctions/:id/group-buy', authenticateToken, createOrGetGroupBuyHandler);
router.post('/group-buys/:id/join', authenticateToken, joinGroupBuyHandler);

// Price Alerts
router.post('/auctions/:id/price-alert', authenticateToken, createPriceAlertHandler);
router.get('/user/price-alerts', authenticateToken, getUserPriceAlertsHandler);
router.delete('/user/price-alerts/:id', authenticateToken, deletePriceAlertHandler);

// Multi-Seller Comparison
router.get('/auctions/:id/sellers', getMatchingSellersHandler);

// AI Features
router.post('/ai/evaluate-product', optionalAuth, evaluateProductHandler);
router.post('/ai/shopping-assistant', optionalAuth, shoppingAssistantHandler);

export default router;
