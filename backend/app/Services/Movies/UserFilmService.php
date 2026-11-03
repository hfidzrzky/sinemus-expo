<?php

namespace App\Services\Movies;

use App\Models\User;
use App\Models\UserMovieAccess;
use Illuminate\Database\Eloquent\Collection;

class UserFilmService
{
    /**
     * Mengambil daftar sewa film aktif milik pengguna terautentikasi (Anti-IDOR).
     *
     * @return Collection<int, UserMovieAccess>
     */
    public function getActiveFilms(User $user): Collection
    {
        return UserMovieAccess::with('movie')
            ->where('user_id', $user->id)
            ->where('access_status', 'active')
            ->where('rental_expires_at', '>', now())
            ->orderByDesc('rental_expires_at')
            ->get();
    }
}
