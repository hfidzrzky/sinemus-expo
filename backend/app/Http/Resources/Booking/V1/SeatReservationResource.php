<?php

namespace App\Http\Resources\Booking\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SeatReservationResource extends JsonResource
{
    /**
     * Transform the resource into an array matching contracts/checkout.contract.json.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'order_id' => (string) $this->resource['order_id'],
            'snap_token' => (string) $this->resource['snap_token'],
            'event_title' => (string) $this->resource['event_title'],
            'locked_seats' => (array) $this->resource['locked_seats'],
            'gross_amount' => (float) $this->resource['gross_amount'],
            'service_fee' => (float) ($this->resource['service_fee'] ?? 0),
            'discount_amount' => (float) $this->resource['discount_amount'],
            'net_amount' => (float) $this->resource['net_amount'],
            'expires_at' => (string) $this->resource['expires_at'],
        ];
    }
}
