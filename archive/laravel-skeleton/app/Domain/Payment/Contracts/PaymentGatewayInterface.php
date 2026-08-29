<?php

namespace App\Domain\Payment\Contracts;

use App\Domain\Payment\ValueObjects\PaymentIntent;
use App\Domain\Payment\ValueObjects\PaymentResult;
use App\Domain\Payment\ValueObjects\PayoutInstruction;
use App\Domain\Shared\ValueObjects\Money;

/**
 * Kırgızistan banka ağ geçitleri için genel sözleşme.
 * MBank, Optima Bank ve DemirBank dahil tüm yerel sağlayıcılar bu arayüzü uygular.
 * Yeni banka eklemek = tek bir implementasyon sınıfı + service sağlayıcı kaydı.
 */
interface PaymentGatewayInterface
{
    /**
     * Ödeme niyeti oluşturur (kullanıcıyı bankanın ödeme sayfasına/QR'a yönlendirir).
     */
    public function createPaymentIntent(PaymentIntent $intent): PaymentResult;

    /**
     * Bankadan dönen callback/webhook sonrası ödemeyi doğrular.
     */
    public function confirmPayment(string $gatewayPaymentId, ?string $signature = null): PaymentResult;

    /**
     * İptal/fraude durumlarında iade (refund) başlatır.
     */
    public function createRefund(string $gatewayPaymentId, Money $amount): PaymentResult;

    /**
     * Satıcıya yerel banka hesabına havale (payout) yapar.
     */
    public function createPayout(PayoutInstruction $instruction): PaymentResult;

    /**
     * Bankanın desteklediği para birimi listesi (genelde KGS).
     */
    public function getSupportedCurrencies(): array;

    /**
     * Banka adı (MBank / Optima / DemirBank).
     */
    public function getGatewayName(): string;

    /**
     * Webhook imzası doğrulaması (HMAC / RSA).
     */
    public function verifyWebhookSignature(array $payload, string $signature, string $secret): bool;
}