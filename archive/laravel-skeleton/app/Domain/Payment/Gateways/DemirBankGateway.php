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
 * DemirBank (Demir Kyrgyz International Bank) KGS ağ geçidi.
 * Entegrasyon: DemirBank "e-commerce"/DemirPay REST API.
 * Özellikler: Webhook bildirimleri, HMAC-SHA256 imza, KGS IBAN havale.
 */
class DemirBankGateway implements PaymentGatewayInterface
{
    public function __construct(
        private readonly array $config, // merchant_id, api_key, base_url, webhook_secret
    ) {}

    public function getGatewayName(): string
    {
        return 'DemirBank';
    }

    public function getSupportedCurrencies(): array
    {
        return ['KGS'];
    }

    public function createPaymentIntent(PaymentIntent $intent): PaymentResult
    {
        $response = Http::withHeaders([
            'X-Merchant-Id' => $this->config['merchant_id'],
            'X-Api-Key' => $this->config['api_key'],
            'X-Signature' => $this->sign([
                'order' => $intent->merchantOrderId,
                'amount_minor_units' => $intent->amount->getMinorUnits(),
            ]),
        ])->post($this->config['base_url'] . '/api/v1/payments', [
            'order_id' => $intent->merchantOrderId,
            'amount_minor_units' => $intent->amount->getMinorUnits(),
            'currency' => $intent->amount->getCurrency(),
            'redirect_url' => $intent->successUrl,
            'callback_url' => $this->config['base_url'] . '/webhook',
            'customer' => [
                'name' => $intent->buyerFullName,
                'phone' => $intent->buyerPhone,
                'inn' => $intent->buyerInn,
            ],
        ]);

        if ($response->failed()) {
            return new PaymentResult(
                false, '', PaymentStatus::FAILED, $intent->amount,
                errorMessage: 'DemirBank: ' . $response->body(), rawResponse: $response->json() ?? [],
            );
        }

        $data = $response->json();

        return new PaymentResult(
            true, (string) $data['payment_id'], PaymentStatus::PENDING, $intent->amount,
            redirectUrl: $data['checkout_url'] ?? null, rawResponse: $data,
        );
    }

    public function confirmPayment(string $gatewayPaymentId, ?string $signature = null): PaymentResult
    {
        $response = Http::withHeaders([
            'X-Merchant-Id' => $this->config['merchant_id'],
            'X-Api-Key' => $this->config['api_key'],
        ])->get($this->config['base_url'] . "/api/v1/payments/{$gatewayPaymentId}");

        if ($response->failed()) {
            return new PaymentResult(false, $gatewayPaymentId, PaymentStatus::FAILED, Money::KGS(0));
        }

        $data = $response->json();

        return new PaymentResult(
            true, $gatewayPaymentId, $this->mapStatus($data['status'] ?? ''),
            Money::fromMinorUnits((int) ($data['amount_minor_units'] ?? 0), 'KGS'),
            rawResponse: $data, callbackSignature: $signature,
        );
    }

    public function createRefund(string $gatewayPaymentId, Money $amount): PaymentResult
    {
        $response = Http::withHeaders([
            'X-Merchant-Id' => $this->config['merchant_id'],
            'X-Api-Key' => $this->config['api_key'],
        ])->post($this->config['base_url'] . "/api/v1/payments/{$gatewayPaymentId}/refund", [
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
        $response = Http::withHeaders([
            'X-Merchant-Id' => $this->config['merchant_id'],
            'X-Api-Key' => $this->config['api_key'],
            'X-Signature' => $this->sign($instruction->toArray()),
        ])->post($this->config['base_url'] . '/api/v1/transfers/iban', [
            'beneficiary_iban' => $instruction->accountNumber,
            'beneficiary_name' => $instruction->recipientFullName,
            'beneficiary_inn' => $instruction->recipientInn,
            'amount_minor_units' => $instruction->amount->getMinorUnits(),
            'currency' => $instruction->amount->getCurrency(),
            'purpose' => 'Auction payout',
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

    private function sign(array $data): string
    {
        ksort($data);
        $canonical = http_build_query($data, '', '&');

        return hash_hmac('sha256', $canonical, $this->config['api_key']);
    }

    private function mapStatus(string $s): PaymentStatus
    {
        return match (strtolower($s)) {
            'succeeded', 'success', 'approved' => PaymentStatus::SUCCESS,
            'pending', 'created', 'processing' => PaymentStatus::PROCESSING,
            default => PaymentStatus::FAILED,
        };
    }
}