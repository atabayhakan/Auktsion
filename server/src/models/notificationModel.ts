// server/src/models/notificationModel.ts
import { getDatabase } from '../config/database.js';
import { broadcastEvent } from '../services/websocketService.js';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  link?: string;
  time: string;
  read: boolean;
  createdAt: string;
}

function formatRelativeTime(isoString: string): string {
  try {
    const now = new Date();
    const past = new Date(isoString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Азыр эле (Şimdi)';
    if (diffMins < 60) return `${diffMins} мүн мурун`;
    if (diffHours < 24) return `${diffHours} саат мурун`;
    if (diffDays === 1) return 'Кечээ (Dün)';
    return `${diffDays} күн мурун`;
  } catch {
    return 'Жаңы';
  }
}

export function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'alert' | 'success' = 'info',
  link: string = '',
  metadata: any = {}
): AppNotification {
  const db = getDatabase();
  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, link, metadata_json, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
  `).run(id, userId, title, message, type, link, JSON.stringify(metadata));

  const notif: AppNotification = {
    id,
    userId,
    title,
    message,
    type,
    link,
    time: 'Азыр эле',
    read: false,
    createdAt: now,
  };

  // Broadcast real-time WebSocket event
  try {
    broadcastEvent('notification:new', {
      userId,
      notification: notif
    });
  } catch (err) {
    console.warn('[NotificationModel] Failed to broadcast notification:', err);
  }

  return notif;
}

export function getUserNotifications(userId: string, limit: number = 20): AppNotification[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT id, user_id, title, message, type, link, is_read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit) as Array<{
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: string;
    link: string | null;
    is_read: number;
    created_at: string;
  }>;

  return rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    title: r.title,
    message: r.message,
    type: (r.type as any) || 'info',
    link: r.link || '',
    time: formatRelativeTime(r.created_at),
    read: Boolean(r.is_read),
    createdAt: r.created_at,
  }));
}

export function getAdminNotifications(limit: number = 25): AppNotification[] {
  const db = getDatabase();
  const list: AppNotification[] = [];

  // Read admin read timestamp from platform_settings
  let lastReadTime = 0;
  try {
    const settingRow = db.prepare("SELECT value FROM platform_settings WHERE key = 'admin_notifications_read_timestamp'").get() as { value: string } | undefined;
    if (settingRow) lastReadTime = parseInt(settingRow.value, 10) || 0;
  } catch {}

  // 1. Explicit notifications from notifications table for admin
  try {
    const rows = db.prepare(`
      SELECT id, user_id, title, message, type, link, is_read, created_at
      FROM notifications
      WHERE user_id = 'admin' OR user_id IN (SELECT id FROM users WHERE role = 'admin')
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit) as Array<any>;

    for (const r of rows) {
      const isRead = Boolean(r.is_read) || (new Date(r.created_at).getTime() <= lastReadTime);
      list.push({
        id: r.id,
        userId: 'admin',
        title: r.title,
        message: r.message,
        type: (r.type as any) || 'info',
        link: r.link || '',
        time: formatRelativeTime(r.created_at),
        read: isRead,
        createdAt: r.created_at,
      });
    }
  } catch {}

  // 2. Real-time Live Queue: Pending KYC applications
  try {
    const kycRows = db.prepare(`
      SELECT k.id, k.user_id, k.created_at, u.full_name, u.email
      FROM kyc_verifications k
      LEFT JOIN users u ON k.user_id = u.id
      WHERE k.status = 'pending'
      ORDER BY k.created_at DESC
      LIMIT 10
    `).all() as Array<any>;

    for (const k of kycRows) {
      const name = k.full_name || k.email || 'Колдонуучу';
      const isRead = new Date(k.created_at).getTime() <= lastReadTime;
      list.push({
        id: `kyc_queue_${k.id}`,
        userId: 'admin',
        title: 'Жаңы KYC өтүнмөсү',
        message: `${name} өздүк документин текшерүүгө жөнөттү`,
        type: 'info',
        link: '/admin/kyc',
        time: formatRelativeTime(k.created_at),
        read: isRead,
        createdAt: k.created_at,
      });
    }
  } catch {}

  // 3. Real-time Live Queue: Pending Payout Requests
  try {
    const payoutRows = db.prepare(`
      SELECT pr.id, pr.amount_minor, pr.currency, pr.requested_at, u.full_name
      FROM payout_requests pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.status = 'pending'
      ORDER BY pr.requested_at DESC
      LIMIT 10
    `).all() as Array<any>;

    for (const p of payoutRows) {
      const name = p.full_name || 'Колдонуучу';
      const amountSom = ((p.amount_minor || 0) / 100).toLocaleString('ru-RU');
      const isRead = new Date(p.requested_at).getTime() <= lastReadTime;
      list.push({
        id: `payout_queue_${p.id}`,
        userId: 'admin',
        title: 'Чыгаруу билдирмеси',
        message: `${name} ${amountSom} сом акча чыгарууну сурады`,
        type: 'warning',
        link: '/admin/financials',
        time: formatRelativeTime(p.requested_at),
        read: isRead,
        createdAt: p.requested_at,
      });
    }
  } catch {}

  // 4. Real-time Live Queue: Open Disputes
  try {
    const disputeRows = db.prepare(`
      SELECT d.id, d.reason, d.created_at, a.title as auction_title
      FROM disputes d
      LEFT JOIN auctions a ON d.auction_id = a.id
      WHERE d.status IN ('open', 'under_review')
      ORDER BY d.created_at DESC
      LIMIT 5
    `).all() as Array<any>;

    for (const d of disputeRows) {
      const isRead = new Date(d.created_at).getTime() <= lastReadTime;
      list.push({
        id: `dispute_queue_${d.id}`,
        userId: 'admin',
        title: 'Кооптуулук / Арыз билдирмеси',
        message: `"${d.auction_title || 'Илан'}" боюнча талаш-тартыш: ${d.reason}`,
        type: 'alert',
        link: '/admin/disputes',
        time: formatRelativeTime(d.created_at),
        read: isRead,
        createdAt: d.created_at,
      });
    }
  } catch {}

  // 5. Real-time Live Queue: Listings Pending Approval
  try {
    const listingRows = db.prepare(`
      SELECT id, title, created_at
      FROM auctions
      WHERE status = 'pending_approval'
      ORDER BY created_at DESC
      LIMIT 5
    `).all() as Array<any>;

    for (const l of listingRows) {
      const isRead = new Date(l.created_at).getTime() <= lastReadTime;
      list.push({
        id: `listing_queue_${l.id}`,
        userId: 'admin',
        title: 'Жаңы аукцион иланы',
        message: `"${l.title}" модерациянын кароосун күтүүдө`,
        type: 'info',
        link: '/admin/listings',
        time: formatRelativeTime(l.created_at),
        read: isRead,
        createdAt: l.created_at,
      });
    }
  } catch {}

  // Sort by date descending
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return list.slice(0, limit);
}

export function markNotificationRead(id: string, userId?: string): boolean {
  const db = getDatabase();
  if (id.startsWith('kyc_queue_') || id.startsWith('payout_queue_') || id.startsWith('dispute_queue_') || id.startsWith('listing_queue_')) {
    return true;
  }
  if (userId) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
  } else {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  }
  return true;
}

export function markAllNotificationsRead(userId: string): boolean {
  const db = getDatabase();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
  return true;
}

export function markAllAdminNotificationsRead(): boolean {
  const db = getDatabase();
  db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = 'admin' OR user_id IN (SELECT id FROM users WHERE role = 'admin')").run();
  
  const nowMs = Date.now().toString();
  db.prepare(`
    INSERT INTO platform_settings (key, value, updated_at)
    VALUES ('admin_notifications_read_timestamp', ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(nowMs);

  return true;
}
