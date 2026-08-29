# config/broadcasting.php — Soketi (self-hosted Pusher) KG bölgesi
'default' => env('BROADCAST_DRIVER', 'pusher'),

'connections' => [

    'pusher' => [
        'driver' => 'pusher',
        'key' => env('SOKETI_APP_KEY', 'auktsion'),
        'secret' => env('SOKETI_APP_SECRET'),
        'app_id' => env('SOKETI_APP_ID', 'auktsion'),
        'options' => [
            'host' => env('SOKETI_HOST', 'wss.auktsion.kg'),   // Bishkek DC
            'port' => env('SOKETI_PORT', 6001),
            'scheme' => env('SOKETI_SCHEME', 'https'),
            'useTLS' => true,
            'encrypted' => true,
            'cluster' => null,  // self-hosted, cluster yok
        ],
    ],

    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
    ],