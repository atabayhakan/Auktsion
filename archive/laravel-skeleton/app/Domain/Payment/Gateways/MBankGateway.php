<?php

namespace App\Domain\Payment\Gateways;

use App\Domain\Payment\Contracts\PaymentGatewayInterface;
use App\Domain\Payment\Enums\PaymentGateway;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\ValueObjects\PaymentIntent;
use App\Domain\Payment\ValueObjects\PaymentResult;
use App\Domain\Payment\ValueObjects\PayoutInstruction;
use App\Domain\Shared\ValueObjects\Money;
use Illuminate\Support\Facades\Http;

/**
 * MBank KGS ağ geçidi.
 * Entegrasyon: MBank "Payworld" ticari API'si.
 * Özellikler: QR ödeme (El QR), P2P transfer, KGS bakiyesi.
 * Auth: OAuth 2.0 client_credentials + per-request HMAC.
 */
class MBankGateway implements PaymentGatewayInterface
{
    public function __construct(
        private readonly array $config, // client_id, client_secret, base_url, webhook_secret
    ) {}

    public function getGatewayName(): string
    {
        return 'MBank';
    }

    public function getSupportedCurrencies(): array
    {
        return ['KGS'];
    }

    /**
     * MBank QR / host-to-host ödeme niyeti oluşturur.
     * POST {base}/v1/payments/intent
     */
    public function createPaymentIntent(PaymentIntent $intent): PaymentResult
    {
        $token = $this->getAccessToken();

        $response = Http::withToken($token)->post($this->config['base_url'] . '/v1/payments/intent', [
            'merchant_order_id' => $intent->merchantOrderId,
            'amount_minor_units' => $intent->amount->getMinorUnits(),
            'currency' => $intent->amount->getCurrency(), // KGS
            'buyer_phone' => $this->normalizeKgPhone($intent->buyerPhone),
            'buyer_full_name' => $intent->buyerFullName,
            'buyer_inn' => $intent->buyerInn,
            'success_url' => $intent->successUrl,
            'cancel_url' => $intent->cancelUrl,
            'metadata' => $intent->metadata,
        ]);

        if ($response->failed()) {
            return new PaymentResult(
                success: false,
                gatewayPaymentId: '',
                status: PaymentStatus::FAILED,
                amount: $intent->amount,
                errorMessage: 'MBank: ' . $response->body(),
                rawResponse: $response->json() ?? [],
            );
        }

        $data = $response->json();

        return new PaymentResult(
            success: true,
            gatewayPaymentId: (string) $data['payment_id'],
            status: PaymentStatus::PENDING,
            amount: $intent->amount,
            redirectUrl: $data['qr_code'] ?? $data['payment_url'] ?? null,
            rawResponse: $data,
        );
    }

    public function confirmPayment(string $gatewayPaymentId, ?string $signature = null): PaymentResult
    {
        $token = $this->getAccessToken();

        $response = Http::withToken($token)->get(
            $this->config['base_url'] . "/v1/payments/{$gatewayPaymentId}"
        );

        if ($response->failed()) {
            return new PaymentResult(
                false, $gatewayPaymentId, PaymentStatus::FAILED,
                Money::KGS(0), errorMessage: 'MBank confirm hatası: ' . $response->body(),
            );
        }

        $data = $response->json();
        $status = $this->mapStatus($data['status'] ?? 'unknown');

        return new PaymentResult(
            true, $gatewayPaymentId, $status,
            Money::fromMinorUnits((int) ($data['amount_minor_units'] ?? 0), 'KGS'),
            rawResponse: $data,
            callbackSignature: $signature,
        );
    }

    public function createRefund(string $gatewayPaymentId, Money $amount): PaymentResult
    {
        $token = $this->getAccessToken();

        $response = Http::withToken($token)->post(
            $this->config['base_url'] . "/v1/payments/{$gatewayPaymentId}/refund",
            ['amount_minor_units' => $amount->getMinorUnits()],
        );

        if ($response->failed()) {
            return new PaymentResult(false, $gatewayPaymentId, PaymentStatus::FAILED, $amount, errorMessage: 'MBank iade hatası');
        }

        return new PaymentResult(
            true, $gatewayPaymentId,
            data_get($response->json(), 'status') === 'refunded' ? PaymentStatus::REFUNDED : PaymentStatus::PENDING,
            $amount, rawResponse: $response->json() ?? [],
        );
    }

    public function createPayout(PayoutInstruction $instruction): PaymentResult
    {
        $token = $this->getAccessToken();

        $response = Http::withToken($token)->post(
            $this->config['base_url'] . '/v1/transfers/p2p',
            [
                'recipient_msisdn' => $this->normalizeKgPhone($instruction->recipientPhone),
                'amount_minor_units' => $instruction->amount->getMinorUnits(),
                'currency' => $instruction->amount->getCurrency(),
                'recipient_name' => $instruction->recipientFullName,
                'recipient_inn' => $instruction->recipientInn,
            ],
        );

        if ($response->failed()) {
            return new PaymentResult(false, '', PaymentStatus::FAILED, $instruction->amount, errorMessage: 'MBank transfer hatası');
        }

        return new PaymentResult(
            true, (string) $response->json('transfer_id'), PaymentStatus::PROCESSING,
            $instruction->amount, rawResponse: $response->json() ?? [],
        );
    }

    public function verifyWebhookSignature(array $payload, string $signature, string $secret): bool
    {
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $expected = hash_hmac('sha256', $body, $secret);

        return hash_equals($expected, $signature);
    }

    private function getAccessToken(): string
    {
        // OAuth2 client_credentials — token Redis'te cache'lenir
        return cache()->remember(
            'mbank_access_token',
            now()->addHour(),
            fn () => Http::asForm()->post($this->config['base_url'] . '/oauth/token', [
                'grant_type' => 'client_credentials',
                'client_id' => $this->config['client_id'],
                'client_secret' => $this->config['client_secret'],
            ])->json('access_token'),
        );
    }

    /** +996 7xx → 9967xx formatı (KGS standart MSISDN) */
    private function normalizeKgPhone(?string $phone): ?string
    {
        if (!$phone) {
            return null;
        }
        $digits = preg_replace('/\D/', '', $phone);
        if (str_starts_with($digits, '0')) {
            $digits = '996' . substr($digits, 1);
        }
        if (str_starts_with($digits, '996') && strlen($digits) <= 9) {
            // placeholder — tam doğrulama servis katmanında
        }
        return $digits;
    }

    private function mapStatus(string $bankStatus): PaymentStatus
    {
        return match ($bankStatus) {
            'completed', 'success', 'paid' => PaymentStatus::SUCCESS,
            'pending', 'created' => PaymentStatus::PENDING,
            'processing' => PaymentStatus::PROCESSING,
            default => PaymentStatus::FAILED,
        };
    }
}