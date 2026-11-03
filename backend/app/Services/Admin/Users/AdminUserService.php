<?php

namespace App\Services\Admin\Users;

use App\Models\User;
use DomainException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AdminUserService
{
    /**
     * Menampilkan daftar pengguna dengan filter dan paginasi.
     *
     * @param  array<string, mixed>  $filters
     */
    public function listUsers(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = User::query()
            ->withCount([
                'eventTransactions as paid_ticket_orders_count' => function ($q) {
                    $q->where('payment_status', 'paid');
                },
                'movieTransactions as paid_movie_orders_count' => function ($q) {
                    $q->where('payment_status', 'paid');
                },
            ]);

        // Filter pencarian teks bebas (nama, email, no HP) dengan mitigasi SQL wildcard injection
        if (! empty($filters['search'])) {
            $search = addcslashes((string) $filters['search'], '%_\\');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        // Filter role (customer / super_admin)
        if (! empty($filters['role']) && $filters['role'] !== 'all') {
            $query->where('role', $filters['role']);
        }

        // Filter status nomor WhatsApp terkunci (is_phone_locked)
        if (isset($filters['is_phone_locked'])) {
            $query->where('is_phone_locked', (bool) $filters['is_phone_locked']);
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Mengambil agregat ringkasan platform statistik pengguna di database (SSOT).
     *
     * @return array<string, int>
     */
    public function getUsersSummaryStats(): array
    {
        $totalUsers = User::count();
        $superAdminCount = User::where('role', 'super_admin')->count();
        $lockedPhoneCount = User::where('is_phone_locked', true)->count();
        $customerCount = max(0, $totalUsers - $superAdminCount);

        return [
            'total_users' => $totalUsers,
            'super_admin_count' => $superAdminCount,
            'locked_phone_count' => $lockedPhoneCount,
            'customer_count' => $customerCount,
        ];
    }

    /**
     * Mengambil data detail pengguna beserta riwayat pesanan tiket, sewa film, dan akses aktif.
     */
    public function getUserDetail(int $userId): User
    {
        return User::query()
            ->withCount([
                'eventTransactions as paid_ticket_orders_count' => function ($q) {
                    $q->where('payment_status', 'paid');
                },
                'movieTransactions as paid_movie_orders_count' => function ($q) {
                    $q->where('payment_status', 'paid');
                },
            ])
            ->with([
                'eventTransactions' => function ($q) {
                    $q->with('schedule.event:id,title,slug')
                        ->orderBy('created_at', 'desc')
                        ->limit(20);
                },
                'movieTransactions' => function ($q) {
                    $q->with('movie:id,title,slug')
                        ->orderBy('created_at', 'desc')
                        ->limit(20);
                },
                'movieAccess' => function ($q) {
                    $q->with('movie:id,title,slug')
                        ->where('access_status', 'active')
                        ->orderBy('rental_expires_at', 'desc');
                },
            ])
            ->findOrFail($userId);
    }

    /**
     * Memperbarui peran (role) pengguna dengan Proteksi Anti-Lockout.
     *
     * @throws DomainException
     */
    public function updateUserRole(int $userId, string $newRole, ?string $adminNotes = null): User
    {
        return DB::transaction(function () use ($userId, $newRole) {
            /** @var User $targetUser */
            $targetUser = User::lockForUpdate()->findOrFail($userId);

            // Jika peran tidak berubah, kembalikan instance saat ini
            if ($targetUser->role === $newRole) {
                return $targetUser;
            }

            // Proteksi Anti-Lockout: Larang pencabutan hak akses jika ini adalah satu-satunya Super Admin aktif
            if ($targetUser->role === 'super_admin' && $newRole !== 'super_admin') {
                $otherActiveSuperAdminsCount = User::where('role', 'super_admin')
                    ->where('id', '!=', $userId)
                    ->count();

                if ($otherActiveSuperAdminsCount < 1) {
                    throw new DomainException(
                        'Tidak dapat mencabut hak akses: Sistem wajib memiliki minimal satu Super Admin aktif.'
                    );
                }
            }

            $targetUser->role = $newRole;
            $targetUser->save();

            return $targetUser->refresh();
        });
    }
}
