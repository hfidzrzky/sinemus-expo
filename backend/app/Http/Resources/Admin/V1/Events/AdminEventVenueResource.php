<?php

namespace App\Http\Resources\Admin\V1\Events;

use App\Models\EventVenue;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read EventVenue $resource
 *
 * @mixin EventVenue
 */
class AdminEventVenueResource extends JsonResource
{
    public static $wrap = null;

    /**
     * Transform the resource into an array for Admin Event Venue.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var EventVenue $venue */
        $venue = $this->resource;

        return [
            'id' => (int) $venue->id,
            'event_id' => (int) $venue->event_id,
            'venue_name' => (string) $venue->venue_name,
            'cinema_partner' => $venue->cinema_partner,
            'venue_address' => (string) $venue->venue_address,
            'city' => (string) $venue->city,
            'google_maps_url' => $venue->google_maps_url,
            'created_at' => $venue->created_at?->toISOString(),
            'updated_at' => $venue->updated_at?->toISOString(),
        ];
    }
}
