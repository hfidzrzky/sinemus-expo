<?php

namespace App\Http\Resources\Tickets\V1;

use App\Models\EventTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read EventTransaction $resource
 *
 * @mixin EventTransaction
 */
class TicketDetailResource extends JsonResource
{
    /**
     * Disable default wrapping.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array matching contracts/tickets.contract.json.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var EventTransaction $t */
        $t = $this->resource;
        $event = $t->schedule?->event;
        $schedule = $t->schedule;
        $snapshot = $t->snapshot_event_data ?? [];

        $eventType = (string) ($event?->event_type ?? 'regular');
        $eventTitle = (string) ($event?->title ?? ($snapshot['event_title'] ?? 'Screening Sinemus'));
        $posterUrl = (string) ($event?->poster_url ?? '');
        $venueName = (string) ($event?->venue_name ?? ($snapshot['venue_name'] ?? ''));
        $venueAddress = (string) ($event?->venue_address ?? '');
        $city = (string) ($event?->city ?? ($snapshot['city'] ?? ''));

        $showTimeCarbon = $schedule?->show_time ?? (isset($snapshot['show_time']) ? Carbon::parse($snapshot['show_time']) : null);
        $showTimeStr = $showTimeCarbon ? $showTimeCarbon->toISOString() : '';

        $isUpcoming = false;
        if ($t->payment_status === 'paid' && $t->checkin_status !== 'checked_in') {
            $isUpcoming = $showTimeCarbon ? $showTimeCarbon->isFuture() : false;
        }

        $paidAmount = (float) $t->net_amount;
        $formattedPaidAmount = 'Rp '.number_format($paidAmount, 0, ',', '.');

        $fulfillmentStatus = null;

        $cinemaTicket = null;
        if (! empty($t->cinema_booking_code) || ! empty($t->cinema_passcode) || ! empty($t->cinema_qr_image_path)) {
            $qrImageUrl = null;
            if (! empty($t->cinema_qr_image_path)) {
                $apiUrl = rtrim(config('app.url', env('APP_URL', 'http://localhost:8000')), '/');
                $hashQuery = ! empty($t->qr_hash) ? '?h='.$t->qr_hash : '';
                $qrImageUrl = "{$apiUrl}/api/v1/tickets/{$t->order_id}/qr-image{$hashQuery}";
            }

            $cinemaTicket = [
                'booking_code' => (string) ($t->cinema_booking_code ?? ''),
                'passcode' => (string) ($t->cinema_passcode ?? ''),
                'qr_image_url' => $qrImageUrl,
                'notes' => $t->cinema_ticket_notes,
                'fulfilled_at' => $t->fulfilled_at?->toISOString(),
            ];
        }

        return [
            'id' => (int) $t->id,
            'order_id' => (string) $t->order_id,
            'event_type' => $eventType,
            'ticket_code' => $t->ticket_code,
            'qr_hash' => $t->qr_hash,
            'buyer_name' => (string) ($t->user?->name ?? ''),
            'buyer_phone' => (string) ($t->user?->phone_number ?? ''),
            'event_title' => $eventTitle,
            'poster_url' => $posterUrl,
            'venue_name' => $venueName,
            'venue_address' => $venueAddress,
            'city' => $city,
            'show_time' => $showTimeStr,
            'seat_codes' => (array) ($t->snapshot_seats ?? []),
            'paid_amount' => $paidAmount,
            'formatted_paid_amount' => $formattedPaidAmount,
            'paid_at' => $t->paid_at?->toISOString() ?? $t->created_at?->toISOString() ?? '',
            'checkin_status' => (string) ($t->checkin_status ?? 'pending'),
            'checkin_at' => $t->checkin_at?->toISOString(),
            'fulfillment_status' => $fulfillmentStatus,
            'cinema_ticket' => $cinemaTicket,
            'is_upcoming' => $isUpcoming,
        ];
    }
}
