<?php

namespace App\Domain\Payment\Enums;

/**
 * Kırgızistan'da desteklenen ödeme gateway'leri.
 * KG Bankaları + Stripe (uluslararası kart için).
 */
enum PaymentGateway: string
{
    case MBANK = 'mbank';
    case OPTIMA = 'optima';
    case DEMIRBANK = 'demirbank';
    case EL_SOM = 'elsom';      // ELQR / ELQR payment aggregator
    case O_NOM = 'onom';        // O!Nom (Beeline) mobil cüzdan
    case STRIPE = 'stripe';     // Uluslararası kart

    /** KG bankaları (millet bankası denetimi altında) */
    public static function kgLocalGateways(): array
    {
        return [self::MBANK, self::OPTIMA, self::DEMIRBANK, self::EL_SOM, self::O_NOM];
    }

    public function isLocalKg(): bool
    {
        return in_array($this, self::kgLocalGateways(), true);
    }

    public function requiresKyc(): bool
    {
        return $this->isLocalKg();
    }

    public function getDisplayName(): string
    {
        return match ($this) {
            self::MBANK => 'MBank',
            self::OPTIMA => 'Optima Bank',
            self::DEMIRBANK => 'DemirBank',
            self::EL_SOM => 'ELQR (Elektron Som)',
            self::O_NOM => 'O!Nom',
            self::STRIPE => 'Stripe (Visa/MC)',
        };
    }

    /** Kırgızistan Merkez Bankası (NBKR) lisans kodu */
    public function getNbkrLicense(): string
    {
        return match ($this) {
            self::MBANK => 'NBKR № 245',
            self::OPTIMA => 'NBKR № 218',
            self::DEMIRBANK => 'NBKR № 122',
            self::EL_SOM => 'NBKR № 401',
            self::O_NOM => 'NBKR № 502',
            self::STRIPE => 'N/A (Uluslararası)',
        };
    }
}
