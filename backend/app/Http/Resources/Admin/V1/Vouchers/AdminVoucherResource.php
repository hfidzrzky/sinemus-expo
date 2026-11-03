<?php

namespace App\Http\Resources\Admin\V1\Vouchers;

use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Voucher
 */
class AdminVoucherResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $now = now();
        $isExpired = $this->valid_until < $now;
        $isExhausted = $this->quota_used >= $this->quota_total;
        $remainingQuota = max(0, $this->quota_total - $this->quota_used);
        $usagePercentage = $this->quota_total > 0
            ? round(($this->quota_used / $this->quota_total) * 100, 2)
            : 0.0;

        // Label status deskriptif
        $statusLabel = 'active';
        if (! $this->is_active) {
            $statusLabel = 'inactive';
        } elseif ($isExpired) {
            $statusLabel = 'expired';
        } elseif ($isExhausted) {
            $statusLabel = 'exhausted';
        }

        // Format potongan harga
        $formattedDiscount = match ($this->discount_type) {
            'percentage' => ((int) $this->discount_value == $this->discount_value
                ? (int) $this->discount_value.'%'
                : number_format((float) $this->discount_value, 2).'%'),
            'slashed_price' => 'Coret: Rp '.number_format((float) $this->discount_value, 0, ',', '.'),
            default => 'Rp '.number_format((float) $this->discount_value, 0, ',', '.'),
        };

        $formattedMinPurchase = 'Rp '.number_format((float) $this->min_purchase, 0, ',', '.');
        $formattedMaxDiscount = $this->max_discount !== null
            ? 'Rp '.number_format((float) $this->max_discount, 0, ',', '.')
            : null;

        $itemTypeLabels = [
            'all' => 'Semua Item (Tiket & VoD)',
            'ticket' => 'Tiket Bioskop',
            'movie_rental' => 'Sewa Film VoD',
        ];

        return [
            'id' => $this->id,
            'code' => $this->code,
            'promo_type' => $this->promo_type ?? 'voucher_code',
            'name' => $this->name,
            'max_uses_per_user' => $this->max_uses_per_user,
            'discount_type' => $this->discount_type,
            'discount_value' => (float) $this->discount_value,
            'formatted_discount' => $formattedDiscount,
            'min_purchase' => (float) $this->min_purchase,
            'formatted_min_purchase' => $formattedMinPurchase,
            'max_discount' => $this->max_discount !== null ? (float) $this->max_discount : null,
            'formatted_max_discount' => $this->max_discount !== null
                ? 'Rp '.number_format((float) $this->max_discount, 0, ',', '.')
                : null,
            'item_type' => $this->item_type,
            'item_type_label' => $itemTypeLabels[$this->item_type] ?? $this->item_type,
            'event_id' => $this->event_id !== null ? (int) $this->event_id : null,
            'event_title' => $this->event?->title,
            'movie_id' => $this->movie_id !== null ? (int) $this->movie_id : null,
            'movie_title' => $this->movie?->title,
            'scope_type' => $this->event_id !== null ? 'event' : ($this->movie_id !== null ? 'movie' : ($this->item_type === 'ticket' ? 'tickets_only' : ($this->item_type === 'movie_rental' ? 'vod_only' : 'all'))),
            // Field aslinya
            'quota_total' => $this->quota_total,
            'quota_used' => $this->quota_used,
            'quota_remaining' => $remainingQuota,
            'usage_percentage' => $usagePercentage,
            'valid_from' => $this->valid_from->toIso8601String(),
            'valid_until' => $this->valid_until->toIso8601String(),
            'is_active' => (bool) $this->is_active,
            'is_expired' => $isExpired,
            'is_exhausted' => $isExhausted,
            'status' => $statusLabel,

            // Aliases untuk kompatibilitas frontend interface
            'quota' => $this->quota_total,
            'used_quota' => $this->quota_used,
            'min_transaction_amount' => (float) $this->min_purchase,
            'max_discount_amount' => $this->max_discount !== null ? (float) $this->max_discount : null,
            'target_item' => match ($this->item_type) {
                'ticket' => 'tickets_only',
                'movie_rental' => 'vod_only',
                default => 'all',
            },

            'transactions_count' => $this->whenCounted('eventTransactions', function () {
                return $this->event_transactions_count + ($this->movie_transactions_count ?? 0);
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
