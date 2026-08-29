# Project: Auktsion v2.0

## Architecture
Auktsion v2.0 is a modern, high-performance auction marketplace tailored for Central Asian (Kyrgyzstan) and international markets, built with:
- **Frontend**: Vue 3 (Composition API, `<script setup>`), TypeScript, Vite, Vue Router 4, Pinia, Tailwind CSS, Lucide Icons, Chart.js / Vue-Chartjs.
- **Backend**: Lightweight Node.js Express server (`server/src/`), TypeScript / ESM, SQLite with WAL mode (`better-sqlite3` or `sqlite3`) with zero config, JWT authentication with bcryptjs, WebSocket / SSE real-time auction bidding ticker, and single-port SPA serving for Hostinger/VPS deployment.
- **Admin Panel**: "eBay 2026" style administrative suite under `/admin` spanning 7 core modules with role-based access control (`role: 'admin'`).

```
d:/Auktsion/
├── frontend/                     # Vue 3 Single Page Application
│   ├── src/
│   │   ├── components/           # UI Components, Layout (Header, Footer, AdminLayout), Auction, Modals
│   │   ├── pages/                # Public & User Pages (Auctions, Sell, Dashboard, Auth, Info)
│   │   │   └── admin/            # Admin Panel Pages (Overview, Users, Listings, Disputes, KYC, Financials, Monitoring, Analytics)
│   │   ├── router/               # Vue Router configuration with auth & admin guards
│   │   ├── stores/               # Pinia Stores (user, auction, bidding, admin, ui)
│   │   ├── services/             # API client (Axios/Fetch with JWT interceptors)
│   │   ├── types/                # TypeScript Domain & API interfaces
│   │   └── data/                 # Mock catalogs & fallback datasets
│   └── package.json
├── server/                       # Node.js Express Backend
│   ├── src/
│   │   ├── config/               # Database, JWT, and Server configuration
│   │   ├── controllers/          # Auth, User, Auction, Bid, Admin, Payout controllers
│   │   ├── middleware/           # Auth (JWT verification), Admin guard, Error handler, Rate limiter
│   │   ├── models/               # SQLite database tables & query helpers
│   │   ├── routes/               # Express API routes (/api/auth, /api/user, /api/auctions, /api/admin)
│   │   ├── services/             # Bidding engine, AML checks, KYC verification, Payout services
│   │   ├── ws/                   # WebSocket / SSE real-time broadcast engine
│   │   └── index.ts              # Server entry point (API + static SPA serving)
│   ├── package.json
│   └── tsconfig.json
├── tests/                        # Comprehensive E2E & Integration Test Suites
│   ├── e2e/                      # Opaque-box UI & API E2E tests (Tiers 1-4)
│   └── adversarial/              # Tier 5 Adversarial & Stress tests
├── PROJECT.md                    # Project Architecture & Milestones
├── TEST_INFRA.md                 # E2E Test Suite Index & Methodology
├── ORIGINAL_REQUEST.md           # User Requirements
└── .agents/                      # Orchestrator & Worker State Metadata
```

---

## Feature Inventory

Every feature mapped from requirements and survey findings with its assigned milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | Production Router Mapping | Map all standard routes (`/`, `/auctions`, `/auctions/:id`, `/categories`, `/dashboard/:tab?`, `/sell`, `/login`, `/register`, `/how-it-works`, `/about`, `/contact`, `/privacy`, `/terms`, `404`) to production pages | M1 | Survey UI |
| F02 | Header Container Alignment | Wrap header sub-navigation category bar in `max-w-[1440px] mx-auto` to eliminate horizontal misalignment on wide screens | M1 | Survey UI |
| F03 | Header Search & Filter Navigation | Search input in header pushes query to `/auctions?search=...` with instant reactive filtering | M1 | Survey UI |
| F04 | Dropdown Component Fixes | Fix undeclared reactive variables, positioning, and click-outside handling in `Dropdown.vue` | M1 | Survey UI |
| F05 | Auction Card Dynamic Routing | Fix lot card links in `AuctionCard.vue` and lists to navigate cleanly to `/auctions/:id` | M1 | Survey UI |
| F06 | Dashboard Tab-Aware Routing | Wire `/dashboard/:tab?` to open corresponding sub-tabs (overview, listings, bids, payments, payouts, kyc, settings) | M1 | Survey UI |
| F07 | Free/Hostinger Node.js Server | Lightweight Express server with SQLite WAL mode, environment configs, and zero-cost VPS readiness | M2 | Survey Backend |
| F08 | User Registration & Password Hashing | `/api/auth/register` with input validation, duplicate check, and bcrypt password hashing | M2 | Survey Backend |
| F09 | User Login & JWT Issuance | `/api/auth/login` validating credentials, issuing signed JWT tokens with user payload and role | M2 | Survey Backend |
| F10 | Session Verification & Logout | `/api/auth/me` to refresh user state and `/api/auth/logout` to terminate session | M2 | Survey Backend |
| F11 | Frontend Auth Guards & Store Sync | Pinia `useUserStore` sync with JWT in `localStorage`, Axios interceptor, and `router.beforeEach` guards | M2 | Survey Backend |
| F12 | User Profile & Settings APIs | `/api/user/profile`, `/api/user/password`, `/api/user/settings` for dashboard management | M2 | Survey Backend |
| F13 | User Listings & Bids APIs | Endpoints for user's active, draft, sold lots and user's active, winning, outbid bids | M2 | Survey Backend |
| F14 | User KYC & Payout APIs | Endpoints for submitting Kyrgyz INN/passport KYC and managing MBank/Optima/DemirBank payout methods | M2 | Survey Backend |
| F15 | Admin Layout & Navigation | Dedicated `/admin` layout with sidebar, header metrics, quick actions, breadcrumbs, and dark mode | M3 | Survey Admin |
| F16 | Admin Users Management Module | `/admin/users`: User table, search/filter, role change (buyer/seller/admin), ban/unban, password reset | M3 | Survey Admin |
| F17 | Admin Listings Management Module | `/admin/listings`: Lot catalog, status filters (active/ended/flagged/draft), lot approval/rejection, featured toggle | M3 | Survey Admin |
| F18 | Admin Disputes & Claims Module | `/admin/disputes`: Buyer/seller dispute ticket resolution, evidence viewer, settlement/refund triggers | M3 | Survey Admin |
| F19 | Admin KYC Approvals Module | `/admin/kyc`: Review uploaded passport/ID documents, verify 14-digit INN, approve or reject with reason notes | M3 | Survey Admin |
| F20 | Admin Financial & Payout Tracking | `/admin/financials`: Escrow balances, 8% commission revenue, payout requests processing (approve/pay), transaction audit log | M3 | Survey Admin |
| F21 | Admin Real-Time Auction Monitoring | `/admin/monitoring`: Live active bid feed ticker, countdown timers, suspicious shill bidding detection, pause lot, cancel bid | M3 | Survey Admin |
| F22 | Admin Rich Analytics Module | `/admin/analytics`: Interactive Chart.js charts for GMV, commission revenue, user growth, conversion, categories | M3 | Survey Admin |
| F23 | Admin Store & API Contracts | Complete `/api/admin/*` backend endpoints with `isAdmin` authorization middleware and frontend store | M3 | Survey Admin |
| F24 | Project Isolation Enforcement | Self-contained assets, zero external project dependencies, zero hardcoded host machine paths | M3 | Survey Admin |
| F25 | Opaque-Box E2E Testing Suite (Tiers 1-4) | Comprehensive test suite covering feature coverage, boundary conditions, cross-feature flows, real-world Kyrgyz auction scenarios | M-Final | Test Track |
| F26 | Adversarial Hardening (Tier 5) | Adversarial test cases for race conditions, bidding concurrency, auth spoofing, and edge validation | M-Final | Test Track |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M-TEST | E2E Testing Infrastructure Track | Build E2E test runner, test harness, mock servers, and test suites (Tiers 1-4). Publish TEST_READY.md | none | DONE |
| M1 | UI Alignment & Routing Fixes (R1) | Fix router index, Header category alignment, Dropdown.vue component, auction card links, dashboard subtabs, and navigation errors | none | DONE |
| M2 | Free/Hostinger Backend & Auth Flow (R2) | Implement Node.js Express server + SQLite database, JWT auth, user profile & dashboard APIs, frontend store sync | none | DONE |
| M3 | eBay 2026 Style Admin Panel (R3, R4) | Build complete Admin Panel suite with 7 core modules, admin APIs, admin store, and project isolation enforcement | M1, M2 | DONE |
| M-Final | E2E Verification & Adversarial Hardening | Pass 100% of E2E test suite (Tiers 1-4) + Tier 5 adversarial stress testing and forensic audit | M-TEST, M1, M2, M3 | IN_PROGRESS |

---

## Interface Contracts

### Frontend ↔ Backend REST API Contract

#### 1. Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register`
  - Body: `{ username, email, password, full_name, phone? }`
  - Returns: `{ success: true, token: string, user: User }`
  - Errors: `400 Bad Request` (validation), `409 Conflict` (email/username exists)
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Returns: `{ success: true, token: string, user: User }`
  - Errors: `401 Unauthorized` (invalid credentials), `403 Forbidden` (account banned)
- `GET /api/auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success: true, user: User }`
- `POST /api/auth/logout`
  - Returns: `{ success: true, message: "Logged out" }`

#### 2. User Dashboard Endpoints (`/api/user`)
- `GET /api/user/profile` | `PUT /api/user/profile`
- `PUT /api/user/password`
- `GET /api/user/listings`
- `GET /api/user/bids`
- `GET /api/user/kyc` | `POST /api/user/kyc`
- `GET /api/user/payout-methods` | `POST /api/user/payout-methods`
- `GET /api/user/payouts` | `POST /api/user/payouts`
- `GET /api/user/settings` | `PUT /api/user/settings`

#### 3. Auction & Bidding Endpoints (`/api/auctions`)
- `GET /api/auctions` (filters: `category`, `search`, `status`, `region`, `sort`)
- `GET /api/auctions/:id`
- `POST /api/auctions` (authenticated, create lot)
- `POST /api/auctions/:id/bids` (authenticated, place bid with validation & anti-sniping)
- `GET /api/auctions/:id/bids` (bid history)

#### 4. Admin Management Endpoints (`/api/admin`)
- Headers: `Authorization: Bearer <token>` (must have `role === 'admin'`)
- `GET /api/admin/overview` (KPI stats: GMV, commission, user count, active lots, pending KYC)
- `GET /api/admin/users` | `PUT /api/admin/users/:id/status` | `PUT /api/admin/users/:id/role`
- `GET /api/admin/listings` | `PUT /api/admin/listings/:id/status` | `PUT /api/admin/listings/:id/featured`
- `GET /api/admin/disputes` | `PUT /api/admin/disputes/:id/resolve`
- `GET /api/admin/kyc` | `PUT /api/admin/kyc/:id/review`
- `GET /api/admin/financials` | `POST /api/admin/payouts/:id/process`
- `GET /api/admin/monitoring` | `POST /api/admin/auctions/:id/pause` | `POST /api/admin/bids/:id/cancel`
- `GET /api/admin/analytics` (time-series revenue, category breakdown, user cohorts)

---

## Code Layout

- `frontend/src/` exclusively owned by Frontend/UI & Admin Workers.
- `server/` exclusively owned by Backend & Auth Workers.
- `tests/` exclusively owned by E2E Testing & Test Writer Workers.
- Concurrent workers will write exclusively to their respective directory boundaries.
