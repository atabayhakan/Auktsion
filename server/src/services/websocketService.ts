import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { Server as HttpServer } from 'http';
import { config } from '../config/env.js';
import { getDatabase } from '../config/database.js';

interface ClientMeta {
  userId: string | null;
  role: string | null;
  rooms: Set<string>;
}

const MAX_ROOMS_PER_CLIENT = 25;
const MAX_AUCTION_ID_LENGTH = 64;

let wssInstance: WebSocketServer | null = null;
const clientMeta = new WeakMap<WebSocket, ClientMeta>();

function parseToken(req: IncomingMessage): string | null {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  return url.searchParams.get('token');
}

// Connection-level auth is OPTIONAL: live auction prices are public data, so
// anonymous visitors may subscribe to public rooms. The token (when present)
// upgrades the connection to an authenticated identity for future
// user-scoped channels; banned/suspended accounts are rejected outright.
function resolveIdentity(token: string | null): { userId: string; role: string } | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id?: string; role?: string };
    if (!decoded.id) return null;
    const db = getDatabase();
    const row = db.prepare('SELECT id, role, status FROM users WHERE id = ?').get(decoded.id) as
      | { id: string; role: string; status: string }
      | undefined;
    if (!row || row.status !== 'active') return null;
    return { userId: row.id, role: row.role };
  } catch {
    return null;
  }
}

function isValidAuctionId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_AUCTION_ID_LENGTH &&
    /^[\w-]+$/.test(value)
  );
}

export function initWebSocketServer(server: HttpServer): WebSocketServer {
  wssInstance = new WebSocketServer({ server, path: '/ws' });

  wssInstance.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const identity = resolveIdentity(parseToken(req));
    clientMeta.set(ws, {
      userId: identity?.userId ?? null,
      role: identity?.role ?? null,
      rooms: new Set<string>(),
    });

    ws.send(
      JSON.stringify({
        event: 'connected',
        authenticated: Boolean(identity),
        message: 'iTorgo Real-time WebSocket connected',
      })
    );

    ws.on('message', (message: string) => {
      let data: any;
      try {
        data = JSON.parse(message.toString());
      } catch {
        return;
      }

      if (data.event === 'ping') {
        ws.send(JSON.stringify({ event: 'pong', timestamp: Date.now() }));
        return;
      }

      const meta = clientMeta.get(ws);
      if (!meta) return;

      if (data.event === 'subscribe' && isValidAuctionId(data.auctionId)) {
        if (meta.rooms.size >= MAX_ROOMS_PER_CLIENT && !meta.rooms.has(data.auctionId)) return;
        meta.rooms.add(data.auctionId);
        ws.send(JSON.stringify({ event: 'subscribed', auctionId: data.auctionId }));
        return;
      }

      if (data.event === 'unsubscribe' && isValidAuctionId(data.auctionId)) {
        meta.rooms.delete(data.auctionId);
      }
    });

    // Drop room bookkeeping eagerly so broadcastEvent never walks dead sets.
    ws.on('close', () => clientMeta.delete(ws));

    ws.on('error', (err) => {
      console.error('WebSocket client error:', err);
    });
  });

  console.log('📡 Real-time WebSocket server initialized on path /ws');
  return wssInstance;
}

/**
 * Scoped event delivery. Events carrying `data.auctionId` are delivered only
 * to clients subscribed to that auction's room — no more global fan-out of
 * every bid to every connected browser. Events without an auctionId (e.g.
 * `auction.created`) remain global broadcasts.
 */
export function broadcastEvent(event: string, data: any): void {
  if (!wssInstance) return;

  const scopedAuctionId =
    data && typeof data.auctionId === 'string' && isValidAuctionId(data.auctionId)
      ? data.auctionId
      : null;

  const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });

  for (const client of wssInstance.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    if (scopedAuctionId) {
      const meta = clientMeta.get(client);
      if (!meta || !meta.rooms.has(scopedAuctionId)) continue;
    }
    client.send(payload);
  }
}

export function getConnectedClientCount(): number {
  if (!wssInstance) return 0;
  let count = 0;
  for (const client of wssInstance.clients) {
    if (client.readyState === WebSocket.OPEN) count++;
  }
  return count;
}
