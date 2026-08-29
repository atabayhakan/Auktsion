import { Router } from 'express';
import {
  listAuctions,
  getAuction,
  createAuction,
  updateAuction,
  deleteAuction,
  placeBid,
  getAuctionBids,
  buyNow,
} from '../controllers/auctionController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { bidLimiter } from '../middleware/rateLimit.js';

export const auctionRoutes = Router();

// Public / optional auth routes
auctionRoutes.get('/', optionalAuth, listAuctions);
auctionRoutes.get('/:id', optionalAuth, getAuction);
auctionRoutes.get('/:id/bids', getAuctionBids);

// Authenticated routes
auctionRoutes.post('/', authenticateToken, createAuction);
auctionRoutes.put('/:id', authenticateToken, updateAuction);
auctionRoutes.delete('/:id', authenticateToken, deleteAuction);
auctionRoutes.post('/:id/bids', bidLimiter, authenticateToken, placeBid);
auctionRoutes.post('/:id/buy-now', bidLimiter, authenticateToken, buyNow);
