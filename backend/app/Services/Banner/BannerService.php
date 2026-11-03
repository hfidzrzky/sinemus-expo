<?php

namespace App\Services\Banner;

use App\Models\Banner;
use Illuminate\Database\Eloquent\Collection;

class BannerService
{
    /**
     * Mengambil daftar seluruh banner aktif yang sedang dalam periode tayang.
     * Menggunakan eager loading terbatas untuk relasi movie & event guna mencegah N+1 query.
     *
     * @return Collection<int, Banner>
     */
    public function getActiveBanners(): Collection
    {
        return Banner::query()
            ->active()
            ->with([
                'movie:id,slug,title,synopsis,age_rating,genre,release_year,duration_minutes',
                'event:id,slug,title,synopsis_short,age_rating,genre,release_year,duration_minutes,cinema_partner',
            ])
            ->get();
    }
}
