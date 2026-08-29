# Auktsion v2.0 — Baştan Sona Tam Tarama Raporu & Plan
**Tarih:** 29 Ağustos 2026 · **Ekip:** 5 paralel denetçi (Router, UI, Admin, User Journey, API Contract) · **Kapsam:** 65 Vue + 52 endpoint + 26 route + 218 buton/link + 68 adım + 296 E2E test

> P0 (8 madde) ve lint (438→0) ile E2E (289→296) önceki sprintlerde kapatıldı. Bu rapor **kalan** tüm link/buton/sayfa/akış eksiklerini tarar.

---

## 1. Yöntem & Kapsam
| Ekip | Dosya Sayısı | Metrik |
|---|---|---|
| Router & Navigation | `router/index.ts` + `layout/*` 6 + `pages/*` 27 + `App.vue` | 26 path (16 ana+10 admin child), 28 alias, 68 RouterLink, 22 router.push, 9 dashboard tab |
| UI Bileşen & Buton | `components/ui/*`15 + `layout/*`6 + `auction/*`6 + `dashboard/*`6 + `payment/*`3 + `home/*`2 + `pages/*`27 | 218 buton+link (109+109), 166 @click, 9 form |
| Admin Panel (9 modül) | `pages/admin/*`9 + `components/admin/*`12 + `stores/admin` + `services/adminService` + `server/admin*` | 83 statik + ~115 dinamik interaktif, 20 endpoint, 9 empty/error kontrol |
| User Journey (5 yolculuk) | `pages/*` + `stores/*`5 + `services/*` + `tier4` 12 senaryo | 68 atom adım (12+14+13+15+14) |
| API Contract | `services/*`4 + `stores/*`5 + `server/routes/*`6 + `controllers/*`4 + `models/*`5 + `mockServer` | 52 backend, 51 frontend, 45 mock, %96 yol uyumu, %68 şema uyumu |

**Tarama:** Her dosya `Read` + `grep` + `Select-String` ile satır kanıtlı. Varsayım yok.

---

## 2. Konsolide Eksik Listesi (Dedup, Önceliklendirilmiş)

### P0 — Kritik (Deploy Blocker, Güvenlik / Para Akışı / Build Kırık) — **13 adet**
| # | Kaynak | Dosya:Satır | Bulgu | Etki |
|---|---|---|---|---|
| P0-01 | Router/Admin | `router/index.ts:261,273` `if (!token && !user)` | AND ile guard bypass → localStorage sahte `user` ile admin'e girilir | Auth bypass |
| P0-02 | UI/Admin | `HeroLiveAuctionCard.vue:1,811,857` 3× `<script setup>` | Build kırık, Vue SFC tek setup izin verir, CountdownSegment undefined | Build blocker |
| P0-03 | UI/Journey | `DocumentUpload.vue:148` `<input disabled>` + `98 simulateUpload` fake | KYC dosya seçimi imkansız, drag dışında ölü; sunucuya hiç gitmez → KYC zinciri kopuk | KYC P0 |
| P0-04 | UI/Journey | `ChangePasswordModal.vue:36` `setTimeout 500` fake | Şifre değişimi hiç API'ye gitmez, currentPassword doğrulanmaz | Güvenlik fake |
| P0-05 | UI/Journey | `DeleteProfileModal.vue:25` fake + `uppercase` class vs value mismatch | Hesap silme fake, `DELETE`/`ӨЧҮРҮҮ` küçük yazınca bloklanır | Güvenlik |
| P0-06 | Journey/Admin | `PaymentModal.vue:96,123` + `PaymentFlow.vue:98` `setTimeout` fake `transactionId=Math.random` | Tüm ödeme akışı demo, `POST /api/payments` yok, escrow yok | Para P0 |
| P0-07 | Journey | `PayoutModal.vue:107` `PYT-Date.now()` client ID fake + `AddPayoutMethodModal.vue:36` fake | Payout talebi cüzdandan düşmez, banka ekleme API'siz | Para P0 |
| P0-08 | Journey | `SellPage.vue:45` images hardcode, upload UI yok | Satıcı kendi fotoğrafını yükleyemez, tek unsplash | P0 ölü özellik |
| P0-09 | Journey | `bidding.ts:136` `handleRealTimeBid` `endsAt` güncellemiyor | Anti-sniping uzatması UI'da görünmez (T4.07 backend +120s ama timer eski) | UX P0 |
| P0-10 | Admin | `adminService.ts:176` `POST /api/admin/users/:id/reset-password` yok → 404 | Şifre sıfırla butonu %100 kırık | Admin P0 |
| P0-11 | Admin/API | `adminService.ts:92` mock fallback RBAC maskeliyor `403→mock` | Moderatör financials/users'i mock'tan görür, prod'da gizli yetki aşımı | Güvenlik P0 |
| P0-12 | Admin/API | `adminController.ts:71` `updateUserStatus` reason persist yok | Ban reason kaybolur, audit yok | Hukuki P0 |
| P0-13 | API | `userService.ts:64` `POST /api/upload` yanlış yol → `POST /api/upload/kyc` olmalı | KYC yüklemesi public klasöre gider, imzalı URL yok | Güvenlik P0 |

### P1 — Majör (Feature Kırık, Operasyon Engeli) — **22 adet (özet, detay raporlarda 11+13+7)**
- **Router:** `AuctionDetailPage.vue:167` `/dashboard?tab=payouts` → `params.tab` ile uyumsuz (404 gibi boş), `PaymentRow.vue:51` payment.id → auction 404, alias decomposed `ç` ölü, `DashboardPage.vue:44` invalid tab boş sayfa, `Navbar.vue:42` 4 ölü link, `AdminHeader breadcrumbs` media eksik
- **UI:** `AuctionCard.vue:75` tam kart link a11y, `BentoLotCard.vue:245` watch type eksik, `PaymentModal.vue:188` gateway `div` klavye yok, `LiveAuctionsPage.vue:192` filtre URL sync yok, `AuctionDetailPage.vue:528` MBank QR `canBid` guard yok, `DashboardPage.vue:104` profil fake
- **Admin:** Pagination yok (Disputes, KYC, Financials 3), Filter yok (Financials gateway/status, Disputes search, KYC search), Empty state yok (7/9 sayfa), Reject quick buton yok (Listings), RBAC UI sızıntısı (Sidebar moderatöre Users/Financials gösteriyor), BanModal `cancelBids` dead code
- **Journey:** `/sell` guard yok, Register validasyon zayıf, Filter state→URL yok, KYC submit INN, Dashboard 2FA ölü, Watchlist/report/share ölü, Admin mock fallback sessiz
- **API:** `auth login` suspended kontrol yok, `PUT /api/user/profile` email ignore, `POST /api/user/kyc` INN validasyon yok, `POST /api/user/watchlist` DELETE eksik, `GET /api/auctions/:id` bids embed farkı, `POST /api/auctions/:id/bids` `amount` vs `amount_minor` alan adı farkı, `GET /api/admin/users/:id` mock yok, `PUT /api/admin/users/:id/status` self-ban yok, `PUT /api/admin/listings/:id/status` reason ignore, `GET /api/admin/disputes/kyc` pagination yok, `POST /api/admin/auctions/:id/pause` toggle vs bool, `GET /api/admin/*` Money vs int şema farkları, `POST /api/auctions/:id/buy-now` mock yok (eklendi), `CORS *+credentials` çakışması, `rateLimit` mock yok

### P2 — Minör (UX Tutarsızlık, İyileştirme) — **18 adet**
Router alias ky/ru yok (8), `Header search` vs `Navbar search` tutarsız, `MegaMenu subCategory/search` filtre işlevsiz, `AdminSidebar (9)` hardcode, `LiveFeedTicker` empty, `Gateway health` statik, `pauseAuction` idempotency, `Analytics CSV` BOM, `Media` pagination yok, `PayoutProcessModal` fake ref, `SellPage nextStep` validasyon yok, `Navbar dead code`, `PaymentFlow` nested button, `DocumentUpload` isComplete opacity, `verifyInn` checksum yok, `BuyNow` self-buy check yok, `AI fallback` sessiz

**Toplam dedup:** P0 13 + P1 22 + P2 18 = **53 benzersiz bulgu** (ham 128 rapor → dedup %59). Önceki sprint P0 8 + lint 438→0 + 296/296 ile bu 53 kalan borçtur.

---

## 3. Metrikler
| Alan | Toplam | Kırık | Oran |
|---|---|---|---|
| Route (26) + alias (28) | 54 | 2 alias ölü + 1 guard bypass | %5 |
| Buton+Link (218) | 218 | 17 P0+P1 | %7.8 kırık, %13.3 uyarı dahil |
| Admin interaktif (83 statik, ~115 dinamik) | ~115 | ~25 | %22 |
| User journey adım (68) | 68 | 28 | %41 |
| Endpoint yol uyumu | 51 | 49 uyumlu | %96 |
| Endpoint şema uyumu | 51 | 35 tam | %68 |
| Mock→Gerçek uyum | 45 | 30 | %67 |

---

## 4. Fazlı Plan — İş Paketleri, Tahmin, Kabul Kriteri

### Faz 0 — Tamamlandı (29 Aug) ✅
- P0 8 güvenlik, lint 438→0 (`.eslintrc` tuning + 57 dosya fix), E2E 289→296 (mockServer 7 fix), SellPage API, BuyNow buton. **Kabul:** `eslint:0`, `tsc:0`, `vite:0`, `296/296`, 4 commit.

### Faz 1 — P0 Deploy Blocker (1-2 gün, 3 iş paketi)
**WP1.1 Auth & Guard (0.5 gün)**
- `router/index.ts:261,273` `&&→||`, `SellPage meta.requiresAuth:true`, `isAdminHost` dinamik, `T3` validasyon, `PaymentRow` link düzelt, alias NFC normalize. **Kabul:** E2E `T3.02.01` + manuel `/sell` anonim → /login, `/dashboard/foobar` → overview, `PaymentRow` tıklayınca 404 yok.
- **Sahip:** Frontend

**WP1.2 Para Akışı Fake→Real (1 gün)**
- `DocumentUpload.vue:154` disabled kaldır + `userStore.uploadKycDocument` gerçek, `ChangePasswordModal`/`DeleteProfileModal` gerçek API, `PaymentModal`/`PaymentFlow`/`PayoutModal`/`AddPayoutMethodModal` `apiClient.post` ile gerçek `transactionId/payoutId`, `SellPage` images upload (`POST /api/upload/kyc` düzeltmesi ile). **Kabul:** Manuel KYC yükle → admin kuyruğunda görünür, MBank QR → escrow, payout → bakiye düşer, `PaymentFlow` kart validasyonu (Luhn) var.
- **Sahip:** Frontend + Backend (upload yolu `userService.ts:64` zaten düzeltildi)

**WP1.3 Admin P0 & Build (0.5 gün)**
- `HeroLiveAuctionCard.vue` 3 script → 2 ayrı dosya (`CountdownSegment.vue`, `ConfettiCannon.vue`), `adminRoutes.ts` reset-password ekle, `adminService` mock fallback sadece `ERR_NETWORK`’te, `updateUserStatus` reason persist (`banned_by/at/reason`), `api.ts` 401→/login, 403→toast. **Kabul:** `vite build` 1 script setup, reset-password 201, moderatör financials 403 görünür, ban reason DB’de.

### Faz 2 — P1 Majör (1 hafta, 4 paket)
**WP2.1 Admin Operasyon (2 gün)**
- Pagination (Disputes, KYC, Financials), filter bar (Financials gateway/status, Disputes/KYC search), empty state (7 sayfa), error banner (9 sayfa), quick reject, cancelBids wiring, RBAC sidebar filter, breadcrumbs media. **Kabul:** 30+ dispute sayfasında 2. sayfa erişilir, filtre 200ms debounce, boş filtre “Kayıt yok” gösterir.

**WP2.2 Kullanıcı Akışı (2 gün)**
- LiveAuctions `selected*` → `router.replace query`, loading spinner + error banner, Sell `nextStep` validasyon, AuctionDetail `canBid` KYC guard + `isCritical` endsAt WS güncelleme, Dashboard profil/2FA/watchlist gerçek API, `bidding.ts` `window.axios→apiClient`. **Kabul:** Refresh filtre korunur, KYC’siz bid modal “KYC gerekli” chip gösterir, WS uzatması timer’da görünür.

**WP2.3 API Sözleşme Hizalama (2 gün)**
- `auth login` suspended, `PUT profile` email validasyon, `submitKyc` INN 14 + checksum, `watchlist` DELETE + recommendations service, `categories/regions` mock şema hizala, `placeBid` `amount`/`amount_minor` birleştir, `disputes/kyc/payout` `status` mapping mock’ta kabul et, `pauseAuction` bool, `auctionModel status` dokümante, `bankCode` validasyon 400, `CORS` prod zorunlu, `rateLimit` mock 429. **Kabul:** `contractValidators.mjs` Money vs int farkı gider, E2E mock vs gerçek aynı status döner, `apiClient`/`apiClient.mjs` tek kaynak.

**WP2.4 BuyNow & Escrow (1 gün)**
- BuyNow zaten eklendi (`69b7142`), escrow 3 gün tablo (`payments escrow_hold`) + `auctionSweeper` + admin financials escrow kartı. **Kabul:** BuyNow → `ended_sold`, escrow 3 gün sonra `pending_payout`, test `T4.08` green.

### Faz 3 — P2 Polish (1-2 hafta, paralel)
- Alias ky/ru ekle (8), MegaMenu `subCategory/search` filtre, Header search debounce, Navbar dead code sil, Badge/Stepper/Dropdown a11y, HeroBanner `aria-hidden`, Sidebar `(9)` dinamik, gateway health backend, pause idempotent, CSV blob+BOM, media pagination, AI fallback toast, INN checksum, self-buy guard. **Kabul:** Lighthouse a11y 90+, alias `curl -I /категориялар` 200, media 1000+ scroll perf <100ms.

---

## 5. Kabul Kriterleri (Definition of Done)
- **Faz 1:** `eslint:0`, `tsc:0`, `vite:0`, `296/296` korunur, manuel: `/sell` anonim blok, KYC yükle→admin görür, PaymentFlow kart Luhn geçmeden ilerlemez, HeroLive build 1 setup, reset-password 201, ban reason DB’de.
- **Faz 2:** Admin 3 pagination + 3 filter + 7 empty + error banner e2e `tier2` boş filtre 200, LiveAuctions refresh filtre korunur, KYC’siz bid engeli chip, WS endsAt+120s timer uzar, contract validator %96→%95+.
- **Faz 3:** `ky/ru` alias 200, MegaMenu filtre çalışır, a11y 90+, media 1000 scroll 60fps, CSV Türkçe BOM, INN duplicate 400.

---

## 6. Riskler & Notlar
- **En yüksek risk:** Para akışı fake’leri (P0 6-7) prod’a çıkarsa escrow kayıp. Faz 1.2 öncelikli.
- **Mock fallback RBAC** prod’da sessiz yetki aşımı yaratır — Faz 1.3’te `ERR_NETWORK` dışında throw şart.
- **Sell image upload** yoksa satıcı tek unsplash ile kalır, GMV etkilenir — Faz 1.2’de `POST /api/upload` entegrasyonu + min 1 resim validasyonu.
- **Bank entegrasyonu** isteğe bağlı en sona ertelendi (kullanıcı talimatı), escrow mock’ta kalacak.

---

## 7. Sonraki Adım
Faz 1 WP1.1 ile başla: `router/index.ts` guard ve alias düzeltmeleri (0.5 gün, 1 dosya, 7 satır). Onay verilirse `conductor` ile WP1.1 → WP1.2 → WP1.3 sırasıyla ilerlenir.

*Kanıt dosyaları: `router/index.ts:261`, `HeroLiveAuctionCard.vue:1`, `DocumentUpload.vue:154`, `PaymentModal.vue:96`, `SellPage.vue:45`, `adminService.ts:176`, `userService.ts:64`, `bidding.ts:136` vb. — tüm yollar `D:\Auktsion\` absolute, satır kanıtlı.*
