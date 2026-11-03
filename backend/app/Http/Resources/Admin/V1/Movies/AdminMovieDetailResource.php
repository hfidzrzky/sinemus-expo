<?php

namespace App\Http\Resources\Admin\V1\Movies;

use App\Models\Movie;
use App\Services\Admin\Settings\SystemSettingService;
use App\Services\Cloudflare\CloudflareImageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * @mixin Movie
 */
class AdminMovieDetailResource extends JsonResource
{
    /**
     * Disable default data wrapping.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array matching admin 4-tab editor contracts.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $genres = is_array($this->genre)
            ? $this->genre
            : (empty($this->genre) ? [] : array_map('trim', explode(',', $this->genre)));

        $imageService = app(CloudflareImageService::class);
        $posterUrl = $imageService->resolveDeliveryUrl($this->poster_path);
        $backdropUrl = $imageService->resolveDeliveryUrl($this->backdrop_path);

        $isFree = $this->access_model === 'free' || (float) ($this->price ?? 0) <= 0;
        $activeRentalsCount = $isFree ? 0 : (int) ($this->active_rentals_count ?? (
            $this->relationLoaded('userAccess')
                ? $this->userAccess->filter(fn ($access) => $access->access_status === 'active' && $access->rental_expires_at?->isFuture())->count()
                : $this->userAccess()->active()->count()
        ));

        return [
            'id' => (int) $this->id,
            'slug' => (string) $this->slug,
            'title' => (string) $this->title,
            'synopsis_short' => Str::limit((string) $this->synopsis, 120),
            'synopsis_full' => (string) $this->synopsis,
            'director' => (string) ($this->director ?? '-'),
            'cast' => is_array($this->cast) ? $this->cast : [],
            'genre' => $genres,
            'release_year' => (int) ($this->release_year ?? 2026),
            'duration_minutes' => (int) ($this->duration_minutes ?? 0),
            'age_rating' => (string) ($this->age_rating ?? '13+'),
            'poster_path' => (string) ($this->poster_path ?? ''),
            'poster_url' => $posterUrl,
            'backdrop_path' => (string) ($this->backdrop_path ?? ''),
            'backdrop_url' => $backdropUrl,
            'look_films' => is_array($this->look_films) ? $this->look_films : [],
            'cloudflare_video_uid' => (string) ($this->cloudflare_video_uid ?? ''),
            'cloudflare_trailer_uid' => $this->cloudflare_trailer_uid ? (string) $this->cloudflare_trailer_uid : null,
            'stream_status' => ! empty($this->cloudflare_video_uid) ? 'ready' : 'processing',
            'access_model' => (string) ($this->access_model ?? 'rental'),
            'rental_price' => (float) ($this->price ?? 0),
            'formatted_rental_price' => 'Rp '.number_format((float) ($this->price ?? 0), 0, ',', '.'),
            'active_rental_duration_hours' => (int) ($this->rental_duration_hours ?? app(SystemSettingService::class)->getVodRentalDurationHours()),
            'is_published' => (bool) $this->is_published,
            'is_featured' => (bool) $this->is_featured,
            'active_rentals_count' => $activeRentalsCount,
            'scheduled_publish_at' => $this->scheduled_publish_at?->toIso8601String(),
            'scheduled_unpublish_at' => $this->scheduled_unpublish_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
