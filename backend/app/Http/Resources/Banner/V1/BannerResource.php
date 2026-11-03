<?php

namespace App\Http\Resources\Banner\V1;

use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read Banner $resource
 * @property int $id
 * @property string|null $title
 * @property string|null $subtitle
 * @property string|null $badge_text
 * @property string $image_url
 * @property string $display_mode
 * @property string $link_type
 * @property string|null $target_url
 * @property string|null $button_text
 * @property int $order_priority
 *
 * @mixin Banner
 */
class BannerResource extends JsonResource
{
    /**
     * Disable default data wrapping when resource is transformed.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array matching contracts/banners.contract.json.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Banner $banner */
        $banner = $this->resource;

        $isImageOnly = $banner->display_mode === 'image_only';
        $isSpotlight = in_array($banner->display_mode, ['spotlight', 'movie_spotlight', 'sorotan'], true);

        return [
            'id' => (int) $banner->id,
            'title' => $isImageOnly ? $banner->title : ($banner->title ?? $banner->event?->title ?? $banner->movie?->title),
            'subtitle' => $isImageOnly ? $banner->subtitle : ($banner->subtitle ?? $banner->event?->synopsis_short ?? ($banner->movie?->synopsis_short ?? $banner->movie?->synopsis)),
            'badge_text' => ($isImageOnly || $isSpotlight) ? null : ($banner->badge_text ?? ($banner->movie_id ? 'SOROTAN FILM' : ($banner->event?->cinema_partner ?? 'PRESALE CINEMA'))),
            'age_rating' => $banner->age_rating ?? $banner->event?->age_rating ?? $banner->movie?->age_rating,
            'genre' => $banner->genre ?? (is_array($banner->event?->genre) ? implode(', ', $banner->event->genre) : $banner->event?->genre) ?? $banner->movie?->genre,
            'release_year' => $banner->release_year !== null ? (int) $banner->release_year : ($banner->event?->release_year ? (int) $banner->event->release_year : ($banner->movie?->release_year ? (int) $banner->movie->release_year : null)),
            'duration_minutes' => $banner->duration_minutes !== null ? (int) $banner->duration_minutes : ($banner->event?->duration_minutes ? (int) $banner->event->duration_minutes : ($banner->movie?->duration_minutes ? (int) $banner->movie->duration_minutes : null)),
            'image_url' => (string) $banner->image_url,
            'display_mode' => (string) $banner->display_mode,
            'link_type' => (string) $banner->link_type,
            'movie_slug' => $banner->movie?->slug,
            'event_slug' => $banner->event?->slug,
            'target_url' => $banner->target_url,
            'button_text' => $banner->button_text ?? 'Lihat Detail',
            'order_priority' => (int) $banner->order_priority,
        ];
    }
}
