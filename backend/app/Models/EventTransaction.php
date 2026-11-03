<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $order_id
 * @property int $user_id
 * @property int $schedule_id
 * @property int|null $voucher_id
 * @property int $ticket_quantity
 * @property float|string $gross_amount
 * @property float|string $discount_amount
 * @property float|string $net_amount
 * @property string $snap_token
 * @property string $payment_status
 * @property string|null $payment_type
 * @property Carbon|null $paid_at
 * @property string|null $ticket_code
 * @property string|null $qr_hash
 * @property string $checkin_status
 * @property Carbon|null $checkin_at
 * @property string $fulfillment_status
 * @property string|null $cinema_booking_code
 * @property string|null $cinema_passcode
 * @property string|null $cinema_qr_image_path
 * @property string|null $cinema_ticket_notes
 * @property Carbon|null $fulfilled_at
 * @property int|null $fulfilled_by_admin_id
 * @property array|null $snapshot_event_data
 * @property array|null $snapshot_seats
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Voucher|null $voucher
 * @property Schedule|null $schedule
 * @property User|null $user
 */
class EventTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'user_id',
        'schedule_id',
        'voucher_id',
        'ticket_quantity',
        'gross_amount',
        'discount_amount',
        'net_amount',
        'snap_token',
        'payment_status',
        'payment_type',
        'paid_at',
        'ticket_code',
        'qr_hash',
        'checkin_status',
        'checkin_at',
        'fulfillment_status',
        'cinema_booking_code',
        'cinema_passcode',
        'cinema_qr_image_path',
        'cinema_ticket_notes',
        'fulfilled_at',
        'fulfilled_by_admin_id',
        'snapshot_event_data',
        'snapshot_seats',
    ];

    protected function casts(): array
    {
        return [
            'ticket_quantity' => 'integer',
            'gross_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'checkin_at' => 'datetime',
            'fulfilled_at' => 'datetime',
            'snapshot_event_data' => 'array',
            'snapshot_seats' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }

    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    public function fulfilledByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fulfilled_by_admin_id');
    }

    public function checkins(): HasMany
    {
        return $this->hasMany(TicketCheckin::class, 'transaction_id');
    }
}
