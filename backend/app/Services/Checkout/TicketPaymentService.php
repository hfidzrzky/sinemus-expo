<?php

namespace App\Services\Checkout;

use App\Exceptions\Checkout\OrderNotFoundException;
use App\Jobs\GenerateTicketPdfJob;
use App\Jobs\SendTransactionEmailJob;
use App\Models\EventTransaction;
use App\Models\Seat;
use App\Models\SeatLock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TicketPaymentService
{
    public function __construct(
        protected VoucherService $voucherService
    ) {}

    /**
     * Memproses notifikasi webhook pembayaran untuk pesanan tiket bioskop (SNM-TKT-*) secara idempoten.
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
            /** @var EventTransaction|null $transaction */
            $transaction = EventTransaction::with(['schedule.event', 'user'])
                ->where('order_id', $orderId)
                ->lockForUpdate()
                ->first();

            if (! $transaction) {
                throw new OrderNotFoundException("Pesanan tiket {$orderId} tidak ditemukan.");
            }

            // 1. Idempotency Guard: Jika transaksi sudah lunas, langsung return tanpa mutasi ulang
            if ($transaction->payment_status === 'paid') {
                Log::info("TicketPaymentService: Webhook diabaikan (Idempoten). Transaksi {$orderId} sudah berstatus lunas.");

                return [
                    'order_id' => $transaction->order_id,
                    'payment_status' => 'paid',
                    'is_idempotent' => true,
                    'message' => 'Pembayaran tiket Anda sudah diverifikasi sebelumnya. E-tiket Anda sudah siap di menu Tiket Saya.',
                ];
            }

            $transactionStatus = (string) ($payload['transaction_status'] ?? '');
            $fraudStatus = (string) ($payload['fraud_status'] ?? '');
            $paymentType = (string) ($payload['payment_type'] ?? $transaction->payment_type);

            $isPaid = ($transactionStatus === 'settlement')
                || ($transactionStatus === 'capture' && $fraudStatus === 'accept');

            if ($isPaid) {
                // 2. Terbitkan kode tiket unik dan hash QR terenkripsi
                $ticketCode = $this->generateUniqueTicketCode();
                $qrHash = bin2hex(random_bytes(16)); // 32-character hex random string

                // 3. Tentukan fulfillment status sesuai tipe event
                $event = $transaction->schedule?->event;
                $fulfillmentStatus = ($event && $event->event_type === 'presale_cinema')
                    ? 'awaiting_cinema_ticket'
                    : 'fulfilled';

                // 4. Update transaksi
                $transaction->payment_status = 'paid';
                $transaction->payment_type = $paymentType;
                $transaction->paid_at = now();
                $transaction->ticket_code = $ticketCode;
                $transaction->qr_hash = $qrHash;
                $transaction->fulfillment_status = $fulfillmentStatus;
                $transaction->save();

                // 5. Update fisik kursi ke status 'booked'
                $lockedSeatIds = SeatLock::where('order_id', $orderId)
                    ->whereNotNull('seat_id')
                    ->pluck('seat_id')
                    ->toArray();

                if (! empty($lockedSeatIds)) {
                    Seat::whereIn('id', $lockedSeatIds)->update(['status' => 'booked']);
                } elseif (! empty($transaction->snapshot_seats) && $transaction->schedule_id) {
                    Seat::where('schedule_id', $transaction->schedule_id)
                        ->whereIn('seat_code', $transaction->snapshot_seats)
                        ->update(['status' => 'booked']);
                }

                // 6. Hapus data seat_locks terkait pesanan ini
                SeatLock::where('order_id', $orderId)->delete();

                // 7. Tambah pemakaian kuota voucher secara atomik jika ada
                if ($transaction->voucher_id) {
                    try {
                        $this->voucherService->incrementUsage($transaction->voucher_id);
                    } catch (\Throwable $e) {
                        Log::error('Gagal sinkronisasi penambahan kuota voucher pada pelunasan tiket', [
                            'order_id' => $orderId,
                            'voucher_id' => $transaction->voucher_id,
                            'error' => $e->getMessage(),
                        ]);

                        $existingNotes = $transaction->cinema_ticket_notes ? $transaction->cinema_ticket_notes.' | ' : '';
                        $transaction->update([
                            'cinema_ticket_notes' => $existingNotes."Audit: Gagal menaikkan kuota voucher ID {$transaction->voucher_id} ({$e->getMessage()})",
                        ]);
                    }
                }

                // 8. Dispatch Async Queue Jobs: Render PDF E-Tiket & Kirim Email Konfirmasi
                GenerateTicketPdfJob::dispatch($transaction->id);
                SendTransactionEmailJob::dispatch($transaction->id);

                Log::info("TicketPaymentService: Transaksi {$orderId} berhasil dilunasi. E-Tiket {$ticketCode} diterbitkan.");

                return [
                    'order_id' => $transaction->order_id,
                    'payment_status' => 'paid',
                    'ticket_code' => $ticketCode,
                    'is_idempotent' => false,
                    'message' => 'Pembayaran tiket berhasil dikonfirmasi! E-tiket digital Anda telah terbit dan siap digunakan.',
                ];
            }

            // 9. Penanganan transaksi gagal, dibatalkan, kedaluwarsa, atau pengembalian dana
            if (in_array($transactionStatus, ['expire', 'cancel', 'deny', 'failure', 'refund', 'chargeback'], true)) {
                $newStatus = match ($transactionStatus) {
                    'expire' => 'expired',
                    'refund' => 'refunded',
                    'chargeback' => 'chargeback',
                    default => 'failed',
                };
                $transaction->payment_status = $newStatus;
                $transaction->payment_type = $paymentType;
                $transaction->save();

                // Lepaskan penguncian kursi sementara agar langsung tersedia untuk penonton lain
                SeatLock::where('order_id', $orderId)->delete();

                // Jika pesanan yang dibatalkan/refund sudah sempat booked, kembalikan kursi fisik ke 'available'
                if (! empty($transaction->snapshot_seats) && $transaction->schedule_id) {
                    Seat::where('schedule_id', $transaction->schedule_id)
                        ->whereIn('seat_code', $transaction->snapshot_seats)
                        ->where('status', 'booked')
                        ->update(['status' => 'available']);
                }

                $statusDescription = match ($newStatus) {
                    'expired' => 'Waktu pembayaran telah kedaluwarsa. Kursi yang Anda pilih telah dilepaskan dan dapat dipesan kembali.',
                    'refunded', 'chargeback' => 'Transaksi telah dikembalikan/dibatalkan. Alokasi kursi telah dilepaskan kembali.',
                    default => 'Pembayaran tiket dibatalkan atau tidak berhasil. Silakan lakukan pemesanan ulang.',
                };

                Log::info("TicketPaymentService: Transaksi {$orderId} berstatus {$newStatus}. Kunci kursi dan alokasi fisik dilepaskan.");

                return [
                    'order_id' => $transaction->order_id,
                    'payment_status' => $newStatus,
                    'is_idempotent' => false,
                    'message' => $statusDescription,
                ];
            }

            // 10. Status pending
            if ($transactionStatus === 'pending') {
                $transaction->payment_status = 'pending';
                $transaction->payment_type = $paymentType;
                $transaction->save();

                return [
                    'order_id' => $transaction->order_id,
                    'payment_status' => 'pending',
                    'is_idempotent' => false,
                    'message' => 'Pemesanan tiket Anda sedang menunggu penyelesaian pembayaran. Segera selesaikan transaksi sebelum batas waktu berakhir.',
                ];
            }

            return [
                'order_id' => $transaction->order_id,
                'payment_status' => $transaction->payment_status,
                'is_idempotent' => false,
                'message' => "Status transaksi {$transactionStatus} tercatat.",
            ];
        });
    }

    /**
     * Menghasilkan kode tiket unik dengan format TKT-YYYYMMDD-XXXX.
     */
    protected function generateUniqueTicketCode(): string
    {
        do {
            $code = 'TKT-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));
        } while (EventTransaction::where('ticket_code', $code)->exists());

        return $code;
    }
}
