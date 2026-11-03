<?php

namespace App\Models;

use App\Services\Cloudflare\CloudflareImageService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Movie extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'title',
        'synopsis',
        'poster_path',
        'backdrop_path',
        'director',
        'cast',
        'genre',
        'age_rating',
        'access_model',
        'duration_minutes',
        'price',
        'rental_duration_hours',
        'cloudflare_trailer_uid',
        'cloudflare_video_uid',
        'look_films',
        'is_featured',
        'release_year',
        'is_published',
        'scheduled_publish_at',
        'scheduled_unpublish_at',
    ];

    protected function casts(): array
    {
        return [
            'cast' => 'array',
            'look_films' => 'array',
            'duration_minutes' => 'integer',
            'price' => 'decimal:2',
            'rental_duration_hours' => 'integer',
            'is_featured' => 'boolean',
            'is_published' => 'boolean',
            'scheduled_publish_at' => 'datetime',
            'scheduled_unpublish_at' => 'datetime',
        ];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    public function banners(): HasMany
    {
        return $this->hasMany(Banner::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(MovieTransaction::class);
    }

    public function userAccess(): HasMany
    {
        return $this->hasMany(UserMovieAccess::class);
    }

    /**
     * Resolusi URL poster film via Cloudflare Images (SSOT).
     */
    protected function posterUrl(): Attribute
    {
        return Attribute::make(
            get: fn (): string => app(CloudflareImageService::class)->resolveDeliveryUrl($this->poster_path)
        );
    }

    /**
     * Resolusi URL backdrop banner film via Cloudflare Images (SSOT).
     */
    protected function backdropUrl(): Attribute
    {
        return Attribute::make(
            get: fn (): string => app(CloudflareImageService::class)->resolveDeliveryUrl($this->backdrop_path)
        );
    }

    /**
     * Resolusi sinopsis ringkas untuk card dan spotlight banner (maks 120 karakter).
     */
    protected function synopsisShort(): Attribute
    {
        return Attribute::make(
            get: fn (): string => Str::limit((string) $this->synopsis, 120)
        );
    }
}
