<?php

namespace App\Http\Resources\Admin\V1\Events;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read Event $resource
 *
 * @mixin Event
 */
class AdminEventDetailResource extends JsonResource
{
    public static $wrap = null;

    /**
     * Transform the resource into an array for Admin Multi-Tab Event Editor.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Event $event */
        $event = $this->resource;

        return [
            'id' => (int) $event->id,
            'slug' => (string) $event->slug,
            'title' => (string) $event->title,
            'event_type' => (string) $event->event_type,
            'seating_type' => (string) $event->seating_type,
            'cinema_partner' => $event->cinema_partner,
            'target_screening_month' => $event->target_screening_month,
            'synopsis_short' => (string) $event->synopsis_short,
            'description' => (string) $event->description,
            'director' => (string) $event->director,
            'cast' => (array) ($event->cast ?? []),
            'genre' => (array) ($event->genre ?? []),
            'duration_minutes' => (int) ($event->duration_minutes ?? 0),
            'release_year' => $event->release_year !== null ? (int) $event->release_year : null,
            'age_rating' => (string) ($event->age_rating ?? 'SU'),
            'cloudflare_teaser_uid' => $event->cloudflare_teaser_uid,
            'venue_name' => (string) $event->venue_name,
            'venue_address' => (string) $event->venue_address,
            'city' => (string) $event->city,
            'poster_path' => $event->poster_path,
            'poster_url' => (string) $event->poster_url,
            'backdrop_path' => $event->backdrop_path,
            'backdrop_url' => (string) $event->backdrop_url,
            'is_active' => (bool) $event->is_active,
            'is_published' => (bool) $event->is_active,
            'is_featured' => (bool) $event->is_featured,
            'presale_start_at' => $event->presale_start_at?->toIso8601String(),
            'presale_end_at' => $event->presale_end_at?->toIso8601String(),
            'sales_start_at' => $event->presale_start_at?->toIso8601String(),
            'sales_end_at' => $event->presale_end_at?->toIso8601String(),
            'event_concludes_at' => $event->event_concludes_at?->toIso8601String(),
            'venues' => AdminEventVenueResource::collection($event->venues),
            'schedules' => AdminScheduleResource::collection($event->schedules),
            'created_at' => $event->created_at?->toIso8601String(),
            'updated_at' => $event->updated_at?->toIso8601String(),
        ];
    }
}
