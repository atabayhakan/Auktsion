<?php

namespace App\Domain\Payment\Enums;

enum PaymentStatus: string
{
    case INITIAL = 'initial';
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case SUCCESS = 'success';
    case FAILED = 'failed';
    case REFUNDED = 'refunded';
    case DISPUTED = 'disputed';   // Kırgızistan'da itiraz (банк претензия)

    public function isTerminal(): bool
    {
        return in_array($this, [self::SUCCESS, self::FAILED, self::REFUNDED], true);
    }
}