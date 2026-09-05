import { Router } from 'express';
import { createDisputeHandler, getUserDisputesHandler } from '../controllers/disputeController.js';
import { authenticateToken } from '../middleware/auth.js';

export const disputeRoutes = Router();

disputeRoutes.use(authenticateToken);

disputeRoutes.post('/', createDisputeHandler);
disputeRoutes.get('/', getUserDisputesHandler);
disputeRoutes.get('/my', getUserDisputesHandler);
