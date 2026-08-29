# iTorgo v2.0 Frontend

Ultra-premium, modern, dark-themed real-time auction platform frontend for Kyrgyzstan.

## 🚀 Tech Stack

- **Framework**: Vue 3.4+ with Composition API & `<script setup>`
- **Build**: Vite 5 + TypeScript 5 (strict mode)
- **Styling**: TailwindCSS 3.4 with custom dark theme (Apple Vision Pro + Dubai Luxury + Gold accent)
- **State**: Pinia 2 (modular stores)
- **Routing**: Vue Router 4 with lazy loading
- **Real-time**: Laravel Echo + Pusher/Soketi (WebSocket)
- **Animations**: @vueuse/motion + Framer Motion
- **HTTP**: Axios with interceptors
- **Forms**: Custom components with validation
- **Charts**: Chart.js + vue-chartjs
- **Icons**: Lucide Vue Next

## 🎨 Design System

### Color Palette
- **Dark Base**: Slate 950 (`#000001`) to Slate 50 (`#1a1a2e`)
- **Gold Accent**: Gold 50 (`#fffbeb`) to Gold 950 (`#451a03`)
- **Neon Gold**: `#ffd700` (glow effects)
- **KGS Brand**: Teal (`#0d9488`)

### Typography
- **Display**: Playfair Display (serif, elegant)
- **Body**: Inter (sans-serif, modern)
- **Mono**: JetBrains Mono (numbers, code)

### Components
All components use:
- Glassmorphism (`backdrop-blur-xl`, semi-transparent backgrounds)
- Gold gradients for primary actions
- Smooth animations (300ms default, spring/bounce variants)
- Dark mode only (luxury auction feel)

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # Base UI components (Button, Input, Modal, etc.)
│   ├── layout/             # Header, Footer, Sidebar, Layouts
│   ├── auction/            # AuctionCard, BidRow, AuctionCard
│   ├── dashboard/          # StatCard, ActivityItem, PaymentRow, etc.
│   └── payment/            # PaymentModal, PayoutModal
├── composables/            # useEcho, useAuction, useCountdown, useFormatters
├── layouts/                # AppLayout, DashboardLayout, LandingLayout
├── pages/                  # All page components (Landing, Dashboard, AuctionDetail, etc.)
├── stores/                 # Pinia stores (auction, user, ui, bidding)
├── types/                  # TypeScript interfaces & enums
├── composables/            # Reusable composition functions
├── assets/
│   └── main.css           # Global styles, Tailwind, animations
└── main.ts                # App entry point
```

## 🛠 Development

### Prerequisites
- Node.js 20+
- npm 10+ (or pnpm/yarn)

### Installation

```bash
cd frontend
npm install
cp .env.example .env.local  # Configure environment variables
```

### Development Server

```bash
npm run dev
# Runs on http://localhost:5173
```

### Build for Production

```bash
npm run build
# Output in dist/
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
npm run format
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL | Yes |
| `VITE_PUSHER_APP_KEY` | Pusher/Soketi app key | Yes |
| `VITE_PUSHER_HOST` | WebSocket host | Yes |
| `VITE_PUSHER_PORT` | WebSocket port | Yes |
| `VITE_PUSHER_SCHEME` | `http` or `https` | Yes |
| `VITE_MBANK_CLIENT_ID` | MBank OAuth client ID | For payments |
| `VITE_OPTIMA_CLIENT_ID` | Optima Bank client ID | For payments |
| `VITE_DEMIRBANK_CLIENT_ID` | DemirBank client ID | For payments |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | For intl payments |

## 🏗 Key Features Implemented

### Pages
- ✅ **Landing Page** - Hero with gold particles, stats, features, categories, CTA
- ✅ **Live Auctions** - Grid with filters, infinite scroll, real-time updates
- ✅ **Auction Detail** - Carousel, countdown, bid input, bid history, seller info, Kafka mini-graph
- ✅ **Dashboard** - 11 tabs (Overview, Listings, Bids, Watchlist, Payments, Payouts, KYC, etc.)
- ✅ **Sell Page** - 5-step wizard (Details, Images, Pricing, Settings, Preview)
- ✅ **Categories** - Grid/List view, search, subcategories
- ✅ **How It Works** - 7 steps, features, FAQ, stats
- ✅ **Contact** - Form, contact info, social links
- ✅ **About** - Mission, values, team, timeline, stats
- ✅ **Privacy/Terms** - Tabbed, comprehensive, GDPR/KR compliant
- ✅ **Auth** - Login/Register with validation, social login placeholders
- ✅ 404 Page

### Real-time Features
- ✅ Laravel Echo + Soketi/Pusher integration
- ✅ Private channels per auction (`private-auction.{id}`)
- ✅ `BidPlaced` event with gold flash animation
- ✅ `AuctionEnded` event handling
- ✅ Kafka event bus integration (`BidPlaced` → Kafka → Soketi)
- ✅ Connection status indicator

### Payment Flow
- ✅ Gateway selector (MBank, Optima, DemirBank, Stripe)
- ✅ MBank: QR code payment (Payworld) + P2P
- ✅ Optima Bank: 3D Secure + card tokenization
- ✅ DemirBank: IBAN transfer instructions
- ✅ Success animation (gold confetti)
- ✅ Webhook handling

### Payout Flow
- ✅ 5-step wizard (Bank → INN → Account → AML → Confirm)
- ✅ Bank selection (MBank/Optima/DemirBank)
- ✅ INN verification (SFB integration)
- ✅ AML threshold warnings (30K/100K KGS)
- ✅ Terms acceptance

### Dashboard Components
- ✅ Stat cards with trends
- ✅ Activity timeline
- ✅ Listing rows (active/ended)
- ✅ Bid rows (winning/outbid)
- ✅ Payment rows (gateway badges)
- ✅ Payout rows (status tracking)
- ✅ Payout method cards
- ✅ KYC stepper + document upload
- ✅ Settings (2FA, password, deletion)

### UI Components
- ✅ Button (5 variants, 5 sizes, loading)
- ✅ Input (validation, icons, clearable)
- ✅ Modal (5 sizes, animations, keyboard)
- ✅ Spinner (4 variants, accessible)
- ✅ Card (4 variants, hover effects)
- ✅ Badge (7 variants, removable)
- ✅ Dropdown (click/hover, keyboard nav)
- ✅ Tabs (4 variants, keyboard)
- ✅ Stepper (3 orientations, descriptions)
- ✅ Toast (4 types, auto-dismiss, progress)
- ✅ ToastContainer (teleport, stack)
- ✅ ToastContainer (portal, animations)

### Composables
- ✅ `useEcho` - Soketi connection, channels, events
- ✅ `useAuction` - Auction CRUD, filters, real-time
- ✅ `useCountdown` - Precise countdown with warnings
- ✅ `useFormatters` - Money (KGS), dates, numbers, status labels

### Stores (Pinia)
- ✅ `useAuctionStore` - Auctions, filters, real-time updates
- ✅ `useUserStore` - Auth, KYC, payments, payouts, bids
- ✅ `useUIStore` - Toasts, modals, drawers, theme, scroll
- ✅ `useBiddingStore` - Bid placement, real-time, history

## 🌐 Deployment

### Docker
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Vercel/Netlify
- Build command: `npm run build`
- Output directory: `dist`
- SPA redirect: Configure in platform settings

### Environment
- Set all `VITE_*` variables in platform dashboard
- Ensure `VITE_API_URL` points to production backend
- Configure Soketi/Pusher production endpoints

## 🔒 Security

- CSP headers configured
- XSS protection via Vue's auto-escaping
- CSRF protection via Sanctum + cookies
- Rate limiting on API
- Secure headers (HSTS, X-Frame-Options)
- Input validation on all forms
- Secure WebSocket (WSS only in production)

## ♿ Accessibility

- Semantic HTML5
- ARIA labels on all interactive elements
- Keyboard navigation (Tab, Enter, Escape, Arrows)
- Focus visible outlines
- Color contrast (WCAG AA)
- Reduced motion support
- Screen reader compatible

## 📱 Responsive Breakpoints

| Device | Breakpoint | Layout |
|--------|------------|--------|
| Mobile | < 640px | Single column, bottom nav |
| Tablet | 640-1024px | 2-col grids, collapsible sidebar |
| Desktop | 1024-1280px | 3-4 col grids, full sidebar |
| Large | > 1280px | 4-col grids, wide layout |

## 🧪 Testing

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Visual regression (Chromatic)
npm run test:visual
```

## 📦 Bundle Analysis

```bash
npm run build -- --mode=analyze
# Opens bundle analyzer
```

## 📄 License

MIT License - see LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

- Email: support@auktsion.kg
- Telegram: @auktsion_support
- Documentation: docs.auktsion.kg

---

**iTorgo v2.0** — Кыргызстандын биринчи實时段 ачуурма платформасы