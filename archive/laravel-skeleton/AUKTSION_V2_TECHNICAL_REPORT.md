# Auktsion v2.0 — Kırgızistan Gerçek Zamanlı Açık Artırma Mimarisi

**Proje:** Auktsion v2.0  
**Bölge:** Kırgızistan (KGS para birimi)  
**Yerel Bankalar:** MBank, Optima Bank, DemirBank  
**Tarih:** 14 Ağustos 2026  
**Kaynak Mimariler:** BidPulse (Socket.io real-time) + Devcraft Orion (Kafka event-driven) — Hibrit yaklaşım

---

## 1. Mimarî Felsefe: "Hibrit Monolit + Event-Driven Core"

| Katman | Teknoloji | Gerekçe |
|--------|-----------|---------|
| **Sunum** | Inertia.js + Vue 3 (SSR) | SEO + SPA deneyimi + KG latansında hızlı TTI |
| **API** | Laravel 11 + Sanctum | Yerel ekosistem gücü (Queue, Events, Policies) |
| **Gerçek Zamanlı** | Soketi (self-hosted Pusher) + Laravel Echo | <30ms RTT Bishkek DC'de; Pusher API uyumlu |
| **Olay Sinyali** | Kafka 3.x (KRaft, ZK-less) | Audit log, fraud, analytics, notification decoupling |
| **Veritabanı** | MySQL 8.0 (utf8mb4_unicode_ci) | İşlem tutarlılığı + JSON + CTE + Window functions |
| **Önbellek/Kilit** | Redis 7 Cluster | Bid sequence, session, rate-limit, distributed lock |
| **Arama** | Meilisearch | RU/KK/KG analyzer + typo-tolerant + facet |
| **Analitik** | ClickHouse | Bid heatmap, revenue, real-time dashboard |
| **Medya** | MinIO (S3-uyumlu) | Bishkek DC, erişim kontrolü |

---

## 2. Domain Katmanı — Kırgızistan Kurallarına Özel

### 2.1 Money Value Object (`Money.php`)
- **Varsayılan para birimi: KGS** (Kırgızistan Somu)
- `brick/money` ile **floating-point hatası sıfır**
- Minor units (tyiyn) olarak DB'de `BIGINT` saklanır
- Format: `"1 500,00 сом"` (KG locale: boşluk binlik ayracı, virgül ondalık)

```php
Money::KGS('1500.00')->getMinorUnits(); // 150000 (int)
Money::KGS('1500.00')->format();         // "1 500,00 сом"
```

### 2.2 Kırgızistan Kimlik VO (`KyzgyzstanPersonalId.php`)
- 14 haneli eski ANK **veya** yeni 2 harf + 7 rakam ID kartı
- Maskeli çıktı: `AB******12`

### 2.3 KYC Durumları (`KycStatus.php`)
| Durum | Açıklama | İşlem İzni |
|-------|----------|------------|
| `NOT_STARTED` | Başlamadı | ❌ |
| `PHONE_VERIFIED` | SMS doğrulandı | Teklif ✅, Ödeme ❌ |
| `ID_UPLOADED` | INN + kimlik yüklendi | ❌ |
| `OCR_PASSED` | OCR + liveness doğrulandı | ❌ |
| `VERIFIED` | **Tam KYC** (NBKR/AMLA onay) | ✅ Her şey |
| `REJECTED` / `ON_HOLD` | Red / Beklemede | ❌ |

> **Kural:** Teklif (bid) için `PHONE_VERIFIED` yeterli; ödeme/payout için `VERIFIED` zorunlu.

### 2.4 Fraud Motoru (`FraudEngine.php`)
- **AML eşiği:** 30,000 сом (NBKR bildirim limiti)
- **Velocity:** 20 teklif/dakika (Redis INCR)
- **Shill bidding:** Aynı IP'den ≥3 farklı hesap eşzamanlı teklif
- **VPN/Bot:** Datacenter IP + headless UA → skor artırılır
- `FraudRisk::CRITICAL` → teklif **engellenir**; `HIGH` → **review** kuyruğuna düşer

---

## 3. Ödeme Katmanı — Yerel 3 Banka Entegrasyonu

### 3.1 Ortak Sözleşme (`PaymentGatewayInterface.php`)
```php
interface PaymentGatewayInterface {
    createPaymentIntent(PaymentIntent): PaymentResult;
    confirmPayment(string, ?string): PaymentResult;
    createRefund(string, Money): PaymentResult;
    createPayout(PayoutInstruction): PaymentResult;
    getSupportedCurrencies(): array;        // ['KGS']
    getGatewayName(): string;
    verifyWebhookSignature(array, string, string): bool;
}
```

### 3.2 MBankGateway — Payworld / QR / P2P
- **Auth:** OAuth 2.0 `client_credentials` + istek başına HMAC
- **Akış:** `POST /v1/payments/intent` → QR kod / payment_url → kullanıcı MBank mobil uygulamasında onayar
- **Webhook:** HMAC-SHA256 (`webhook_secret`)
- **Payout:** MSISDN (`+996...`) bazlı P2P transfer

### 3.3 OptimaGateway — OpenAPI + 3-D Secure
- **Kart tokenizasyonu:** Tek tıkla ödeme (saved card)
- **3-D Secure:** `redirect_url` üzerinden ACS challenge
- **Para birimi:** KGS + USD (kart limitlerinde)
- **Payout:** Banka kodu (UBKARD) + hesap numarası

### 3.4 DemirBankGateway — DemirPay + HMAC
- **İmza:** `X-Signature` = HMAC-SHA256(canonical_query, api_key)
- **Webhook:** `callback_url` → HMAC doğrulama
- **Payout:** IBAN bazlı yerel havale (T+1)

### 3.5 Komisyon ve Escrow (`PaymentService.php`)
```php
$commission = $total * 0.08;           // %8 platform komisyonu
$sellerPayout = $total - $commission;  // Satıcıya gider
```
- Escrow tutma: `config('payment.escrow_hold_days')` = 3 gün
- Alıcı teslim onayı (`releaseFunds`) → payout tetiklenir

---

## 4. Payout Sistemi — Kırgızistan Banka Transfer API'leri

| Banka | Transfer Yöntemi | Gerekli Alanlar | Süre |
|-------|------------------|-----------------|------|
| MBank | P2P (MSISDN) | telefon, INN, ad | Anlık |
| Optima | Kart/Hesap | bank_code, account, INN, ad | < 1 saat |
| DemirBank | IBAN | IBAN, INN, ad | T+1 |

`PayoutInstruction` VO: `merchantPayoutId`, `amount (KGS)`, `recipientInn` (zorunlu), `bankCode`, `accountNumber`.

---

## 5. Gerçek Zamanlı Teklif (Bidding) — Hibrit Mimarî

### 5.1 Atomik Teklif Yerleştirme (Race-safe)
```php
// PlaceBidAction → DB Transaction + Optimistic Lock
$auction = $repo->findForUpdate($id);          // SELECT ... FOR UPDATE
if ($auction->version !== $expected) throw ConcurrencyException;
$bid = $auction->placeBid($bidderId, $amount); // Domain invariant
$repo->save($auction);                         // version++
event(new BidPlaced(...));                     // Sync broadcast
KafkaBidProducer::publishBid([...]);           // Async event bus
```

### 5.2 Soketi (Pusher API Uyumlu)
- **Host:** `wss.auktsion.kg` (Bishkek DC)
- **Port:** 6001 (WSS/TLS 1.3)
- **Channel:** `private-auction.{id}` — her açık artırma izole
- **Event:** `bid.placed` → Laravel Echo → Vue composable

### 5.3 Kafka Event Bus (Orion Pattern)
| Topic | Partition Key | Tüketiciler |
|-------|---------------|-------------|
| `auktsion.bids` | `auction_id` | gateway-service, fraud-service, analytics |
| `auktsion.auctions` | `auction_id` | notification, settlement |
| `auktsion.payments` | `payment_id` | reconciliation, tax |
| `auktsion.payouts` | `payout_id` | bank-notify, audit |
| `auktsion.fraud` | `user_id` | risk-engine, compliance |

- **Bölümleme:** `auction_id` → aynı açık artırmadaki teklifler sıralı işlenir
- **Exactly-once:** Idempotent consumer + transactional outbox

---

## 6. KYC / AML / Fraud — Kırgızistan Mevzuatı

| Bileşen | Standard | Entegrasyon |
|---------|----------|-------------|
| **INN Doğrulama** | NBKR / SFB kayıtları | API sorgulama (cached) |
| **Pasaport OCR** | MRZ + görsel | Tesseract + custom model |
| **Liveness** | Selfie + challenge | Passive liveness SDK |
| **Sanksiyon Listesi** | NBKR + UN + OFAC | Günlük sync, Redis cache |
| **AML Bildirimi** | ≥30,000 сом | Otomatik FIU raporu |
| **SMS Doğrulama** | Megacom / Beeline / O! | Template: "Auktsion kodunuz: 123456" |

---

## 7. Altyapı ve Dağıtım — Kırgızistan POP Optimizasyonu

### 7.1 CDN / Edge (Cloudflare)
- **POP:** Bishkek (FRU) + Almaty (ALA) — KG kullanıcıları için <20ms
- **Cache:** Static assets (img, js, css) + API GET (stale-while-revalidate)
- **WAF:** Rate limit (100 req/min/IP), GeoIP (KG-only bid), Bot fight mode

### 7.2 Soketi Bölgesel Dağıtım
| Lokasyon | RTT (ms) | Kullanım |
|----------|----------|----------|
| Bishkek DC | <5 | Primary |
| Osh DC | 15 | Failover |
| Almaty (Kazakhstan) | 25 | Cross-border fallback |

### 7.3 Veritabanı Karakter Seti
```sql
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
-- Kırgızça (KG), Rusça (RU), İngilizce (EN) tam destek
```

---

## 8. Docker / Kubernetes Dağıtım Şablonu

**Dosya:** `docker-compose.yml` (tek komutla `docker compose up -d`)

Servisler:
| Servis | Görüntü | Ölçeklenebilirlik |
|--------|---------|-------------------|
| `app` | `auktsion/app:latest` (PHP 8.2-FPM + Nginx) | HPA: CPU>70% → 3-10 pod |
| `queue` | aynı image | HPA: kuyruk uzunluğu >100 → +worker |
| `scheduler` | aynı image | Singleton (leader election) |
| `soketi` | `quay.io/soketi/soketi:latest` | 2 replica (sticky session) |
| `redis` | `redis:7-alpine` (Cluster 3-node) | Sentinel HA |
| `db` | `mysql:8.0` (Primary + 2 Replica) | GTID replication |
| `kafka` | `bitnami/kafka:3.6` (KRaft, 3 broker) | ISR=2, RF=2 |
| `meilisearch` | `bitnami/meilisearch:latest` | Single (yedek snapshot) |

---

## 9. Güvenlik ve Uyumluluk Özeti

| Alan | Yaklaşım |
|------|----------|
| **TLS** | 1.3 everywhere (Soketi, API, DB, Kafka) |
| **Auth** | Sanctum SPA token + HttpOnly cookie (admin) |
| **Rate Limit** | Redis sliding window: 60 req/min (API), 20 bid/min (user) |
| **CSP / HSTS** | Strict; `frame-ancestors 'none'` |
| **Audit Log** | Append-only (Kafka `auktsion.audit`) — 7 yıl saklama (KG vergi) |
| **Veri Yerel** | Tüm PII (INN, pasaport, telefon) Kırgızistan DCsinde kalır |

---

## 10. Geliştirme / CI-CD

```bash
# Yerel geliştirme
docker compose up -d
composer install && npm ci && npm run dev
php artisan migrate --seed
php artisan queue:work & php artisan schedule:work

# Test
./vendor/bin/pest --parallel
./vendor/bin/phpstan analyse --level=8
./vendor/bin/pint --test

# Deploy (GitHub Actions → Docker Hub → K8s/VM)
```

---

## 11. Dosya Yapısı Özeti

```
app/
├── Domain/
│   ├── Shared/ValueObjects/Money.php              # KGS VO
│   ├── Auction/
│   │   ├── Aggregates/Auction.php, Bid.php
│   │   ├── ValueObjects/KyzgyzstanPersonalId.php
│   │   └── Events/BidPlaced.php, AuctionEnded.php
│   ├── Payment/
│   │   ├── Contracts/PaymentGatewayInterface.php
│   │   ├── Gateways/MBankGateway.php, OptimaGateway.php, DemirBankGateway.php
│   │   ├── ValueObjects/PaymentIntent.php, PaymentResult.php, PayoutInstruction.php
│   │   ├── Enums/PaymentGateway.php, PaymentStatus.php
│   │   └── Services/PaymentService.php, PaymentGatewayRegistry.php
│   ├── Kyc/KycProfile.php, KycStatus.php
│   └── Fraud/FraudEngine.php, FraudRisk.php
├── Actions/Auction/PlaceBidAction.php, Payment/ProcessPaymentAction.php
├── Events/BidPlaced.php (ShouldBroadcastNow)
├── Services/Kafka/KafkaBidProducer.php
└── Http/Controllers/...

config/
├── payment.php           # Banka config, komisyon, limitler
├── broadcasting.php      # Soketi (KG POP)
└── kafka.php             # Topic/partition tanımı

docker/
├── app/Dockerfile        # PHP 8.2 + ext + locales (ru_KG, kk_KZ, ky_KG)
└── nginx/*.conf

docker-compose.yml        # Tam stack
```

---

## 12. Sonuç

Bu mimari:
- **KGS-first** para birimi ve **MBank/Optima/DemirBank** yerel entegrasyonuyla Kırgızistan bankacılık ekosistemiyle tam uyumlu
- **BidPulse**'dan: Soketi + Laravel Echo ile <30ms gerçek zamanlı teklif deneyimi
- **Devcraft Orion**'dan: Kafka event bus, partition-by-auction, consumer-group pattern
- **Laravel** ekosisteminden: Queue, Scheduler, Sanctum, Policies, Observers, Notifications
- **KYC/AML/Fraud** Kırgızistan yasalarına (NBKR, 74-son AML yasası) göre modellenmiş
- **Bölgesel latency** için Bishkek DC-first CDN, Soketi, Kafka, DB deployment

Mimari **ölçeklenebilir**, **test edilebilir** (Domain/Action ayrımı), **güvenli** (TLS everywhere, rate-limit, audit) ve **yerel mevzuata uygun**.

---

*Rapor: Auktsion v2.0 Mimari Ekibi — 14 Ağustos 2026*