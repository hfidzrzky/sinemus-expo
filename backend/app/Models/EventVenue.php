<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventVenue extends Model
{
    use HasFactory;

    protected $table = 'event_venues';

    protected $fillable = [
        'event_id',
        'venue_name',
        'cinema_partner',
        'venue_address',
        'city',
        'google_maps_url',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class, 'event_venue_id');
    }

    public function scopeCity(Builder $query, ?string $city): Builder
    {
        if (empty($city)) {
            return $query;
        }

        return $query->where('city', $city);
    }
}
