<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Voucher extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'promo_type',
        'name',
        'discount_type',
        'discount_value',
        'min_purchase',
        'max_discount',
        'item_type',
        'event_id',
        'movie_id',
        'quota_total',
        'quota_used',
        'max_uses_per_user',
        'valid_from',
        'valid_until',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'min_purchase' => 'decimal:2',
            'max_discount' => 'decimal:2',
            'quota_total' => 'integer',
            'quota_used' => 'integer',
            'max_uses_per_user' => 'integer',
            'valid_from' => 'datetime',
            'valid_until' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        $now = now();

        return $query->where('is_active', true)
            ->where('valid_from', '<=', $now)
            ->where('valid_until', '>=', $now)
            ->whereColumn('quota_used', '<', 'quota_total');
    }

    public function scopeDirectDiscounts(Builder $query): Builder
    {
        return $query->where('promo_type', 'direct_discount');
    }

    public function scopeVoucherCodes(Builder $query): Builder
    {
        return $query->where('promo_type', 'voucher_code');
    }

    /**
     * Memeriksa apakah voucher valid untuk total belanja, tipe item, dan target item tertentu.
     */
    public function isValidFor(float $amount, string $itemType, ?int $targetId = null): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $now = now();
        if ($this->valid_from > $now || $this->valid_until < $now) {
            return false;
        }

        if ($this->quota_used >= $this->quota_total) {
            return false;
        }

        if ($this->item_type !== 'all' && $this->item_type !== $itemType) {
            return false;
        }

        if ($this->event_id !== null && ($itemType !== 'ticket' || $targetId !== (int) $this->event_id)) {
            return false;
        }

        if ($this->movie_id !== null && ($itemType !== 'movie_rental' || $targetId !== (int) $this->movie_id)) {
            return false;
        }

        if ($amount < (float) $this->min_purchase) {
            return false;
        }

        return true;
    }

    /**
     * Menghitung besaran diskon berdasarkan nominal belanja.
     */
    public function calculateDiscount(float $amount): float
    {
        if ($this->discount_type === 'percentage') {
            $calculated = ($amount * (float) $this->discount_value) / 100.0;
            if ($this->max_discount !== null && $calculated > (float) $this->max_discount) {
                return (float) $this->max_discount;
            }

            return round($calculated, 2);
        }

        if ($this->discount_type === 'slashed_price') {
            $cut = (float) $this->discount_value;

            return round(min($cut, $amount), 2);
        }

        // Fixed discount
        $fixed = (float) $this->discount_value;

        return min($fixed, $amount);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function movie(): BelongsTo
    {
        return $this->belongsTo(Movie::class);
    }

    public function eventTransactions(): HasMany
    {
        return $this->hasMany(EventTransaction::class);
    }

    public function movieTransactions(): HasMany
    {
        return $this->hasMany(MovieTransaction::class);
    }
}
