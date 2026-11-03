<?php

namespace App\Http\Resources\Admin\V1\Presale;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SmartIngestPreviewResource extends JsonResource
{
    /**
     * Disable default wrapping.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array matching contracts/admin.contract.json previewSmartCinemaTicketsIngest.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'total_detected' => (int) ($this->resource['total_detected'] ?? 0),
            'matched_count' => (int) ($this->resource['matched_count'] ?? 0),
            'unmatched_count' => (int) ($this->resource['unmatched_count'] ?? 0),
            'matched_items' => (array) ($this->resource['matched_items'] ?? []),
            'unmatched_items' => (array) ($this->resource['unmatched_items'] ?? []),
        ];
    }
}
