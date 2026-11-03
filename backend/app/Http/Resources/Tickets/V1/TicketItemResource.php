<?php

namespace App\Http\Resources\Tickets\V1;

use App\Models\EventTransaction;
use App\Services\Admin\Settings\SystemSettingService;
use App\Services\Tickets\UserTicketService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read EventTransaction $resource
 *
 * @mixin EventTransaction
 */
class TicketItemResource extends JsonResource
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
        $city = (string) ($event?->city ?? ($snapshot['city'] ?? ''));

        $showTimeCarbon = $schedule?->show_time ?? (isset($snapshot['show_time']) ? Carbon::parse($snapshot['show_time']) : null);
        $showTimeStr = $showTimeCarbon ? $showTimeCarbon->toISOString() : '';

        $isUpcoming = false;
        if ($t->payment_status === 'paid' && $t->checkin_status !== 'checked_in') {
            if ($eventType === 'presale_cinema') {
                // Presale Bioskop: aktif hingga 120 menit (2 jam) setelah show_time (toleransi cetak di kiosk)
                $isUpcoming = $showTimeCarbon
                    ? $showTimeCarbon->copy()->addMinutes(UserTicketService::PRESALE_GRACE_PERIOD_MINUTES)->isFuture()
                    : false;
            } else {
                // Screening Reguler: show_time di masa depan
                $isUpcoming = $showTimeCarbon ? $showTimeCarbon->isFuture() : false;
            }
        }

        $fulfillmentStatus = ($eventType === 'regular') ? null : $t->fulfillment_status;

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
            ];
        }

        $isPending = $t->payment_status === 'pending';
        $snapToken = $isPending ? (string) $t->snap_token : null;
        $expiresAt = null;

        if ($isPending && $t->created_at) {
            static $cachedLockDuration = null;
            if ($cachedLockDuration === null) {
                $cachedLockDuration = app(SystemSettingService::class)->getSeatLockDurationMinutes();
            }
            $expiresAt = $t->created_at->copy()->addMinutes($cachedLockDuration)->toISOString();
        }

        return [
            'id' => (int) $t->id,
            'order_id' => (string) $t->order_id,
            'event_type' => $eventType,
            'ticket_code' => $t->ticket_code,
            'qr_hash' => $t->qr_hash,
            'event_title' => $eventTitle,
            'poster_url' => $posterUrl,
            'venue_name' => $venueName,
            'city' => $city,
            'show_time' => $showTimeStr,
            'seat_codes' => (array) ($t->snapshot_seats ?? []),
            'payment_status' => (string) $t->payment_status,
            'checkin_status' => (string) ($t->checkin_status ?? 'pending'),
            'fulfillment_status' => $fulfillmentStatus,
            'cinema_ticket' => $cinemaTicket,
            'gross_amount' => $t->gross_amount !== null ? (float) $t->gross_amount : null,
            'net_amount' => $t->net_amount !== null ? (float) $t->net_amount : null,
            'snap_token' => $snapToken,
            'expires_at' => $expiresAt,
            'is_upcoming' => $isUpcoming,
        ];
    }
}
