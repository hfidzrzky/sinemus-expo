<?php

namespace App\Http\Resources\Admin\V1\Presale;

use App\Models\EventTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * @property-read EventTransaction $resource
 */
class CinemaTicketInjectionResource extends JsonResource
{
    /**
     * Disable default wrapping.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array matching contracts/admin.contract.json injectCinemaTicket.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $qrImageUrl = null;
        if (! empty($this->resource->cinema_qr_image_path)) {
            $path = $this->resource->cinema_qr_image_path;
            if (Str::startsWith($path, ['http://', 'https://'])) {
                $qrImageUrl = $path;
            } elseif (Storage::disk('public')->exists($path)) {
                $qrImageUrl = Storage::disk('public')->url($path);
            } elseif (! empty(config('filesystems.disks.r2.url'))) {
                $qrImageUrl = rtrim((string) config('filesystems.disks.r2.url'), '/').'/'.ltrim($path, '/');
            } else {
                $qrImageUrl = Storage::url($path);
            }
        }

        return [
            'order_id' => (string) $this->resource->order_id,
            'fulfillment_status' => (string) $this->resource->fulfillment_status,
            'cinema_booking_code' => (string) $this->resource->cinema_booking_code,
            'cinema_passcode' => (string) $this->resource->cinema_passcode,
            'qr_image_url' => $qrImageUrl,
            'notes' => $this->resource->cinema_ticket_notes,
            'fulfilled_at' => $this->resource->fulfilled_at?->toISOString() ?? now()->toISOString(),
        ];
    }
}
