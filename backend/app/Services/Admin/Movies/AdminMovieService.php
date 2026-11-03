<?php

namespace App\Services\Admin\Movies;

use App\Models\Banner;
use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\UserMovieAccess;
use App\Services\Cloudflare\CloudflareStreamService;
use DomainException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminMovieService
{
    public function __construct(
        protected CloudflareStreamService $streamService
    ) {}

    /**
     * Mengambil daftar film dengan filter dan paginasi untuk kebutuhan Super Admin.
     */
    public function getAdminMovies(
        ?string $search = null,
        ?string $genre = null,
        ?bool $isPublished = null,
        int $perPage = 50
    ): LengthAwarePaginator {
        $query = Movie::query()
            ->withCount([
                'userAccess as active_rentals_count' => fn ($q) => $q->active(),
            ])
            ->latest('id');

        if (! empty($search)) {
            $trimmed = trim($search);
            $query->where(function ($q) use ($trimmed) {
                $q->where('title', 'like', "%{$trimmed}%")
                    ->orWhere('director', 'like', "%{$trimmed}%")
                    ->orWhere('slug', 'like', "%{$trimmed}%");
            });
        }

        if (! empty($genre)) {
            $trimmedGenre = trim($genre);
            $query->where('genre', 'like', "%{$trimmedGenre}%");
        }

        if ($isPublished !== null) {
            $query->where('is_published', $isPublished);
        }

        return $query->paginate($perPage);
    }

    /**
     * Mengambil detail film berdasarkan ID.
     */
    public function getMovieById(int $id): Movie
    {
        return Movie::query()
            ->withCount([
                'userAccess as active_rentals_count' => fn ($q) => $q->active(),
            ])
            ->findOrFail($id);
    }

    /**
     * Membuat entitas film baru dengan auto-slug generator dan sanitasi data.
     *
     * @param  array<string, mixed>  $data
     */
    public function createMovie(array $data): Movie
    {
        // Auto-slug generator jika slug kosong
        if (empty($data['slug'])) {
            $data['slug'] = $this->generateUniqueSlug((string) ($data['title'] ?? 'film'));
        } else {
            $data['slug'] = Str::slug((string) $data['slug']);
        }

        // Normalisasi genre (jika dikirim sebagai array dari chip frontend)
        if (isset($data['genre']) && is_array($data['genre'])) {
            $data['genre'] = implode(', ', array_map('trim', $data['genre']));
        }

        // Pra-verifikasi Cloudflare Stream Video UID
        if (! empty($data['cloudflare_video_uid'])) {
            $this->streamService->verifyVideo((string) $data['cloudflare_video_uid']);
        }

        return Movie::create($data);
    }

    /**
     * Memperbarui entitas film yang sudah ada.
     *
     * @param  array<string, mixed>  $data
     */
    public function updateMovie(int $id, array $data): Movie
    {
        return DB::transaction(function () use ($id, $data) {
            $movie = Movie::findOrFail($id);

            if (array_key_exists('slug', $data) && empty($data['slug'])) {
                unset($data['slug']);
            } elseif (! empty($data['slug'])) {
                $data['slug'] = Str::slug((string) $data['slug']);
            }

            if (isset($data['genre']) && is_array($data['genre'])) {
                $data['genre'] = implode(', ', array_map('trim', $data['genre']));
            }

            if (! empty($data['cloudflare_video_uid']) && $data['cloudflare_video_uid'] !== $movie->cloudflare_video_uid) {
                $this->streamService->verifyVideo((string) $data['cloudflare_video_uid']);
            }

            $movie->update($data);

            // Selaraskan data banner terkait jika ada perubahan judul/sinopsis/metadata film
            $this->syncLinkedBanners($movie);

            return $movie->fresh()->loadCount([
                'userAccess as active_rentals_count' => fn ($q) => $q->active(),
            ]);
        });
    }

    /**
     * Menyelaraskan data banner beranda (title, sinopsis/subtitle, metadata karya)
     * yang menautkan film ini agar terhindar dari inkonsistensi data atau UX flaw.
     */
    protected function syncLinkedBanners(Movie $movie): void
    {
        $banners = Banner::where('movie_id', $movie->id)->get();
        if ($banners->isEmpty()) {
            return;
        }

        $genreString = is_array($movie->genre)
            ? implode(', ', array_filter(array_map('trim', $movie->genre)))
            : (string) ($movie->genre ?? '');

        $synopsis = $movie->synopsis_short ?? $movie->synopsis;

        foreach ($banners as $banner) {
            $isSpotlight = in_array($banner->display_mode, ['spotlight', 'movie_spotlight', 'sorotan'], true);

            $updatePayload = [
                'age_rating' => $movie->age_rating,
                'genre' => ! empty($genreString) ? $genreString : null,
                'release_year' => $movie->release_year ? (int) $movie->release_year : null,
                'duration_minutes' => $movie->duration_minutes ? (int) $movie->duration_minutes : null,
            ];

            if ($isSpotlight || empty($banner->title)) {
                $updatePayload['title'] = $movie->title;
            }

            if ($isSpotlight || empty($banner->subtitle)) {
                if (! empty($synopsis)) {
                    $updatePayload['subtitle'] = $synopsis;
                }
            }

            $banner->update($updatePayload);
        }
    }

    /**
     * Menghapus entitas film dengan proteksi transaksi finansial dan hak sewa aktif.
     * Mencegah anomali finansial jika film memiliki riwayat pembelian atau sewa penonton.
     *
     * @throws DomainException
     */
    public function deleteMovie(int $id, bool $force = false): bool
    {
        $movie = Movie::findOrFail($id);

        if (! $force) {
            // 1. Cek apakah film memiliki riwayat transaksi lunas (paid) yang sah
            $hasPaidTransactions = MovieTransaction::where('movie_id', $id)
                ->where('payment_status', 'paid')
                ->exists();
            if ($hasPaidTransactions) {
                throw new DomainException(
                    'Film tidak dapat dihapus karena memiliki riwayat transaksi sewa penonton. Anda dapat mengubah statusnya menjadi tidak dipublikasikan (unpublish) untuk menyembunyikannya dari katalog.'
                );
            }

            // 2. Cek apakah ada hak sewa aktif penonton yang masih berlaku
            $hasActiveRentals = UserMovieAccess::where('movie_id', $id)
                ->where('access_status', 'active')
                ->where('rental_expires_at', '>', now())
                ->exists();
            if ($hasActiveRentals) {
                throw new DomainException(
                    'Film tidak dapat dihapus karena memiliki riwayat hak sewa penonton. Silakan nonaktifkan publikasi film tersebut.'
                );
            }
        }

        return DB::transaction(function () use ($movie, $id) {
            // Bersihkan data akses sewa, transaksi non-paid/stale, dan banner terkait agar foreign key constraint (restrictOnDelete) terpenuhi
            UserMovieAccess::where('movie_id', $id)->delete();
            MovieTransaction::where('movie_id', $id)->delete();
            Banner::where('movie_id', $id)->delete();

            return (bool) $movie->delete();
        });
    }

    /**
     * Menghasilkan slug unik dengan resolusi tabrakan (collision-safe) dan batas panjang aman.
     */
    protected function generateUniqueSlug(string $title): string
    {
        $baseSlug = Str::limit(Str::slug($title), 180, '');
        if ($baseSlug === '') {
            $baseSlug = 'film-'.Str::random(6);
        }

        $slug = $baseSlug;
        $counter = 1;

        while (Movie::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
