<?php

// config/payment.php — Kırgızistan bankaları Promise/Config
return [

    'default_currency' => env('PAYMENT_CURRENCY', 'KGS'),

    // Auktsion platformunun escrow hesabı için komisyon (yüzde)
    'commission_rate' => (float) env('COMMISSION_RATE', 0.08), // %8

    'gateways' => [

        'mbank' => [
            'enabled' => env('MBANK_ENABLED', true),
            'client_id' => env('MBANK_CLIENT_ID'),
            'client_secret' => env('MBANK_CLIENT_SECRET'),
            'base_url' => env('MBANK_BASE_URL', 'https://api.mbank.kg'),
            'webhook_secret' => env('MBANK_WEBHOOK_SECRET'),
        ],

        'optima' => [
            'enabled' => env('OPTIMA_ENABLED', true),
            'merchant_id' => env('OPTIMA_MERCHANT_ID'),
            'api_key' => env('OPTIMA_API_KEY'),
            'base_url' => env('OPTIMA_BASE_URL', 'https://api.optimabank.kg'),
            'webhook_secret' => env('OPTIMA_WEBHOOK_SECRET'),
        ],

        'demirbank' => [
            'enabled' => env('DEMIRBANK_ENABLED', true),
            'merchant_id' => env('DEMIRBANK_MERCHANT_ID'),
            'api_key' => env('DEMIRBANK_API_KEY'),
            'base_url' => env('DEMIRBANK_BASE_URL', 'https://api.demirbank.kg'),
            'webhook_secret' => env('DEMIRBANK_WEBHOOK_SECRET'),
        ],

        // Uluslararası kart için (opsiyonel, KGS cinsinden)
        'stripe' => [
            'enabled' => env('STRIPE_ENABLED', false),
            'secret_key' => env('STRIPE_SECRET_KEY'),
            'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        ],

    ],

    // Escrow tutulma süresi (gün) — alıcı teslim onayı sonrası serbest
    'escrow_hold_days' => (int) env('ESCROW_HOLD_DAYS', 3),

    // Minimum/maksimum ödeme limitleri (KGS minor units)
    'min_payment_minor' => (int) env('MIN_PAYMENT_MINOR', 10000),     // 100.00 сом
    'max_payment_minor' => (int) env('MAX_PAYMENT_MINOR', 50000000),  // 500,000.00 сом

    // Single-transaction limit: NBKR / AML uyarı eşiği
    'aml_threshold_minor' => (int) env('AML_THRESHOLD_MINOR', 3000000), // 30,000 сом
];