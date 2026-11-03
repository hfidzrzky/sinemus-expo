<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserMovieAccess extends Model
{
    use HasFactory;

    protected $table = 'user_movie_access';

    protected $fillable = [
        'user_id',
        'movie_id',
        'transaction_id',
        'access_status',
        'rental_start_at',
        'rental_expires_at',
        'revoked_at',
        'revoke_reason',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'rental_start_at' => 'datetime',
            'rental_expires_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('access_status', 'active')
            ->where('rental_expires_at', '>', now());
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function movie(): BelongsTo
    {
        return $this->belongsTo(Movie::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(MovieTransaction::class, 'transaction_id');
    }
}
