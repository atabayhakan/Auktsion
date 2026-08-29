<?php

namespace App\Domain\Shared\ValueObjects;

use Brick\Money\Money as BrickMoney;
use Brick\Money\Currency;
use Brick\Money\Context\DefaultContext;
use JsonSerializable;
use Stringable;

/**
 * KGS para birimi birinci sınıf vatandaş olarak tasarlanmış Money Value Object.
 * Kırgızistan Som (KGS) varsayılan; USD/RUB destekli.
 * brick/money kütüphanesi ile floating-point hatası sıfır.
 */
final class Money implements JsonSerializable, Stringable
{
    private BrickMoney $money;

    private function __construct(BrickMoney $money)
    {
        $this->money = $money;
    }

    // ═══════════════════════════════════════════════════
    //  FACTORY METHODS — KG varsayılan
    // ═══════════════════════════════════════════════════

    /** Kırgızistan Som (KGS) — varsayılan para birimi */
    public static function KGS(int|float|string $amount): self
    {
        return new self(BrickMoney::of($amount, Currency::of('KGS')));
    }

    /** US Dollar — escrow/komisyon hesabı için */
    public static function USD(int|float|string $amount): self
    {
        return new self(BrickMoney::of($amount, Currency::of('USD')));
    }

    /** Rus Rublesi — Kırgızistan'da yaygın ikinci para birimi */
    public static function RUB(int|float|string $amount): self
    {
        return new self(BrickMoney::of($amount, Currency::of('RUB')));
    }

    /** Generic — DB'den hydrate ederken kullanılır */
    public static function of(int|float|string $amount, string $currency = 'KGS'): self
    {
        return new self(BrickMoney::of($amount, Currency::of($currency)));
    }

    /** Minor units (tyiyn/kopek/cent) → major unit */
    public static function fromMinorUnits(int $minorUnits, string $currency = 'KGS'): self
    {
        return new self(BrickMoney::ofMinor($minorUnits, Currency::of($currency)));
    }

    // ═══════════════════════════════════════════════════
    //  ARİTMETİK OPERASYONLAR (immutables)
    // ═══════════════════════════════════════════════════

    public function add(self $other): self
    {
        return new self($this->money->plus($other->money));
    }

    public function subtract(self $other): self
    {
        return new self($this->money->minus($other->money));
    }

    public function multiply(float|int|string $factor): self
    {
        return new self($this->money->multipliedBy($factor));
    }

    public function divide(float|int|string $divisor): self
    {
        return new self($this->money->dividedBy($divisor, roundingMode: \Brick\Math\RoundingMode::HALF_UP));
    }

    // ═══════════════════════════════════════════════════
    //  KARŞILAŞTIRMA
    // ═══════════════════════════════════════════════════

    public function greaterThan(self $other): bool
    {
        return $this->money->isGreaterThan($other->money);
    }

    public function lessThan(self $other): bool
    {
        return $this->money->isLessThan($other->money);
    }

    public function greaterThanOrEqual(self $other): bool
    {
        return $this->money->isGreaterThanOrEqualTo($other->money);
    }

    public function lessThanOrEqual(self $other): bool
    {
        return $this->money->isLessThanOrEqualTo($other->money);
    }

    public function equals(self $other): bool
    {
        return $this->money->isEqualTo($other->money);
    }

    public function isZero(): bool
    {
        return $this->money->isZero();
    }

    public function isPositive(): bool
    {
        return $this->money->isPositive();
    }

    public function isNegative(): bool
    {
        return $this->money->isNegative();
    }

    public function max(self $other): self
    {
        return $this->greaterThan($other) ? $this : $other;
    }

    public function min(self $other): self
    {
        return $this->lessThan($other) ? $this : $other;
    }

    // ═══════════════════════════════════════════════════
    //  ACCESSORS
    // ═══════════════════════════════════════════════════

    /** Major unit string: "1500.00" */
    public function getAmount(): string
    {
        return $this->money->getAmount()->toScale(2, \Brick\Math\RoundingMode::HALF_UP)->toString();
    }

    /** Minor units (DB'de integer olarak saklanır): 150000 */
    public function getMinorUnits(): int
    {
        return (int) $this->money->getAmountMinor()->toInt();
    }

    /** ISO 4217 kodu: KGS / USD / RUB */
    public function getCurrency(): string
    {
        return $this->money->getCurrency()->getCurrencyCode();
    }

    /** Kırgızistan locale'ında format: "1 500,00 сом" */
    public function format(string $locale = 'ru_KG'): string
    {
        // Kırgızistan formatı: binlik ayraç boşluk, ondalık virgül
        $formatted = number_format(
            (float) $this->getAmount(),
            2,
            ',',
            ' '
        );

        $symbol = match ($this->getCurrency()) {
            'KGS' => 'сом',
            'USD' => '$',
            'RUB' => '₽',
            default => $this->getCurrency(),
        };

        return match ($this->getCurrency()) {
            'USD' => "{$symbol}{$formatted}",
            default => "{$formatted} {$symbol}",
        };
    }

    // ═══════════════════════════════════════════════════
    //  SERIALIZATION
    // ═══════════════════════════════════════════════════

    public function jsonSerialize(): array
    {
        return [
            'amount' => $this->getAmount(),
            'minor_units' => $this->getMinorUnits(),
            'currency' => $this->getCurrency(),
            'formatted' => $this->format(),
        ];
    }

    public function __toString(): string
    {
        return $this->format();
    }
}
