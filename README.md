# Auktsion v2.0 / iTorgo — Kırgızistan Gerçek Zamanlı Açık Artırma Pazaryeri

> **Aktif Stack:** Node/Express + TypeScript + SQLite (WAL) + Vue 3 + Inertia.js
> **Arşivlenen:** Laravel 11 + MySQL + Kafka + Soketi → `archive/laravel-skeleton/`

---

## 🏗️ Mimarî Genel Bakış

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vue 3)                         │
│  frontend/ — Vue 3 + Inertia.js + Pinia + Tailwind + TypeScript │
│  • 24 sayfa, 7 modüllü admin paneli                             │
│  • i18n: ru / ky / tr (~1.421 anahtar)                          │
│  • WebSocket real-time bidding (optimistic + reconciliation)    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/WS
┌──────────────────────────▼──────────────────────────────────────┐
│                      BACKEND (Node/Express)                      │
│  server/ — Express + TypeScript + better-sqlite3 (WAL) + ws     │
│  • Atomik bidding motoru (transaction + anti-sniping)           │
│  • Parametreli SQL, admin RBAC, JWT auth                        │
│  • WebSocket server (bid.placed, outbid, auction.ended)         │
│  • Auction sweeper (expired auction finalization + escrow)      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                        VERİTABANI                                │
│  SQLite (WAL mode) → PostgreSQL migration planlandı (ADR-002)   │
│  Şema: users, auctions, bids, payments, notifications, kycs,    │
│        disputes, payouts, watchlists, categories                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 20+
- npm 10+

### Geliştirme Ortamı

```bash
# Backend
cd server
npm install
npm run dev          # tsx watch src/index.ts (port 5000)

# Frontend (ayrı terminal)
cd frontend
npm install
npm run dev          # Vite dev server (port 5173)

# Admin panel: http://admin.localhost:5173 (hosts dosyası gerekmez)
```

### Veritabanı
```bash
cd server
npm run seed         # SQLite şeması + seed data (development)
```

### Testler
```bash
# Backend unit/integration
cd server && npm run test

# E2E testler (5 tier: feature, boundary, pairwise, workload, adversarial)
cd tests/e2e && node runner.mjs --tier=all
```

---

## 📦 Production Dağıtımı

### Docker (Önerilen)
```bash
# Production stack: Node + PostgreSQL + Redis + Meilisearch + Nginx
docker compose -f docker-compose.prod.yml up -d

# Servisler:
# - app: Node/Express (port 5000)
# - db: PostgreSQL 16 (port 5432)
# - redis: Redis 7 (port 6379)
# - meilisearch: Arama motoru (port 7700)
# - nginx: Reverse proxy + SSL termination (port 80/443)
```

### Manuel (VPS/Hostinger)
```bash
cd server
npm run build        # TypeScript → dist/
npm run start        # node dist/index.js

# PM2 ile process management önerilir:
pm2 start dist/index.js --name "auktsion-api"
pm2 save && pm2 startup
```

---

## 🔧 Konfigürasyon

### Environment Variables (`.env`)

```bash
# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://auktsion.kg
ADMIN_HOST=admin.auktsion.kg

# Database
DB_PATH=./data/auktsion.db          # SQLite (development)
# DATABASE_URL=postgresql://...     # PostgreSQL (production)

# JWT
JWT_SECRET=your-super-secret-key    # 32+ karakter, production'da zorunlu
JWT_EXPIRES_IN=15m
REFRESH_SECRET=your-refresh-secret
REFRESH_EXPIRES_IN=7d

# Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760              # 10MB

# WebSocket
WS_PORT=5000                        # Same as HTTP (upgrade)

# Rate Limit
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Meilisearch
MEILI_HOST=http://meilisearch:7700
MEILI_MASTER_KEY=your-master-key
```

---

## 🗂️ Proje Yapısı

```
Auktsion/
├── server/                      # Backend (Node/Express)
│   ├── src/
│   │   ├── config/              # env, database
│   │   ├── controllers/         # HTTP controllers
│   │   ├── middleware/          # auth, rateLimit, errorHandler, upload
│   │   ├── models/              # SQL models (auction, bid, user, payment, kyc, dispute, payout)
│   │   ├── routes/              # API routes
│   │   ├── services/            # websocketService, auctionSweeper
│   │   ├── utils/               # dates, signedUploads
│   │   ├── database/            # schema.ts, seed.ts
│   │   └── index.ts             # App entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                    # Frontend (Vue 3)
│   ├── src/
│   │   ├── pages/               # 24 sayfa (LiveAuctions, AuctionDetail, Sell, Dashboard, Admin/*)
│   │   ├── components/          # UI + auction + admin + layout + payment + dashboard
│   │   ├── stores/              # Pinia stores (auction, bidding, user, auth, admin, activity, recommendations, ui)
│   │   ├── composables/         # useI18n, useFormatters, useEcho (WebSocket)
│   │   ├── types/               # TypeScript types (api, domain, admin, components)
│   │   ├── styles/              # tailwind.css (design tokens)
│   │   ├── router/              # Vue Router (lazy-loaded routes)
│   │   ├── locales/             # ru/ky/tr translations
│   │   └── main.ts              # App entry + WebSocket init
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── tests/                       # E2E + Adversarial test suite (5 tier, 68 test)
│   ├── e2e/
│   │   ├── tier1_feature/       # Feature coverage
│   │   ├── tier2_boundary/      # Boundary & corner cases
│   │   ├── tier3_pairwise/      # Cross-feature pairwise
│   │   ├── tier4_workloads/     # Real-world workload scenarios
│   │   ├── tier5_adversarial/   # Security/stress testing
│   │   └── harness/             # Test framework, mock server, assertions
│   └── adversarial/
│
├── archive/
│   └── laravel-skeleton/        # Laravel 11 + MySQL + Kafka + Soketi vizyonu (referans)
│
└── docs/                        # (Planlanıyor) ADR'ler, API docs, Runbook'lar
```

---

## 🔐 Güvenlik Durumu

| Kontrol | Durum | Not |
|---------|-------|-----|
| Rate Limiting | ✅ Aktif | `express-rate-limit` + Redis (production) |
| JWT Auth | ✅ Access + Refresh token | Rotation + revocation |
| WebSocket Auth | ✅ Token tabanlı + room izolasyonu | `bid.placed` sadece ilgili auction room'una |
| KYC Upload | ✅ Auth-gated | `express.static` kaldırıldı, signed URL ile erişim |
| CSP | ✅ Strict | `helmet` ile aktif |
| Demo User | ✅ Kaldırıldı | `isAuthenticated` default `false` |
| Seed Admin | ✅ Env-gated | Sadece `SEED_ADMIN=true` ile oluşur |
| Hardcoded Secrets | ✅ Temizlendi | `.env` + Vault/SOPS öneriliyor |

---

## 🗺️ Yol Haritası (ADR-001 Sonrası)

| Faz | Süre | Odak | Durum |
|-----|------|------|-------|
| **Faz 0** | 1-2 hft | Güvenlik (P0) + Altyapı + Mimari Karar | 🔄 **Başladı** |
| **Faz 1** | 3-5 hft | Çekirdek Döngü (Sell→API, Buy-now, Escrow, MBank, Payout) | ⏳ Planlandı |
| **Faz 2** | 6-8 hft | Mobil UX + Performans (Font, Safe-area, PWA, Skeleton) | ⏳ Planlandı |
| **Faz 3** | 9-10 hft | i18n + Erişilebilirlik + Agentic (Passkey, JSON-LD) | ⏳ Planlandı |
| **Faz 4** | 11-12 hft | Admin Olgunlaştırma (Real-time, Export, Audit) | ⏳ Planlandı |

Detaylı plan: `IMPROVEMENT_REPORT_2026.md` §7

---

## 📚 Referans Belgeler

| Belge | Konum | Açıklama |
|-------|-------|----------|
| **ADR-001** | Bu dosya (README) | Backend mimarisi kararı (Node vs Laravel) |
| **ADR-002** | `docs/adr/ADR-002-postgresql-migration.md` | PostgreSQL migration stratejisi (planlanıyor) |
| **Technical Report** | `archive/laravel-skeleton/AUKTSION_V2_TECHNICAL_REPORT.md` | Laravel vizyonu (referans) |
| **Improvement Report** | `IMPROVEMENT_REPORT_2026.md` | Güvenlik/Ürün/Tasarım analizi + yol haritası |
| **Design Audit** | `DESIGN_AUDIT_PLAN.md` | Mobil-first tasarım denetimi + trend uyumu |

---

## 🤝 Katkıda Bulunma

1. **Branch:** `feature/...` veya `fix/...` (main'e doğrudan push yok)
2. **Commit:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `security:`)
3. **PR:** Template doldurulmalı, CI gate'leri geçmeli (lint + typecheck + test + visual-regression)
4. **Review:** Min 2 approval (1 domain expert, 1 cross-functional)

---

## 📄 Lisans

Proprietary — Auktsion v2.0 / iTorgo. Tüm hakları saklıdır.

---

*Son güncelleme: 2026-08-28 — ADR-001 onayıyla aktif stack Node/Express olarak belirlendi.*