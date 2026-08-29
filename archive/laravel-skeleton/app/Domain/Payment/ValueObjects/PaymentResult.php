<?php

namespace App\Domain\Payment\ValueObjects;

use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Shared\ValueObjects\Money;

/**
 * Ödeme ağ geçidinden dönen standart sonuç.
 */
final class PaymentResult
{
    public function __construct(
        public readonly bool $success,
        public readonly string $gatewayPaymentId,   // Bankanın txn id'si
        public readonly PaymentStatus $status,      // PENDING / SUCCESS / FAILED
        public readonly Money $amount,
        public readonly ?string $redirectUrl = null, // 3DS / QR yönlendirme
        public readonly ?string $errorMessage = null,
        public readonly array $rawResponse = [],    // Bankanın ham yanıtı (log)
        public readonly ?string $callbackSignature = null,
    ) {}
}