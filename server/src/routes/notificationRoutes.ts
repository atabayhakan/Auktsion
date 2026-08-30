// server/src/routes/notificationRoutes.ts
import { Router } from 'express';
import {
  getUserNotificationsController,
  markNotificationReadController,
  markAllUserNotificationsReadController,
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

export const notificationRoutes = Router();

notificationRoutes.use(authenticateToken);

notificationRoutes.get('/', getUserNotificationsController);
notificationRoutes.put('/:id/read', markNotificationReadController);
notificationRoutes.put('/read-all', markAllUserNotificationsReadController);
