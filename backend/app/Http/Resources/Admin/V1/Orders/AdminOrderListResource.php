<?php

namespace App\Http\Resources\Admin\V1\Orders;

use App\Models\EventTransaction;
use App\Models\MovieTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminOrderListResource extends JsonResource
{
    /**
     * Transform the resource into an array matching contracts/admin.contract.json (AdminOrderItem).
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $orderId = (string) ($this->order_id ?? '');

        // Tentukan tipe pesanan jika belum ada di atribut
        $orderType = $this->order_type ?? (str_starts_with($orderId, 'SNM-VOD') ? 'movie_rental' : 'ticket');

        // Resolusi identitas pembeli
        $userEmail = (string) ($this->user_email ?? ($this->user?->email ?? '-'));
        $userName = (string) ($this->user_name ?? ($this->user?->name ?? 'Guest'));
        $userPhone = $this->user_phone ?? ($this->user?->phone_number ?? null);

        // Resolusi snapshot data jika ada
        $snapshot = [];
        if (! empty($this->snapshot_event_data)) {
            $snapshot = is_string($this->snapshot_event_data)
                ? (json_decode($this->snapshot_event_data, true) ?: [])
                : (array) $this->snapshot_event_data;
        }

        // Resolusi nama judul item transaksi
        $itemTitle = (string) ($this->item_title ?? '');
        if (empty($itemTitle) || $itemTitle === 'Tiket Bioskop' || $itemTitle === 'Sewa Film VoD') {
            if ($this->resource instanceof EventTransaction) {
                $itemTitle = $this->schedule?->event?->title ?? ($this->snapshot_event_data['event_title'] ?? ($this->snapshot_event_data['title'] ?? ($itemTitle ?: 'Tiket Bioskop')));
            } elseif ($this->resource instanceof MovieTransaction) {
                $itemTitle = $this->movie?->title ?? ($this->snapshot_movie_data['title'] ?? ($itemTitle ?: 'Sewa Film VoD'));
            } else {
                $itemTitle = $snapshot['event_title'] ?? ($snapshot['title'] ?? ($itemTitle ?: ($orderType === 'ticket' ? 'Tiket Bioskop' : 'Sewa Film VoD')));
            }
        }

        // Resolusi nama venue bioskop
        $venueName = $this->venue_name ?? $this->event_venue_name ?? ($snapshot['venue_name'] ?? ($this->schedule?->event?->venue_name ?? null));

        // Resolusi kursi yang dipesan
        $seatCodes = null;
        if (! empty($this->seat_codes)) {
            $seatCodes = is_string($this->seat_codes) ? json_decode($this->seat_codes, true) : (array) $this->seat_codes;
        } elseif (! empty($this->snapshot_seats)) {
            $seatCodes = is_string($this->snapshot_seats) ? json_decode($this->snapshot_seats, true) : (array) $this->snapshot_seats;
        }

        // Normalisasi format seat codes agar selalu array string ['A1', 'B2']
        if (is_array($seatCodes)) {
            $seatCodes = array_values(array_filter(array_map(function ($s) {
                if (is_array($s) && isset($s['seat_code'])) {
                    return (string) $s['seat_code'];
                }
                if (is_object($s) && isset($s->seat_code)) {
                    return (string) $s->seat_code;
                }

                return is_scalar($s) ? (string) $s : '';
            }, $seatCodes)));
        }

        // Resolusi tanggal
        $paidAt = null;
        if (! empty($this->paid_at)) {
            $paidAt = $this->paid_at instanceof Carbon
                ? $this->paid_at->toISOString()
                : Carbon::parse($this->paid_at)->toISOString();
        }

        $createdAt = now()->toISOString();
        if (! empty($this->created_at)) {
            $createdAt = $this->created_at instanceof Carbon
                ? $this->created_at->toISOString()
                : Carbon::parse($this->created_at)->toISOString();
        }

        return [
            'order_id' => $orderId,
            'order_type' => (string) $orderType,
            'user_email' => $userEmail,
            'user_name' => $userName,
            'user_phone' => $userPhone,
            'item_title' => $itemTitle,
            'venue_name' => $venueName,
            'seat_codes' => $seatCodes,
            'gross_amount' => (float) $this->gross_amount,
            'discount_amount' => (float) $this->discount_amount,
            'net_amount' => (float) $this->net_amount,
            'payment_status' => (string) $this->payment_status,
            'payment_type' => $this->payment_type ?? null,
            'fulfillment_status' => $this->fulfillment_status ?? null,
            'paid_at' => $paidAt,
            'created_at' => $createdAt,
        ];
    }
}
