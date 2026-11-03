<?php

namespace App\Http\Resources\Movies\V1;

use App\Models\Movie;
use App\Services\Admin\Settings\SystemSettingService;
use App\Services\Checkout\VoucherService;
use App\Services\Cloudflare\CloudflareImageService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read Movie $resource
 *
 * @mixin Movie
 */
class MovieDetailResource extends JsonResource
{
    /**
     * Nonaktifkan pembungkus bawaan 'data'.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transformasikan entitas Movie ke representasi detail komprehensif MovieDetail sesuai kontrak SSOT.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Movie $movie */
        $movie = $this->resource;

        $basePrice = (float) ($movie->price ?? 0);
        $directDiscount = app(VoucherService::class)->getActiveDirectDiscount($basePrice, 'movie_rental', (int) $movie->id);

        if ($directDiscount['has_discount']) {
            $price = (float) $directDiscount['discounted_price'];
            $originalPrice = (float) $directDiscount['original_price'];
        } else {
            $price = $basePrice;
            $originalPrice = null;
        }
        $genreString = is_array($movie->genre)
            ? implode(', ', $movie->genre)
            : (string) ($movie->genre ?? '');

        // Resolusi URL poster (2:3) dan backdrop banner (16:9) via Cloudflare Images (SSOT)
        $imageService = app(CloudflareImageService::class);
        $posterUrl = ! empty($movie->poster_url)
            ? (string) $movie->poster_url
            : $imageService->resolveDeliveryUrl($movie->poster_path);

        $backdropUrl = ! empty($movie->backdrop_url)
            ? (string) $movie->backdrop_url
            : $imageService->resolveDeliveryUrl($movie->backdrop_path);

        // Durasi sewa film dinamis (SSOT: Prioritaskan override pada film, fallback ke SystemSettingService)
        $settingService = app(SystemSettingService::class);
        $defaultRentalDuration = $settingService->getVodRentalDurationHours();
        $rentalDurationHours = (int) ($movie->rental_duration_hours ?? $defaultRentalDuration);

        // Evaluasi status hak akses tonton (access_status)
        // Dapat di-inject secara dinamis oleh MovieCatalogService melalui property runtime entitas
        $accessStatus = $movie->access_status ?? ($movie->access_model === 'free' ? 'active' : 'locked');

        // Evaluasi rental_expires_at
        $rentalExpiresAt = null;
        if (! empty($movie->rental_expires_at)) {
            $rentalExpiresAt = $movie->rental_expires_at instanceof Carbon
                ? $movie->rental_expires_at->toISOString()
                : Carbon::parse((string) $movie->rental_expires_at)->toISOString();
        }

        // Security Guardrail (Checkpoint 14 Anti-IDOR & Checkpoint 20 Fail-Closed):
        // UID video master Cloudflare Stream hanya diungkap jika akses tonton sudah 'active' atau film bertipe 'free'.
        // Jika masih 'locked' atau sudah 'expired', sembunyikan sebagai null agar tidak disusupi/di-scrape.
        $canAccessStream = ($accessStatus === 'active') || ($movie->access_model === 'free');
        $cloudflareVideoUid = $canAccessStream && ! empty($movie->cloudflare_video_uid)
            ? (string) $movie->cloudflare_video_uid
            : null;

        // Resolusi galeri Look Films (16:9 stills)
        $lookFilms = [];
        if (is_array($movie->look_films)) {
            foreach ($movie->look_films as $stillPath) {
                if (! empty($stillPath)) {
                    $lookFilms[] = $imageService->resolveDeliveryUrl($stillPath);
                }
            }
        }

        return [
            'id' => (int) $movie->id,
            'slug' => (string) $movie->slug,
            'title' => (string) $movie->title,
            'synopsis' => (string) ($movie->synopsis ?? ''),
            'poster_url' => $posterUrl,
            'backdrop_url' => $backdropUrl,
            'look_films' => $lookFilms,
            'director' => (string) ($movie->director ?? '-'),
            'cast' => is_array($movie->cast) ? array_values($movie->cast) : [],
            'genre' => $genreString,
            'duration_minutes' => (int) ($movie->duration_minutes ?? 0),
            'age_rating' => (string) ($movie->age_rating ?? '13+'),
            'release_year' => (int) ($movie->release_year ?? 2026),
            'price' => $price,
            'formatted_price' => 'Rp '.number_format($price, 0, ',', '.'),
            'original_price' => $originalPrice,
            'formatted_original_price' => $originalPrice !== null ? 'Rp '.number_format($originalPrice, 0, ',', '.') : null,
            'rental_duration_hours' => $rentalDurationHours,
            'access_model' => (string) ($movie->access_model ?? 'rental'),
            'cloudflare_trailer_uid' => ! empty($movie->cloudflare_trailer_uid) ? (string) $movie->cloudflare_trailer_uid : null,
            'access_status' => (string) $accessStatus,
            'rental_expires_at' => $rentalExpiresAt,
            'cloudflare_video_uid' => $cloudflareVideoUid,
        ];
    }
}
