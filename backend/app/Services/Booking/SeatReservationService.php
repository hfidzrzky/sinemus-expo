<?php

namespace App\Services\Booking;

use App\Exceptions\Booking\SeatUnavailableException;
use App\Models\EventTransaction;
use App\Models\Schedule;
use App\Models\Seat;
use App\Models\SeatLock;
use App\Models\User;
use App\Models\Voucher;
use App\Services\Admin\Settings\SystemSettingService;
use App\Services\Checkout\MidtransSnapService;
use App\Services\Checkout\VoucherService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SeatReservationService
{
    public function __construct(
        protected VoucherService $voucherService,
        protected ?MidtransSnapService $midtransSnapService = null,
        protected ?SystemSettingService $settingService = null
    ) {
        $this->settingService = $settingService ?? app(SystemSettingService::class);
    }

    /**
     * Cadangkan kursi atau kuota tiket dengan transaksi ACID dan pessimistic row locking.
     *
     * @param  array<int>|null  $seatIds
     * @return array<string, mixed>
     *
     * @throws SeatUnavailableException
     */
    public function reserve(
        User $user,
        int $scheduleId,
        ?array $seatIds = null,
        ?int $quantity = null,
        ?string $voucherCode = null
    ): array {
        return DB::transaction(fn () => $this->executeReservation(
            $user,
            $scheduleId,
            $seatIds,
            $quantity,
            $voucherCode
        ));
    }

    /**
     * Eksekusi alur reservasi berdasarkan jenis layout kursi penayangan.
     *
     * @param  array<int>|null  $seatIds
     * @return array<string, mixed>
     *
     * @throws SeatUnavailableException
     */
    protected function executeReservation(
        User $user,
        int $scheduleId,
        ?array $seatIds = null,
        ?int $quantity = null,
        ?string $voucherCode = null
    ): array {
        // Gatekeeper 0: Kontrol Darurat - Pembekuan Penjualan Tiket Bioskop
        if ($this->settingService->isCinemaTicketSalesFrozen()) {
            throw new SeatUnavailableException('Pemesanan tiket saat ini sedang dibekukan sementara oleh penyelenggara.');
        }

        $lockDuration = $this->settingService->getSeatLockDurationMinutes();
        $maxTickets = $this->settingService->getMaxTicketsPerOrder();

        $schedule = $this->validateAndLockSchedule($scheduleId);
        $event = $schedule->event;

        // Gatekeeper 1: Validasi Jendela Waktu Penjualan (Presale & Reguler)
        if ($event->presale_start_at && now()->lt($event->presale_start_at)) {
            $startFormatted = $event->presale_start_at->translatedFormat('d F Y, H:i');
            $tipeLabel = $event->event_type === 'presale_cinema' ? 'tiket presale' : 'tiket';
            throw new SeatUnavailableException("Pemesanan {$tipeLabel} belum dibuka. Penjualan dibuka pada {$startFormatted} WIB.");
        }

        if ($event->presale_end_at && now()->gt($event->presale_end_at)) {
            $endFormatted = $event->presale_end_at->translatedFormat('d F Y, H:i');
            $tipeLabel = $event->event_type === 'presale_cinema' ? 'presale' : 'tiket';
            throw new SeatUnavailableException("Periode penjualan {$tipeLabel} telah berakhir pada {$endFormatted} WIB.");
        }

        $orderId = $this->generateUniqueOrderId();
        $expiresAt = now()->addMinutes($lockDuration);

        // Audit & Perilaku Pengguna: Tandai transaksi pending lama milik user yang sudah melebihi lock duration sebagai expired
        EventTransaction::where('user_id', $user->id)
            ->where('payment_status', 'pending')
            ->where('created_at', '<=', now()->subMinutes($lockDuration))
            ->update(['payment_status' => 'expired']);

        if ($event->seating_type === 'assigned_seating') {
            return $this->reserveAssignedSeats(
                $user,
                $schedule,
                $orderId,
                $expiresAt,
                $seatIds,
                $voucherCode,
                $maxTickets,
                $lockDuration
            );
        }

        return $this->reserveGeneralAdmissionSeats(
            $user,
            $schedule,
            $orderId,
            $expiresAt,
            $seatIds,
            $quantity,
            $voucherCode,
            $maxTickets,
            $lockDuration
        );
    }

    /**
     * Lock baris jadwal penayangan dan validasi status keaktifan.
     *
     * @throws SeatUnavailableException
     */
    protected function validateAndLockSchedule(int $scheduleId): Schedule
    {
        $schedule = Schedule::with(['event', 'venue'])
            ->where('id', $scheduleId)
            ->lockForUpdate()
            ->first();

        if (! $schedule || ! $schedule->is_active || ! $schedule->event || ! $schedule->event->is_active) {
            throw new SeatUnavailableException('Jadwal tayang tidak ditemukan atau sudah tidak aktif.');
        }

        if ($schedule->show_time <= now()) {
            throw new SeatUnavailableException('Jadwal penayangan sudah dimulai atau telah berakhir.');
        }

        return $schedule;
    }

    /**
     * Cadangkan kursi nomor fisik (Assigned Seating).
     *
     * @param  array<int>|null  $seatIds
     * @return array<string, mixed>
     *
     * @throws SeatUnavailableException
     */
    protected function reserveAssignedSeats(
        User $user,
        Schedule $schedule,
        string $orderId,
        Carbon $expiresAt,
        ?array $seatIds = null,
        ?string $voucherCode = null,
        int $maxTickets = 8,
        ?int $lockDuration = null
    ): array {
        $lockDuration = $lockDuration ?? $this->settingService->getSeatLockDurationMinutes();
        if (empty($seatIds) || ! is_array($seatIds)) {
            throw new SeatUnavailableException('Daftar kursi wajib dipilih untuk penayangan dengan denah kursi.');
        }

        // 1. Deterministic Ordering: Urutkan ID kursi secara ASC untuk mencegah deadlock InnoDB
        $sortedSeatIds = $seatIds;
        sort($sortedSeatIds, SORT_NUMERIC);

        if (count($sortedSeatIds) < 1 || count($sortedSeatIds) > $maxTickets) {
            throw new SeatUnavailableException("Jumlah pemesanan tiket harus antara 1 sampai {$maxTickets} tiket.");
        }

        // 2. Pessimistic Lock pada baris kursi fisik
        $seats = Seat::whereIn('id', $sortedSeatIds)
            ->lockForUpdate()
            ->get();

        if ($seats->count() !== count($sortedSeatIds)) {
            throw new SeatUnavailableException('Satu atau lebih kursi yang dipilih tidak valid.');
        }

        // 3. Validasi kepemilikan schedule dan status fisik kursi
        foreach ($seats as $seat) {
            if ($seat->schedule_id !== $schedule->id) {
                throw new SeatUnavailableException('Kursi tidak terdaftar pada sesi jadwal ini.');
            }

            if ($seat->status !== 'available' || $seat->seat_type === 'aisle') {
                throw new SeatUnavailableException("Kursi {$seat->seat_code} sudah tidak tersedia ({$seat->status}).");
            }
        }

        // 4. Validasi anti-overlap dengan seat_locks yang masih aktif
        $activeLocks = SeatLock::where('schedule_id', $schedule->id)
            ->whereIn('seat_id', $sortedSeatIds)
            ->where('expires_at', '>', now())
            ->lockForUpdate()
            ->get();

        if ($activeLocks->isNotEmpty()) {
            // Jika ada kursi yang dikunci oleh pemesan lain, tolak dengan 409
            $lockedByOther = $activeLocks->contains(fn ($lock) => (int) $lock->user_id !== (int) $user->id);
            if ($lockedByOther) {
                throw new SeatUnavailableException('Satu atau lebih kursi yang dipilih sedang dikunci oleh pemesan lain.');
            }

            // Jika seluruh kursi yang diminta sudah dikunci oleh user yang sama pada pesanan pending yang masih aktif
            $lockedSeatIds = $activeLocks->pluck('seat_id')->sort()->values()->all();
            if ($lockedSeatIds === collect($sortedSeatIds)->sort()->values()->all()) {
                $existingOrderId = $activeLocks->pluck('order_id')->filter()->first();
                if ($existingOrderId) {
                    $existingTransaction = EventTransaction::where('order_id', $existingOrderId)
                        ->where('payment_status', 'pending')
                        ->first();

                    if ($existingTransaction) {
                        return $this->handleExistingReservation(
                            transaction: $existingTransaction,
                            activeLock: $activeLocks->first(),
                            user: $user,
                            schedule: $schedule,
                            voucherCode: $voucherCode
                        );
                    }
                }
            }
        }

        // Bebaskan lock lama milik user pada jadwal ini jika sebelumnya memilih kursi lain
        SeatLock::where('schedule_id', $schedule->id)
            ->where('user_id', $user->id)
            ->whereNotIn('seat_id', $sortedSeatIds)
            ->delete();

        $ticketQuantity = count($sortedSeatIds);
        $seatLabels = $seats->sortBy('seat_code')->pluck('seat_code')->values()->toArray();

        // 5. Kalkulasi harga dinamis per-kursi (Reguler vs VIP)
        $regularPrice = (float) $schedule->ticket_price;
        $vipPrice = $schedule->vip_ticket_price !== null ? (float) $schedule->vip_ticket_price : $regularPrice;

        $calculatedGrossAmount = 0.0;
        foreach ($seats as $seat) {
            if ($seat->seat_type === 'vip') {
                $calculatedGrossAmount += $vipPrice;
            } else {
                $calculatedGrossAmount += $regularPrice;
            }
        }

        // 6. Pasang kunci durasi timeout ke tabel seat_locks
        foreach ($sortedSeatIds as $seatId) {
            SeatLock::create([
                'schedule_id' => $schedule->id,
                'seat_id' => $seatId,
                'user_id' => $user->id,
                'quantity' => 1,
                'order_id' => $orderId,
                'expires_at' => $expiresAt,
            ]);
        }

        return $this->createDraftTransaction(
            $user,
            $schedule,
            $orderId,
            $ticketQuantity,
            $seatLabels,
            $expiresAt,
            $voucherCode,
            $calculatedGrossAmount,
            $lockDuration
        );
    }

    /**
     * Cadangkan kuota tiket (General Admission).
     *
     * @param  array<int>|null  $seatIds
     * @return array<string, mixed>
     *
     * @throws SeatUnavailableException
     */
    protected function reserveGeneralAdmissionSeats(
        User $user,
        Schedule $schedule,
        string $orderId,
        Carbon $expiresAt,
        ?array $seatIds = null,
        ?int $quantity = null,
        ?string $voucherCode = null,
        int $maxTickets = 8,
        ?int $lockDuration = null
    ): array {
        $lockDuration = $lockDuration ?? $this->settingService->getSeatLockDurationMinutes();
        $requestedQuantity = $quantity ?: (is_array($seatIds) && count($seatIds) > 0 ? count($seatIds) : 1);

        if ($requestedQuantity < 1 || $requestedQuantity > $maxTickets) {
            throw new SeatUnavailableException("Jumlah pemesanan tiket harus antara 1 sampai {$maxTickets} tiket.");
        }

        // Cek apakah user sudah memiliki lock general admission aktif pada sesi ini
        $existingGaLock = SeatLock::where('schedule_id', $schedule->id)
            ->whereNull('seat_id')
            ->where('user_id', $user->id)
            ->where('expires_at', '>', now())
            ->lockForUpdate()
            ->first();

        if ($existingGaLock && (int) $existingGaLock->quantity === $requestedQuantity) {
            $existingTransaction = EventTransaction::where('order_id', $existingGaLock->order_id)
                ->where('payment_status', 'pending')
                ->first();

            if ($existingTransaction) {
                return $this->handleExistingReservation(
                    transaction: $existingTransaction,
                    activeLock: $existingGaLock,
                    user: $user,
                    schedule: $schedule,
                    voucherCode: $voucherCode
                );
            }
        }

        // Jika user memiliki kuota lock lama yang berbeda, bebaskan terlebih dahulu
        if ($existingGaLock) {
            $existingGaLock->delete();
        }

        // Hitung kuota yang sudah terjual lunas
        $paidQuantity = (int) EventTransaction::where('schedule_id', $schedule->id)
            ->where('payment_status', 'paid')
            ->sum('ticket_quantity');

        // Hitung kuota yang sedang dikunci aktif (belum kedaluwarsa)
        $activeLockedQuantity = (int) SeatLock::where('schedule_id', $schedule->id)
            ->where('expires_at', '>', now())
            ->sum('quantity');

        $availableQuota = max(0, $schedule->total_seats - ($paidQuantity + $activeLockedQuantity));

        if ($requestedQuantity > $availableQuota) {
            throw new SeatUnavailableException('Kuota tiket untuk sesi ini sudah habis atau sedang dipesan.');
        }

        // Pasang kunci general admission (seat_id = null)
        SeatLock::create([
            'schedule_id' => $schedule->id,
            'seat_id' => null,
            'user_id' => $user->id,
            'quantity' => $requestedQuantity,
            'order_id' => $orderId,
            'expires_at' => $expiresAt,
        ]);

        return $this->createDraftTransaction(
            $user,
            $schedule,
            $orderId,
            $requestedQuantity,
            [],
            $expiresAt,
            $voucherCode,
            null,
            $lockDuration
        );
    }

    /**
     * Hitung kalkulasi finansial dan buat draft transaksi.
     *
     * @param  array<string>  $seatLabels
     * @return array<string, mixed>
     */
    protected function createDraftTransaction(
        User $user,
        Schedule $schedule,
        string $orderId,
        int $ticketQuantity,
        array $seatLabels,
        Carbon $expiresAt,
        ?string $voucherCode = null,
        ?float $customGrossAmount = null,
        ?int $lockDuration = null
    ): array {
        $lockDuration = $lockDuration ?? $this->settingService->getSeatLockDurationMinutes();
        $event = $schedule->event;
        $unitPrice = (float) $schedule->ticket_price;
        $grossAmount = $customGrossAmount !== null ? round($customGrossAmount, 2) : round($unitPrice * $ticketQuantity, 2);
        $discountAmount = 0.00;
        $voucherModel = null;

        if (! empty($voucherCode)) {
            $applied = $this->voucherService->applyVoucher($voucherCode, $grossAmount, 'ticket', (int) $schedule->event_id);
            $voucherModel = Voucher::find($applied['voucher_id']);
            $discountAmount = (float) $applied['discount_amount'];
        } else {
            // Terapkan direct discount (coret harga) otomatis jika aktif tanpa perlu kode kupon
            $directDiscount = $this->voucherService->getActiveDirectDiscount($grossAmount, 'ticket', (int) $schedule->event_id);
            if ($directDiscount['has_discount'] && $directDiscount['voucher']) {
                $voucherModel = $directDiscount['voucher'];
                $discountAmount = (float) $directDiscount['discount_amount'];
            }
        }

        $serviceFee = $this->settingService->getPlatformServiceFee();
        $subtotal = max(0.00, round($grossAmount - $discountAmount, 2));
        $netAmount = round($subtotal + $serviceFee, 2);

        $transaction = EventTransaction::create([
            'order_id' => $orderId,
            'user_id' => $user->id,
            'schedule_id' => $schedule->id,
            'voucher_id' => $voucherModel?->id,
            'ticket_quantity' => $ticketQuantity,
            'gross_amount' => $grossAmount,
            'discount_amount' => $discountAmount,
            'net_amount' => $netAmount,
            'snap_token' => $this->generateSnapToken($orderId, $netAmount, $user, $lockDuration),
            'payment_status' => 'pending',
            'snapshot_event_data' => [
                'event_title' => $event->title,
                'venue_name' => $schedule->venue?->venue_name ?: ($event->venue_name ?? ''),
                'city' => $schedule->venue?->city ?: ($event->city ?? ''),
                'show_time' => $schedule->show_time->toIso8601String(),
                'ticket_price' => $unitPrice,
                'vip_ticket_price' => $schedule->vip_ticket_price !== null ? (float) $schedule->vip_ticket_price : null,
                'studio_name' => $schedule->studio_name,
                'service_fee' => $serviceFee,
            ],
            'snapshot_seats' => $seatLabels,
        ]);

        return [
            'order_id' => $transaction->order_id,
            'snap_token' => $transaction->snap_token,
            'event_title' => $event->title,
            'locked_seats' => $seatLabels,
            'gross_amount' => $grossAmount,
            'service_fee' => $serviceFee,
            'discount_amount' => $discountAmount,
            'net_amount' => $netAmount,
            'expires_at' => $expiresAt->toIso8601String(),
            'lock_duration_minutes' => $lockDuration,
        ];
    }

    /**
     * Generate unique Order ID with prefix SNM-TKT-YYYYMMDD-XXXX.
     */
    protected function generateUniqueOrderId(): string
    {
        do {
            $orderId = 'SNM-TKT-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));
        } while (EventTransaction::where('order_id', $orderId)->exists());

        return $orderId;
    }

    /**
     * Generate Snap Token via MidtransSnapService jika tersedia atau fallback ke draft token di lingkungan non-produksi.
     *
     * @throws SeatUnavailableException
     */
    protected function generateSnapToken(string $orderId, float $netAmount, User $user, ?int $expiryMinutes = null): string
    {
        $expiryMinutes = $expiryMinutes ?? $this->settingService->getSeatLockDurationMinutes();
        if ($this->midtransSnapService && config('services.midtrans.server_key')) {
            try {
                return $this->midtransSnapService->createTicketSnapToken(
                    $orderId,
                    $netAmount,
                    $user,
                    [],
                    $expiryMinutes
                );
            } catch (\Throwable $e) {
                Log::error("Gagal menerbitkan Midtrans Snap Token untuk pesanan {$orderId}", [
                    'order_id' => $orderId,
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);

                if (app()->isProduction()) {
                    throw new SeatUnavailableException('Layanan gerbang pembayaran sedang mengalami kendala. Mohon coba beberapa saat lagi.');
                }

                Log::warning("Menggunakan token draft cadangan untuk pesanan {$orderId} di lingkungan non-produksi.");
            }
        }

        return 'snap_draft_'.Str::random(32);
    }

    /**
     * Menangani pemesanan yang sudah ada (Idempotent Re-entry untuk user yang sama).
     *
     * @return array<string, mixed>
     */
    protected function handleExistingReservation(
        EventTransaction $transaction,
        SeatLock $activeLock,
        User $user,
        Schedule $schedule,
        ?string $voucherCode = null
    ): array {
        $grossAmount = (float) $transaction->gross_amount;
        $discountAmount = (float) $transaction->discount_amount;
        $voucherModel = $transaction->voucher;

        $serviceFee = (float) ($transaction->snapshot_event_data['service_fee'] ?? $this->settingService->getPlatformServiceFee());
        $lockDuration = $this->settingService->getSeatLockDurationMinutes();

        $currentVoucherCode = $voucherModel?->code;
        $normalizedVoucherCode = ! empty($voucherCode) ? strtoupper(trim($voucherCode)) : null;

        // Evaluasi target voucher yang seharusnya aktif: kupon manual atau fallback direct discount
        $targetVoucherModel = null;
        $targetDiscountAmount = 0.00;

        if (! empty($normalizedVoucherCode)) {
            $applied = $this->voucherService->applyVoucher($normalizedVoucherCode, $grossAmount, 'ticket', (int) $schedule->event_id);
            $targetVoucherModel = Voucher::find($applied['voucher_id']);
            $targetDiscountAmount = (float) $applied['discount_amount'];
        } else {
            $directDiscount = $this->voucherService->getActiveDirectDiscount($grossAmount, 'ticket', (int) $schedule->event_id);
            if ($directDiscount['has_discount'] && $directDiscount['voucher']) {
                $targetVoucherModel = $directDiscount['voucher'];
                $targetDiscountAmount = (float) $directDiscount['discount_amount'];
            }
        }

        $targetVoucherId = $targetVoucherModel?->id;
        $currentVoucherId = $voucherModel?->id;

        // Jika ada perubahan voucher promo pada transaksi yang sedang aktif
        if ($currentVoucherId !== $targetVoucherId) {
            $voucherModel = $targetVoucherModel;
            $discountAmount = $targetDiscountAmount;

            $subtotal = max(0.00, round($grossAmount - $discountAmount, 2));
            $netAmount = round($subtotal + $serviceFee, 2);

            // Perbarui transaksi secara atomik dan idiomatik Eloquent
            $newSnapToken = $this->generateSnapToken($transaction->order_id, $netAmount, $user, $lockDuration);

            $transaction->update([
                'voucher_id' => $voucherModel?->id,
                'discount_amount' => $discountAmount,
                'net_amount' => $netAmount,
                'snap_token' => $newSnapToken,
            ]);
        } else {
            $netAmount = (float) $transaction->net_amount;
        }

        $eventTitle = $transaction->snapshot_event_data['event_title']
            ?? ($transaction->schedule?->event?->title ?? '');

        return [
            'order_id' => $transaction->order_id,
            'snap_token' => $transaction->snap_token,
            'event_title' => $eventTitle,
            'locked_seats' => $transaction->snapshot_seats ?? [],
            'gross_amount' => $grossAmount,
            'service_fee' => $serviceFee,
            'discount_amount' => $discountAmount,
            'net_amount' => $netAmount,
            'expires_at' => $activeLock->expires_at->toIso8601String(),
            'lock_duration_minutes' => $lockDuration,
        ];
    }
}
