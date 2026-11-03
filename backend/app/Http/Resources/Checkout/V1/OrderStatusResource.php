<?php

namespace App\Http\Resources\Checkout\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderStatusResource extends JsonResource
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
            'item_type' => (string) $this->resource['item_type'],
            'status' => (string) $this->resource['status'],
            'payment_type' => $this->resource['payment_type'],
            'paid_at' => $this->resource['paid_at'],
        ];
    }
}
