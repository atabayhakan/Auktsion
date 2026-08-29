<?php

namespace App\Domain\Payment\Services;

use App\Domain\Payment\Contracts\PaymentGatewayInterface;
use App\Domain\Payment\Contracts\PaymentGatewayRegistryInterface;
use App\Domain\Payment\Enums\PaymentGateway;

/**
 * Banka ağ geçidi fabrikası + kayıt defteri.
 * Yeni banka eklemek için: Gateway implementasyonu + burada register.
 * (Config'ten okur, service provider'da bağlanır.)
 */
class PaymentGatewayRegistry implements PaymentGatewayRegistryInterface
{
    /** @var array<string, PaymentGatewayInterface> */
    private array $gateways = [];

    public function register(PaymentGateway $gateway, PaymentGatewayInterface $impl): void
    {
        $this->gateways[$gateway->value] = $impl;
    }

    public function make(PaymentGateway $gateway): PaymentGatewayInterface
    {
        if (!isset($this->gateways[$gateway->value])) {
            throw new \InvalidArgumentException(
                "Desteklenmeyen ödeme ağ geçidi: {$gateway->value}"
            );
        }
        return $this->gateways[$gateway->value];
    }

    /** Kullanıcının KYC durumuna göre aktif yerel ağ geçitleri */
    public function availableGateways(bool $kycVerified = true): array
    {
        $all = array_keys($this->gateways);
        return $kycVerified
            ? $all
            : collect(PaymentGateway::cases())
                ->filter(fn ($g) => !$g->requiresKyc())
                ->map(fn ($g) => $g->value)
                ->all();
    }

    public function all(): array
    {
        return $this->gateways;
    }
}