<?php

namespace App\Services\Movies;

use App\Exceptions\Movies\MovieNotFoundException;
use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\User;
use App\Models\UserMovieAccess;
use App\Services\Checkout\OrderStatusService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;

class MovieCatalogService
{
    /**
     * Mengambil daftar film aktif/terpublikasi untuk katalog penonton.
     * Dilengkapi filter genre, pencarian judul/sutradara, filter unggulan, dan paginasi standar.
     */
    public function getActiveMovies(
        ?string $genre = null,
        ?string $search = null,
        ?bool $featured = null,
        int $perPage = 12
    ): LengthAwarePaginator {
        $query = Movie::query()->published();

        // 1. Filter Genre
        $cleanGenre = trim((string) $genre);
        if ($cleanGenre !== '') {
            $escapedGenre = addcslashes($cleanGenre, '%_\\');
            $query->where('genre', 'like', "%{$escapedGenre}%");
        }

        // 2. Filter Pencarian Judul atau Sutradara (Sanitized)
        $cleanSearch = trim((string) $search);
        if ($cleanSearch !== '') {
            $escapedSearch = addcslashes($cleanSearch, '%_\\');
            $searchPattern = "%{$escapedSearch}%";

            $query->where(function ($subQuery) use ($searchPattern) {
                $subQuery->where('title', 'like', $searchPattern)
                    ->orWhere('director', 'like', $searchPattern);
            });
        }

        // 3. Filter Featured Movies
        if ($featured !== null) {
            $query->where('is_featured', $featured);
        }

        // 4. Urutkan: Film Unggulan terlebih dahulu, lalu rilis terbaru
        return $query->orderByDesc('is_featured')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    /**
     * Mengambil detail satu film berdasarkan slug atau ID numerik.
     * Mengevaluasi status hak sewa (access_status: 'locked' | 'active' | 'expired')
     * berdasarkan identitas penonton yang terotentikasi.
     *
     * @throws MovieNotFoundException
     */
    public function getMovieBySlugOrId(string|int $identifier, ?User $user = null): Movie
    {
        $query = Movie::query();
        $isSuperAdmin = $user && $user->role === 'super_admin';

        // Hanya Super Admin yang diizinkan pratinjau film belum terbit
        if (! $isSuperAdmin) {
            $query->published();
        }

        /** @var Movie|null $movie */
        $movie = is_numeric($identifier)
            ? $query->where('id', (int) $identifier)->first()
            : $query->where('slug', (string) $identifier)->first();

        if (! $movie) {
            throw new MovieNotFoundException;
        }

        // 1. Film dengan model akses gratis (Free) selalu berstatus aktif
        if ($movie->access_model === 'free') {
            $movie->access_status = 'active';
            $movie->rental_expires_at = null;

            return $movie;
        }

        // 2. Penonton yang belum login (tamu) selalu terkunci
        if (! $user) {
            $movie->access_status = 'locked';
            $movie->rental_expires_at = null;

            return $movie;
        }

        // 3. Pratinjau Film Draft (Hanya untuk film belum terbit oleh Super Admin)
        if (! $movie->is_published && $isSuperAdmin) {
            $movie->access_status = 'active';
            $movie->rental_expires_at = now()->addHour();

            return $movie;
        }

        // 4. Evaluasi hak akses sewa pengguna terautentikasi (Anti-IDOR & Prioritas Akses Aktif)
        /** @var UserMovieAccess|null $access */
        $access = UserMovieAccess::where('user_id', $user->id)
            ->where('movie_id', $movie->id)
            ->where('access_status', 'active')
            ->where('rental_expires_at', '>', now())
            ->latest('rental_expires_at')
            ->first();

        // 5. Self-Healing Recovery: Jika belum ada akses aktif, periksa transaksi sewa pending terbaru
        if (! $access) {
            $pendingTrx = MovieTransaction::where('user_id', $user->id)
                ->where('movie_id', $movie->id)
                ->where('payment_status', 'pending')
                ->where('created_at', '>=', now()->subMinutes(30))
                ->latest('id')
                ->first();

            if ($pendingTrx) {
                try {
                    // Auto-sync status pembayaran langsung ke Midtrans API secara Server-to-Server
                    app(OrderStatusService::class)->getOrderStatus($user, $pendingTrx->order_id);
                    $access = UserMovieAccess::where('user_id', $user->id)
                        ->where('movie_id', $movie->id)
                        ->where('access_status', 'active')
                        ->where('rental_expires_at', '>', now())
                        ->latest('rental_expires_at')
                        ->first();
                } catch (\Throwable $e) {
                    Log::warning("Auto-sync rental pending gagal untuk order {$pendingTrx->order_id}: {$e->getMessage()}");
                }
            }
        }

        if ($access) {
            $movie->access_status = 'active';
            $movie->rental_expires_at = $access->rental_expires_at;
        } else {
            // Cek riwayat sewa lampau untuk membedakan status 'expired' vs 'locked'
            $latestHistorical = UserMovieAccess::where('user_id', $user->id)
                ->where('movie_id', $movie->id)
                ->latest('id')
                ->first();

            if ($latestHistorical) {
                $movie->access_status = 'expired';
                $movie->rental_expires_at = $latestHistorical->rental_expires_at;
            } else {
                $movie->access_status = 'locked';
                $movie->rental_expires_at = null;
            }
        }

        return $movie;
    }
}
