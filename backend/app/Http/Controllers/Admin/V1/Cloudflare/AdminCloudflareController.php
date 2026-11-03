<?php

namespace App\Http\Controllers\Admin\V1\Cloudflare;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\V1\Cloudflare\DirectUploadImageRequest;
use App\Http\Requests\Admin\V1\Cloudflare\VerifyStreamUidRequest;
use App\Http\Resources\Admin\V1\Cloudflare\StreamVerificationResource;
use App\Services\Cloudflare\CloudflareImageService;
use App\Services\Cloudflare\CloudflareStreamService;
use Illuminate\Http\JsonResponse;

class AdminCloudflareController extends Controller
{
    public function __construct(
        protected CloudflareStreamService $streamService,
        protected CloudflareImageService $imageService
    ) {}

    /**
     * Memverifikasi UID video ke Cloudflare Stream API dan mengembalikan pratinjau metadata.
     */
    public function verifyStream(VerifyStreamUidRequest $request): JsonResponse
    {
        $uid = (string) $request->validated('uid');

        $video = $this->streamService->verifyVideo($uid);

        if (! $video) {
            return response()->json([
                'success' => false,
                'message' => 'Video tidak ditemukan di akun Cloudflare Stream Sinemus. Pastikan UID sudah benar dan telah diunggah ke dashboard.',
                'data' => null,
                'server_time' => now()->toISOString(),
            ], 404);
        }

        $previewToken = null;
        if ($video->requireSignedUrls) {
            $previewToken = $this->streamService->generateSignedToken($uid, 3600);
        }

        $resource = (new StreamVerificationResource($video))->withPreviewToken($previewToken);

        return response()->json([
            'success' => true,
            'message' => 'Video Cloudflare Stream berhasil diverifikasi.',
            'data' => $resource,
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Menerbitkan ephemeral signed token untuk keperluan preview video berstatus privat di Admin Studio.
     */
    public function generatePreviewToken(string $uid): JsonResponse
    {
        $cleanUid = strtolower(trim($uid));

        if (! preg_match('/^[a-f0-9]{32}$/', $cleanUid)) {
            return response()->json([
                'success' => false,
                'message' => 'Format UID video tidak valid.',
                'data' => null,
                'server_time' => now()->toISOString(),
            ], 422);
        }

        $token = $this->streamService->generateSignedToken($cleanUid, 3600);

        if (! $token) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menerbitkan token pratinjau. Pastikan Cloudflare Stream Key ID dan PEM Key terkonfigurasi.',
                'data' => null,
                'server_time' => now()->toISOString(),
            ], 500);
        }

        $urls = $this->streamService->getPlaybackUrls($cleanUid, $token);

        return response()->json([
            'success' => true,
            'message' => 'Token pratinjau Cloudflare Stream berhasil diterbitkan.',
            'data' => [
                'uid' => $cleanUid,
                'signed_token' => $token,
                'preview_iframe_url' => $urls['preview_iframe_url'],
                'playback_hls_url' => $urls['playback_hls_url'],
                'expires_in' => 3600,
            ],
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Menerbitkan One-Time Direct Creator Upload URL untuk Cloudflare Images.
     */
    public function createImageDirectUpload(DirectUploadImageRequest $request): JsonResponse
    {
        $assetType = (string) $request->input('asset_type', 'general');

        $uploadData = $this->imageService->generateDirectUploadUrl($assetType);

        if (! $uploadData) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat sesi unggah Cloudflare Images. Periksa kredensial konfigurasi.',
                'data' => null,
                'server_time' => now()->toISOString(),
            ], 502);
        }

        return response()->json([
            'success' => true,
            'message' => 'Sesi unggah Cloudflare Images berhasil diterbitkan.',
            'data' => $uploadData,
            'server_time' => now()->toISOString(),
        ], 200);
    }

    /**
     * Menghapus aset gambar dari Cloudflare Images jika digantikan atau dibatalkan.
     */
    public function deleteImage(string $id): JsonResponse
    {
        $success = $this->imageService->deleteImage($id);

        return response()->json([
            'success' => $success,
            'message' => $success
                ? 'Berkas gambar berhasil dihapus dari Cloudflare Images.'
                : 'Aset gambar tidak ditemukan atau gagal dihapus dari Cloudflare Images.',
            'data' => ['image_id' => $id],
            'server_time' => now()->toISOString(),
        ], $success ? 200 : 400);
    }
}
