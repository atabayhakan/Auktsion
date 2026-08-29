# iTorgo / Auktsion — 2026 Tasarım Denetimi ve İyileştirme Planı

> Kapsam: `frontend/src` (müşteriye dönük sayfalar + ortak bileşenler).
> Yöntem: ckw-design (design-system, design-spatial, design-thinking, design-ux),
> StyleSeed Design Review, design-taste-frontend ve deterministic-design kurallarına
> göre statik kod denetimi. Tüm bulgular dosya/satır kanıtlıdır.
> **Öncelik ilkesi: site ağırlıklı olarak MOBİL kullanıcılar tarafından kullanılacak.**

---

## 0. Yönetici Özeti

Mevcut durum sağlam bir temele oturmuş: token mimarisi (`tailwind.css` :root değişkenleri),
"Liquid Luster / Sunlit Sky" görsel kimliği, mobil alt navigasyon, yapışkan teklif çubuğu ve
safe-area desteği zaten var. Ancak denetim **2 kritik engel (blocker)**, **8 büyük (major)**
ve çok sayıda küçük sorun ortaya çıkardı. En acil üç konu:

1. **Font yükleme stratejisi bozuk** — Google Fonts render-blocking bağlantısı + `display=swap`
   = her sayfa yüklenişinde FOUT (font pop-in). Tasarım sisteminin "asla font pop-in olmaz"
   kuralı ihlal ediliyor.
2. **iOS safe-area çalışmıyor** — `viewport-fit=cover` eksik olduğu için alt navigasyonun
   `env(safe-area-inset-bottom)`'u iPhone'larda 0 döner; çubuk home-indicator'ın altında kalır.
3. **Ölü/kirli tema katmanı** — `gold-*`, `dark-*`, `glass-panel` sınıflarını kullanan eski
   tema bileşenleri (BentoLotCard, HeroLiveAuctionCard, Navbar.vue) hâlâ depoda; hiçbir yerde
   import edilmiyorlar ama yanlışlıkla kullanılırlarsa **renksiz** render ederler (bu hata
   projenin geçmişinde bir kez yaşandı, DESIGN_SYSTEM.md'de belgeli).

---

## 1. BULGULAR — Önceliklendirilmiş Liste

### 🔴 BLOCKER (görev tamamlanamıyor / aktif yanıltıcı)

| # | Bulgu | Konum | Kanıt | Çözüm |
|---|---|---|---|---|
| B1 | **FOUT / render-blocking font**: Google Fonts `<link>` (CSS round-trip + DNS/TLS gecikmesi) ve `display=swap` → başlıklar önce fallback fontta boyanır, sonra yeniden akar. | `frontend/index.html:11-12` | `family=Poppins...&display=swap` | Poppins + JetBrains Mono'yu **WOFF2 olarak self-host** et; ilk ekranda kullanılan ağırlıkları `<link rel="preload" as="font" crossorigin>` ile önceliklendir; `<head>`'e senkron `fonts-pending` sınıfı + `document.fonts.ready` sonrası `fonts-ready` geçişi + 2.5 sn güvenlik zamanlayıcısı ekle (design-system kuralı). |
| B2 | **`viewport-fit=cover` yok** → `env(safe-area-inset-bottom)` iOS'ta 0 döner. MobilBottomNav ve AuctionDetail'deki yapışkan teklif çubuğu iPhone çentik/home-bar altında kalır. | `frontend/index.html:7`; `MobileBottomNav.vue:44`; `AuctionDetailPage.vue:~755` | `pb-[env(safe-area-inset-bottom)]` kullanılıyor ama viewport meta bunu etkinleştirmiyor | Meta'yı `width=device-width, initial-scale=1.0, viewport-fit=cover` yap. |
| B3 | **Yatay taşma kapısı hiç ölçülmedi** (zorunlu gate): 390px ve 1024px'te `scrollWidth - clientWidth === 0` doğrulaması yapılmadı. Header satırı `flex-wrap` değil; dar genişlikte logo+mega-menü+arama satırı taşabilir. | `Header.vue:126-131` (tek satır flex, nowrap davranışı) | skill zorunluluğu | Dev sunucusunu başlatıp Playwright ile 390px/768px/1024px'te ölç; >0 ise suçluyu `getBoundingClientRect` döngüsüyle bul. Savunma olarak `body { overflow-x: clip }` ve header içi satırlara `flex-wrap: wrap` ekle. |

### 🟠 MAJOR (yavaşlatır, kafa karıştırır)

| # | Bulgu | Konum | Çözüm |
|---|---|---|---|
| M1 | **Ölü eski-tema bileşenleri**: `BentoLotCard.vue`, `HeroLiveAuctionCard.vue` tanımsız `gold-500/dark-900/glass-panel/font-display` sınıflarıyla dolu (52 eşleşme); hiçbir yerde import edilmiyorlar. `Navbar.vue` da ölü kod — hardcoded Türkçe menü, var olmayan rotalar (`/canli-acik-artirmalar`, `/profil`…) ve dil listesinde desteklenmeyen `en`. | `components/auction/BentoLotCard.vue`, `HeroLiveAuctionCard.vue`, `components/layout/Navbar.vue`; `design/tokens.ts:687-754` (aynı ölü paleti anlatıyor) | Üç dosyayı ve `design/tokens.ts` içindeki ölü gold/dark bölümlerini sil. Yanlışlıkla kullanım riskini kökten kaldır. |
| M2 | **DESIGN_SYSTEM.md ile gerçek tokenlar uyuşmuyor**: Doküman `primary = #705D00` (koyu zeytin, üzerine `text-white`) diyor; `tailwind.css` ise `#F2B138` güneş altını (üzerine **koyu metin**) tanımlıyor. Dokümana göre kod yazan biri `bg-primary text-white` üretir → okunmaz kontrast. | `DESIGN_SYSTEM.md` renk tablosu ↔ `styles/tailwind.css:10-13` | Dokümanı gerçek değerlerle yeniden yaz; "primary üzerinde daima koyu metin" kuralını vurgula; `Button.vue` varyantlarını da bu kurala göre doğrula. |
| M3 | **Hardcoded Kırgızça metinler** (ru/tr kullanıcıları için bozuk deneyim): LiveAuctionsPage başlıkları/filtreleri/boş-durum ("Кыргызстан боюнча Түз Эфирдеги Аукциондор", "Фильтрлер", "Тазалоо", sıralama seçenekleri…), CategoriesPage başlığı, AuctionDetailPage öznitelik kutuları ("Породасы", "Салмагы"…), SellPage fiyat etiketleri, AdminOverviewPage. | `LiveAuctionsPage.vue:246-260, 300-470`; `CategoriesPage.vue:47-56`; `AuctionDetailPage.vue:345-410`; `SellPage.vue:573-640`; `admin/AdminOverviewPage.vue:44-48` | Tümü `t('...')` anahtarlarına çevrilsin; ky/ru/tr sözlüklerine simetrik eklenip `verify_all_translations.mjs` ile doğrulansın. |
| M4 | **Emoji UI ikonu olarak**: 🐄🚗🏢 (kart rozetleri + detay kutuları), ✨🔥🔍 (kategori hapları, filtre, boş durum), bayrak emojileri 🇹🇷🇰🇬🇷🇺 (dil seçici). Kontrolsüz renkler enjekte eder; "AI-üretimi" görünümünün 1 numaralı işareti. | `AuctionCard.vue:66-77`; `LiveAuctionsPage.vue:239, 461, 495`; `locales/index.ts` flag alanı; `MegaMenu.vue:60` | Tek bir line-icon setine geç (zaten lucide-vue-next kullanılıyor): kategori ikonları lucide karşılıklarıyla, bayraklar yerine dil kodu rozeti (KY/RU/TR). |
| M5 | **`prefers-reduced-motion` yalnızca motion.ts'te var**; CSS animasyonları (5 sn'lik sonsuz shimmer-sweep, pulse-glow, float, wiggle, sayfa geçişleri) bunu umursamıyor. | `styles/tailwind.css` animasyonlar; `AuctionCard.vue:216-222`; `App.vue:38-53` | Global ekle: `@media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important } }` |
| M6 | **iOS input zoom**: arama ve form inputları `text-xs`/`text-sm` (<16px). iOS, 16px altındaki inputlara odaklanınca sayfayı otomatik zoom'lar — mobilde her aramada ekran zıplar. | `Header.vue:184` (`text-xs xl:text-sm`), tüm Input bileşeni | Mobilde input font-size ≥16px (`text-base sm:text-sm` gibi) veya form elemanlarına `maximum-scale` yerine doğru çözüm olan 16px kuralı uygulanmalı. |
| M7 | **Dokunma hedefleri 44px altında**: MobilBottomNav öğeleri `py-2` (~40px), header ikon butonları `p-2` (~32px), kart rozetleri tıklanamaz ama görsel olarak butonumsu. | `MobileBottomNav.vue:49`; `Header.vue:296-303` | Alt nav öğelerini min 44×44 dp yap (`py-2.5` + icon 24px); header ikon butonlarına `min-w-[44px] min-h-[44px]`. |
| M8 | **Toast konumu mobilde çakışıyor**: `#toast-container` sabit `bottom-6 right-6`; mobilde alt navigasyon/yapışkan teklif çubuğunun üstüne biner. | `App.vue:31` | Mobilde `bottom-20 sm:bottom-6` (alt bar yüksekliği kadar yukarı) veya üstten bildirime geç. |

### 🟡 MINOR (parlaklık / tutarlılık)

| # | Bulgu | Konum | Çözüm |
|---|---|---|---|
| m1 | `text-[9px]`/`text-[10px]` 27 dosyada 102 kez — mobilde okunabilirlik sınırının altında. | grep kanıtı | Minimum `text-[11px]`; gerçekten mikro etiketler için tip ölçeğinde `text-xs` standartlaştır. |
| m2 | Karışık radius dili: `rounded`(10px), `rounded-xl`(12), `rounded-2xl`(16), `rounded-3xl`(24), `rounded-full` aynı ekranda iç içe. | AuctionDetailPage, Header | Radius ölçeğini 3 kademeye indir: 10 (kontrol), 16 (kart), 24 (panel). |
| m3 | Karanlık mod kalıntıları: `* { @apply ... dark:border-slate-700 }` ve çeşitli `dark:` sınıfları; dokümana göre dark mode kaldırıldı. | `tailwind.css:57`; DashboardSidebar vb. | `dark:` sınıflarını temizle; `.dark` bloklarını sil. |
| m4 | Sahte veri fallback'leri güven sarsıyor: `(auction.views \|\| 1420)`, AboutPage "50 000+ kullanıcı", mockAuctions fallback'i canlı listede. | `AuctionDetailPage.vue:657`; `AboutPage.vue:22-27`; `LandingPage.vue:36-41` | Veri yoksa "—" göster veya bölümü gizle; sahte istatistikleri gerçek API'ye bağla veya kaldır. |
| m5 | Login sayfası demo kimlik bilgilerini production'da ön-dolduruyor. | `LoginPage.vue:18-19` | Sadece dev modunda (`import.meta.env.DEV`) ön-doldur. |
| m6 | AuctionDetail loading state'i generic spinner (`Loader2`); final düzeni izlemeyen iskelet yok. | `AuctionDetailPage.vue:337-340` | Final kart düzenini izleyen skeleton (görsel kutusu + başlık satırları + fiyat bloğu) ile değiştir. |
| m7 | LCP görseli öncelendirilmemiş: hero/kart görsellerinde `fetchpriority="high"` yok; bazı img'larda `width/height` yok (aspect-ratio kabı var, CLS riski düşük ama sıfır değil). | `AuctionCard.vue:130-135`; `AuctionDetailPage.vue:309-314` | İlk ekran görseline `fetchpriority="high"`; diğerlerine `decoding="async"`; tüm img'lere boyut rezervi. |
| m8 | Teklif gönderiminde idempotency anahtarı yok (yalnızca client-side `isPlacingBid` kilidi); çift tıklama/zayıf ağda mükerrer teklif riski. | `AuctionDetailPage.vue:262-283` | placeBid çağrısına UUID idempotency-key ekle (server tarafı doğrulamasıyla). |
| m9 | `animate-bounce-in` her teklif sayısı güncellemesinde tetikleniyor + `ring-offset` flaşı — yoğun canlı aksiyonda dikkat dağıtıcı. | `AuctionCard.vue:110-117` | Animasyonu tek seferlik yumuşak renk geçişine indir (mevcut price-flash yeterli). |
| m10 | Dil seçicide seçili öğede hem kalın hem çift kenarlık + tick — görsel gürültü. | `Header.vue:373-377` | Tick + tint yeterli; border kaldır. |

---

## 2. 2026 TREND UYUM DEĞERLENDİRMESİ

| Trend | Durum | Not |
|---|---|---|
| Glassmorphism / translucency | ✅ Güçlü | `.glass` sistemi tutarlı ve performanslı blur kullanıyor. |
| Token-tabanlı tasarım sistemi | ✅ Var, ⚠️ doküman sapması | CSS değişkenleri + Tailwind köprüsü doğru; M2'deki doküman uyumsuzluğu giderilmeli. |
| Emoji'siz, tek ikon dili | ❌ Kısmen | lucide zaten bağımlılık; M4 ile tamamlanacak. |
| Erişilebilir hareket (reduced-motion) | ❌ Eksik | M5 ile kapanacak. |
| Mobil-önce düzen | ✅ İyi temel | Alt nav, sticky CTA, filtre çekmecesi mevcut; B2/M6/M7 ile olgunlaşır. |
| Büyük tipografik hiyerarşi | ⚠️ Zayıf | Sayfa başlıkları iyi (`text-3xl→5xl extrabold tracking-tight`) ama mikro-metin bolluğu (m1) hiyerarşiyi zayıflatıyor. |
| Tek vurgu rengi disiplini | ⚠️ | Gold + blue + success/error/warning makul; ancak amber-500/10 chip'leri token dışı — `primary-container` tokenına geçirilmeli (`AboutPage.vue:51`, `ContactPage.vue`, `CategoriesPage.vue`). |
| Skeleton-first yükleme | ❌ | Spinner'lar hâlâ baskın (m6). |
| PWA / offline farkındalığı | ❌ | manifest.json yok; Kyrgyzistan'da kesintili bağlantı için değerli (bkz. Mobil Plan §4). |

---

## 3. MOBİL İYİLEŞTİRME PLANI (birinci sınıf gereklilik)

### 3.1 Hemen yapılacaklar (P0)
1. **B2** — `viewport-fit=cover` (safe-area'yı fiilen çalıştırır).
2. **M6** — input font-size ≥16px (iOS zoom'u önler).
3. **M7** — tüm dokunma hedefleri ≥44×44px; alt nav öğeleri `py-2.5`.
4. **M8** — toast'ları alt barların üstüne taşı.
5. **B3** — 390px yatay taşma ölçümü ve düzeltme (her yeni satır öğesi eklendiğinde kapı yeniden açılır).

### 3.2 Baş-parmak bölgesi (thumb-zone) düzeni
- AuctionDetail'de sticky bid bar zaten doğru yerde ✅. Ek olarak:
  - Sekonder aksiyonlar (Paylaş, Satıcıya yaz, Bildir) mobilde alta değil, içerik akışında kalmalı; sticky bara **sadece birincil CTA** konmalı (mevcut durum doğru — korunsun).
  - Filtre çekmecesindeki "N sonucu gör" butonu zaten altta ✅.
  - SellPage sihirbazında İleri/Geri butonlarını ekran altına sabitle (şu an içerik içinde).

### 3.3 Performans / veri tasarrufu
- Görsellere `srcset` + WebP/AVIF; liste kartlarında `sizes="(max-width:640px) 100vw, 33vw"`.
- Canlı teklif WebSocket güncellemelerinde mobil arka planda sekme gizliyken throttle.
- Countdown interval'i `requestAnimationFrame` yerine saniyelik setInterval kalsın ama `visibilitychange`'de duraklat.

### 3.4 PWA temelleri
- `manifest.webmanifest` (ad, ikonlar, theme-color #F2B138), service worker ile temel çevrimdışı kabuk + son görülen açık artırma listesinin cache'i.
- iOS'a "Ana ekrana ekle" ipucu (ilk ziyarette, dismissible).

### 3.5 Mikro-etkileşim (design-spells, ölçülü)
- Tek imza hareket: teklif kabulünde fiyat rakamının kısa "count-up + flash" animasyonu (mevcut price-flash'i genişlet). Diğer her yerde hareket sessiz kalsın — "punctuation" kuralı.
- Teklif butonunda `navigator.vibrate(10)` (Android; iOS yok, zararsız).

---

## 4. UYGULAMA SIRASI (önerilen sprint sırası)

| Faz | İşler | Tahmini etki |
|---|---|---|
| **Faz 1 — Kritik altyapı** | B1 font self-host+FOUT kapısı, B2 viewport-fit, B3 taşma ölçümü, M5 reduced-motion | Her sayfada algılanan hız + iOS güvenilirliği |
| **Faz 2 — Temizlik** | M1 ölü dosyaların silinmesi, M2 doküman senkronu, m3 dark kalıntıları | Bakım yükü ↓, regresyon riski ↓ |
| **Faz 3 — Mobil UX** | M6, M7, M8, thumb-zone, skeleton'lar (m6) | Dönüşüm ↑, hata oranı ↓ |
| **Faz 4 — i18n & tutarlılık** | M3 hardcoded metinler, M4 emoji→ikon, m1 tip ölçeği, m2 radius ölçeği | ru/tr pazaryeri açılır, marka tutarlılığı |
| **Faz 5 — Güven & parlaklık** | m4 sahte veri, m5 demo kimlik, m8 idempotency, m7 LCP, PWA (§3.4) | Üretim hazırılığı |

Her fazdan sonra: `node scripts/verify_all_translations.mjs` + 390px/1024px taşma ölçümü +
(render mümkünse) taze gözlerle Nielsen skorlaması — "kendini not verme" kuralı gereği ayrı
denetçi perspektifi.

---

## 5. Doğrulama Kontrol Listesi (her teslimde)

- [ ] `scrollWidth - clientWidth === 0` @390px ve @1024px
- [ ] Font pop-in yok (yavaş 3G simülasyonunda başlık fallback flash'ı yok)
- [ ] iPhone safe-area: alt çubuk home-indicator üstünde
- [ ] Input odaklanınca sayfa zoom yapmıyor
- [ ] Tüm dokunma hedefleri ≥44px
- [ ] `prefers-reduced-motion` açıkken animasyonlar duruyor
- [ ] ru/tr dilinde hardcoded Kırgızça/Türkçe metin kalmadı
- [ ] Emoji UI ikonu kalmadı
- [ ] `verify_all_translations.mjs` → 0 hata
