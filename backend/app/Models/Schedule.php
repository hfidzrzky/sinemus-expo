<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'event_venue_id',
        'studio_name',
        'show_time',
        'ticket_price',
        'vip_ticket_price',
        'total_seats',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'event_venue_id' => 'integer',
            'show_time' => 'datetime',
            'ticket_price' => 'decimal:2',
            'vip_ticket_price' => 'decimal:2',
            'total_seats' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function venue(): BelongsTo
    {
        return $this->belongsTo(EventVenue::class, 'event_venue_id');
    }

    public function seats(): HasMany
    {
        return $this->hasMany(Seat::class);
    }

    public function seatLocks(): HasMany
    {
        return $this->hasMany(SeatLock::class);
    }

    public function eventTransactions(): HasMany
    {
        return $this->hasMany(EventTransaction::class);
    }
}
