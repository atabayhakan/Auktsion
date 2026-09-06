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
  shoppingAssistantHandler
} from '../controllers/featureController.js';

const router = Router();

// Public Config
router.get('/config/features', getPublicFeaturesConfig);

// Admin Controls & Inspection
router.get('/admin/features', authenticateToken, requireRole('admin', 'moderator'), getAdminFeatureSettings);
router.put('/admin/features', authenticateToken, requireRole('admin', 'moderator'), updateAdminFeatureSettings);


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
