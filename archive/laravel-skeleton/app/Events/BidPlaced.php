<?php

namespace App\Events;

use App\Domain\Shared\ValueObjects\Money;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Bir teklif verildiğinde gerçek zamanlı olarak yayınlanan event.
 * - Laravel Echo ile soketi tetikler (analog Socket.io / Pusher).
 * - Kafka ya da Redis bridge ile backend'e akar (Orion pattern).
 */
class BidPlaced implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $auctionId,
        public readonly string $bidId,
        public readonly int $bidderId,
        public readonly Money $bidAmount,
        public readonly string $placedAtIso,
    ) {}

    /** Soketi: her açık artırma için ayrı private channel */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("auction.{$this->auctionId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'bid.placed';
    }

    public function broadcastWith(): array
    {
        return [
            'auction_id' => $this->auctionId,
            'bid' => [
                'id' => $this->bidId,
                'bidder_id' => $this->bidderId,
                'amount' => $this->bidAmount->jsonSerialize(),
                'placed_at' => $this->placedAtIso,
            ],
        ];
    }
}