<?php

namespace App\Services\Admin\Vouchers;

use App\Models\Voucher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminVoucherService
{
    /**
     * Mengambil daftar voucher dengan filter multi-kriteria dan paginasi terindeks.
     *
     * @param  array<string, mixed>  $filters
     */
    public function listVouchers(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Voucher::query()
            ->with(['event:id,title', 'movie:id,title'])
            ->withCount(['eventTransactions', 'movieTransactions'])
            ->latest('id');

        // Filter search (kode kupon atau nama promo)
        if (! empty($filters['search'])) {
            $search = strtoupper(trim((string) $filters['search']));
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        // Filter item_type (all, ticket, movie_rental)
        if (! empty($filters['item_type']) && $filters['item_type'] !== 'all') {
            $query->where('item_type', $filters['item_type']);
        }

        // Filter discount_type (percentage, fixed)
        if (! empty($filters['discount_type']) && $filters['discount_type'] !== 'all') {
            $query->where('discount_type', $filters['discount_type']);
        }

        // Filter promo_type (direct_discount, voucher_code)
        if (! empty($filters['promo_type']) && $filters['promo_type'] !== 'all') {
            $query->where('promo_type', $filters['promo_type']);
        }

        // Filter status (all, active, scheduled, expired, exhausted, inactive, archived)
        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $now = now();
            match ($filters['status']) {
                'archived' => $query->onlyTrashed(),
                'active' => $query->where('is_active', true)
                    ->where('valid_from', '<=', $now)
                    ->where('valid_until', '>=', $now)
                    ->whereColumn('quota_used', '<', 'quota_total'),
                'scheduled' => $query->where('is_active', true)
                    ->where('valid_from', '>', $now),
                'expired' => $query->where('valid_until', '<', $now),
                'exhausted' => $query->whereColumn('quota_used', '>=', 'quota_total'),
                'inactive' => $query->where('is_active', false),
                default => null,
            };
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Mengambil satu data voucher berdasarkan ID (termasuk yang diarsipkan).
     */
    public function getVoucherById(int $id): Voucher
    {
        return Voucher::withTrashed()
            ->with(['event:id,title', 'movie:id,title'])
            ->withCount(['eventTransactions', 'movieTransactions'])
            ->findOrFail($id);
    }

    /**
     * Membuat voucher baru dengan sanitasi kode kupon dan inisialisasi kuota.
     *
     * @param  array<string, mixed>  $data
     */
    public function createVoucher(array $data): Voucher
    {
        return DB::transaction(function () use ($data) {
            if (! empty($data['code'])) {
                $data['code'] = strtoupper(trim((string) $data['code']));
            } else {
                $prefix = ($data['promo_type'] ?? 'voucher_code') === 'direct_discount' ? 'DISC' : 'VOUCHER';
                $data['code'] = $prefix.'-'.strtoupper(Str::random(10));
            }

            $data['quota_used'] = 0;
            $data['is_active'] = $data['is_active'] ?? true;

            // Jika discount_type adalah fixed atau slashed_price, max_discount di-null-kan jika tidak diisi
            if (in_array($data['discount_type'], ['fixed', 'slashed_price']) && empty($data['max_discount'])) {
                $data['max_discount'] = null;
            }

            return Voucher::create($data);
        });
    }

    /**
     * Memperbarui konfigurasi voucher dengan penjagaan integritas kuota pemakaian.
     *
     * @param  array<string, mixed>  $data
     *
     * @throws ValidationException
     */
    public function updateVoucher(Voucher $voucher, array $data): Voucher
    {
        return DB::transaction(function () use ($voucher, $data) {
            // Guard Integritas Kuota: quota_total tidak boleh lebih kecil dari quota_used yang telah dikonsumsi
            if (isset($data['quota_total'])) {
                $newQuotaTotal = (int) $data['quota_total'];
                if ($newQuotaTotal < $voucher->quota_used) {
                    throw ValidationException::withMessages([
                        'quota_total' => ["Total kuota ({$newQuotaTotal}) tidak boleh lebih kecil dari kuota yang telah terpakai ({$voucher->quota_used} kuota)."],
                    ]);
                }
            }

            // Sanitasi code jika di-update
            if (isset($data['code'])) {
                $data['code'] = strtoupper(trim($data['code']));
            }

            // Jika discount_type diubah ke fixed/slashed_price, atau tetap fixed/slashed_price dengan max_discount kosong
            $discountType = $data['discount_type'] ?? $voucher->discount_type;
            if (in_array($discountType, ['fixed', 'slashed_price']) && array_key_exists('max_discount', $data) && empty($data['max_discount'])) {
                $data['max_discount'] = null;
            }

            $voucher->update($data);

            return $voucher->fresh(['eventTransactions', 'movieTransactions']);
        });
    }

    /**
     * Mengubah status aktif/nonaktif voucher secara cepat (Inline Toggle).
     */
    public function toggleStatus(Voucher $voucher): Voucher
    {
        return DB::transaction(function () use ($voucher) {
            $voucher->update([
                'is_active' => ! $voucher->is_active,
            ]);

            return $voucher->fresh(['eventTransactions', 'movieTransactions']);
        });
    }

    /**
     * Memulihkan voucher yang sebelumnya ditiadakan/diarsipkan.
     */
    public function restoreVoucher(int $id): Voucher
    {
        return DB::transaction(function () use ($id) {
            /** @var Voucher $voucher */
            $voucher = Voucher::onlyTrashed()->findOrFail($id);
            $voucher->restore();
            $voucher->update(['is_active' => true]);

            return $voucher->fresh(['eventTransactions', 'movieTransactions']);
        });
    }

    /**
     * Menghapus voucher:
     * - Jika belum pernah digunakan: Langsung Hard Delete permanen dari database.
     * - Jika telah memiliki riwayat transaksi/pemakaian: Soft Delete (ditiadakan dari halaman utama dan masuk ke Arsip).
     *
     * @return array{mode: string, deleted: bool, deactivated: bool, message: string}
     */
    public function deleteVoucher(Voucher $voucher): array
    {
        return DB::transaction(function () use ($voucher) {
            $hasEventTransactions = $voucher->eventTransactions()->exists();
            $hasMovieTransactions = $voucher->movieTransactions()->exists();
            $hasUsage = $voucher->quota_used > 0;

            // Jika sudah pernah terpakai di transaksi atau kuotanya pernah berkurang:
            // Soft Delete agar ditiadakan dari halaman utama, tapi jejak audit transaksi tetap aman.
            if ($hasEventTransactions || $hasMovieTransactions || $hasUsage) {
                $voucher->update(['is_active' => false]);
                $voucher->delete();

                return [
                    'mode' => 'archived',
                    'deleted' => true,
                    'deactivated' => true,
                    'message' => 'Promo berhasil ditiadakan dari daftar utama dan dipindahkan ke Arsip.',
                ];
            }

            // Jika belum pernah digunakan sama sekali (kuota 0 pemakaian dan tanpa transaksi):
            // Langsung Hard Delete fisik secara permanen dari sistem.
            $voucher->forceDelete();

            return [
                'mode' => 'hard_deleted',
                'deleted' => true,
                'deactivated' => false,
                'message' => 'Voucher promo berhasil dihapus secara permanen.',
            ];
        });
    }
}
