<?php

namespace App\Services\Admin\Banners;

use App\Models\Banner;
use App\Models\Event;
use App\Models\Movie;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdminBannerService
{
    /**
     * Mengambil daftar banner dengan filter status, display_mode, link_type, dan paginasi.
     *
     * @param  array<string, mixed>  $filters
     */
    public function listBanners(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Banner::query()
            ->with([
                'movie:id,title,slug,synopsis,age_rating,genre,release_year,duration_minutes',
                'event:id,title,slug,synopsis_short,cinema_partner,age_rating,genre,release_year,duration_minutes',
            ]);

        // Filter pencarian teks bebas (title, subtitle, target_url)
        if (! empty($filters['search'])) {
            $search = (string) $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('subtitle', 'like', "%{$search}%")
                    ->orWhere('target_url', 'like', "%{$search}%")
                    ->orWhere('badge_text', 'like', "%{$search}%");
            });
        }

        // Filter mode tampilan (rich_content / image_only)
        if (! empty($filters['display_mode']) && $filters['display_mode'] !== 'all') {
            $query->where('display_mode', $filters['display_mode']);
        }

        // Filter tipe link aksi (movie / event / voucher / url)
        if (! empty($filters['link_type']) && $filters['link_type'] !== 'all') {
            $query->where('link_type', $filters['link_type']);
        }

        // Filter status tayang: active, upcoming, inactive
        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $now = now();
            $status = (string) $filters['status'];

            if ($status === 'active') {
                $query->where('is_active', true)
                    ->where(function ($q) use ($now) {
                        $q->whereNull('start_at')->orWhere('start_at', '<=', $now);
                    })
                    ->where(function ($q) use ($now) {
                        $q->whereNull('end_at')->orWhere('end_at', '>=', $now);
                    });
            } elseif ($status === 'upcoming') {
                $query->where('is_active', true)
                    ->whereNotNull('start_at')
                    ->where('start_at', '>', $now);
            } elseif ($status === 'inactive') {
                $query->where(function ($q) use ($now) {
                    $q->where('is_active', false)
                        ->orWhere(function ($sub) use ($now) {
                            $sub->whereNotNull('end_at')->where('end_at', '<', $now);
                        });
                });
            }
        }

        return $query->orderBy('order_priority', 'asc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Mengambil detail banner tunggal beserta relasi movie dan event.
     */
    public function getBannerById(int $id): Banner
    {
        return Banner::query()
            ->with([
                'movie:id,title,slug,synopsis,age_rating,genre,release_year,duration_minutes',
                'event:id,title,slug,synopsis_short,cinema_partner,age_rating,genre,release_year,duration_minutes',
            ])
            ->findOrFail($id);
    }

    /**
     * Membuat slide banner baru dan mengunggah aset gambar 16:9 ke Cloudflare R2 disk.
     *
     * @param  array<string, mixed>  $data
     */
    public function createBanner(array $data, ?UploadedFile $image = null): Banner
    {
        return DB::transaction(function () use ($data, $image) {
            // Upload gambar 16:9 ke storage disk Cloudflare R2 atau simpan image_url
            if ($image !== null) {
                $imagePath = $image->store('banners', 'r2');
                $data['image_path'] = $imagePath;
            } elseif (! empty($data['image_url'])) {
                $data['image_path'] = $data['image_url'];
            }

            // Jika order_priority tidak diisi, berikan prioritas urutan setelah slide terakhir
            if (empty($data['order_priority'])) {
                $maxPriority = (int) Banner::max('order_priority');
                $data['order_priority'] = $maxPriority + 1;
            }

            // Bersihkan foreign key jika tidak relevan dengan link_type
            $this->sanitizeTargetLinks($data);

            // Auto-resolve data spotlight jika judul/meta belum terisi
            $this->resolveSpotlightData($data);

            $banner = Banner::create($data);

            return $banner->load([
                'movie:id,title,slug',
                'event:id,title,slug',
            ]);
        });
    }

    /**
     * Memperbarui data banner dan mengganti file gambar di R2 jika ada file baru diunggah.
     *
     * @param  array<string, mixed>  $data
     */
    public function updateBanner(Banner $banner, array $data, ?UploadedFile $image = null): Banner
    {
        return DB::transaction(function () use ($banner, $data, $image) {
            // Jika ada gambar baru, hapus file gambar lama dari disk R2
            if ($image !== null) {
                if (! empty($banner->image_path) && Storage::disk('r2')->exists($banner->image_path)) {
                    Storage::disk('r2')->delete($banner->image_path);
                }
                $data['image_path'] = $image->store('banners', 'r2');
            } elseif (! empty($data['image_url'])) {
                $data['image_path'] = $data['image_url'];
            }

            // Bersihkan foreign key jika link_type diubah
            $this->sanitizeTargetLinks($data);

            // Auto-resolve data spotlight jika judul/meta belum terisi
            $this->resolveSpotlightData($data);

            $banner->update($data);

            return $banner->refresh()->load([
                'movie:id,title,slug',
                'event:id,title,slug',
            ]);
        });
    }

    /**
     * Menghapus banner dan membersihkan file aset gambarnya di storage disk R2.
     */
    public function deleteBanner(Banner $banner): bool
    {
        return DB::transaction(function () use ($banner) {
            // Hapus file gambar dari Cloudflare R2
            if (! empty($banner->image_path) && Storage::disk('r2')->exists($banner->image_path)) {
                Storage::disk('r2')->delete($banner->image_path);
            }

            return (bool) $banner->delete();
        });
    }

    /**
     * Melakukan batch reordering urutan prioritas banner slide (`order_priority`).
     *
     * @param  array<int, array{id: int, order_priority: int}>  $orderedItems
     */
    public function reorderBanners(array $orderedItems): int
    {
        return DB::transaction(function () use ($orderedItems) {
            $updatedCount = 0;

            foreach ($orderedItems as $item) {
                $affected = Banner::where('id', $item['id'])
                    ->update(['order_priority' => (int) $item['order_priority']]);
                $updatedCount += $affected;
            }

            return $updatedCount;
        });
    }

    /**
     * Membersihkan kolom link target yang tidak relevan dengan link_type yang dipilih.
     *
     * @param  array<string, mixed>  $data
     */
    protected function sanitizeTargetLinks(array &$data): void
    {
        if (isset($data['link_type'])) {
            if ($data['link_type'] !== 'movie') {
                $data['movie_id'] = null;
            }
            if ($data['link_type'] !== 'event') {
                $data['event_id'] = null;
            }
            if ($data['link_type'] !== 'url') {
                $data['target_url'] = null;
            }
        }
    }

    /**
     * Mengisi otomatis data judul, subtitle, badge, dan metadata untuk mode sorotan jika kosong.
     *
     * @param  array<string, mixed>  $data
     */
    protected function resolveSpotlightData(array &$data): void
    {
        $displayMode = $data['display_mode'] ?? null;
        if (! in_array($displayMode, ['spotlight', 'movie_spotlight', 'sorotan'], true)) {
            return;
        }

        $linkType = $data['link_type'] ?? null;

        if ($linkType === 'movie' && ! empty($data['movie_id'])) {
            $movie = Movie::find($data['movie_id']);
            if ($movie) {
                $data['title'] = ! empty($data['title']) ? $data['title'] : $movie->title;
                $data['subtitle'] = ! empty($data['subtitle']) ? $data['subtitle'] : ($movie->synopsis_short ?? $movie->synopsis);
                $data['badge_text'] = null;
                $data['age_rating'] = ! empty($data['age_rating']) ? $data['age_rating'] : $movie->age_rating;
                $data['genre'] = ! empty($data['genre']) ? $data['genre'] : (is_array($movie->genre) ? implode(', ', $movie->genre) : $movie->genre);
                $data['release_year'] = ! empty($data['release_year']) ? (int) $data['release_year'] : ($movie->release_year ? (int) $movie->release_year : null);
                $data['duration_minutes'] = ! empty($data['duration_minutes']) ? (int) $data['duration_minutes'] : ($movie->duration_minutes ? (int) $movie->duration_minutes : null);
            }
        } elseif ($linkType === 'event' && ! empty($data['event_id'])) {
            $event = Event::find($data['event_id']);
            if ($event) {
                $data['title'] = ! empty($data['title']) ? $data['title'] : $event->title;
                $data['subtitle'] = ! empty($data['subtitle']) ? $data['subtitle'] : ($event->synopsis_short ?: 'Tiket Presale Terbatas');
                $data['badge_text'] = null;
                $data['age_rating'] = ! empty($data['age_rating']) ? $data['age_rating'] : $event->age_rating;
                $data['genre'] = ! empty($data['genre']) ? $data['genre'] : (is_array($event->genre) ? implode(', ', $event->genre) : $event->genre);
                $data['release_year'] = ! empty($data['release_year']) ? (int) $data['release_year'] : ($event->release_year ? (int) $event->release_year : null);
                $data['duration_minutes'] = ! empty($data['duration_minutes']) ? (int) $data['duration_minutes'] : ($event->duration_minutes ? (int) $event->duration_minutes : null);
            }
        }
    }
}
