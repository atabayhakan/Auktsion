<?php

namespace App\Domain\Kyc\Enums;

/**
 * Kırgızistan KYC durumları.
 * NBKR "Müşteri Tanıyın" (KYC) düzenlemelerine ve 2005 tarihli
 * "Kara para aklamanın önlenmesi" yasasına (AML/CFT) uygun.
 */
enum KycStatus: string
{
    case NOT_STARTED = 'not_started';
    case PHONE_VERIFIED = 'phone_verified';   // SMS doğrulandı
    case ID_UPLOADED = 'id_uploaded';         // INN + kimlik belgesi yüklendi
    case OCR_PASSED = 'ocr_passed';           // OCR + liveness doğrulandı
    case VERIFIED = 'verified';               // NBKR tam KYC / AMLA onayı
    case REJECTED = 'rejected';               // Red (sahte belge şüphesi)
    case ON_HOLD = 'on_hold';                 // Ek inceleme (frozen)

    public function canTransact(): bool
    {
        return in_array($this, [self::VERIFIED], true);
    }

    public function canBid(): bool
    {
        // Teklif için telefon doğrulaması yeterli; ödeme için tam KYC.
        return in_array($this, [self::PHONE_VERIFIED, self::ID_UPLOADED, self::OCR_PASSED, self::VERIFIED], true);
    }
}