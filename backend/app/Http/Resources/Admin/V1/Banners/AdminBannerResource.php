<?php

namespace App\Http\Resources\Admin\V1\Banners;

use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Banner
 */
class AdminBannerResource extends JsonResource
{
    /**
     * Disable default data wrapping when resource is transformed.
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
        $now = now();
        $isExpired = $this->end_at !== null && $this->end_at < $now;
        $isUpcoming = $this->start_at !== null && $this->start_at > $now;

        $statusLabel = 'active';
        if (! $this->is_active) {
            $statusLabel = 'inactive';
        } elseif ($isExpired) {
            $statusLabel = 'expired';
        } elseif ($isUpcoming) {
            $statusLabel = 'upcoming';
        }

        $isImageOnly = $this->display_mode === 'image_only';
        $isSpotlight = in_array($this->display_mode, ['spotlight', 'movie_spotlight', 'sorotan'], true);

        return [
            'id' => (int) $this->id,
            'title' => $isImageOnly ? $this->title : ($this->title ?? $this->event?->title ?? $this->movie?->title),
            'subtitle' => $isImageOnly ? $this->subtitle : ($this->subtitle ?? $this->event?->synopsis_short ?? ($this->movie?->synopsis_short ?? $this->movie?->synopsis)),
            'badge_text' => ($isImageOnly || $isSpotlight) ? null : ($this->badge_text ?? ($this->movie_id ? 'SOROTAN FILM' : ($this->event?->cinema_partner ?? 'PRESALE CINEMA'))),
            'age_rating' => $this->age_rating ?? $this->event?->age_rating ?? $this->movie?->age_rating,
            'genre' => $this->genre ?? (is_array($this->event?->genre) ? implode(', ', $this->event->genre) : $this->event?->genre) ?? $this->movie?->genre,
            'release_year' => $this->release_year !== null ? (int) $this->release_year : ($this->event?->release_year ? (int) $this->event->release_year : ($this->movie?->release_year ? (int) $this->movie->release_year : null)),
            'duration_minutes' => $this->duration_minutes !== null ? (int) $this->duration_minutes : ($this->event?->duration_minutes ? (int) $this->event->duration_minutes : ($this->movie?->duration_minutes ? (int) $this->movie->duration_minutes : null)),
            'image_path' => (string) $this->image_path,
            'image_url' => (string) $this->image_url,
            'display_mode' => (string) $this->display_mode,
            'link_type' => (string) $this->link_type,
            'movie_id' => $this->movie_id !== null ? (int) $this->movie_id : null,
            'movie_slug' => $this->movie?->slug,
            'movie_title' => $this->movie?->title,
            'event_id' => $this->event_id !== null ? (int) $this->event_id : null,
            'event_slug' => $this->event?->slug,
            'event_title' => $this->event?->title,
            'target_url' => $this->target_url,
            'button_text' => $this->button_text ?? 'Lihat Detail',
            'order_priority' => (int) $this->order_priority,
            'is_active' => (bool) $this->is_active,
            'start_at' => $this->start_at?->toIso8601String(),
            'end_at' => $this->end_at?->toIso8601String(),
            'status' => $statusLabel,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
