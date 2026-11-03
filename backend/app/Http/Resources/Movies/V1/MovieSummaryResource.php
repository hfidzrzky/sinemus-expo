<?php

namespace App\Http\Resources\Movies\V1;

use App\Models\Movie;
use App\Services\Checkout\VoucherService;
use App\Services\Cloudflare\CloudflareImageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * @property-read Movie $resource
 *
 * @mixin Movie
 */
class MovieSummaryResource extends JsonResource
{
    /**
     * Nonaktifkan pembungkus bawaan 'data' untuk transformasi item langsung.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transformasikan entitas Movie ke representasi ringkas MovieSummary sesuai kontrak SSOT.
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

        // Resolusi URL poster portrait 2:3 via Cloudflare Images (SSOT)
        $posterUrl = ! empty($movie->poster_url)
            ? (string) $movie->poster_url
            : app(CloudflareImageService::class)->resolveDeliveryUrl($movie->poster_path);

        return [
            'id' => (int) $movie->id,
            'slug' => (string) $movie->slug,
            'title' => (string) $movie->title,
            'synopsis_short' => Str::limit((string) ($movie->synopsis ?? ''), 120),
            'poster_url' => $posterUrl,
            'genre' => $genreString,
            'duration_minutes' => (int) ($movie->duration_minutes ?? 0),
            'price' => $price,
            'formatted_price' => 'Rp '.number_format($price, 0, ',', '.'),
            'original_price' => $originalPrice,
            'is_featured' => (bool) $movie->is_featured,
            'release_year' => (int) ($movie->release_year ?? 2026),
            'age_rating' => (string) ($movie->age_rating ?? '13+'),
            'access_model' => (string) ($movie->access_model ?? 'rental'),
        ];
    }
}
