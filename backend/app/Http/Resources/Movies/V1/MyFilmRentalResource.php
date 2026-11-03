<?php

namespace App\Http\Resources\Movies\V1;

use App\Models\UserMovieAccess;
use App\Services\Cloudflare\CloudflareImageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read UserMovieAccess $resource
 *
 * @mixin UserMovieAccess
 */
class MyFilmRentalResource extends JsonResource
{
    public static $wrap = null;

    /**
     * Transform the resource into an array matching contracts/tickets.contract.json.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $access = $this->resource;
        $movie = $access->movie;

        $now = now();
        $expiresAt = $access->rental_expires_at;
        $isExpired = $access->access_status !== 'active' || ($expiresAt && $expiresAt->isPast());
        $remainingSeconds = max(0, $expiresAt ? $now->diffInSeconds($expiresAt, false) : 0);

        return [
            'movie_id' => (int) ($movie?->id ?? $access->movie_id),
            'slug' => (string) ($movie?->slug ?? ''),
            'title' => (string) ($movie?->title ?? 'Film Sewa'),
            'poster_url' => ! empty($movie?->poster_url)
                ? (string) $movie->poster_url
                : app(CloudflareImageService::class)->resolveDeliveryUrl($movie?->poster_path),
            'genre' => is_array($movie?->genre) ? implode(', ', $movie->genre) : (string) ($movie?->genre ?? ''),
            'duration_minutes' => (int) ($movie?->duration_minutes ?? 0),
            'rental_expires_at' => $expiresAt?->toISOString() ?? '',
            'remaining_seconds' => $isExpired ? 0 : (int) $remainingSeconds,
            'is_expired' => $isExpired,
        ];
    }
}
