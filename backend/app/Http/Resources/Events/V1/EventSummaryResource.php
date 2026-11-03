<?php

namespace App\Http\Resources\Events\V1;

use App\Models\Event;
use App\Services\Checkout\VoucherService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read Event $resource
 *
 * @mixin Event
 */
class EventSummaryResource extends JsonResource
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

        $earliestSchedule = $event->schedules->sortBy('show_time')->first();
        $earliestShowTime = $earliestSchedule?->show_time;
        $rawStartingPrice = (float) ($event->schedules->min('ticket_price') ?? 0);
        $directDiscount = app(VoucherService::class)->getActiveDirectDiscount($rawStartingPrice, 'ticket', (int) $event->id);

        if ($directDiscount['has_discount']) {
            $startingPrice = (float) $directDiscount['discounted_price'];
            $originalStartingPrice = (float) $directDiscount['original_price'];
        } else {
            $startingPrice = $rawStartingPrice;
            $originalStartingPrice = null;
        }

        // Hitung total sisa kursi yang tersedia dari seluruh jadwal aktif
        $remainingSeatsCount = 0;
        foreach ($event->schedules as $schedule) {
            if ($schedule->seats->isNotEmpty()) {
                $lockedSeatIds = $schedule->seatLocks->pluck('seat_id')->filter()->all();
                $remainingSeatsCount += $schedule->seats->filter(function ($seat) use ($lockedSeatIds) {
                    return $seat->seat_type !== 'aisle'
                        && $seat->status === 'available'
                        && ! in_array($seat->id, $lockedSeatIds, true);
                })->count();
            } else {
                $lockedQty = (int) $schedule->seatLocks->sum('quantity');
                $remainingSeatsCount += max(0, (int) $schedule->total_seats - $lockedQty);
            }
        }

        return [
            'id' => (int) $event->id,
            'slug' => (string) $event->slug,
            'title' => (string) $event->title,
            'poster_url' => (string) $event->poster_url,
            'backdrop_url' => (string) $event->backdrop_url,
            'venue_name' => (string) $event->venue_name,
            'city' => (string) $event->city,
            'earliest_show_time' => $earliestShowTime ? $earliestShowTime->toIso8601String() : null,
            'starting_price' => $startingPrice,
            'formatted_starting_price' => 'Rp '.number_format($startingPrice, 0, ',', '.'),
            'original_starting_price' => $originalStartingPrice,
            'formatted_original_starting_price' => $originalStartingPrice !== null ? 'Rp '.number_format($originalStartingPrice, 0, ',', '.') : null,
            'event_type' => (string) $event->event_type,
            'seating_type' => (string) $event->seating_type,
            'cinema_partner' => $event->cinema_partner,
            'presale_start_at' => $event->presale_start_at?->toIso8601String(),
            'presale_end_at' => $event->presale_end_at?->toIso8601String(),
            'sales_start_at' => $event->presale_start_at?->toIso8601String(),
            'sales_end_at' => $event->presale_end_at?->toIso8601String(),
            'event_concludes_at' => $event->event_concludes_at?->toIso8601String(),
            'remaining_seats_count' => (int) $remainingSeatsCount,
            'total_schedules_count' => (int) $event->schedules->count(),
            'is_featured' => (bool) $event->is_featured,
            'genre' => (array) ($event->genre ?? []),
            'duration_minutes' => (int) ($event->duration_minutes ?? 0),
            'release_year' => $event->release_year !== null ? (int) $event->release_year : null,
            'age_rating' => (string) ($event->age_rating ?? 'SU'),
        ];
    }
}
