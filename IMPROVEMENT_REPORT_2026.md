# Auktsion v2.0 — Proje Analizi ve 2026 Geliştirme Raporu

> Tarih: 25 Ağustos 2026 · Kapsam: Tam kod tabanı denetimi (backend + frontend + testler + altyapı)

## 1. Yönetici Özeti

Auktsion v2.0, Kırgızistan pazarına yönelik gerçek zamanlı açık artırma pazaryeridir
(Vue 3 SPA + Express/SQLite backend + 7 modüllü admin paneli).

**Genel değerlendirme:** Çekirdek mimari sağlam — atomik bidding motoru (transaction +
anti-sniping), parametreli SQL, rol korumalı admin uçları ve 3 dilde (~1.421 anahtar ×
ru/ky/tr) çalışan i18n iyi durumda. Ancak proje **iki paralel kimlik** arasında sıkışmış
durumda ve birkaç kritik güvenlik/ürün açığı 2026 standartlarının gerisinde kalıyor.

## 2. Güçlü Yönler

| Alan | Kanıt |
|---|---|
| Atomik teklif motoru | `server/src/models/bidModel.ts` → `db.transaction()` içinde artış kuralı + anti-sniping soft-close (<3 dk → süre uzatma) |
| SQL güvenliği | Tüm sorgular `prepare()` + `?` parametreli; enjeksiyon riski bulunamadı |
| Admin RBAC | `/api/admin/*` tüm rotalar `requireRole` ile korunuyor |
| i18n | ru/ky/tr, 50 dosyada fiilen kullanılıyor |
| Gerçek zamanlı UI | Optimistic bid + WS reconciliasyonu (`stores/bidding.ts`) |
| Para birimi disiplini | Minor unit (tyiyn) BIGINT saklama — float hatası yok |

## 3. Kritik Bulgular (P0)

1. **KYC belgeleri herkese açık** — Pasaport/kimlik yüklemeleri `express.static('/uploads')`
   ile anonim erişime açık. NBKR-AML/KVKK uyumunda ihlal.
2. **Rate limiter kurulmuş ama hiç import edilmemiş** (`express-rate-limit@7.2.0` package.json'da,
   kodda 0 kullanım). Login/register sınırsız brute-force hedefi.
3. **JWT zayıf noktaları** — kod içi hardcoded fallback secret (`config/env.ts:14`);
   refresh token yok; logout'ta token iptali yok; 7 günlük ömür uzun.
4. **WebSocket tamamen açık** — bağlantıda auth yok, room izolasyonu yok; `bid.placed` +
   outbid bildirimleri anonim herkese global yayınlanıyor.
5. **Frontend'de hardcoded credential** — `services/aiService.ts:23-25` API key kaynak kodda.
6. **Demo kullanıcı tuzağı** — `stores/user.ts` varsayılan state'i `isAuthenticated=true`
   sahte kullanıcı; başarısız login `'demo-auth-token'` basıyor.
7. **Seed süperadmin** — `admin@itorgo.kg / AdminPass123!` her boot'ta otomatik oluşuyor.
8. **CSP kapalı** — `helmet({ contentSecurityPolicy: false })`.

## 4. Mimari Tutarsızlık (Stratejik Karar)

Repoda iki paralel dünya var:

| | "Görsel" Mimari | Gerçek Uygulama |
|---|---|---|
| Stack | Laravel 11 + MySQL + Kafka + Soketi + Meilisearch | Node/Express + SQLite + ws |
| Kod | `app/` (PHP domain iskeleti), `docker-compose.yml` (PHP-FPM stack) | `frontend/` + `server/` ("iTorgo") |
| Doküman | `AUKTSION_V2_TECHNICAL_REPORT.md` | `PROJECT.md` |

Docker-compose, çalışmayan Laravel stack'ini tarif ediyor; marka karışık (Auktsion vs iTorgo).
Karar: PHP domain katmanı + compose arşivlenmeli ya da migration planı yazılmalı.
SQLite WAL tek-node Hostinger hedefiyle uyumlu; ancak PostgreSQL'e geçiş yol haritası yazılmalı.

## 5. Ürün Boşlukları

- **SellPage ilan yayınlamıyor**: `submitAuction()` lokal obje üretip store'a ekliyor;
  `POST /api/auctions` çağrısı yok (`pages/SellPage.vue:142`). Satış akışı fiilen kopuk.
- **Buy-now fiyatı var ama satın alma endpoint'i yok** (schema'da `buy_now_price` mevcut).
- **Escrow yok**: Teknik rapor 3 gün escrow vaat ediyor; backend'de tablo/mantık yok.
- **Ödeme entegrasyonu sıfır**: MBank/Optima/DemirBank yalnızca PHP iskeletinde stub.
- **Mock test yanılgısı**: 68 test dosyası varsayılan olarak mock sunucuya karşı koşuyor
  (`tests/e2e/harness/mockServer.mjs`); gerçek backend'e değil.

## 6. 2026 Trendleriyle Hizalama

### a) Agentic Commerce
AI-yönlendirilmiş e-ticaret trafiği ~%400 büyüdü; pazaryerleri en fazla AI-trafiği alan segment.
Yapılması gerekenler:
- Her lot için schema.org `Product` + `Offer` JSON-LD işaretleme
- Kategori bazlı yapılandırılmış ilan alanları (marka, durum, uyumluluk)
- `llms.txt` + makine-okunabilir katalog endpoint'i (`/api/auctions?format=jsonld`)
- Fraud motorunu insan-davranışı sinyallerinden cihaz/kimlik tutarlılığına kaydırma

### b) SEO/GEO
Şu an dinamik içerik = sadece `document.title`; OG/canonical/hreflang/JSON-LD yok; SSR/prerender yok.
Öneri: Vite SSG prerendering veya en azından lot detay sayfaları için prerender + meta enjeksiyonu.
Dil tutarsızlığı düzeltilmeli (`index.html lang="ky"` vs default locale `ru`, Türkçe description).

### c) Passkeys/WebAuthn
5 milyar aktif passkey; NIST SP 800-63B-4 synced passkey'i resmi authenticator kabul ediyor.
Conditional-UI autofill + login sonrası otomatik upgrade pattern önerilir.

### d) Frontend ekosistemi
- Vite 8 + Rolldown (%10-30x hızlı build) — proje Vite 5'te; Node 20.19+ şart
- Vue 3.6 Vapor Mode (RC) — canlı teklif listesi/ticker gibi hot-path için opt-in
- Router lazy-loading acil (24 route statik import; admin vitrinle aynı bundle'da)
- Ölü ağırlık: `@inertiajs/vue3` (kurulu+bundle ama 0 kullanım), `framer-motion`
  (olmayan `framer-motion-vue` paketini import eden kırık bileşenler), `@vueuse/core` (0 kullanım),
  duplicate sayfalar, yetim `design/tokens.ts`

### e) Tasarım sistemi sürüklenmesi
DESIGN_SYSTEM.md eski "Liquid Luster" paletini anlatıyor; CSS'te "Sunlit Sky" var;
tema toggle'lar etkisiz. Tek doğru kaynak belirlenmeli.

## 7. Önceliklendirilmiş Yol Haritası

| Faz | Kapsam |
|---|---|
| **P0 (1 hafta)** | Upload'lara auth-gated servis, rate-limit devreye alma, WS auth+room, hardcoded secret temizliği, demo-user fallback kaldırma, seed admin env-gated, CSP |
| **P1 (2-4 hafta)** | SellPage→API bağlama, buy-now endpoint'i, escrow tablo+mantık, MBank gerçek entegrasyonu, testleri gerçek sunucuya çevirme, eksik indexler |
| **P2 (1-2 ay)** | JSON-LD + OG/canonical/hreflang + prerender, router code-splitting, passkey login, PostgreSQL geçiş planı, mimari karar (PHP iskeleti akıbeti) |
| **P3 (3+ ay)** | Vite 8/Rolldown, Vue 3.6 Vapor (hot-path), agentic katalog feed'i (ACP/UCP hazırlığı), event-outbox audit trail |

## 8. Uygulama Durumu

P0 maddeleri bu depoda uygulanmıştır (bkz. git geçmişi / ilgili dosyalar):
rate limiting, JWT fail-fast, WebSocket auth+room izolasyonu, KYC upload koruması,
seed admin env-gating, aiService key taşıma, demo-user fallback kaldırma,
router lazy-loading, inertia chunk kaldırma.
