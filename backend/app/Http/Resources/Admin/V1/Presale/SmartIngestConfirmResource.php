<?php

namespace App\Http\Resources\Admin\V1\Presale;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SmartIngestConfirmResource extends JsonResource
{
    /**
     * Disable default wrapping.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array matching contracts/admin.contract.json confirmSmartCinemaTicketsFulfillment.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'fulfilled_count' => (int) ($this->resource['fulfilled_count'] ?? 0),
            'dispatched_notifications_count' => (int) ($this->resource['dispatched_notifications_count'] ?? 0),
        ];
    }
}
