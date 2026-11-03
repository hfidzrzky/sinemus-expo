<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Seat extends Model
{
    use HasFactory;

    protected $fillable = [
        'schedule_id',
        'row_label',
        'grid_column',
        'seat_number',
        'seat_code',
        'seat_type',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'grid_column' => 'integer',
            'seat_number' => 'integer',
        ];
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }

    public function seatLock(): HasOne
    {
        return $this->hasOne(SeatLock::class);
    }
}
