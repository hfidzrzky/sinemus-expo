<?php

namespace App\Services\Cloudflare;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CloudflareImageService
{
    protected string $accountId;

    protected string $apiToken;

    protected string $accountHash;

    public function __construct()
    {
        $this->accountId = (string) config('services.cloudflare.account_id', '');
        $this->apiToken = (string) config('services.cloudflare.images_api_token', '');
        $this->accountHash = (string) config('services.cloudflare.images_account_hash', '');
    }

    /**
     * Menerbitkan One-Time Direct Creator Upload URL untuk Cloudflare Images.
     * File gambar akan diunggah langsung dari browser ke Cloudflare tanpa membebani server Laravel.
     *
     * @return array{image_id: string, upload_url: string, delivery_url: string}|null
     */
    public function generateDirectUploadUrl(?string $assetType = 'general'): ?array
    {
        if (empty($this->accountId) || empty($this->apiToken)) {
            Log::warning('Cloudflare Images direct upload requested but account_id or images_api_token is missing.');

            return null;
        }

        $url = "https://api.cloudflare.com/client/v4/accounts/{$this->accountId}/images/v2/direct_upload";

        try {
            $response = Http::withToken($this->apiToken)
                ->acceptJson()
                ->timeout(8)
                ->asMultipart()
                ->post($url, [
                    [
                        'name' => 'requireSignedURLs',
                        'contents' => 'false',
                    ],
                    [
                        'name' => 'metadata',
                        'contents' => json_encode([
                            'uploaded_by' => 'super_admin',
                            'asset_type' => $assetType,
                            'platform' => 'sinemus_v2',
                        ]),
                    ],
                ]);

            if (! $response->successful()) {
                Log::error("Cloudflare Images direct_upload failed with status {$response->status()}", [
                    'body' => $response->json(),
                ]);

                return null;
            }

            $body = $response->json();
            if (! isset($body['success']) || $body['success'] !== true || empty($body['result'])) {
                return null;
            }

            $result = $body['result'];
            $imageId = (string) ($result['id'] ?? '');
            $uploadUrl = (string) ($result['uploadURL'] ?? '');

            if (empty($imageId) || empty($uploadUrl)) {
                return null;
            }

            $accountHash = ! empty($this->accountHash) ? $this->accountHash : 'default_hash';
            $deliveryUrl = "https://imagedelivery.net/{$accountHash}/{$imageId}/public";

            return [
                'image_id' => $imageId,
                'upload_url' => $uploadUrl,
                'delivery_url' => $deliveryUrl,
            ];
        } catch (ConnectionException|RequestException $e) {
            Log::error('Network exception during Cloudflare Images direct upload URL generation', [
                'message' => $e->getMessage(),
            ]);

            return null;
        } catch (\Throwable $e) {
            Log::error('Unexpected exception during Cloudflare Images direct upload URL generation', [
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Menghapus gambar dari Cloudflare Images jika digantikan atau dibatalkan.
     * Mencegah penumpukan aset sampah/orphan di akun Cloudflare.
     */
    public function deleteImage(string $imageId): bool
    {
        $cleanId = trim($imageId);

        // Strict validation: ID hanya boleh karakter alfanumerik, dash, dan underscore
        if (! preg_match('/^[a-zA-Z0-9_\-]+$/', $cleanId)) {
            return false;
        }

        if (empty($this->accountId) || empty($this->apiToken)) {
            return false;
        }

        $url = "https://api.cloudflare.com/client/v4/accounts/{$this->accountId}/images/v1/{$cleanId}";

        try {
            $response = Http::withToken($this->apiToken)
                ->acceptJson()
                ->timeout(8)
                ->delete($url);

            return $response->successful() && ($response->json('success') === true);
        } catch (\Throwable $e) {
            Log::error("Failed to delete Cloudflare image {$cleanId}", [
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Resolusi URL pengiriman gambar Cloudflare Images (SSOT).
     * Menerima URL lengkap (https://imagedelivery.net/...) atau Image UID mentah.
     */
    public function resolveDeliveryUrl(?string $pathOrId, string $variant = 'public'): string
    {
        if (empty($pathOrId)) {
            return '';
        }

        $trimmed = trim($pathOrId);

        if (Str::startsWith($trimmed, ['http://', 'https://'])) {
            return $trimmed;
        }

        $accountHash = ! empty($this->accountHash) ? $this->accountHash : 'default_hash';
        $cleanId = ltrim($trimmed, '/');

        return "https://imagedelivery.net/{$accountHash}/{$cleanId}/{$variant}";
    }
}
