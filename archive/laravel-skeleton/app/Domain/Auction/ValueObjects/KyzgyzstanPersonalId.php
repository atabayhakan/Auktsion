<?php

namespace App\Domain\Auction\ValueObjects;

/**
 * Kırgızistan İçişleri Bakanlığı standartlarına uygun kimlik numarası.
 * Format: 14 haneli (eski tip ANK) veya 6+4 karakter (yeni tip ID).
 */
final class KyzgyzstanPersonalId
{
    private function __construct(
        private readonly string $idNumber,
        private readonly PersonalIdType $type,
    ) {}

    public static function fromString(string $raw): self
    {
        $cleaned = preg_replace('/\s+/', '', $raw);

        if (preg_match('/^\d{14}$/', $cleaned)) {
            return new self($cleaned, PersonalIdType::ANK_14_DIGIT);
        }

        if (preg_match('/^[A-Z]{2}\d{7}$/i', $cleaned)) {
            return new self(strtoupper($cleaned), PersonalIdType::ID_CARD_NEW);
        }

        throw new \InvalidArgumentException('Geçersiz KG kimlik numarası formatı: ' . $raw);
    }

    public function getIdNumber(): string
    {
        return $this->idNumber;
    }

    public function getType(): PersonalIdType
    {
        return $this->type;
    }

    public function getMasked(): string
    {
        $len = strlen($this->idNumber);
        if ($len <= 4) {
            return str_repeat('*', $len);
        }
        return substr($this->idNumber, 0, 2) . str_repeat('*', $len - 4) . substr($this->idNumber, -2);
    }
}

enum PersonalIdType: string
{
    case ANK_14_DIGIT = 'ank_14';
    case ID_CARD_NEW = 'id_card';
}
