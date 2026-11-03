<?php

namespace App\Services\Admin\Presale\Actions;

use App\Jobs\SendCinemaTicketReadyEmailJob;
use App\Models\EventTransaction;
use App\Services\Admin\Presale\Support\CinemaTicketStorageManager;
use App\Services\Tickets\TicketPdfService;
use DomainException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SingleTicketInjectionAction
{
    /**
     * Eksekusi injeksi tiket bioskop tunggal dengan proteksi ACID transaction.
     *
     * @throws DomainException
     */
    public function execute(
        int $transactionId,
        int $adminUserId,
        string $bookingCode,
        string $passcode,
        ?UploadedFile $qrImage = null,
        ?string $notes = null,
        bool $sendNotification = true,
        bool $allowUpdate = false
    ): EventTransaction {
        return DB::transaction(function () use (
            $transactionId,
            $adminUserId,
            $bookingCode,
            $passcode,
            $qrImage,
            $notes,
            $sendNotification,
            $allowUpdate
        ) {
            /** @var EventTransaction $transaction */
            $transaction = EventTransaction::with(['schedule.event'])->lockForUpdate()->findOrFail($transactionId);

            // 1. Guard: Pastikan transaksi adalah jenis presale_cinema
            $eventType = (string) ($transaction->schedule?->event?->event_type
                ?? ($transaction->snapshot_event_data['event_type'] ?? 'regular'));

            if ($eventType !== 'presale_cinema') {
                throw new DomainException('Injeksi tiket bioskop hanya dapat dilakukan pada transaksi Presale Bioskop (presale_cinema).', 422);
            }

            // 2. Guard: Cross-Order Physical Seat Collision Guard
            // Cek apakah kursi pada pesanan ini sudah pernah terinjeksi ke pesanan lain yang berstatus fulfilled pada jadwal yang sama
            $currentSeats = is_array($transaction->snapshot_seats) ? $transaction->snapshot_seats : [];
            if (! empty($currentSeats) && $transaction->schedule_id !== null) {
                $otherFulfilledOrders = EventTransaction::where('schedule_id', $transaction->schedule_id)
                    ->where('id', '!=', $transaction->id)
                    ->where('fulfillment_status', 'fulfilled')
                    ->with('user:id,name')
                    ->get();

                foreach ($otherFulfilledOrders as $otherOrder) {
                    $otherSeats = is_array($otherOrder->snapshot_seats) ? $otherOrder->snapshot_seats : [];
                    $intersect = array_values(array_intersect($currentSeats, $otherSeats));
                    if (! empty($intersect)) {
                        $collidingSeatsStr = implode(', ', $intersect);
                        $otherUserName = $otherOrder->user?->name ?? 'Penonton Lain';
                        throw new DomainException(
                            "Konflik Kursi Bioskop: Kursi {$collidingSeatsStr} pada sesi ini sudah terinjeksi ke pesanan {$otherOrder->order_id} atas nama {$otherUserName}. Kursi fisik yang sama tidak dapat diinjeksi ke lebih dari satu penonton pada sesi yang sama.",
                            409
                        );
                    }
                }
            }

            // 3. Guard: Cek status fulfilled & mode update
            if ($transaction->fulfillment_status === 'fulfilled' && ! $allowUpdate) {
                $existingCode = $transaction->cinema_booking_code ?? '-';
                throw new DomainException(
                    "Pesanan {$transaction->order_id} sudah berstatus Terinjeksi sebelumnya (Kode Booking: {$existingCode}). Jika Anda bermaksud memperbarui atau mengoreksi data tiket, silakan gunakan tombol Ubah Tiket.",
                    409
                );
            }

            // 4. Upload QR Code jika disediakan (mengutamakan Cloudflare R2 dengan resilient local fallback)
            $qrImagePath = $transaction->cinema_qr_image_path;

            if ($qrImage !== null) {
                $oldQrImagePath = $transaction->cinema_qr_image_path;

                $ext = $qrImage->getClientOriginalExtension() ?: 'png';
                $filename = Str::random(32).'.'.strtolower($ext);
                $directory = 'cinema-tickets/permanent/'.date('Y/m');

                $stored = CinemaTicketStorageManager::storeTicketQrImage(
                    $qrImage,
                    $directory,
                    $filename
                );

                $qrImagePath = $stored['path'];

                // Hapus berkas lama dari Cloudflare R2 & disk publik jika gambar diganti
                if (! empty($oldQrImagePath) && $oldQrImagePath !== $qrImagePath) {
                    CinemaTicketStorageManager::deleteFile($oldQrImagePath);
                }
            }

            // 5. Update data transaksi secara atomik
            $transaction->update([
                'fulfillment_status' => 'fulfilled',
                'cinema_booking_code' => $bookingCode,
                'cinema_passcode' => $passcode,
                'cinema_qr_image_path' => $qrImagePath,
                'cinema_ticket_notes' => $notes,
                'fulfilled_at' => now(),
                'fulfilled_by_admin_id' => $adminUserId,
            ]);

            // Invalidate stale PDF cache so the fresh cinema QR is immediately rendered
            app(TicketPdfService::class)->purgeCache($transaction->order_id);

            // 6. Dispatch notifikasi email jika diaktifkan (after commit untuk proteksi ACID)
            if ($sendNotification) {
                SendCinemaTicketReadyEmailJob::dispatch($transaction->id)->afterCommit();
            }

            return $transaction->refresh();
        });
    }
}
