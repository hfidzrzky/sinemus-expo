<?php

namespace App\Services\Checkout;

use App\Models\User;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class MidtransSnapService
{
    /**
     * Midtrans Snap API production & sandbox endpoints.
     */
    public const SANDBOX_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    public const PRODUCTION_URL = 'https://app.midtrans.com/snap/v1/transactions';

    /**
     * Menerbitkan Snap Token dari Midtrans Core API.
     *
     * @param  array<string, mixed>  $params
     * @return array{token: string, redirect_url: string}
     *
     * @throws RuntimeException
     */
    public function createTransaction(array $params): array
    {
        $serverKey = (string) config('services.midtrans.server_key');
        if (empty($serverKey)) {
            throw new RuntimeException('Midtrans Server Key belum dikonfigurasi di environment.');
        }

        $isProduction = (bool) config('services.midtrans.is_production', false);
        $endpoint = $isProduction ? self::PRODUCTION_URL : self::SANDBOX_URL;

        /** @var Response $response */
        $response = Http::withBasicAuth($serverKey, '')
            ->withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->timeout(10)
            ->post($endpoint, $params);

        if ($response->failed()) {
            Log::error('Midtrans Snap API Error', [
                'status' => $response->status(),
                'body' => $response->body(),
                'order_id' => $params['transaction_details']['order_id'] ?? null,
            ]);

            throw new RuntimeException('Gagal menerbitkan token pembayaran Midtrans: '.$response->body());
        }

        $token = (string) $response->json('token');
        $redirectUrl = (string) $response->json('redirect_url');

        if (empty($token)) {
            throw new RuntimeException('Midtrans response tidak mengembalikan token pembayaran yang valid.');
        }

        return [
            'token' => $token,
            'redirect_url' => $redirectUrl,
        ];
    }

    /**
     * Helper pembuatan Snap Token untuk pemesanan tiket bioskop.
     *
     * @param  array<int, array<string, mixed>>  $itemDetails
     */
    public function createTicketSnapToken(
        string $orderId,
        float $grossAmount,
        User $user,
        array $itemDetails = [],
        int $expiryMinutes = 15
    ): string {
        $payload = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) round($grossAmount),
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone_number ?? '',
            ],
            'expiry' => [
                'duration' => $expiryMinutes,
                'unit' => 'minutes',
            ],
        ];

        if (! empty($itemDetails)) {
            $payload['item_details'] = $itemDetails;
        }

        $result = $this->createTransaction($payload);

        return $result['token'];
    }

    /**
     * Memeriksa status transaksi langsung ke Midtrans Core API (v2).
     *
     * @return array<string, mixed>|null
     */
    public function checkTransactionStatus(string $orderId): ?array
    {
        $serverKey = (string) config('services.midtrans.server_key');
        if (empty($serverKey)) {
            return null;
        }

        $isProduction = (bool) config('services.midtrans.is_production', false);
        $baseUrl = $isProduction
            ? 'https://api.midtrans.com/v2'
            : 'https://api.sandbox.midtrans.com/v2';

        try {
            /** @var Response $response */
            $response = Http::withBasicAuth($serverKey, '')
                ->withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])
                ->timeout(5)
                ->get("{$baseUrl}/{$orderId}/status");

            if ($response->successful()) {
                return $response->json();
            }

            Log::info("Midtrans checkTransactionStatus non-200: {$response->status()} untuk {$orderId}");

            return null;
        } catch (\Throwable $e) {
            Log::warning("Gagal menghubungi Midtrans Status API untuk {$orderId}: {$e->getMessage()}");

            return null;
        }
    }
}
