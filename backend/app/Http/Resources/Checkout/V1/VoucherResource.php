<?php

namespace App\Http\Resources\Checkout\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VoucherResource extends JsonResource
{
    /**
     * Transform the resource into an array matching contracts/checkout.contract.json.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'code' => (string) $this->resource['code'],
            'discount_amount' => (float) $this->resource['discount_amount'],
            'net_amount' => (float) $this->resource['net_amount'],
            'description' => (string) $this->resource['description'],
        ];
    }
}
