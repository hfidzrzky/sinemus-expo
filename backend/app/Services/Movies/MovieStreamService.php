<?php

namespace App\Services\Movies;

use App\Exceptions\Movies\MovieNotFoundException;
use App\Exceptions\Movies\MovieStreamForbiddenException;
use App\Exceptions\Movies\MovieStreamSigningFailedException;
use App\Exceptions\Movies\MovieStreamUnavailableException;
use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\User;
use App\Models\UserMovieAccess;
use App\Services\Admin\Settings\SystemSettingService;
use App\Services\Checkout\OrderStatusService;
use App\Services\Cloudflare\CloudflareStreamService;
use Illuminate\Support\Facades\Log;

class MovieStreamService
{
    public function __construct(
        protected CloudflareStreamService $streamService,
        protected SystemSettingService $settingService
    ) {}

    /**
     * Memverifikasi hak akses tonton dan menerbitkan RS256 JWT Signed Token Cloudflare Stream HLS.
     *
     * @return array{playback_url: string, preview_iframe_url: string, signed_token: string, rental_expires_at: ?string, remaining_seconds: int}
     *
     * @throws MovieNotFoundException
     * @throws MovieStreamUnavailableException
     * @throws MovieStreamForbiddenException
     * @throws MovieStreamSigningFailedException
     */
    public function getStreamSession(User $user, int|string $idOrSlug): array
    {
        $movie = is_numeric($idOrSlug)
            ? Movie::find((int) $idOrSlug)
            : Movie::where('slug', (string) $idOrSlug)->first();

        if (! $movie) {
            throw new MovieNotFoundException('Film tidak ditemukan.');
        }

        if (empty($movie->cloudflare_video_uid)) {
            throw new MovieStreamUnavailableException('Berkas video film belum siap dialirkan. Hubungi pengelola platform.');
        }

        $isSuperAdmin = $user->role === 'super_admin';
        $isFreeAccess = $movie->access_model === 'free';

        // Security Guardrail: Cegah streaming film belum terbit untuk publik non-admin
        if (! $isSuperAdmin && ! $movie->is_published) {
            throw new MovieNotFoundException('Film tidak ditemukan atau belum dipublikasikan.');
        }

        // Pratinjau draft film hanya berlaku untuk film belum terbit oleh Super Admin
        $isAdminDraftPreview = ! $movie->is_published && $isSuperAdmin;

        $access = null;
        if (! $isFreeAccess && ! $isAdminDraftPreview) {
            // Anti-IDOR & Entitlement Verification
            $access = UserMovieAccess::where('user_id', $user->id)
                ->where('movie_id', $movie->id)
                ->where('access_status', 'active')
                ->where('rental_expires_at', '>', now())
                ->first();

            // Self-Healing Recovery: Jika belum ada akses aktif, periksa transaksi sewa pending terbaru
            if (! $access) {
                $pendingTrx = MovieTransaction::where('user_id', $user->id)
                    ->where('movie_id', $movie->id)
                    ->where('payment_status', 'pending')
                    ->where('created_at', '>=', now()->subMinutes(30))
                    ->latest('id')
                    ->first();

                if ($pendingTrx) {
                    try {
                        app(OrderStatusService::class)->getOrderStatus($user, $pendingTrx->order_id);
                        $access = UserMovieAccess::where('user_id', $user->id)
                            ->where('movie_id', $movie->id)
                            ->where('access_status', 'active')
                            ->where('rental_expires_at', '>', now())
                            ->first();
                    } catch (\Throwable $e) {
                        Log::warning("Auto-sync rental pending stream gagal untuk order {$pendingTrx->order_id}: {$e->getMessage()}");
                    }
                }
            }
        }

        // Jika bukan free, bukan pratinjau draft super admin, dan tidak memiliki sewa aktif
        if (! $isFreeAccess && ! $isAdminDraftPreview && ! $access) {
            $defaultRentalDuration = $this->settingService->getVodRentalDurationHours();
            $rentalDurationHours = (int) ($movie->rental_duration_hours ?? $defaultRentalDuration);

            throw new MovieStreamForbiddenException(
                "Anda belum menyewa film ini atau masa sewa {$rentalDurationHours} jam telah berakhir. Silakan lakukan sewa untuk menonton."
            );
        }

        // Hitung sisa masa sewa film
        $remainingSeconds = 3600;
        $rentalExpiresAt = null;

        if ($access) {
            $remainingSeconds = max(60, (int) now()->diffInSeconds($access->rental_expires_at, false));
            $rentalExpiresAt = $access->rental_expires_at->toISOString();
        } elseif ($isFreeAccess) {
            $remainingSeconds = 86400; // 24 jam untuk film berakses gratis
            $rentalExpiresAt = now()->addDay()->toISOString();
        } else {
            // Super Admin Preview (preview hingga 12 jam)
            $remainingSeconds = 43200;
            $rentalExpiresAt = now()->addHours(12)->toISOString();
        }

        // Dinamisasi durasi token sesi: durasi film + 2 jam buffer jeda/pause (toleransi rewind & intermisi)
        // Dibatasi oleh sisa masa sewa aktif (fail-closed guardrail)
        $movieDurationMinutes = max(30, (int) ($movie->duration_minutes ?? 120));
        $movieDurationSeconds = $movieDurationMinutes * 60;
        $pauseBufferSeconds = 7200; // 2 jam buffer jeda/pause & intermisi
        $targetSessionDuration = $movieDurationSeconds + $pauseBufferSeconds;

        $tokenDuration = max(60, min($targetSessionDuration, $remainingSeconds));

        // Terbitkan RS256 JWT Signed Token
        $signedToken = $this->streamService->generateSignedToken($movie->cloudflare_video_uid, $tokenDuration);

        if (! $signedToken) {
            throw new MovieStreamSigningFailedException(
                'Gagal menerbitkan sesi pemutaran aman Cloudflare Stream. Periksa konfigurasi kunci kriptografi.'
            );
        }

        $urls = $this->streamService->getPlaybackUrls($movie->cloudflare_video_uid, $signedToken);

        return [
            'playback_url' => $urls['playback_hls_url'],
            'preview_iframe_url' => $urls['preview_iframe_url'],
            'signed_token' => $signedToken,
            'rental_expires_at' => $rentalExpiresAt,
            'remaining_seconds' => $remainingSeconds,
        ];
    }
}
