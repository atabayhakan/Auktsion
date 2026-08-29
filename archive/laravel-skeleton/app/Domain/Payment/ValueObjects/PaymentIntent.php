<?php

namespace App\Domain\Payment\ValueObjects;

use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Payment\Enums\PaymentGateway;

/**
 * Bankaya iletilecek ödeme isteği.
 */
final class PaymentIntent
{
    public function __construct(
        public readonly string $merchantOrderId,   // Auktsion txn_ref (UUID)
        public readonly Money $amount,             // KGS (varsayılan)
        public readonly PaymentGateway $gateway,
        public readonly string $successUrl,
        public readonly string $cancelUrl,
        public readonly ?string $buyerPhone = null,   // KGS cep telefonu (MSISDN)
        public readonly ?string $buyerFullName = null,
        public readonly ?string $buyerInn = null,     // KYC doğrulanmış INN
        public readonly array $metadata = [],
    ) {}
}