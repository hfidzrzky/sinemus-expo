<?php

namespace App\Http\Resources\Admin\V1\Scanner;

use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read Schedule $resource
 *
 * @mixin Schedule
 */
class ScannerSessionResource extends JsonResource
{
    public static $wrap = null;

    /**
     * Transform the resource into an array matching contracts/admin.contract.json listScannerSessions.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Schedule $schedule */
        $schedule = $this->resource;
        $event = $schedule->event;

        $totalSeats = (int) $schedule->total_seats;
        $ticketsSold = (int) ($schedule->tickets_sold ?? 0);
        $checkedInCount = (int) ($schedule->checked_in_count ?? 0);
        $pendingCheckin = max(0, $ticketsSold - $checkedInCount);

        $occupancyRate = $totalSeats > 0
            ? round(($ticketsSold / $totalSeats) * 100, 1)
            : 0.0;

        // Gate Status computation based on SSOT server time
        $gateStatus = 'upcoming';
        if ($schedule->show_time) {
            $now = now();
            $openGateTime = $schedule->show_time->copy()->subHours(2);
            $concludeGateTime = $schedule->show_time->copy()->addHours(2);
            $closingGateTime = $schedule->show_time->copy()->addHours(4);

            if ($now->gte($openGateTime) && $now->lte($concludeGateTime)) {
                $gateStatus = 'open_now';
            } elseif ($now->gt($concludeGateTime) && $now->lte($closingGateTime)) {
                $gateStatus = 'closing_soon';
            } elseif ($now->lt($openGateTime)) {
                $gateStatus = 'upcoming';
            }
        }

        return [
            'id' => (int) $schedule->id,
            'event_id' => (int) $schedule->event_id,
            'event_title' => (string) ($event?->title ?? 'Sinemus Screening'),
            'event_slug' => (string) ($event?->slug ?? ''),
            'poster_url' => (string) ($event?->poster_url ?? ''),
            'venue_name' => (string) ($schedule->venue?->venue_name ?? $event?->venue_name ?? ''),
            'city' => (string) ($schedule->venue?->city ?? $event?->city ?? ''),
            'cinema_partner' => $schedule->venue?->cinema_partner ?? $event?->cinema_partner ?? null,
            'studio_name' => (string) ($schedule->studio_name ?? 'Studio Utama'),
            'show_time' => $schedule->show_time?->toIso8601String(),
            'ticket_price' => (float) $schedule->ticket_price,
            'gate_status' => $gateStatus,
            'total_seats' => $totalSeats,
            'tickets_sold' => $ticketsSold,
            'checked_in_count' => $checkedInCount,
            'pending_checkin_count' => $pendingCheckin,
            'occupancy_rate' => $occupancyRate,
        ];
    }
}
