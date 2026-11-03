<?php

namespace App\Http\Resources\Events\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScheduleSeatMapResource extends JsonResource
{
    /**
     * Disable default data wrapping when resource is transformed.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array matching contracts/events.contract.json.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = is_array($this->resource) ? $this->resource : (array) $this->resource;

        return [
            'schedule_id' => (int) ($data['schedule_id'] ?? 0),
            'rows' => (array) ($data['rows'] ?? []),
            'cols' => (int) ($data['cols'] ?? 0),
            'ticket_price' => (float) ($data['ticket_price'] ?? 0),
            'formatted_ticket_price' => 'Rp '.number_format((float) ($data['ticket_price'] ?? 0), 0, ',', '.'),
            'vip_ticket_price' => isset($data['vip_ticket_price']) && $data['vip_ticket_price'] !== null ? (float) $data['vip_ticket_price'] : null,
            'formatted_vip_ticket_price' => isset($data['vip_ticket_price']) && $data['vip_ticket_price'] !== null ? 'Rp '.number_format((float) $data['vip_ticket_price'], 0, ',', '.') : null,
            'seats' => (array) ($data['seats'] ?? []),
        ];
    }
}
