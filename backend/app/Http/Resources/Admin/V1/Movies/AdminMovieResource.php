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
class AdminMovieResource extends JsonResource
{
    /**
     * Disable default data wrapping.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array matching admin contracts.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $genres = is_array($this->genre)
            ? $this->genre
            : (empty($this->genre) ? [] : array_map('trim', explode(',', $this->genre)));

        $posterUrl = $this->resolveMediaUrl($this->poster_path);
        $backdropUrl = $this->resolveMediaUrl($this->backdrop_path);

        $lookFilms = is_array($this->look_films)
            ? array_values(array_filter(array_map(fn ($p) => $this->resolveMediaUrl($p), $this->look_films)))
            : [];

        return [
            'id' => (int) $this->id,
            'slug' => (string) $this->slug,
            'title' => (string) $this->title,
            'synopsis' => (string) $this->synopsis,
            'synopsis_short' => Str::limit((string) $this->synopsis, 120),
            'synopsis_full' => (string) $this->synopsis,
            'director' => (string) ($this->director ?? '-'),
            'cast' => is_array($this->cast) ? $this->cast : [],
            'genre' => $genres,
            'release_year' => (int) ($this->release_year ?? 2026),
            'duration_minutes' => (int) ($this->duration_minutes ?? 0),
            'age_rating' => (string) ($this->age_rating ?? '13+'),
            'poster_url' => $posterUrl,
            'backdrop_url' => $backdropUrl,
            'look_films' => $lookFilms,
            'cloudflare_video_uid' => (string) ($this->cloudflare_video_uid ?? ''),
            'cloudflare_trailer_uid' => $this->cloudflare_trailer_uid ? (string) $this->cloudflare_trailer_uid : null,
            'stream_status' => ! empty($this->cloudflare_video_uid) ? 'ready' : 'processing',
            'access_model' => (string) ($this->access_model ?? 'rental'),
            'rental_price' => (float) ($this->price ?? 0),
            'formatted_rental_price' => 'Rp '.number_format((float) ($this->price ?? 0), 0, ',', '.'),
            'active_rental_duration_hours' => (int) ($this->rental_duration_hours ?? app(SystemSettingService::class)->getVodRentalDurationHours()),
            'is_published' => (bool) $this->is_published,
            'is_featured' => (bool) $this->is_featured,
            'active_rentals_count' => ($this->access_model === 'free' || (float) ($this->price ?? 0) <= 0)
                ? 0
                : (int) ($this->active_rentals_count ?? $this->userAccess()->active()->count()),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    protected function resolveMediaUrl(?string $path): string
    {
        return app(CloudflareImageService::class)->resolveDeliveryUrl($path);
    }
}
