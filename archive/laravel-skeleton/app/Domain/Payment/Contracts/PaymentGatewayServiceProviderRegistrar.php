<?php

namespace App\Domain\Payment\Contracts;

use App\Domain\Payment\Enums\PaymentGateway;
use App\Domain\Payment\Gateways\MBankGateway;
use App\Domain\Payment\Gateways\OptimaGateway;
use App\Domain\Payment\Gateways\DemirBankGateway;
use App\Domain\Payment\Gateways\StripeGateway;
use App\Domain\Payment\Services\PaymentGatewayRegistry;

/**
 * Kayıt ağ geçitlerini kurar.
 * config/payment.php den okur.
 */
class PaymentGatewayServiceProviderRegistrar
{
    public static function register(PaymentGatewayRegistry $registry, array $config): void
    {
        if (isset($config['mbank']['enabled'])) {
            $registry->register(PaymentGateway::MBANK, app(MBankGateway::class));
        }
        if (isset($config['optima']['enabled'])) {
            $registry->register(PaymentGateway::OPTIMA, app(OptimaGateway::class));
        }
        if (isset($config['demirbank']['enabled'])) {
            $registry->register(PaymentGateway::DEMIRBANK, app(DemirBankGateway::class));
        }
        if (isset($config['stripe']['enabled'])) {
            $registry->register(PaymentGateway::STRIPE, app(StripeGateway::class));
        }
    }
}