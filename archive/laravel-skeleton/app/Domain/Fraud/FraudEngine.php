<?php

namespace App\Domain\Fraud;

use App\Domain\Fraud\Enums\FraudRisk;
use App\Domain\Shared\ValueObjects\Money;

/**
 * Kırgızistan'a özel gerçek zamanlı fraud/risk motoru.
 * Yerel bankaların kurallarına + NBKR AML uyarı eşiklerine göre puanlar.
 */
final class FraudEngine
{
    // NBKR AML bildirim eşiği (KGS) — 30,000 сом ve üzeri işlemler izlenir
    private const AML_MINOR_THRESHOLD = 3_000_000;

    // Tek kullanıcının belirli sürede en fazla kaç teklif verebileceği
    private const BID_VELOCITY_PER_MINUTE = 20;

    // Aynı IP/cihazdan farklı hesaplarla eşzamanlı teklif (shill bidding) eşiği
    private const SUSPECTED_COLLUSION_THRESHOLD = 3;

    public function __construct(
        private readonly \Redis $redis, // ya da Cache facade
    ) {}

    public function assessBidRisk(
        int $bidderId,
        string $ip,
        string $userAgent,
        Money $amount,
        int $auctionId,
        ?int $relatedBidderCount = null,
    ): FraudRisk {
        $score = 0;

        // 1) İşlem tutarı AML eşiğini aşıyorsa yüksek risk
        if ($amount->greaterThanOrEqual(Money::KGS(self::AML_MINOR_THRESHOLD))) {
            $score += 2;
        }

        // 2) Teklif hızı (velocity check) — Redis INCR ile sayaç
        $count = $this->redis->incr("bid_velocity:{$bidderId}");
        $this->redis->expire("bid_velocity:{$bidderId}", 60);
        if ($count > self::BID_VELOCITY_PER_MINUTE) {
            $score += 3;
        }

        // 3) Aynı IP'den çok hesap (sybil / shill bidding)
        if ($relatedBidderCount !== null && $relatedBidderCount >= self::SUSPECTED_COLLUSION_THRESHOLD) {
            $score += 3;
        }

        // 4) VPN / datacenter IP tespiti
        if ($this->isSuspiciousIp($ip)) {
            $score += 2;
        }

        // 5) Headless browser / bot user-agent sinyalleri
        if ($this->isAutomatedUserAgent($userAgent)) {
            $score += 2;
        }

        return match (true) {
            $score <= 1 => FraudRisk::LOW,
            $score <= 3 => FraudRisk::MEDIUM,
            $score <= 5 => FraudRisk::HIGH,
            default => FraudRisk::CRITICAL,
        };
    }

    /** Telefon numarası üzerinden Truecaller/KG mobil doğrulama taklidi */
    public function verifyKgPhone(string $phone): bool
    {
        // +996 ile başlamalı, 9 haneli sonrası
        return preg_match('/^\+?996\s?\d{9}$/', $phone) === 1;
    }

    private function isSuspiciousIp(string $ip): bool
    {
        // MaxMind / ipinfo.is işaretlemesi. Örnek: datacenter IP aralıkları.
        // Gerçek uygulamada geoip servisinden okunur.
        return false; // env'e göre toggle
    }

    private function isAutomatedUserAgent(string $userAgent): bool
    {
        return (bool) preg_match('/curl|python-requests|postman|HeadlessChrome/i', $userAgent);
    }
}

namespace App\Domain\Fraud\Enums;

enum FraudRisk: string
{
    case LOW = 'low';
    case MEDIUM = 'medium';
    case HIGH = 'high';
    case CRITICAL = 'critical';

    public function blocksBid(): bool
    {
        return in_array($this, [self::CRITICAL], true);
    }

    public function flagsForReview(): bool
    {
        return in_array($this, [self::HIGH, self::CRITICAL], true);
    }
}