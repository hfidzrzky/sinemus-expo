<?php

namespace App\Services\Checkout;

use App\Exceptions\Checkout\OrderNotFoundException;
use App\Models\EventTransaction;
use App\Models\MovieTransaction;
use App\Models\SeatLock;
use App\Models\User;
use App\Services\Admin\Settings\SystemSettingService;
use App\Services\Movies\MovieRentalOrderService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderStatusService
{
    protected SystemSettingService $settingService;

    public function __construct(
        protected ?MidtransSnapService $midtransSnapService = null,
        protected ?TicketPaymentService $ticketPaymentService = null,
        protected ?MovieRentalPaymentService $movieRentalPaymentService = null,
        ?SystemSettingService $settingService = null
    ) {
        $this->settingService = $settingService ?? app(SystemSettingService::class);
    }

    /**
     * Mengambil status pesanan dengan perlindungan Anti-IDOR (wajib dimiliki user yang terotentikasi).
     *
     * @return array{order_id: string, item_type: string, status: string, payment_type: string|null, paid_at: string|null}
     *
     * @throws OrderNotFoundException
     */
    public function getOrderStatus(User $user, string $orderId): array
    {
        // 1. Periksa apakah pesanan adalah tiket bioskop (EventTransaction)
        if (str_starts_with($orderId, 'SNM-TKT-')) {
            $order = EventTransaction::where('order_id', $orderId)
                ->where('user_id', $user->id)
                ->first();

            if (! $order) {
                throw new OrderNotFoundException;
            }

            if ($order->payment_status === 'pending') {
                $this->syncTicketOrder($order);
                $order->refresh();
            }

            return [
                'order_id' => $order->order_id,
                'item_type' => 'ticket',
                'status' => $order->payment_status,
                'payment_type' => $order->payment_type,
                'paid_at' => $order->paid_at?->toISOString(),
            ];
        }

        // 2. Periksa apakah pesanan adalah sewa film digital (MovieTransaction)
        if (str_starts_with($orderId, 'SNM-VOD-')) {
            $order = MovieTransaction::where('order_id', $orderId)
                ->where('user_id', $user->id)
                ->first();

            if (! $order) {
                throw new OrderNotFoundException;
            }

            if ($order->payment_status === 'pending') {
                $this->syncMovieOrder($order);
                $order->refresh();
            }

            return [
                'order_id' => $order->order_id,
                'item_type' => 'movie_rental',
                'status' => $order->payment_status,
                'payment_type' => $order->payment_type,
                'paid_at' => $order->paid_at?->toISOString(),
            ];
        }

        // 3. Fallback pencarian id jika prefix non-standar
        $eventOrder = EventTransaction::where('order_id', $orderId)
            ->where('user_id', $user->id)
            ->first();

        if ($eventOrder) {
            if ($eventOrder->payment_status === 'pending') {
                $this->syncTicketOrder($eventOrder);
                $eventOrder->refresh();
            }

            return [
                'order_id' => $eventOrder->order_id,
                'item_type' => 'ticket',
                'status' => $eventOrder->payment_status,
                'payment_type' => $eventOrder->payment_type,
                'paid_at' => $eventOrder->paid_at?->toISOString(),
            ];
        }

        $movieOrder = MovieTransaction::where('order_id', $orderId)
            ->where('user_id', $user->id)
            ->first();

        if ($movieOrder) {
            if ($movieOrder->payment_status === 'pending') {
                $this->syncMovieOrder($movieOrder);
                $movieOrder->refresh();
            }

            return [
                'order_id' => $movieOrder->order_id,
                'item_type' => 'movie_rental',
                'status' => $movieOrder->payment_status,
                'payment_type' => $movieOrder->payment_type,
                'paid_at' => $movieOrder->paid_at?->toISOString(),
            ];
        }

        throw new OrderNotFoundException;
    }

    /**
     * Membatalkan pesanan yang belum lunas dan membebaskan alokasi kunci kursi (Anti-IDOR).
     *
     * @return array{order_id: string, item_type: string, status: string, payment_type: string|null, paid_at: string|null}
     *
     * @throws OrderNotFoundException
     * @throws \DomainException
     */
    public function cancelOrder(User $user, string $orderId): array
    {
        // 1. Pesanan Tiket Bioskop (EventTransaction)
        if (str_starts_with($orderId, 'SNM-TKT-')) {
            /** @var EventTransaction|null $order */
            $order = EventTransaction::where('order_id', $orderId)
                ->where('user_id', $user->id)
                ->first();

            if (! $order) {
                throw new OrderNotFoundException;
            }

            if ($order->payment_status === 'paid') {
                throw new \DomainException('Pesanan yang sudah lunas tidak dapat dibatalkan.');
            }

            if ($order->payment_status !== 'cancelled') {
                DB::transaction(function () use ($order) {
                    $locked = EventTransaction::where('id', $order->id)->lockForUpdate()->first();
                    if ($locked->payment_status === 'paid') {
                        throw new \DomainException('Pesanan yang sudah lunas tidak dapat dibatalkan.');
                    }
                    $locked->update(['payment_status' => 'cancelled']);
                    SeatLock::where('order_id', $locked->order_id)->delete();
                });
                Log::info("OrderStatusService: Transaksi tiket {$orderId} berhasil dibatalkan oleh user {$user->id} dan kunci kursi dibebaskan.");
            }

            return [
                'order_id' => $order->order_id,
                'item_type' => 'ticket',
                'status' => 'cancelled',
                'payment_type' => $order->payment_type,
                'paid_at' => null,
            ];
        }

        // 2. Pesanan Sewa Film Digital (MovieTransaction)
        if (str_starts_with($orderId, 'SNM-VOD-')) {
            /** @var MovieTransaction|null $order */
            $order = MovieTransaction::where('order_id', $orderId)
                ->where('user_id', $user->id)
                ->first();

            if (! $order) {
                throw new OrderNotFoundException;
            }

            if ($order->payment_status === 'paid') {
                throw new \DomainException('Pesanan sewa film yang sudah lunas tidak dapat dibatalkan.');
            }

            if ($order->payment_status !== 'cancelled') {
                DB::transaction(function () use ($order) {
                    $locked = MovieTransaction::where('id', $order->id)->lockForUpdate()->first();
                    if ($locked->payment_status === 'paid') {
                        throw new \DomainException('Pesanan sewa film yang sudah lunas tidak dapat dibatalkan.');
                    }
                    $locked->update(['payment_status' => 'cancelled']);
                });
                Log::info("OrderStatusService: Transaksi sewa film {$orderId} berhasil dibatalkan oleh user {$user->id}.");
            }

            return [
                'order_id' => $order->order_id,
                'item_type' => 'movie_rental',
                'status' => 'cancelled',
                'payment_type' => $order->payment_type,
                'paid_at' => null,
            ];
        }

        // 3. Fallback pencarian id jika prefix non-standar
        $eventOrder = EventTransaction::where('order_id', $orderId)
            ->where('user_id', $user->id)
            ->first();

        if ($eventOrder) {
            if ($eventOrder->payment_status === 'paid') {
                throw new \DomainException('Pesanan yang sudah lunas tidak dapat dibatalkan.');
            }

            DB::transaction(function () use ($eventOrder) {
                $locked = EventTransaction::where('id', $eventOrder->id)->lockForUpdate()->first();
                if ($locked->payment_status === 'paid') {
                    throw new \DomainException('Pesanan yang sudah lunas tidak dapat dibatalkan.');
                }
                $locked->update(['payment_status' => 'cancelled']);
                SeatLock::where('order_id', $locked->order_id)->delete();
            });

            return [
                'order_id' => $eventOrder->order_id,
                'item_type' => 'ticket',
                'status' => 'cancelled',
                'payment_type' => $eventOrder->payment_type,
                'paid_at' => null,
            ];
        }

        throw new OrderNotFoundException;
    }

    /**
     * Sinkronisasi status tiket langsung dengan Midtrans Core API secara Server-to-Server.
     * ZERO CLIENT TRUST: Status pembayaran HANYA dipercaya dari server Midtrans resmi.
     */
    protected function syncTicketOrder(EventTransaction $order): void
    {
        if (! $this->ticketPaymentService) {
            return;
        }

        if ($order->payment_status === 'paid') {
            return;
        }

        $serverKey = config('services.midtrans.server_key');
        if ($this->midtransSnapService && ! empty($serverKey)) {
            $lock = Cache::lock("sync_ticket_{$order->order_id}", 10);
            try {
                // Tunggu hingga 3 detik jika ada webhook/request lain yang sedang memproses transaksi bersamaan
                $lock->block(3);
                $order->refresh();
                if ($order->payment_status === 'paid') {
                    return;
                }

                $midtransStatus = $this->midtransSnapService->checkTransactionStatus($order->order_id);
                if ($midtransStatus && ! empty($midtransStatus['transaction_status'])) {
                    try {
                        $this->ticketPaymentService->handleNotification($midtransStatus);

                        return;
                    } catch (\Throwable $e) {
                        Log::error("Gagal sinkronisasi tiket via Midtrans API ({$order->order_id}): {$e->getMessage()}");
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("Sinkronisasi tiket ({$order->order_id}) tertahan lock: {$e->getMessage()}");
            } finally {
                optional($lock)->release();
            }
        }

        $lockDuration = $this->settingService->getSeatLockDurationMinutes();

        // Jika transaksi masih berstatus pending dan usianya sudah melebihi batas waktu lock kursi,
        // ubah status transaksi menjadi 'expired' secara otomatis untuk ketertiban pencatatan keuangan & perilaku user
        if ($order->payment_status === 'pending' && $order->created_at && $order->created_at->addMinutes($lockDuration)->isPast()) {
            $this->markTicketOrderAsExpired($order, $lockDuration);
        }
    }

    /**
     * Tandai transaksi tiket kedaluwarsa dan bersihkan kunci kursi terkait.
     */
    protected function markTicketOrderAsExpired(EventTransaction $order, ?int $lockDuration = null): void
    {
        $duration = $lockDuration ?? $this->settingService->getSeatLockDurationMinutes();
        DB::transaction(function () use ($order) {
            $order->update(['payment_status' => 'expired']);
            SeatLock::where('order_id', $order->order_id)->delete();
        });
        Log::info("OrderStatusService: Transaksi {$order->order_id} telah kedaluwarsa (> {$duration} menit). Status otomatis diperbarui menjadi expired.");
    }

    /**
     * Sinkronisasi status sewa film langsung dengan Midtrans Core API secara Server-to-Server.
     * ZERO CLIENT TRUST: Status pembayaran HANYA dipercaya dari server Midtrans resmi.
     */
    protected function syncMovieOrder(MovieTransaction $order): void
    {
        if (! $this->movieRentalPaymentService || ! $this->midtransSnapService) {
            return;
        }

        if ($order->payment_status === 'paid') {
            return;
        }

        $serverKey = config('services.midtrans.server_key');
        if (empty($serverKey)) {
            return;
        }

        $lock = Cache::lock("sync_movie_{$order->order_id}", 10);
        try {
            $lock->block(3);
            $order->refresh();
            if ($order->payment_status === 'paid') {
                return;
            }

            $midtransStatus = $this->midtransSnapService->checkTransactionStatus($order->order_id);
            if ($midtransStatus && ! empty($midtransStatus['transaction_status'])) {
                try {
                    $this->movieRentalPaymentService->handleNotification($midtransStatus);
                } catch (\Throwable $e) {
                    Log::error("Gagal sinkronisasi film via Midtrans API ({$order->order_id}): {$e->getMessage()}");
                }
            }
        } catch (\Throwable $e) {
            Log::warning("Sinkronisasi film ({$order->order_id}) tertahan lock: {$e->getMessage()}");
        } finally {
            optional($lock)->release();
        }

        // Tandai transaksi sewa film yang telah melewati batas 15 menit sebagai expired
        if ($order->isPendingExpired(MovieRentalOrderService::PENDING_EXPIRY_MINUTES)) {
            DB::transaction(function () use ($order) {
                $order->update([
                    'payment_status' => MovieTransaction::STATUS_EXPIRED,
                    'updated_at' => now(),
                ]);
            });
            Log::info("OrderStatusService: Transaksi sewa film {$order->order_id} telah kedaluwarsa (> 15 menit). Status otomatis diubah menjadi expired.");
        }
    }
}
