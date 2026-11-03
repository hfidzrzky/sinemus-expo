<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MovieTransaction extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_PAID = 'paid';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'order_id',
        'user_id',
        'movie_id',
        'voucher_id',
        'gross_amount',
        'discount_amount',
        'net_amount',
        'snap_token',
        'payment_status',
        'payment_type',
        'paid_at',
        'snapshot_movie_data',
    ];

    protected function casts(): array
    {
        return [
            'gross_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'snapshot_movie_data' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function movie(): BelongsTo
    {
        return $this->belongsTo(Movie::class);
    }

    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    public function movieAccess(): HasOne
    {
        return $this->hasOne(UserMovieAccess::class, 'transaction_id');
    }

    /**
     * Memeriksa apakah transaksi pending telah kedaluwarsa melampaui batas toleransi (SSOT).
     */
    public function isPendingExpired(int $toleranceMinutes = 15): bool
    {
        return $this->payment_status === self::STATUS_PENDING
            && $this->created_at !== null
            && $this->created_at->lte(now()->subMinutes($toleranceMinutes));
    }

    /**
     * Scope query untuk transaksi pending yang telah melewati batas kedaluwarsa (DRY).
     */
    public function scopePendingExpired($query, int $toleranceMinutes = 15)
    {
        return $query->where('payment_status', self::STATUS_PENDING)
            ->where('created_at', '<=', now()->subMinutes($toleranceMinutes));
    }
}
