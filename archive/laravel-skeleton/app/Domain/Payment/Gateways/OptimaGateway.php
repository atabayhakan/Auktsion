<?php

namespace App\Domain\Payment\Gateways;

use App\Domain\Payment\Contracts\PaymentGatewayInterface;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\ValueObjects\PaymentIntent;
use App\Domain\Payment\ValueObjects\PaymentResult;
use App\Domain\Payment\ValueObjects\PayoutInstruction;
use App\Domain\Shared\ValueObjects\Money;
use Illuminate\Support\Facades\Http;

/**
 * Optima Bank KGS ağ geçidi.
 * Entegrasyon: Optima "OpenAPI"/e-commerce + 3-D Secure.
 * Özellikler: Kart tokenizasyonu, 3-D Secure, tek tıkla ödeme.
 * Kartlar: Visa, Mastercard (Ubkard işleme).
 */
class OptimaGateway implements PaymentGatewayInterface
{
    public function __construct(
        private readonly array $config, // merchant_id, api_key, base_url, webhook_secret
    ) {}

    public function getGatewayName(): string
    {
        return 'Optima Bank';
    }

    public function getSupportedCurrencies(): array
    {
        return ['KGS', 'USD'];
    }

    public function createPaymentIntent(PaymentIntent $intent): PaymentResult
    {
        $response = Http::withToken($this->config['api_key'])
            ->post($this->config['base_url'] . '/v2/payments', [
                'merchant_order_id' => $intent->merchantOrderId,
                'amount_minor_units' => $intent->amount->getMinorUnits(),
                'currency' => $intent->amount->getCurrency(),
                'payment_method' => 'card',
                'three_d_secure' => true,
                'card_token' => $intent->metadata['saved_card_token'] ?? null,
                'customer' => [
                    'name' => $intent->buyerFullName,
                    'phone' => $this->normalizeKgPhone($intent->buyerPhone),
                    'inn' => $intent->buyerInn,
                    'email' => $intent->metadata['email'] ?? null,
                ],
                'return_urls' => [
                    'success' => $intent->successUrl,
                    'cancel' => $intent->cancelUrl,
                ],
            ]);

        if ($response->failed()) {
            return new PaymentResult(
                false, '', PaymentStatus::FAILED, $intent->amount,
                errorMessage: 'Optima: ' . $response->body(), rawResponse: $response->json() ?? [],
            );
        }

        $data = $response->json();

        return new PaymentResult(
            true, (string) $data['payment_id'], PaymentStatus::PENDING, $intent->amount,
            redirectUrl: $data['redirect_url'] ?? null, // 3DS yönlendirme
            rawResponse: $data,
        );
    }

    public function confirmPayment(string $gatewayPaymentId, ?string $signature = null): PaymentResult
    {
        $response = Http::withToken($this->config['api_key'])
            ->get($this->config['base_url'] . "/v2/payments/{$gatewayPaymentId}");

        if ($response->failed()) {
            return new PaymentResult(false, $gatewayPaymentId, PaymentStatus::FAILED, Money::KGS(0));
        }

        $data = $response->json();

        return new PaymentResult(
            true, $gatewayPaymentId, $this->mapStatus($data['status'] ?? ''),
            Money::fromMinorUnits((int) ($data['amount_minor_units'] ?? 0), $data['currency'] ?? 'KGS'),
            rawResponse: $data,
        );
    }

    public function createRefund(string $gatewayPaymentId, Money $amount): PaymentResult
    {
        $response = Http::withToken($this->config['api_key'])
            ->post($this->config['base_url'] . "/v2/payments/{$gatewayPaymentId}/refund", [
                'amount_minor_units' => $amount->getMinorUnits(),
            ]);

        return new PaymentResult(
            !$response->failed(), $gatewayPaymentId,
            $response->successful() ? PaymentStatus::REFUNDED : PaymentStatus::FAILED,
            $amount, rawResponse: $response->json() ?? [],
        );
    }

    public function createPayout(PayoutInstruction $instruction): PaymentResult
    {
        $response = Http::withToken($this->config['api_key'])
            ->post($this->config['base_url'] . '/v2/transfers/bank', [
                'beneficiary' => [
                    'bank_code' => $instruction->bankCode,
                    'account_number' => $instruction->accountNumber,
                    'full_name' => $instruction->recipientFullName,
                    'inn' => $instruction->recipientInn,
                    'purpose' => 'Auction payout',
                ],
                'amount_minor_units' => $instruction->amount->getMinorUnits(),
                'currency' => $instruction->amount->getCurrency(),
            ]);

        return new PaymentResult(
            !$response->failed(), (string) $response->json('transfer_id'),
            $response->successful() ? PaymentStatus::PROCESSING : PaymentStatus::FAILED,
            $instruction->amount, rawResponse: $response->json() ?? [],
        );
    }

    public function verifyWebhookSignature(array $payload, string $signature, string $secret): bool
    {
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return hash_equals(hash_hmac('sha256', $body, $secret), $signature);
    }

    private function normalizeKgPhone(?string $phone): ?string
    {
        return $phone ? preg_replace('/\D/', '', $phone) : null;
    }

    private function mapStatus(string $s): PaymentStatus
    {
        return match (strtolower($s)) {
            'succeeded', 'success', 'paid' => PaymentStatus::SUCCESS,
            'requires_action', 'pending', 'processing' => PaymentStatus::PROCESSING,
            default => PaymentStatus::FAILED,
        };
    }
}