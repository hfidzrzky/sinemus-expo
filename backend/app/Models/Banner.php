<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Banner extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'subtitle',
        'badge_text',
        'age_rating',
        'genre',
        'release_year',
        'duration_minutes',
        'image_path',
        'display_mode',
        'link_type',
        'movie_id',
        'event_id',
        'target_url',
        'button_text',
        'order_priority',
        'is_active',
        'start_at',
        'end_at',
    ];

    protected function casts(): array
    {
        return [
            'release_year' => 'integer',
            'duration_minutes' => 'integer',
            'is_active' => 'boolean',
            'order_priority' => 'integer',
            'start_at' => 'datetime',
            'end_at' => 'datetime',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        $now = now();

        return $query->where('is_active', true)
            ->where(function (Builder $q) use ($now) {
                $q->whereNull('start_at')->orWhere('start_at', '<=', $now);
            })
            ->where(function (Builder $q) use ($now) {
                $q->whereNull('end_at')->orWhere('end_at', '>=', $now);
            })
            ->orderBy('order_priority', 'asc');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function movie(): BelongsTo
    {
        return $this->belongsTo(Movie::class);
    }

    /**
     * Resolusi URL gambar banner (Full URI, Cloudflare R2, atau Storage disk).
     */
    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: function (): string {
                if (empty($this->image_path)) {
                    return '';
                }

                if (Str::startsWith($this->image_path, ['http://', 'https://'])) {
                    return $this->image_path;
                }

                $r2Url = config('filesystems.disks.r2.url');
                if (! empty($r2Url)) {
                    return rtrim((string) $r2Url, '/').'/'.ltrim($this->image_path, '/');
                }

                return Storage::url($this->image_path);
            }
        );
    }

    /**
     * Memastikan button_text selalu terisi default 'Lihat Detail' jika null atau kosong.
     */
    protected function buttonText(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value) => empty($value) ? 'Lihat Detail' : $value,
        );
    }
}
