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
class AdminEventListResource extends JsonResource
{
    public static $wrap = null;

    /**
     * Transform the resource into an array for Admin Studio Event Table.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Event $event */
        $event = $this->resource;

        $totalSchedules = $event->relationLoaded('schedules') ? $event->schedules->count() : 0;

        // Prioritaskan nilai teragregasi dari SQL withSum untuk efisiensi O(1) query
        $totalSeatsCapacity = isset($event->total_capacity)
            ? (int) $event->total_capacity
            : (int) ($event->relationLoaded('schedules') ? $event->schedules->sum('total_seats') : 0);

        $totalTicketsSold = isset($event->total_booked)
            ? (int) $event->total_booked
            : 0;

        $totalSeatsLocked = isset($event->total_locked)
            ? (int) $event->total_locked
            : 0;

        // Fallback jika tidak dieksekusi via withSum (misal unit test isolated atau fixtures)
        if (! isset($event->total_booked) && $event->relationLoaded('schedules')) {
            foreach ($event->schedules as $schedule) {
                if (isset($schedule->booked_tickets_count)) {
                    $totalTicketsSold += (int) $schedule->booked_tickets_count;
                } elseif ($schedule->relationLoaded('eventTransactions')) {
                    $totalTicketsSold += (int) $schedule->eventTransactions->where('payment_status', 'paid')->sum('ticket_quantity');
                }

                if (isset($schedule->locked_seats_count)) {
                    $totalSeatsLocked += (int) $schedule->locked_seats_count;
                }
            }
        }

        $occupancyPercentage = $totalSeatsCapacity > 0
            ? round(($totalTicketsSold / $totalSeatsCapacity) * 100, 1)
            : 0.0;

        return [
            'id' => (int) $event->id,
            'slug' => (string) $event->slug,
            'title' => (string) $event->title,
            'event_type' => (string) $event->event_type,
            'seating_type' => (string) $event->seating_type,
            'cinema_partner' => $event->cinema_partner,
            'target_screening_month' => $event->target_screening_month,
            'venue_name' => (string) $event->venue_name,
            'city' => (string) $event->city,
            'director' => (string) ($event->director ?? ''),
            'genre' => (array) ($event->genre ?? []),
            'duration_minutes' => (int) ($event->duration_minutes ?? 0),
            'release_year' => $event->release_year !== null ? (int) $event->release_year : null,
            'age_rating' => (string) ($event->age_rating ?? 'SU'),
            'poster_url' => (string) $event->poster_url,
            'backdrop_url' => (string) $event->backdrop_url,
            'is_active' => (bool) $event->is_active,
            'is_published' => (bool) $event->is_active,
            'is_featured' => (bool) $event->is_featured,
            'presale_start_at' => $event->presale_start_at?->toIso8601String(),
            'presale_end_at' => $event->presale_end_at?->toIso8601String(),
            'sales_start_at' => $event->presale_start_at?->toIso8601String(),
            'sales_end_at' => $event->presale_end_at?->toIso8601String(),
            'event_concludes_at' => $event->event_concludes_at?->toIso8601String(),
            'total_capacity' => $totalSeatsCapacity,
            'total_booked' => $totalTicketsSold,
            'total_locked' => $totalSeatsLocked,
            'occupancy_rate' => $occupancyPercentage,
            'venues' => AdminEventVenueResource::collection($event->venues),
            'schedules' => AdminScheduleResource::collection($event->schedules),
            'metrics' => [
                'total_schedules' => $totalSchedules,
                'total_seats_capacity' => $totalSeatsCapacity,
                'total_tickets_sold' => $totalTicketsSold,
                'total_seats_locked' => $totalSeatsLocked,
                'occupancy_percentage' => $occupancyPercentage,
                'formatted_occupancy' => "{$occupancyPercentage}%",
            ],
            'created_at' => $event->created_at?->toIso8601String(),
            'updated_at' => $event->updated_at?->toIso8601String(),
        ];
    }
}
