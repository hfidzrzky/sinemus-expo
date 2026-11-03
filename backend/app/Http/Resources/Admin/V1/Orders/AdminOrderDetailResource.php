<?php

namespace App\Http\Resources\Admin\V1\Orders;

use App\Models\EventTransaction;
use App\Models\MovieTransaction;
use App\Services\Admin\Settings\SystemSettingService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminOrderDetailResource extends JsonResource
{
    /**
     * Disable default wrapping.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Format angka ke format mata uang Rupiah.
     */
    protected function formatRupiah(float|int $amount): string
    {
        return 'Rp '.number_format((float) $amount, 0, ',', '.');
    }

    /**
     * Transform the resource into an array for Admin Drawer Audit Snapshot.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isTicket = $this->resource instanceof EventTransaction || str_starts_with((string) $this->order_id, 'SNM-TKT');

        if ($isTicket) {
            return $this->formatTicketOrderDetail();
        }

        return $this->formatMovieOrderDetail();
    }

    /**
     * Format detail pesanan tiket bioskop (EventTransaction).
     *
     * @return array<string, mixed>
     */
    protected function formatTicketOrderDetail(): array
    {
        /** @var EventTransaction $t */
        $t = $this->resource;
        $user = $t->user;
        $event = $t->schedule?->event;
        $schedule = $t->schedule;
        $voucher = $t->voucher;
        $snapshot = $t->snapshot_event_data ?? [];

        // Resolusi QR image URL bioskop
        $cinemaQrImageUrl = null;
        if (! empty($t->cinema_qr_image_path)) {
            if (Str::startsWith($t->cinema_qr_image_path, ['http://', 'https://'])) {
                $cinemaQrImageUrl = $t->cinema_qr_image_path;
            } elseif (! empty(config('filesystems.disks.r2.url'))) {
                $cinemaQrImageUrl = rtrim((string) config('filesystems.disks.r2.url'), '/').'/'.ltrim($t->cinema_qr_image_path, '/');
            } else {
                $cinemaQrImageUrl = Storage::url($t->cinema_qr_image_path);
            }
        }

        $gross = (float) $t->gross_amount;
        $discount = (float) $t->discount_amount;
        $net = (float) $t->net_amount;

        $itemTitle = (string) ($event?->title ?? ($snapshot['event_title'] ?? ($snapshot['title'] ?? 'Tiket Bioskop')));
        $venueName = (string) ($event?->venue_name ?? ($snapshot['venue_name'] ?? '-'));
        $showTime = $schedule?->show_time?->toISOString() ?? ($snapshot['show_time'] ?? null);
        $seats = (array) ($t->snapshot_seats ?? []);
        if (is_array($seats)) {
            $seats = array_values(array_filter(array_map(function ($s) {
                if (is_array($s) && isset($s['seat_code'])) {
                    return (string) $s['seat_code'];
                }
                if (is_object($s) && isset($s->seat_code)) {
                    return (string) $s->seat_code;
                }

                return is_scalar($s) ? (string) $s : '';
            }, $seats)));
        }

        return [
            'order_id' => (string) $t->order_id,
            'order_type' => 'ticket',
            'payment_status' => (string) $t->payment_status,
            'payment_type' => $t->payment_type,
            'snap_token' => $t->snap_token,
            'paid_at' => $t->paid_at?->toISOString(),
            'created_at' => $t->created_at?->toISOString() ?? now()->toISOString(),

            // Top-level compatibility attributes
            'user_name' => (string) ($user?->name ?? 'Guest'),
            'user_email' => (string) ($user?->email ?? '-'),
            'user_phone' => $user?->phone_number,
            'user_birth_date' => $user?->birth_date?->toDateString(),
            'is_phone_locked' => (bool) ($user?->is_phone_locked ?? false),
            'item_title' => $itemTitle,
            'venue_name' => $venueName,
            'show_time' => $showTime,
            'seat_codes' => $seats,
            'ticket_quantity' => (int) $t->ticket_quantity,
            'gross_amount' => $gross,
            'discount_amount' => $discount,
            'net_amount' => $net,
            'voucher_code' => $voucher?->code,
            'fulfillment_status' => (string) $t->fulfillment_status,
            'cinema_booking_code' => $t->cinema_booking_code,
            'cinema_passcode' => $t->cinema_passcode,
            'cinema_qr_image_path' => $cinemaQrImageUrl,
            'cinema_ticket_notes' => $t->cinema_ticket_notes,
            'checkin_status' => (string) $t->checkin_status,
            'checkin_time' => $t->checkin_at?->toISOString(),
            'midtrans_transaction_id' => $t->snap_token,

            'buyer' => [
                'user_id' => (int) ($user?->id ?? $t->user_id),
                'name' => (string) ($user?->name ?? 'Guest'),
                'email' => (string) ($user?->email ?? '-'),
                'phone_number' => $user?->phone_number,
                'is_phone_locked' => (bool) ($user?->is_phone_locked ?? false),
                'birth_date' => $user?->birth_date?->toDateString(),
            ],
            'item_details' => [
                'event_id' => $schedule?->event_id ?? ($snapshot['event_id'] ?? null),
                'event_title' => $itemTitle,
                'venue_name' => $venueName,
                'venue_address' => (string) ($event?->venue_address ?? ($snapshot['venue_address'] ?? '')),
                'city' => (string) ($event?->city ?? ($snapshot['city'] ?? '-')),
                'cinema_partner' => $event?->cinema_partner ?? ($snapshot['cinema_partner'] ?? null),
                'studio_name' => $schedule?->studio_name ?? ($snapshot['studio_name'] ?? '-'),
                'show_time' => $showTime,
                'ticket_code' => $t->ticket_code,
                'ticket_quantity' => (int) $t->ticket_quantity,
                'qr_hash' => $t->qr_hash,
                'seats' => $seats,
                'checkin_status' => (string) $t->checkin_status,
                'checkin_at' => $t->checkin_at?->toISOString(),
                'fulfillment_status' => (string) $t->fulfillment_status,
                'cinema_booking_code' => $t->cinema_booking_code,
                'cinema_passcode' => $t->cinema_passcode,
                'cinema_qr_image_url' => $cinemaQrImageUrl,
                'cinema_ticket_notes' => $t->cinema_ticket_notes,
                'fulfilled_at' => $t->fulfilled_at?->toISOString(),
                'fulfilled_by_admin' => $t->fulfilledByAdmin ? [
                    'id' => (int) $t->fulfilledByAdmin->id,
                    'name' => (string) $t->fulfilledByAdmin->name,
                    'email' => (string) $t->fulfilledByAdmin->email,
                ] : null,
            ],
            'financials' => [
                'gross_amount' => $gross,
                'discount_amount' => $discount,
                'net_amount' => $net,
                'formatted_gross_amount' => $this->formatRupiah($gross),
                'formatted_discount_amount' => $this->formatRupiah($discount),
                'formatted_net_amount' => $this->formatRupiah($net),
                'voucher' => $voucher ? [
                    'id' => (int) $voucher->id,
                    'code' => (string) $voucher->code,
                    'discount_type' => (string) $voucher->discount_type,
                    'discount_value' => (float) $voucher->discount_value,
                ] : null,
            ],
            'audit_logs' => [
                'payment_gateway' => 'midtrans',
                'payment_type' => $t->payment_type,
                'snap_token' => $t->snap_token,
                'checkin_history' => $t->relationLoaded('checkins') ? $t->checkins->map(function ($c) {
                    return [
                        'scanned_by' => $c->scannedBy?->name ?? 'Admin',
                        'scanned_at' => $c->scanned_at?->toISOString(),
                        'device_info' => $c->device_info,
                    ];
                })->all() : [],
            ],
        ];
    }

    /**
     * Format detail pesanan sewa film VoD (MovieTransaction).
     *
     * @return array<string, mixed>
     */
    protected function formatMovieOrderDetail(): array
    {
        /** @var MovieTransaction $t */
        $t = $this->resource;
        $user = $t->user;
        $movie = $t->movie;
        $voucher = $t->voucher;
        $access = $t->movieAccess;
        $snapshot = $t->snapshot_movie_data ?? [];

        $gross = (float) $t->gross_amount;
        $discount = (float) $t->discount_amount;
        $net = (float) $t->net_amount;

        $itemTitle = (string) ($movie?->title ?? ($snapshot['title'] ?? 'Sewa Film VoD'));
        $defaultRentalDuration = app(SystemSettingService::class)->getVodRentalDurationHours();
        $durationHours = $movie?->rental_duration_hours ?? ($snapshot['rental_duration_hours'] ?? $defaultRentalDuration);
        $durationMinutes = $movie?->duration_minutes ?? ($snapshot['duration_minutes'] ?? null);

        return [
            'order_id' => (string) $t->order_id,
            'order_type' => 'movie_rental',
            'payment_status' => (string) $t->payment_status,
            'payment_type' => $t->payment_type,
            'snap_token' => $t->snap_token,
            'paid_at' => $t->paid_at?->toISOString(),
            'created_at' => $t->created_at?->toISOString() ?? now()->toISOString(),

            // Top-level compatibility attributes
            'user_name' => (string) ($user?->name ?? 'Guest'),
            'user_email' => (string) ($user?->email ?? '-'),
            'user_phone' => $user?->phone_number,
            'user_birth_date' => $user?->birth_date?->toDateString(),
            'is_phone_locked' => (bool) ($user?->is_phone_locked ?? false),
            'item_title' => $itemTitle,
            'gross_amount' => $gross,
            'discount_amount' => $discount,
            'net_amount' => $net,
            'voucher_code' => $voucher?->code,
            'access_duration_hours' => $durationHours,
            'access_status' => $access?->access_status ?? ($t->payment_status === 'paid' ? 'active' : 'inactive'),
            'midtrans_transaction_id' => $t->snap_token,

            'buyer' => [
                'user_id' => (int) ($user?->id ?? $t->user_id),
                'name' => (string) ($user?->name ?? 'Guest'),
                'email' => (string) ($user?->email ?? '-'),
                'phone_number' => $user?->phone_number,
                'is_phone_locked' => (bool) ($user?->is_phone_locked ?? false),
                'birth_date' => $user?->birth_date?->toDateString(),
            ],
            'item_details' => [
                'movie_id' => (int) ($movie?->id ?? $t->movie_id),
                'movie_title' => $itemTitle,
                'duration_minutes' => $durationMinutes,
                'poster_url' => $movie?->poster_url ?? ($snapshot['poster_url'] ?? null),
                'access_status' => $access?->access_status ?? ($t->payment_status === 'paid' ? 'active' : 'inactive'),
                'rental_start_at' => $access?->rental_start_at?->toISOString(),
                'rental_expires_at' => $access?->rental_expires_at?->toISOString(),
            ],
            'financials' => [
                'gross_amount' => $gross,
                'discount_amount' => $discount,
                'net_amount' => $net,
                'formatted_gross_amount' => $this->formatRupiah($gross),
                'formatted_discount_amount' => $this->formatRupiah($discount),
                'formatted_net_amount' => $this->formatRupiah($net),
                'voucher' => $voucher ? [
                    'id' => (int) $voucher->id,
                    'code' => (string) $voucher->code,
                    'discount_type' => (string) $voucher->discount_type,
                    'discount_value' => (float) $voucher->discount_value,
                ] : null,
            ],
            'audit_logs' => [
                'payment_gateway' => 'midtrans',
                'payment_type' => $t->payment_type,
                'snap_token' => $t->snap_token,
                'checkin_history' => [],
            ],
        ];
    }
}
