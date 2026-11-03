<?php

namespace App\Services\Cloudflare;

use App\DTO\Cloudflare\StreamVideoMetadata;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CloudflareStreamService
{
    protected string $accountId;

    protected string $apiToken;

    protected string $keyId;

    protected string $pemKey;

    public function __construct()
    {
        $this->accountId = (string) config('services.cloudflare.account_id', '');
        $this->apiToken = (string) config('services.cloudflare.stream_api_token', '');
        $this->keyId = (string) config('services.cloudflare.stream_key_id', '');
        $this->pemKey = (string) config('services.cloudflare.stream_pem_key', '');
    }

    /**
     * Memverifikasi keberadaan video di Cloudflare Stream dan mengambil metadata teknisnya.
     * Menggunakan regex ketat untuk mencegah SSRF dan cache 7 hari (604.800 detik) untuk memangkas latency/kuota API
     * karena metadata video stream bersifat immutable setelah transcoding selesai.
     */
    public function verifyVideo(string $uid): ?StreamVideoMetadata
    {
        $cleanUid = strtolower(trim($uid));

        // Strict SSRF Guardrail (Checkpoint 4): Hanya karakter heksadesimal tepat 32 karakter
        if (! preg_match('/^[a-f0-9]{32}$/', $cleanUid)) {
            return null;
        }

        $cacheKey = "cf:stream:metadata:{$cleanUid}";

        return Cache::remember($cacheKey, 604800, function () use ($cleanUid) {
            return $this->fetchFromCloudflare($cleanUid);
        });
    }

    /**
     * Mengambil detail video langsung dari REST API Cloudflare Stream.
     */
    protected function fetchFromCloudflare(string $uid): ?StreamVideoMetadata
    {
        if (empty($this->accountId) || empty($this->apiToken)) {
            Log::warning('Cloudflare Stream verification called but account_id or stream_api_token is not configured.');

            return null;
        }

        $url = "https://api.cloudflare.com/client/v4/accounts/{$this->accountId}/stream/{$uid}";

        try {
            $response = Http::withToken($this->apiToken)
                ->acceptJson()
                ->timeout(6)
                ->get($url);

            if ($response->status() === 404) {
                return null;
            }

            if (! $response->successful()) {
                Log::warning("Cloudflare Stream API responded with status {$response->status()}", [
                    'uid' => $uid,
                    'status' => $response->status(),
                ]);

                return null;
            }

            $body = $response->json();
            if (! isset($body['success']) || $body['success'] !== true || empty($body['result'])) {
                return null;
            }

            $result = $body['result'];
            $state = $result['status']['state'] ?? 'unknown';
            $isReady = (bool) ($result['readyToStream'] ?? ($state === 'ready'));
            $durationSeconds = (float) ($result['duration'] ?? 0);

            $thumbnailUrl = $result['thumbnail'] ?? "https://videodelivery.net/{$uid}/thumbnails/thumbnail.jpg?time=1s&height=240";
            $previewIframeUrl = "https://iframe.videodelivery.net/{$uid}";
            $playbackHlsUrl = "https://videodelivery.net/{$uid}/manifest/video.m3u8";

            $requireSignedUrls = (bool) ($result['requireSignedURLs'] ?? false);
            $width = isset($result['input']['width']) ? (int) $result['input']['width'] : null;
            $height = isset($result['input']['height']) ? (int) $result['input']['height'] : null;
            $sizeBytes = isset($result['size']) ? (int) $result['size'] : null;
            $createdAt = $result['created'] ?? null;

            return new StreamVideoMetadata(
                uid: $uid,
                status: $state,
                isReady: $isReady,
                durationSeconds: $durationSeconds,
                formattedDuration: $this->formatDuration($durationSeconds),
                thumbnailUrl: $thumbnailUrl,
                previewIframeUrl: $previewIframeUrl,
                playbackHlsUrl: $playbackHlsUrl,
                requireSignedUrls: $requireSignedUrls,
                width: $width,
                height: $height,
                sizeBytes: $sizeBytes,
                createdAt: $createdAt,
            );
        } catch (ConnectionException $e) {
            Log::error('Connection timeout during Cloudflare Stream verification', [
                'uid' => $uid,
                'message' => $e->getMessage(),
            ]);

            return null;
        } catch (RequestException $e) {
            Log::error('Request exception during Cloudflare Stream verification', [
                'uid' => $uid,
                'message' => $e->getMessage(),
            ]);

            return null;
        } catch (\Throwable $e) {
            Log::error('Unexpected error during Cloudflare Stream verification', [
                'uid' => $uid,
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Menerbitkan RS256 JWT Signed Token resmi Cloudflare Stream.
     * Menggunakan Cloudflare Stream Signing Key ID dan RSA Private Key.
     *
     * @param  string  $videoUid  32-karakter hex UID video
     * @param  int  $expirySeconds  Durasi token aktif (detik)
     * @param  array<int, array<string, mixed>>  $accessRules  Aturan restriksi tambahan Cloudflare (misal: geo/IP)
     */
    public function generateSignedToken(string $videoUid, int $expirySeconds = 3600, array $accessRules = []): ?string
    {
        $cleanUid = strtolower(trim($videoUid));

        // Strict SSRF / UID Guardrail
        if (! preg_match('/^[a-f0-9]{32}$/', $cleanUid)) {
            Log::warning('Percobaan penandatanganan token Cloudflare Stream dengan UID tidak valid', [
                'uid' => $videoUid,
            ]);

            return null;
        }

        if (empty($this->keyId) || empty($this->pemKey)) {
            Log::error('Cloudflare Stream Key ID atau PEM Key belum dikonfigurasi di .env');

            return null;
        }

        $now = time();
        $payload = [
            'sub' => $cleanUid,
            'kid' => $this->keyId,
            'exp' => $now + max(60, $expirySeconds),
            'nbf' => $now - 60, // Toleransi time drift 60 detik
            'downloadable' => false,
        ];

        if (! empty($accessRules)) {
            $payload['accessRules'] = $accessRules;
        }

        $header = [
            'alg' => 'RS256',
            'typ' => 'JWT',
            'kid' => $this->keyId,
        ];

        $encodedHeader = $this->base64UrlEncode(json_encode($header, JSON_UNESCAPED_SLASHES));
        $encodedPayload = $this->base64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES));
        $signatureData = "{$encodedHeader}.{$encodedPayload}";

        $pem = $this->formatPemKey($this->pemKey);
        $privateKey = openssl_pkey_get_private($pem);

        if (! $privateKey) {
            Log::error('Format Cloudflare Stream Private PEM Key tidak valid untuk OpenSSL');

            return null;
        }

        $signature = '';
        $success = openssl_sign($signatureData, $signature, $privateKey, OPENSSL_ALGO_SHA256);

        if (! $success) {
            Log::error('Gagal menandatangani JWT Cloudflare Stream dengan algoritma RS256');

            return null;
        }

        $encodedSignature = $this->base64UrlEncode($signature);

        return "{$signatureData}.{$encodedSignature}";
    }

    /**
     * Menerbitkan token untuk video publik/teaser dengan Cache Layer (High Concurrency Shield).
     * Mencegah crypto-exhaustion pada CPU server saat traffic penonton melonjak tinggi.
     */
    public function getCachedTeaserToken(string $teaserUid, int $ttlSeconds = 7200): ?string
    {
        $cleanUid = strtolower(trim($teaserUid));

        if (! preg_match('/^[a-f0-9]{32}$/', $cleanUid)) {
            return null;
        }

        $cacheKey = "cf:stream:teaser_token:{$cleanUid}";
        // Simpan di cache selama 75% dari TTL token untuk mencegah race condition expiry
        $cacheDuration = (int) max(60, $ttlSeconds * 0.75);

        return Cache::remember($cacheKey, $cacheDuration, function () use ($cleanUid, $ttlSeconds) {
            return $this->generateSignedToken($cleanUid, $ttlSeconds);
        });
    }

    /**
     * Membentuk URL pemutaran HLS dan iframe, baik menggunakan token maupun raw UID.
     *
     * @return array{playback_hls_url: string, preview_iframe_url: string, thumbnail_url: string}
     */
    public function getPlaybackUrls(string $uid, ?string $token = null): array
    {
        $target = $token ?: $uid;

        return [
            'playback_hls_url' => "https://videodelivery.net/{$target}/manifest/video.m3u8",
            'preview_iframe_url' => "https://iframe.videodelivery.net/{$target}",
            'thumbnail_url' => "https://videodelivery.net/{$target}/thumbnails/thumbnail.jpg?time=1s&height=240",
        ];
    }

    /**
     * Encode string ke format URL-safe Base64 (tanpa padding '=').
     */
    protected function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Memastikan string PEM RSA Key memiliki pembungkus header & newline yang valid.
     */
    protected function formatPemKey(string $key): string
    {
        $trimmed = trim($key);

        // 1. Cek jika seluruh string PEM disimpan sebagai base64 string di .env (misal diawali LS0tLS1C...)
        $decoded = base64_decode($trimmed, true);
        if ($decoded !== false && (str_contains($decoded, '-----BEGIN RSA PRIVATE KEY-----') || str_contains($decoded, '-----BEGIN PRIVATE KEY-----'))) {
            return $decoded;
        }

        // 2. Jika string memuat karakter escaped newline '\n' dari .env
        $normalized = str_replace('\n', "\n", $trimmed);

        if (str_contains($normalized, '-----BEGIN RSA PRIVATE KEY-----') || str_contains($normalized, '-----BEGIN PRIVATE KEY-----')) {
            return $normalized;
        }

        // 3. Jika tersimpan sebagai raw base64 string tanpa header
        return "-----BEGIN RSA PRIVATE KEY-----\n".
            chunk_split($normalized, 64, "\n").
            "-----END RSA PRIVATE KEY-----\n";
    }

    /**
     * Format durasi detik ke format ramah penonton / admin.
     * Contoh: "2j 14m 30d", "45m 10d", "30d"
     */
    protected function formatDuration(float $seconds): string
    {
        $totalSeconds = (int) round($seconds);
        if ($totalSeconds <= 0) {
            return '0d';
        }

        $hours = intdiv($totalSeconds, 3600);
        $minutes = intdiv($totalSeconds % 3600, 60);
        $secs = $totalSeconds % 60;

        $parts = [];
        if ($hours > 0) {
            $parts[] = "{$hours}j";
        }
        if ($minutes > 0 || $hours > 0) {
            $parts[] = "{$minutes}m";
        }
        $parts[] = "{$secs}d";

        return implode(' ', $parts);
    }
}
