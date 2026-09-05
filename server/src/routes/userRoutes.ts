import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updatePassword,
  getListings,
  getBids,
  getWatchlist,
  toggleWatchlist,
  getRecommendations,
  getKyc,
  submitKyc,
  getPayoutMethodsList,
  addPayoutMethod,
  deletePayoutMethod,
  getPayouts,
  requestPayout,
  getSettings,
  updateSettings,
} from '../controllers/userController.js';
import { createDisputeHandler, getUserDisputesHandler } from '../controllers/disputeController.js';
import { authenticateToken } from '../middleware/auth.js';

export const userRoutes = Router();

// Apply auth middleware to all /api/user routes
userRoutes.use(authenticateToken);

// Profile
userRoutes.get('/profile', getProfile);
userRoutes.put('/profile', updateProfile);
userRoutes.put('/password', updatePassword);

// Listings & Bids
userRoutes.get('/listings', getListings);
userRoutes.get('/bids', getBids);

// Watchlist
userRoutes.get('/watchlist', getWatchlist);
userRoutes.post('/watchlist/:id', toggleWatchlist);
userRoutes.delete('/watchlist/:id', toggleWatchlist);

// Personalization ("For You") — derived entirely from the watchlist, see
// getRecommendations in userController.ts for why.
userRoutes.get('/recommendations', getRecommendations);

// KYC
userRoutes.get('/kyc', getKyc);
userRoutes.post('/kyc', submitKyc);

// Payout Methods
userRoutes.get('/payout-methods', getPayoutMethodsList);
userRoutes.post('/payout-methods', addPayoutMethod);
userRoutes.delete('/payout-methods/:id', deletePayoutMethod);

// Payout Requests
userRoutes.get('/payouts', getPayouts);
userRoutes.post('/payouts', requestPayout);

// Settings
userRoutes.get('/settings', getSettings);
userRoutes.put('/settings', updateSettings);

// Disputes & Complaints
userRoutes.get('/disputes', getUserDisputesHandler);
userRoutes.post('/disputes', createDisputeHandler);
