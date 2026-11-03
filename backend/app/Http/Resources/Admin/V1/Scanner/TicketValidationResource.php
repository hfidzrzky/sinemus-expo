<?php

namespace App\Http\Resources\Admin\V1\Scanner;

use App\Models\EventTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read EventTransaction $resource
 */
class TicketValidationResource extends JsonResource
{
    /**
     * Transform the resource into an array matching contracts/admin.contract.json validateTicketQR.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $eventTitle = $this->resource->schedule?->event?->title
            ?? $this->resource->snapshot_event_data['title']
            ?? $this->resource->snapshot_event_data['event_title']
            ?? 'Sinemus Event Screening';

        $buyerName = $this->resource->user?->name
            ?? $this->resource->snapshot_event_data['buyer_name']
            ?? 'Penonton Sinemus';

        $seatingType = $this->resource->schedule?->event?->seating_type
            ?? $this->resource->snapshot_event_data['seating_type']
            ?? 'assigned_seating';

        // Extract seat_codes from snapshot_seats or relation
        $seatCodes = null;
        if (! empty($this->resource->snapshot_seats) && is_array($this->resource->snapshot_seats)) {
            $seatCodes = array_map(function ($seat) {
                if (is_array($seat)) {
                    return $seat['seat_code'] ?? $seat['code'] ?? (string) json_encode($seat);
                }

                return (string) $seat;
            }, $this->resource->snapshot_seats);
        }

        $scannedAt = $this->resource->checkin_at
            ? $this->resource->checkin_at->toISOString()
            : now()->toISOString();

        return [
            'ticket_code' => (string) ($this->resource->ticket_code ?? $this->resource->order_id),
            'event_title' => (string) $eventTitle,
            'buyer_name' => (string) $buyerName,
            'seating_type' => (string) $seatingType,
            'ticket_quantity' => (int) ($this->resource->ticket_quantity ?? 1),
            'seat_codes' => $seatCodes,
            'checkin_status' => (string) $this->resource->checkin_status,
            'scanned_at' => $scannedAt,
            'venue_name' => (string) ($this->resource->schedule?->event?->venue_name ?? $this->resource->snapshot_event_data['venue_name'] ?? ''),
            'studio_name' => (string) ($this->resource->schedule?->studio_name ?? $this->resource->snapshot_event_data['studio_name'] ?? ''),
        ];
    }
}
