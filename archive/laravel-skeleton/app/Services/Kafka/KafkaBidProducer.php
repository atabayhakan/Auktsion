<?php

namespace App\Services\Kafka;

use Junges\Kafka\Contracts\KafkaProducerMessage;
use Junges\Kafka\Facades\Kafka;

/**
 * Bid olaylarını Kafka'ya yayınlar.
 * Bölge içi (KG) latency için broker'lar Bishkek DC'de konumlanır.
 * Bölümleme: auction_id'e göre — sıralı işleme garantisi sağlar.
 */
final class KafkaBidProducer
{
    public function publishBid(array $bid): void
    {
        Kafka::publishOn('auktsion.bids')
            ->withKey((string) $bid['auction_id'])      // bölümleme anahtarı
            ->withHeaders([
                'event_type' => 'bid.placed',
                'source' => 'auktsion-api',
                'occurred_at' => $bid['placed_at'],
            ])
            ->send($bid);
    }

    public function publishAuctionEnd(int $auctionId, array $result): void
    {
        Kafka::publishOn('auktsion.auctions')
            ->withKey((string) $auctionId)
            ->withHeaders(['event_type' => 'auction.ended'])
            ->send([
                'auction_id' => $auctionId,
                'result' => $result,
            ]);
    }
}