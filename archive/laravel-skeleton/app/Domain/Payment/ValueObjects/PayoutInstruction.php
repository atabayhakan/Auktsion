<?php

namespace App\Domain\Payment\ValueObjects;

use App\Domain\Shared\ValueObjects\Money;

/**
 * Satıcıya yapılacak KGS çıkış (payout) talimatı.
 * Kırgızistan banka havalesi: yerel hesap numarası (IBAN yerine 8-20 haneli hesap no)
 * + banka kodu (UNIPAY/ELSIR yönlendirme kodu) + INN (zorunlu).
 */
final class PayoutInstruction
{
    public function __construct(
        public readonly string $merchantPayoutId,   // Auktsion payout UUID
        public readonly Money $amount,              // KGS
        public readonly string $recipientFullName,
        public readonly string $recipientInn,       // Kırgızistan KYC INN (zorunlu)
        public readonly string $recipientPhone,     // +996... (bildirim için)
        public readonly string $bankCode,           // MBANK/OPTIMA/DEMIRBANK
        public readonly string $accountNumber,      // Yerel hesap numarası
        public readonly ?string $note = null,
    ) {}

    public function toArray(): array
    {
        return [
            'merchant_payout_id' => $this->merchantPayoutId,
            'amount_minor_units' => $this->amount->getMinorUnits(),
            'currency' => $this->amount->getCurrency(),
            'recipient_full_name' => $this->recipientFullName,
            'recipient_inn' => $this->recipientInn,
            'recipient_phone' => $this->recipientPhone,
            'bank_code' => $this->bankCode,
            'account_number' => $this->accountNumber,
            'note' => $this->note,
        ];
    }
}