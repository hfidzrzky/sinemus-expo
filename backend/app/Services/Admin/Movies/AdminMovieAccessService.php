<?php

namespace App\Services\Admin\Movies;

use App\Models\Movie;
use App\Models\User;
use App\Models\UserMovieAccess;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AdminMovieAccessService
{
    /**
     * Mengambil daftar hak tonton pengguna dengan filter, pencarian teks, dan paginasi.
     */
    public function getAccessList(
        ?int $userId = null,
        ?int $movieId = null,
        ?string $status = null,
        ?string $search = null,
        int $perPage = 20
    ): LengthAwarePaginator {
        $query = UserMovieAccess::with(['user', 'movie', 'transaction'])->latest('id');

        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        if ($movieId !== null) {
            $query->where('movie_id', $movieId);
        }

        if (! empty($status) && $status !== 'all') {
            if ($status === 'active') {
                $query->active();
            } elseif ($status === 'expired') {
                $query->expired();
            } elseif ($status === 'revoked') {
                $query->revoked();
            } else {
                $query->where('access_status', $status);
            }
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhereHas('movie', function ($mq) use ($search) {
                    $mq->where('title', 'like', "%{$search}%");
                });
            });
        }

        return $query->paginate($perPage);
    }

    /**
     * Menghitung ringkasan statistik hak akses film (total, aktif, kedaluwarsa, dicabut).
     *
     * @return array{total: int, active: int, expired: int, revoked: int}
     */
    public function getAccessSummary(): array
    {
        return [
            'total' => UserMovieAccess::count(),
            'active' => UserMovieAccess::active()->count(),
            'expired' => UserMovieAccess::expired()->count(),
            'revoked' => UserMovieAccess::revoked()->count(),
        ];
    }

    /**
     * Memberikan hak sewa/tonton gratis kepada pengguna (misal: reviewer/giveaway) tanpa transaksi finansial.
     * Menggunakan transaksi database ACID dan pessimistic locking.
     */
    public function grantAccess(
        int $userId,
        int $movieId,
        int $durationHours = 48,
        ?string $notes = null,
        ?int $adminId = null
    ): UserMovieAccess {
        return DB::transaction(function () use ($userId, $movieId, $durationHours, $notes, $adminId) {
            // Pessimistic Locking untuk memastikan integritas user dan movie
            User::lockForUpdate()->findOrFail($userId);
            $movie = Movie::lockForUpdate()->findOrFail($movieId);

            // Validasi Integritas: Film gratis tidak memerlukan entitlement hak tonton manual
            if ($movie->access_model === 'free' || (float) ($movie->price ?? 0) <= 0) {
                throw new \InvalidArgumentException('Film ini merupakan film gratis dan dapat ditonton langsung oleh seluruh pengguna tanpa memerlukan hak sewa manual.');
            }

            $startAt = now();
            $expiresAt = now()->addHours($durationHours);

            // Periksa apakah sudah ada hak akses sebelumnya untuk film ini
            $access = UserMovieAccess::lockForUpdate()
                ->where('user_id', $userId)
                ->where('movie_id', $movieId)
                ->latest('id')
                ->first();

            if ($access) {
                $access->update([
                    'access_status' => 'active',
                    'rental_start_at' => $startAt,
                    'rental_expires_at' => $expiresAt,
                    'revoked_at' => null,
                    'revoke_reason' => 'none',
                    'admin_notes' => $notes,
                ]);
            } else {
                $access = UserMovieAccess::create([
                    'user_id' => $userId,
                    'movie_id' => $movieId,
                    'transaction_id' => null,
                    'access_status' => 'active',
                    'rental_start_at' => $startAt,
                    'rental_expires_at' => $expiresAt,
                    'revoked_at' => null,
                    'revoke_reason' => 'none',
                    'admin_notes' => $notes,
                ]);
            }

            Log::info('Super Admin granted movie access', [
                'admin_id' => $adminId ?? Auth::id(),
                'user_id' => $userId,
                'movie_id' => $movieId,
                'duration_hours' => $durationHours,
                'access_id' => $access->id,
            ]);

            return $access->load(['user', 'movie']);
        });
    }

    /**
     * Mencabut hak sewa/tonton film dari pengguna secara manual oleh Super Admin.
     * Menggunakan transaksi database ACID dan pessimistic locking.
     */
    public function revokeAccess(
        int $accessId,
        string $reason,
        ?string $notes = null,
        ?int $adminId = null
    ): UserMovieAccess {
        return DB::transaction(function () use ($accessId, $reason, $notes, $adminId) {
            $access = UserMovieAccess::lockForUpdate()->findOrFail($accessId);

            $access->update([
                'access_status' => 'revoked',
                'revoked_at' => now(),
                'revoke_reason' => $reason,
                'admin_notes' => $notes ?? $access->admin_notes,
            ]);

            Log::info('Super Admin revoked movie access', [
                'admin_id' => $adminId ?? Auth::id(),
                'access_id' => $accessId,
                'reason' => $reason,
            ]);

            return $access->load(['user', 'movie']);
        });
    }
}
