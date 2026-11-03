<?php

namespace App\Http\Resources\Admin\V1\Presale;

use App\Models\EventTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin EventTransaction
 */
class CinemaFulfillmentOrderResource extends JsonResource
{
    /**
     * Transformasi entitas transaksi presale ke format DTO AdminFulfillmentOrder.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $snapshot = (array) ($this->snapshot_event_data ?? []);

        return [
            'id' => (int) $this->id,
            'transaction_id' => (int) $this->id,
            'order_id' => (string) $this->order_id,
            'user_name' => (string) ($this->user?->name ?? 'Penonton Sinemus'),
            'user_email' => (string) ($this->user?->email ?? '-'),
            'user_phone' => (string) ($this->user?->phone_number ?? '-'),
            'event_title' => (string) ($this->schedule?->event?->title ?? $snapshot['event_title'] ?? 'Penayangan Bioskop'),
            'schedule_show_time' => $this->schedule?->show_time
                ? $this->schedule->show_time->toIso8601String()
                : ($snapshot['show_time'] ?? now()->toIso8601String()),
            'event_venue_id' => $this->schedule?->event_venue_id ? (int) $this->schedule->event_venue_id : null,
            'venue_name' => (string) ($this->schedule?->venue?->venue_name ?? $this->schedule?->event?->venue_name ?? $snapshot['venue_name'] ?? 'Cinema XXI / CGV'),
            'studio_name' => (string) ($this->schedule?->studio_name ?? $snapshot['studio_name'] ?? 'Studio 1'),
            'ticket_quantity' => (int) $this->ticket_quantity,
            'seats' => (array) ($this->snapshot_seats ?? []),
            'gross_amount' => (float) $this->gross_amount,
            'discount_amount' => (float) $this->discount_amount,
            'net_amount' => (float) $this->net_amount,
            'payment_status' => (string) $this->payment_status,
            'fulfillment_status' => (string) $this->fulfillment_status,
            'cinema_booking_code' => $this->cinema_booking_code,
            'cinema_passcode' => $this->cinema_passcode,
            'cinema_qr_image_path' => $this->cinema_qr_image_path,
            'cinema_ticket_notes' => $this->cinema_ticket_notes,
            'fulfilled_at' => $this->fulfilled_at?->toIso8601String(),
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : now()->toIso8601String(),
        ];
    }
}
