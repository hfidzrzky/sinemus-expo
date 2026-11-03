<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'event_type',
        'seating_type',
        'presale_start_at',
        'presale_end_at',
        'event_concludes_at',
        'title',
        'description',
        'synopsis_short',
        'poster_path',
        'backdrop_path',
        'director',
        'cast',
        'genre',
        'duration_minutes',
        'release_year',
        'age_rating',
        'cloudflare_teaser_uid',
        'venue_name',
        'cinema_partner',
        'venue_address',
        'city',
        'target_screening_month',
        'is_active',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'presale_start_at' => 'datetime',
            'presale_end_at' => 'datetime',
            'event_concludes_at' => 'datetime',
            'cast' => 'array',
            'genre' => 'array',
            'duration_minutes' => 'integer',
            'release_year' => 'integer',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope untuk event yang masa penayangannya belum berakhir (belum draf).
     */
    public function scopeNotConcluded(Builder $query): Builder
    {
        return $query->where(function (Builder $subQuery) {
            $subQuery->whereNull('event_concludes_at')
                ->orWhere('event_concludes_at', '>', now());
        });
    }

    /**
     * Scope untuk event yang jendela penjualannya sedang aktif.
     */
    public function scopeSalesOpen(Builder $query): Builder
    {
        $now = now();

        return $query->where('is_active', true)
            ->where(function (Builder $subQuery) use ($now) {
                $subQuery->whereNull('presale_start_at')
                    ->orWhere('presale_start_at', '<=', $now);
            })
            ->where(function (Builder $subQuery) use ($now) {
                $subQuery->whereNull('presale_end_at')
                    ->orWhere('presale_end_at', '>=', $now);
            });
    }

    /**
     * Alias semantik sales_start_at -> presale_start_at (Opsi A)
     */
    protected function salesStartAt(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->presale_start_at,
            set: fn ($value) => ['presale_start_at' => $value]
        );
    }

    /**
     * Alias semantik sales_end_at -> presale_end_at (Opsi A)
     */
    protected function salesEndAt(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->presale_end_at,
            set: fn ($value) => ['presale_end_at' => $value]
        );
    }

    /**
     * Hitung waktu penayangan selesai efektif (menggunakan event_concludes_at atau kalkulasi dari jadwal terakhir).
     */
    public function getEffectiveConcludesAt(): ?Carbon
    {
        if ($this->event_concludes_at) {
            return $this->event_concludes_at;
        }

        $latestSchedule = $this->schedules->sortByDesc('show_time')->first();
        if (! $latestSchedule || ! $latestSchedule->show_time) {
            return $this->presale_end_at;
        }

        $duration = (int) ($this->duration_minutes ?: 120);

        return $latestSchedule->show_time->copy()->addMinutes($duration + 30);
    }

    /**
     * Mengetahui apakah penjualan tiket sedang buka.
     */
    public function isSalesOpen(): bool
    {
        $now = now();
        if ($this->presale_start_at && $now->lt($this->presale_start_at)) {
            return false;
        }
        if ($this->presale_end_at && $now->gt($this->presale_end_at)) {
            return false;
        }

        return (bool) $this->is_active;
    }

    /**
     * Mengetahui apakah seluruh penayangan event sudah selesai.
     */
    public function isConcluded(): bool
    {
        $concludesAt = $this->getEffectiveConcludesAt();
        if (! $concludesAt) {
            return false;
        }

        return now()->gt($concludesAt);
    }

    public function scopeCity(Builder $query, ?string $city): Builder
    {
        if (empty($city)) {
            return $query;
        }

        return $query->where(function (Builder $subQuery) use ($city) {
            $subQuery->where('city', $city)
                ->orWhereHas('venues', fn (Builder $venueQuery) => $venueQuery->where('city', $city));
        });
    }

    public function venues(): HasMany
    {
        return $this->hasMany(EventVenue::class, 'event_id');
    }

    /**
     * Resolusi URL poster event (Full URI, Cloudflare R2, atau Storage disk).
     */
    protected function posterUrl(): Attribute
    {
        return Attribute::make(
            get: function (): string {
                if (empty($this->poster_path)) {
                    return '';
                }

                if (Str::startsWith($this->poster_path, ['http://', 'https://'])) {
                    return $this->poster_path;
                }

                $r2Url = config('filesystems.disks.r2.url');
                if (! empty($r2Url)) {
                    return rtrim((string) $r2Url, '/').'/'.ltrim($this->poster_path, '/');
                }

                return Storage::url($this->poster_path);
            }
        );
    }

    /**
     * Resolusi URL backdrop event (Full URI, Cloudflare R2, atau Storage disk).
     */
    protected function backdropUrl(): Attribute
    {
        return Attribute::make(
            get: function (): string {
                if (empty($this->backdrop_path)) {
                    return '';
                }

                if (Str::startsWith($this->backdrop_path, ['http://', 'https://'])) {
                    return $this->backdrop_path;
                }

                $r2Url = config('filesystems.disks.r2.url');
                if (! empty($r2Url)) {
                    return rtrim((string) $r2Url, '/').'/'.ltrim($this->backdrop_path, '/');
                }

                return Storage::url($this->backdrop_path);
            }
        );
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    public function eventTransactions(): HasManyThrough
    {
        return $this->hasManyThrough(EventTransaction::class, Schedule::class, 'event_id', 'schedule_id');
    }

    public function seatLocks(): HasManyThrough
    {
        return $this->hasManyThrough(SeatLock::class, Schedule::class, 'event_id', 'schedule_id');
    }

    public function banners(): HasMany
    {
        return $this->hasMany(Banner::class);
    }

    protected function venueName(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value): string => $value ?: ($this->venues->first()?->venue_name ?? '')
        );
    }

    protected function cinemaPartner(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value): ?string => $value ?: ($this->venues->first()?->cinema_partner ?? null)
        );
    }

    protected function venueAddress(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value): string => $value ?: ($this->venues->first()?->venue_address ?? '')
        );
    }

    protected function city(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value): string => $value ?: ($this->venues->first()?->city ?? '')
        );
    }
}
