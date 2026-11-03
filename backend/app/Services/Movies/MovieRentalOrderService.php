<?php

namespace App\Services\Movies;

use App\Exceptions\Movies\MovieAlreadyRentedException;
use App\Exceptions\Movies\MovieNotFoundException;
use App\Exceptions\Movies\MovieNotRentableException;
use App\Exceptions\Movies\MovieRentalFrozenException;
use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\User;
use App\Models\UserMovieAccess;
use App\Services\Admin\Settings\SystemSettingService;
use App\Services\Checkout\MidtransSnapService;
use App\Services\Checkout\VoucherService;
use Illuminate\Support\Facades\DB;

class MovieRentalOrderService
{
    public const PENDING_EXPIRY_MINUTES = 15;

    public function __construct(
        protected MidtransSnapService $midtransSnapService,
        protected VoucherService $voucherService,
        protected SystemSettingService $settingService
    ) {}

    /**
     * Menginisiasi pesanan sewa film digital VoD dengan perlindungan transaksi ACID,
     * Pessimistic Concurrency Guard, verifikasi voucher diskon, dan Midtrans Snap Token.
     *
     * @return array{order_id: string, snap_token: string, movie_title: string, gross_amount: float, discount_amount: float, net_amount: float, rental_duration_hours: int}
     *
     * @throws MovieRentalFrozenException
     * @throws MovieNotFoundException
     * @throws MovieNotRentableException
     * @throws MovieAlreadyRentedException
     */
    public function createRentalOrder(User $user, int $movieId, ?string $voucherCode = null): array
    {
        // 1. Emergency Freeze Guard (Fail-Closed)
        if ($this->settingService->isVodRentalsFrozen()) {
            throw new MovieRentalFrozenException;
        }

        return DB::transaction(function () use ($user, $movieId, $voucherCode) {
            // Bersihkan transaksi pending usang milik user (> 15 menit) secara DRY
            $this->pruneExpiredOrders(userId: $user->id);

            // 2. Pessimistic Locking untuk memastikan integritas data film
            /** @var Movie|null $movie */
            $movie = Movie::where('id', $movieId)
                ->lockForUpdate()
                ->first();

            if (! $movie || ! $movie->is_published) {
                throw new MovieNotFoundException;
            }

            // 3. Film berakses gratis tidak dapat/perlu disewa
            if ($movie->access_model === 'free') {
                throw new MovieNotRentableException('Film ini dapat ditonton secara gratis tanpa perlu menyewa.');
            }

            // 4. Anti-Double-Rent Guard: Cegah sewa ulang jika user masih memiliki akses aktif
            $activeAccess = UserMovieAccess::where('user_id', $user->id)
                ->where('movie_id', $movieId)
                ->where('access_status', 'active')
                ->where('rental_expires_at', '>', now())
                ->lockForUpdate()
                ->first();

            if ($activeAccess) {
                throw new MovieAlreadyRentedException('Anda masih memiliki hak sewa aktif untuk film ini.');
            }

            // 5. Durasi sewa dinamis SSOT via SystemSettingService
            $defaultRentalDuration = $this->settingService->getVodRentalDurationHours();
            $rentalDurationHours = (int) ($movie->rental_duration_hours ?? $defaultRentalDuration);

            // 6. Kalkulasi Harga & Diskon Kupon Promo
            $grossAmount = (float) ($movie->price ?? 0);
            $discountAmount = 0.0;
            $netAmount = $grossAmount;
            $voucherId = null;

            if (! empty($voucherCode)) {
                $voucherResult = $this->voucherService->applyVoucher(
                    code: $voucherCode,
                    grossAmount: $grossAmount,
                    itemType: 'movie_rental',
                    targetId: $movie->id
                );

                $discountAmount = (float) $voucherResult['discount_amount'];
                $netAmount = (float) $voucherResult['net_amount'];
                $voucherId = (int) $voucherResult['voucher_id'];
            } else {
                // Terapkan direct discount (coret harga) otomatis jika aktif tanpa perlu kode kupon
                $directDiscount = $this->voucherService->getActiveDirectDiscount($grossAmount, 'movie_rental', $movie->id);
                if ($directDiscount['has_discount'] && $directDiscount['voucher']) {
                    $discountAmount = (float) $directDiscount['discount_amount'];
                    $netAmount = (float) $directDiscount['discounted_price'];
                    $voucherId = (int) $directDiscount['voucher']->id;
                }
            }

            // 7. Generate Format Order ID SSOT: SNM-VOD-YYYY-XXXX
            $year = now()->format('Y');
            $randomHex = strtoupper(bin2hex(random_bytes(4)));
            $orderId = "SNM-VOD-{$year}-{$randomHex}";

            // 8. Penanganan Transaksi Bebas Bayar / Diskon 100% (Zero-Amount Checkout Guardrail)
            if ($netAmount <= 0.0) {
                $snapToken = 'PROMO-FREE-'.$orderId;
                $now = now();
                $expiresAt = $now->copy()->addHours($rentalDurationHours);

                MovieTransaction::create([
                    'order_id' => $orderId,
                    'user_id' => $user->id,
                    'movie_id' => $movie->id,
                    'voucher_id' => $voucherId,
                    'gross_amount' => $grossAmount,
                    'discount_amount' => $discountAmount,
                    'net_amount' => 0.00,
                    'snap_token' => $snapToken,
                    'payment_status' => 'paid',
                    'payment_type' => 'voucher',
                    'paid_at' => $now,
                    'snapshot_movie_data' => [
                        'id' => $movie->id,
                        'slug' => $movie->slug,
                        'title' => $movie->title,
                        'price' => $grossAmount,
                        'rental_duration_hours' => $rentalDurationHours,
                    ],
                ]);

                UserMovieAccess::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'movie_id' => $movie->id,
                    ],
                    [
                        'access_status' => 'active',
                        'rental_start_at' => $now,
                        'rental_expires_at' => $expiresAt,
                        'revoke_reason' => 'none',
                    ]
                );

                if ($voucherId) {
                    $this->voucherService->incrementUsage($voucherId);
                }

                return [
                    'order_id' => $orderId,
                    'snap_token' => $snapToken,
                    'movie_title' => (string) $movie->title,
                    'gross_amount' => $grossAmount,
                    'discount_amount' => $discountAmount,
                    'net_amount' => 0.00,
                    'rental_duration_hours' => $rentalDurationHours,
                ];
            }

            // 9. Susun Item Details untuk Midtrans Snap
            $itemDetails = [
                [
                    'id' => 'MOVIE-'.$movie->id,
                    'price' => (int) round($grossAmount),
                    'quantity' => 1,
                    'name' => mb_substr((string) $movie->title, 0, 50),
                ],
            ];

            if ($discountAmount > 0) {
                $itemDetails[] = [
                    'id' => 'VOUCHER-DISCOUNT',
                    'price' => -(int) round($discountAmount),
                    'quantity' => 1,
                    'name' => 'Diskon Voucher Promo',
                ];
            }

            // 10. Terbitkan Midtrans Snap Token
            $snapPayload = [
                'transaction_details' => [
                    'order_id' => $orderId,
                    'gross_amount' => (int) round($netAmount),
                ],
                'customer_details' => [
                    'first_name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone_number ?? '',
                ],
                'item_details' => $itemDetails,
                'expiry' => [
                    'duration' => 15,
                    'unit' => 'minutes',
                ],
            ];

            $snapResponse = $this->midtransSnapService->createTransaction($snapPayload);
            $snapToken = $snapResponse['token'];

            // 11. Persistensi Entitas MovieTransaction
            MovieTransaction::create([
                'order_id' => $orderId,
                'user_id' => $user->id,
                'movie_id' => $movie->id,
                'voucher_id' => $voucherId,
                'gross_amount' => $grossAmount,
                'discount_amount' => $discountAmount,
                'net_amount' => $netAmount,
                'snap_token' => $snapToken,
                'payment_status' => 'pending',
                'snapshot_movie_data' => [
                    'id' => $movie->id,
                    'slug' => $movie->slug,
                    'title' => $movie->title,
                    'price' => $grossAmount,
                    'rental_duration_hours' => $rentalDurationHours,
                ],
            ]);

            return [
                'order_id' => $orderId,
                'snap_token' => $snapToken,
                'movie_title' => (string) $movie->title,
                'gross_amount' => $grossAmount,
                'discount_amount' => $discountAmount,
                'net_amount' => $netAmount,
                'rental_duration_hours' => $rentalDurationHours,
            ];
        });
    }

    /**
     * Membersihkan transaksi sewa film berstatus pending yang telah kedaluwarsa (SSOT & DRY).
     *
     * @param  int|null  $userId  Jika diisi, hanya membersihkan milik user tersebut.
     * @param  int  $toleranceMinutes  Toleransi waktu kedaluwarsa dalam menit (default: 15 menit).
     * @return int Jumlah baris transaksi yang diperbarui menjadi expired.
     */
    public function pruneExpiredOrders(?int $userId = null, int $toleranceMinutes = self::PENDING_EXPIRY_MINUTES): int
    {
        $query = MovieTransaction::pendingExpired($toleranceMinutes);

        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        return $query->update([
            'payment_status' => MovieTransaction::STATUS_EXPIRED,
            'updated_at' => now(),
        ]);
    }
}
