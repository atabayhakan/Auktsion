// server/src/controllers/notificationController.ts
import { Request, Response } from 'express';
import {
  getUserNotifications,
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  markAllAdminNotificationsRead,
} from '../models/notificationModel.js';

export async function getUserNotificationsController(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const list = getUserNotifications(userId);
    const unreadCount = list.filter(n => !n.read).length;
    res.json({
      success: true,
      data: list,
      unreadCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function markNotificationReadController(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    markNotificationRead(id, userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function markAllUserNotificationsReadController(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    markAllNotificationsRead(userId);
    res.json({ success: true, message: 'Бардык билдирмелер окулду деп белгиленди' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAdminNotificationsController(req: Request, res: Response): Promise<void> {
  try {
    const list = getAdminNotifications(25);
    const unreadCount = list.filter(n => !n.read).length;
    res.json({
      success: true,
      data: list,
      unreadCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function markAdminNotificationReadController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    markNotificationRead(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function markAllAdminNotificationsReadController(req: Request, res: Response): Promise<void> {
  try {
    markAllAdminNotificationsRead();
    res.json({ success: true, message: 'Бардык админ билдирмелер окулду деп белгиленди' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
