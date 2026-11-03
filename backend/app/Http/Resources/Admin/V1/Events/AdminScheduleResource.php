<?php

namespace App\Http\Resources\Admin\V1\Events;

use App\Models\EventTransaction;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read Schedule $resource
 *
 * @mixin Schedule
 */
class AdminScheduleResource extends JsonResource
{
    public static $wrap = null;

    /**
     * Transform the resource into an array for Admin Studio.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Schedule $schedule */
        $schedule = $this->resource;

        $ticketPrice = (float) $schedule->ticket_price;
        $vipPrice = $schedule->vip_ticket_price !== null ? (float) $schedule->vip_ticket_price : null;

        $hasSeats = $schedule->relationLoaded('seats');
        $seatsCount = $hasSeats ? $schedule->seats->count() : 0;
        $seatMapConfig = null;
        $aisleCount = 0;

        if ($hasSeats && $seatsCount > 0) {
            $uniqueRows = $schedule->seats->pluck('row_label')->unique()->values();
            $maxGridCol = (int) ($schedule->seats->max('grid_column') ?? $schedule->seats->max('seat_number') ?? 10);
            $vipSeats = $schedule->seats->where('seat_type', 'vip')->map(function ($s) {
                $col = $s->grid_column ?? $s->seat_number;

                return "{$s->row_label}{$col}";
            })->values()->all();
            $aisleSeats = $schedule->seats->filter(fn ($s) => $s->seat_type === 'aisle' || $s->status === 'disabled')->map(function ($s) {
                $col = $s->grid_column ?? $s->seat_number;

                return "{$s->row_label}{$col}";
            })->values()->all();
            $aisleCount = count($aisleSeats);

            $seatMapConfig = [
                'rows' => count($uniqueRows) > 0 ? count($uniqueRows) : 6,
                'columns' => $maxGridCol > 0 ? $maxGridCol : 10,
                'vip_seats' => $vipSeats,
                'disabled_seats' => [],
                'aisle_seats' => $aisleSeats,
                'total_capacity' => (int) $schedule->total_seats,
            ];

            $availableCount = $schedule->seats->where('status', 'available')->where('seat_type', '!=', 'aisle')->count();
            $bookedCount = $schedule->seats->where('status', 'booked')->count();
        } else {
            $bookedCount = isset($schedule->booked_tickets_count)
                ? (int) $schedule->booked_tickets_count
                : ($schedule->relationLoaded('eventTransactions') ? (int) $schedule->eventTransactions->where('payment_status', 'paid')->sum('ticket_quantity') : 0);
            $availableCount = max(0, (int) $schedule->total_seats - $bookedCount);
        }

        $checkedInCount = 0;
        if ($schedule->relationLoaded('eventTransactions')) {
            $checkedInCount = (int) $schedule->eventTransactions->where('checkin_status', 'checked_in')->sum('ticket_quantity');
            $bookedCount = max($bookedCount, (int) $schedule->eventTransactions->where('payment_status', 'paid')->sum('ticket_quantity'));
        }

        $lockedCount = isset($schedule->locked_seats_count) ? (int) $schedule->locked_seats_count : 0;

        $paidTransactions = $schedule->relationLoaded('eventTransactions')
            ? $schedule->eventTransactions->where('payment_status', 'paid')
            : EventTransaction::where('schedule_id', $schedule->id)->where('payment_status', 'paid')->get();

        $paidCount = $paidTransactions->count();
        $isSeatMapLocked = $seatsCount > 0 && $paidCount > 0;

        $paidSeatCodes = [];
        if ($isSeatMapLocked) {
            foreach ($paidTransactions as $pt) {
                if (! empty($pt->snapshot_seats) && is_array($pt->snapshot_seats)) {
                    $paidSeatCodes = array_merge($paidSeatCodes, $pt->snapshot_seats);
                }
            }
            $paidSeatCodes = array_values(array_unique($paidSeatCodes));
            sort($paidSeatCodes);
        }

        $lockedReason = $isSeatMapLocked
            ? "{$paidCount} tiket terjual".(count($paidSeatCodes) > 0 ? ' (Kursi: '.implode(', ', $paidSeatCodes).')' : '')
            : null;

        return [
            'id' => (int) $schedule->id,
            'event_id' => (int) $schedule->event_id,
            'event_venue_id' => $schedule->event_venue_id ? (int) $schedule->event_venue_id : null,
            'venue' => $schedule->venue ? new AdminEventVenueResource($schedule->venue) : null,
            'studio_name' => (string) ($schedule->studio_name ?? 'Studio 1'),
            'show_time' => $schedule->show_time?->toIso8601String(),
            'ticket_price' => $ticketPrice,
            'formatted_ticket_price' => 'Rp '.number_format($ticketPrice, 0, ',', '.'),
            'vip_ticket_price' => $vipPrice,
            'formatted_vip_ticket_price' => $vipPrice !== null ? 'Rp '.number_format($vipPrice, 0, ',', '.') : null,
            'total_seats' => (int) $schedule->total_seats,
            'available_seats_count' => $availableCount,
            'booked_seats_count' => $bookedCount,
            'locked_seats_count' => $lockedCount,
            'checked_in_count' => $checkedInCount,
            'is_active' => (bool) $schedule->is_active,
            'is_seat_map_locked' => (bool) $isSeatMapLocked,
            'locked_reason' => $lockedReason,
            'paid_seat_codes' => $paidSeatCodes,
            'seatmap' => [
                'total_seats_generated' => $seatsCount,
                'available_count' => $availableCount,
                'booked_count' => $bookedCount,
                'aisle_count' => $aisleCount,
            ],
            'seat_map_config' => $seatMapConfig,
            'created_at' => $schedule->created_at?->toIso8601String(),
            'updated_at' => $schedule->updated_at?->toIso8601String(),
        ];
    }
}
