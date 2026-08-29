<?php

namespace App\Domain\Kyc;

use App\Domain\Kyc\Enums\KycStatus;

/**
 * Kırgızistan KYC profili aggregate'ı.
 * Zorunlu alanlar: INN, kimlik tipi, cep telefonu (+996), adres.
 */
final class KycProfile
{
    private KycStatus $status = KycStatus::NOT_STARTED;

    public function __construct(
        private readonly int $userId,
        private readonly string $inn,            // 14 haneli INN
        private string $fullName,
        private string $phone,                    // +996 XXX XXXXXX
        private string $idType = 'passport',      // passport | id_card
        private string $idNumber = '',
        private ?string $address = null,
        private ?string $ipGeo = null,
        private bool $sanctionsFlagged = false,
    ) {}

    /** KYC akışı adımlarını ilerleten metot */
    public function submitForVerification(string $inn, string $idType, string $idNumber): void
    {
        $this->inn = $inn;
        $this->idType = $idType;
        $this->idNumber = $idNumber;
        $this->status = KycStatus::ID_UPLOADED;
    }

    public function verifyPhone(string $verifiedPhone): void
    {
        $this->phone = $verifiedPhone;
        if ($this->status === KycStatus::NOT_STARTED) {
            $this->status = KycStatus::PHONE_VERIFIED;
        }
    }

    public function markOcrPassed(): void
    {
        if ($this->status === KycStatus::ID_UPLOADED) {
            $this->status = KycStatus::OCR_PASSED;
        }
    }

    public function approve(): void
    {
        $this->status = KycStatus::VERIFIED;
    }

    public function reject(string $reason): void
    {
        $this->status = KycStatus::REJECTED;
    }

    public function flagSanctions(): void
    {
        $this->sanctionsFlagged = true;
        $this->status = KycStatus::ON_HOLD;
    }

    // Accessors
    public function status(): KycStatus { return $this->status; }
    public function inn(): string { return $this->inn; }
    public function fullName(): string { return $this->fullName; }
    public function phone(): string { return $this->phone; }
    public function isSanctionsFlagged(): bool { return $this->sanctionsFlagged; }
    public function getStatus(): KycStatus { return $this->status; }
}