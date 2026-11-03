<?php

namespace App\Http\Resources\Events\V1;

use App\Models\Event;
use App\Services\Checkout\VoucherService;
use App\Services\Cloudflare\CloudflareStreamService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read Event $resource
 *
 * @mixin Event
 */
class EventDetailResource extends JsonResource
{
    /**
     * Disable default data wrapping when resource is transformed.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array matching contracts/events.contract.json.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Event $event */
        $event = $this->resource;

        $schedules = $event->schedules->map(function ($schedule) use ($event) {
            $totalSeats = (int) $schedule->total_seats;

            if ($schedule->seats->isNotEmpty()) {
                $physicalSellableSeats = $schedule->seats
                    ->where('seat_type', '!=', 'aisle')
                    ->where('status', '!=', 'disabled');

                $sellableCount = $physicalSellableSeats->count();
                $totalSeats = $sellableCount > 0 ? $sellableCount : (int) $schedule->total_seats;

                $lockedSeatIds = $schedule->seatLocks->pluck('seat_id')->filter()->all();
                $availableSeatsCount = $schedule->seats->filter(function ($seat) use ($lockedSeatIds) {
                    return $seat->seat_type !== 'aisle'
                        && $seat->status === 'available'
                        && ! in_array($seat->id, $lockedSeatIds, true);
                })->count();
            } else {
                $lockedQty = (int) $schedule->seatLocks->sum('quantity');
                $availableSeatsCount = max(0, $totalSeats - $lockedQty);
            }

            $baseTicketPrice = (float) $schedule->ticket_price;
            $voucherService = app(VoucherService::class);
            $directDiscount = $voucherService->getActiveDirectDiscount($baseTicketPrice, 'ticket', (int) $event->id);

            if ($directDiscount['has_discount']) {
                $ticketPrice = (float) $directDiscount['discounted_price'];
                $originalTicketPrice = (float) $directDiscount['original_price'];
            } else {
                $ticketPrice = $baseTicketPrice;
                $originalTicketPrice = null;
            }

            $vipPrice = $schedule->vip_ticket_price !== null ? (float) $schedule->vip_ticket_price : null;
            $originalVipPrice = null;
            if ($vipPrice !== null) {
                $vipDiscount = $voucherService->getActiveDirectDiscount($vipPrice, 'ticket', (int) $event->id);
                if ($vipDiscount['has_discount']) {
                    $originalVipPrice = (float) $vipDiscount['original_price'];
                    $vipPrice = (float) $vipDiscount['discounted_price'];
                }
            }

            return [
                'id' => (int) $schedule->id,
                'event_venue_id' => $schedule->event_venue_id ? (int) $schedule->event_venue_id : null,
                'venue' => $schedule->venue ? new EventVenueResource($schedule->venue) : null,
                'studio_name' => (string) ($schedule->studio_name ?? 'Studio 1'),
                'show_time' => $schedule->show_time?->toIso8601String(),
                'ticket_price' => $ticketPrice,
                'formatted_ticket_price' => 'Rp '.number_format($ticketPrice, 0, ',', '.'),
                'original_ticket_price' => $originalTicketPrice,
                'formatted_original_ticket_price' => $originalTicketPrice !== null ? 'Rp '.number_format($originalTicketPrice, 0, ',', '.') : null,
                'vip_ticket_price' => $vipPrice,
                'formatted_vip_ticket_price' => $vipPrice !== null ? 'Rp '.number_format($vipPrice, 0, ',', '.') : null,
                'original_vip_ticket_price' => $originalVipPrice,
                'formatted_original_vip_ticket_price' => $originalVipPrice !== null ? 'Rp '.number_format($originalVipPrice, 0, ',', '.') : null,
                'available_seats_count' => (int) $availableSeatsCount,
                'total_seats' => $totalSeats,
            ];
        })->values()->all();

        $teaserToken = null;
        $teaserUrls = null;

        if (! empty($event->cloudflare_teaser_uid)) {
            /** @var CloudflareStreamService $streamService */
            $streamService = app(CloudflareStreamService::class);
            $teaserToken = $streamService->getCachedTeaserToken($event->cloudflare_teaser_uid);
            $teaserUrls = $streamService->getPlaybackUrls($event->cloudflare_teaser_uid, $teaserToken);
        }

        return [
            'id' => (int) $event->id,
            'slug' => (string) $event->slug,
            'title' => (string) $event->title,
            'description' => (string) $event->description,
            'synopsis_short' => (string) $event->synopsis_short,
            'poster_url' => (string) $event->poster_url,
            'backdrop_url' => (string) $event->backdrop_url,
            'director' => (string) $event->director,
            'cast' => is_array($event->cast) ? $event->cast : [],
            'genre' => is_array($event->genre) ? $event->genre : [],
            'duration_minutes' => (int) ($event->duration_minutes ?? 0),
            'release_year' => $event->release_year !== null ? (int) $event->release_year : null,
            'age_rating' => (string) ($event->age_rating ?? 'SU'),
            'cloudflare_teaser_uid' => $event->cloudflare_teaser_uid,
            'cloudflare_teaser_token' => $teaserToken,
            'cloudflare_teaser_iframe_url' => $teaserUrls['preview_iframe_url'] ?? null,
            'cloudflare_teaser_playback_url' => $teaserUrls['playback_hls_url'] ?? null,
            'venue_name' => (string) $event->venue_name,
            'venue_address' => (string) $event->venue_address,
            'city' => (string) $event->city,
            'event_type' => (string) $event->event_type,
            'seating_type' => (string) $event->seating_type,
            'presale_start_at' => $event->presale_start_at?->toIso8601String(),
            'presale_end_at' => $event->presale_end_at?->toIso8601String(),
            'sales_start_at' => $event->presale_start_at?->toIso8601String(),
            'sales_end_at' => $event->presale_end_at?->toIso8601String(),
            'event_concludes_at' => $event->event_concludes_at?->toIso8601String(),
            'venues' => EventVenueResource::collection($event->venues),
            'schedules' => $schedules,
            'is_featured' => (bool) $event->is_featured,
        ];
    }
}
