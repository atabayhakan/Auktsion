<?php

namespace App\Domain\Payment\Services;

use App\Domain\Payment\ValueObjects\PaymentIntent;
use App\Domain\Payment\ValueObjects\PaymentResult;
use App\Domain\Payment\Contracts\PaymentGatewayRegistryInterface;
use App\Domain\Payment\Enums\PaymentGateway;
use App\Domain\Shared\ValueObjects\Money;

/**
 * Yüksek seviye ödeme orkestrası.
 * Escrow modeli: alıcı öder → para platformda tutulur → teslimat onayı → satıcıya payout.
 * Komisyon (varsayılan %8) otomatik kesilir.
 */
final class PaymentService
{
    public function __construct(
        private PaymentGatewayRegistryInterface $registry,
    ) {}

    /** Ödeme başlat (kazanan kullanıcı için) */
    public function initiatePayment(
        string $orderId,
        Money $amount,
        PaymentGateway $gateway,
        string $successUrl,
        string $cancelUrl,
        ?array $buyer = null,
    ): PaymentResult {
        $intent = new PaymentIntent(
            merchantOrderId: $orderId,
            amount: $amount,
            gateway: $gateway,
            successUrl: $successUrl,
            cancelUrl: $cancelUrl,
            buyerPhone: $buyer['phone'] ?? null,
            buyerFullName: $buyer['name'] ?? null,
            buyerInn: $buyer['inn'] ?? null,
            metadata: $buyer ?? [],
        );

        return $this->registry->make($gateway)->createPaymentIntent($intent);
    }

    /** Banka webhook'u / callback'inden dönen doğrulama */
    public function confirm(string $txnId, PaymentGateway $gateway, ?string $signature = null): PaymentResult
    {
        return $this->registry->make($gateway)->confirmPayment($txnId, $signature);
    }

    /** Komisyon kesintisi */
    public function calculateCommission(Money $total): array
    {
        $commission = $total->multiply((float) config('payment.commission_rate')); // %8
        $sellerPayout = $total->subtract($commission);

        return [
            'total' => $total,
            'commission' => $commission->getMinorUnits(),
            'seller_payout' => $sellerPayout,
        ];
    }
}