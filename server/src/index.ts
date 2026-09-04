import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { config, getCorsOrigin } from './config/env.js';
import { getDatabase } from './config/database.js';
import { initializeSchema } from './database/schema.js';
import { seedDatabase } from './database/seed.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initWebSocketServer } from './services/websocketService.js';
import { startAuctionSweeper } from './services/auctionSweeper.js';

// Import Routes
import { authRoutes } from './routes/authRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import { auctionRoutes } from './routes/auctionRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { notificationRoutes } from './routes/notificationRoutes.js';
import { uploadRoutes, serveKycFile } from './routes/uploadRoutes.js';
import { metaRoutes, getSitemapXml, getRobotsTxt } from './routes/metaRoutes.js';
import { authenticateToken } from './middleware/auth.js';
import { apiLimiter } from './middleware/rateLimit.js';

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// 1. Initialize SQLite Database & Seed
const db = getDatabase();
initializeSchema(db);
seedDatabase(db);

// 2. Global Middlewares
app.use(helmet({
  // Pragmatic CSP: 'unsafe-inline' is still required for the inline font-loader
  // in index.html and Vue's runtime style injection, but default-src 'self'
  // plus frame-ancestors 'none' already blocks the highest-value vectors.
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://*.unsplash.com'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: getCorsOrigin(),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Static Uploads — ONLY auction images are public. KYC documents live in
// uploads/kyc and are served exclusively through the auth-gated signed-URL
// endpoint (GET /api/uploads/kyc/:filename, see uploadRoutes.serveKycFile).
app.use('/uploads/auctions', express.static(path.join(config.uploadDir, 'auctions')));
app.get('/api/uploads/kyc/:filename', authenticateToken, serveKycFile);

// 4. Global API Rate Limiter (300 req/min/IP) — applied to all /api/* routes
app.use('/api/', apiLimiter);

// 5. API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'iTorgo API Server',
    version: '2.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', metaRoutes);

// Search Engine Optimization (SEO) Endpoints
app.get('/sitemap.xml', getSitemapXml);
app.get('/robots.txt', getRobotsTxt);

// 5. Hostinger / VPS Single-Port SPA Serving (Multi-tenant: itorgo.kg vs admin.itorgo.kg)
const hasFrontendDist = fs.existsSync(config.frontendDist);
const hasAdminDist = fs.existsSync(config.adminDist);

if (hasFrontendDist || hasAdminDist) {
  if (hasFrontendDist) console.log(`📦 Serving frontend SPA static files from ${config.frontendDist}`);
  if (hasAdminDist) console.log(`📦 Serving admin SPA static files from ${config.adminDist}`);

  // Express static middleware with host routing
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/ws')) {
      return next();
    }
    const host = req.hostname || (req.headers.host || '').split(':')[0];
    const isAdminHost = host.startsWith('admin.');

    if (isAdminHost && hasAdminDist) {
      express.static(config.adminDist)(req, res, next);
    } else if (hasFrontendDist) {
      express.static(config.frontendDist)(req, res, next);
    } else {
      next();
    }
  });

  // SPA Fallback for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/ws')) {
      return next();
    }
    const host = req.hostname || (req.headers.host || '').split(':')[0];
    const isAdminHost = host.startsWith('admin.');

    if (isAdminHost && hasAdminDist) {
      res.sendFile('index.html', { root: config.adminDist });
    } else if (hasFrontendDist) {
      res.sendFile('index.html', { root: config.frontendDist });
    } else {
      next();
    }
  });
} else {
  console.log(`ℹ️ Frontend/Admin dist not found. Running in API-only mode.`);
  app.get('/', (req, res) => {
    res.json({
      message: 'iTorgo API Server is running. To serve frontend, run `npm run build` in /frontend and /admin.',
      health: '/api/health',
      docs: '/api/auctions',
    });
  });
}

// 6. Global Error Handler
app.use(errorHandler);

// 7. Initialize Real-Time WebSocket Server
initWebSocketServer(server);

// 7b. Auction sweeper — finalizes auctions whose ends_at has passed
startAuctionSweeper();

// 8. Start Server
server.listen(config.port, () => {
  console.log(`
  ======================================================
  🚀 iTorgo Backend Server Running!
  ------------------------------------------------------
  🌐 HTTP/REST URL : http://localhost:${config.port}
  📡 WebSocket URL : ws://localhost:${config.port}/ws
  🩺 Health Check  : http://localhost:${config.port}/api/health
  🗄️ Database     : SQLite (WAL Mode) at ${config.dbPath}
  📂 Uploads Dir   : ${config.uploadDir}
  ======================================================
  `);
});

export { app, server };
