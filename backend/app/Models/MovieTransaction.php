<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property string $order_id
 * @property int $user_id
 * @property int $movie_id
 * @property int|null $voucher_id
 * @property float|string $gross_amount
 * @property float|string $discount_amount
 * @property float|string $net_amount
 * @property string|null $snap_token
 * @property string $payment_status
 * @property string|null $payment_type
 * @property Carbon|null $paid_at
 * @property array|null $snapshot_movie_data
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read Movie $movie
 * @property-read Voucher|null $voucher
 * @property-read UserMovieAccess|null $movieAccess
 *
 * @method static Builder|MovieTransaction pendingExpired(int $toleranceMinutes = 15)
 * @method static Builder|MovieTransaction query()
 */
class MovieTransaction extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_PAID = 'paid';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_FAILED = 'failed';

    public const STATUS_CANCELLED = 'cancelled';

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
        return $this->belongsTo(Voucher::class)->withTrashed();
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
    public function scopePendingExpired(Builder $query, int $toleranceMinutes = 15): Builder
    {
        return $query->where('payment_status', self::STATUS_PENDING)
            ->where('created_at', '<=', now()->subMinutes($toleranceMinutes));
    }
}
