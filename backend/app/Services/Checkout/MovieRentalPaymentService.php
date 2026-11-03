<?php

namespace App\Services\Checkout;

use App\Exceptions\Checkout\OrderNotFoundException;
use App\Models\MovieTransaction;
use App\Models\UserMovieAccess;
use App\Services\Admin\Settings\SystemSettingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MovieRentalPaymentService
{
    public function __construct(
        protected VoucherService $voucherService
    ) {}

    /**
     * Memproses notifikasi webhook pembayaran untuk sewa film VoD (SNM-VOD-*) secara idempoten.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     *
     * @throws OrderNotFoundException
     */
    public function handleNotification(array $payload): array
    {
        $orderId = (string) ($payload['order_id'] ?? '');

        return DB::transaction(function () use ($orderId, $payload) {
            /** @var MovieTransaction|null $transaction */
            $transaction = MovieTransaction::where('order_id', $orderId)
                ->lockForUpdate()
                ->first();

            if (! $transaction) {
                throw new OrderNotFoundException("Pesanan sewa film {$orderId} tidak ditemukan.");
            }

            // 1. Idempotency Guard
            if ($transaction->payment_status === 'paid') {
                Log::info("MovieRentalPaymentService: Webhook diabaikan (Idempoten). Transaksi {$orderId} sudah berstatus lunas.");

                return [
                    'order_id' => $transaction->order_id,
                    'payment_status' => 'paid',
                    'is_idempotent' => true,
                    'message' => 'Pembayaran sewa film sudah diverifikasi sebelumnya. Akses streaming Anda masih aktif di menu Koleksi Saya.',
                ];
            }

            $transactionStatus = (string) ($payload['transaction_status'] ?? '');
            $fraudStatus = (string) ($payload['fraud_status'] ?? '');
            $paymentType = (string) ($payload['payment_type'] ?? $transaction->payment_type);

            $isPaid = ($transactionStatus === 'settlement')
                || ($transactionStatus === 'capture' && $fraudStatus === 'accept');

            if ($isPaid) {
                $settingService = app(SystemSettingService::class);
                $defaultDuration = $settingService->getVodRentalDurationHours();
                $rentalDurationHours = (int) ($transaction->movie?->rental_duration_hours ?? $defaultDuration);

                $now = now();
                $expiresAt = $now->copy()->addHours($rentalDurationHours);

                // 2. Update status transaksi sewa
                $transaction->payment_status = 'paid';
                $transaction->payment_type = $paymentType;
                $transaction->paid_at = $now;
                $transaction->save();

                // 3. Berikan hak akses pemutaran film sesuai durasi sewa
                UserMovieAccess::updateOrCreate(
                    [
                        'transaction_id' => $transaction->id,
                    ],
                    [
                        'user_id' => $transaction->user_id,
                        'movie_id' => $transaction->movie_id,
                        'access_status' => 'active',
                        'rental_start_at' => $now,
                        'rental_expires_at' => $expiresAt,
                        'revoke_reason' => 'none',
                    ]
                );

                // 4. Tambah pemakaian kuota voucher jika ada
                if ($transaction->voucher_id) {
                    try {
                        $this->voucherService->incrementUsage($transaction->voucher_id);
                    } catch (\Throwable $e) {
                        Log::error('Gagal sinkronisasi penambahan kuota voucher pada pelunasan sewa film', [
                            'order_id' => $orderId,
                            'voucher_id' => $transaction->voucher_id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                Log::info("MovieRentalPaymentService: Transaksi {$orderId} lunas. Akses film ID {$transaction->movie_id} aktif {$rentalDurationHours} jam hingga {$expiresAt->toIso8601String()}.");

                return [
                    'order_id' => $transaction->order_id,
                    'payment_status' => 'paid',
                    'is_idempotent' => false,
                    'rental_expires_at' => $expiresAt->toIso8601String(),
                    'message' => "Pembayaran sewa film berhasil dikonfirmasi! Akses streaming film telah aktif selama {$rentalDurationHours} jam ke depan.",
                ];
            }

            // 5. Penanganan expired/cancelled/failed
            if (in_array($transactionStatus, ['expire', 'cancel', 'deny', 'failure'], true)) {
                $newStatus = ($transactionStatus === 'expire') ? 'expired' : 'failed';
                $transaction->payment_status = $newStatus;
                $transaction->payment_type = $paymentType;
                $transaction->save();

                $statusDescription = ($newStatus === 'expired')
                    ? 'Waktu pembayaran sewa film telah kedaluwarsa. Silakan lakukan pemesanan ulang untuk menonton.'
                    : 'Pembayaran sewa film dibatalkan atau tidak berhasil. Silakan coba kembali.';

                Log::info("MovieRentalPaymentService: Transaksi {$orderId} berstatus {$newStatus}.");

                return [
                    'order_id' => $transaction->order_id,
                    'payment_status' => $newStatus,
                    'is_idempotent' => false,
                    'message' => $statusDescription,
                ];
            }

            // 6. Status pending
            if ($transactionStatus === 'pending') {
                $transaction->payment_status = 'pending';
                $transaction->payment_type = $paymentType;
                $transaction->save();

                return [
                    'order_id' => $transaction->order_id,
                    'payment_status' => 'pending',
                    'is_idempotent' => false,
                    'message' => 'Pemesanan sewa film Anda sedang menunggu penyelesaian pembayaran.',
                ];
            }

            return [
                'order_id' => $transaction->order_id,
                'payment_status' => $transaction->payment_status,
                'is_idempotent' => false,
                'message' => "Status transaksi sewa film {$transactionStatus} tercatat.",
            ];
        });
    }
}
