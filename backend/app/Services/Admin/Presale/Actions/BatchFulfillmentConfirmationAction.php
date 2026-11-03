<?php

namespace App\Services\Admin\Presale\Actions;

use App\Jobs\SendCinemaTicketReadyEmailJob;
use App\Models\EventTransaction;
use App\Models\Schedule;
use App\Services\Admin\Presale\Support\CinemaTicketStorageManager;
use App\Services\Tickets\TicketPdfService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BatchFulfillmentConfirmationAction
{
    /**
     * Konfirmasi Final & Publikasi Massal Tiket Presale Terverifikasi.
     * Menggunakan S3 Server-Side Copy pada Cloudflare R2 (temp/ -> permanent/).
     *
     * @param  array<int, array{
     *     transaction_id: int,
     *     detected_booking_code: string,
     *     detected_passcode: string,
     *     r2_qr_path: string,
     *     notes?: string|null
     * }>  $approvedItems
     * @return array{fulfilled_count: int, dispatched_notifications_count: int}
     */
    public function execute(
        Schedule $schedule,
        array $approvedItems,
        int $adminUserId,
        bool $sendNotification = true
    ): array {
        return DB::transaction(function () use ($schedule, $approvedItems, $adminUserId, $sendNotification) {
            $diskName = config('filesystems.default') === 'r2' ? 'r2' : 'public';
            $fulfilledCount = 0;
            $dispatchedCount = 0;
            $sessionDirectoriesToClean = [];

            foreach ($approvedItems as $item) {
                /** @var EventTransaction|null $transaction */
                $transaction = EventTransaction::lockForUpdate()->find($item['transaction_id']);

                if (! $transaction || (int) $transaction->schedule_id !== (int) $schedule->id) {
                    continue;
                }

                // Promosikan file dari temp/ ke permanent/ (mengutamakan Cloudflare R2 dengan resilient fallback)
                $tempPath = $item['r2_qr_path'];
                $sessionDirectoriesToClean[] = dirname($tempPath);
                $safeFilename = basename($tempPath);
                $permanentPath = 'cinema-tickets/permanent/'.date('Y/m').'/'.$safeFilename;

                $promoted = CinemaTicketStorageManager::promoteTempToPermanent(
                    $tempPath,
                    $permanentPath
                );
                $finalPermanentPath = $promoted['path'];

                $wasAlreadyFulfilled = ($transaction->fulfillment_status === 'fulfilled');

                $transaction->update([
                    'fulfillment_status' => 'fulfilled',
                    'cinema_booking_code' => $item['detected_booking_code'],
                    'cinema_passcode' => $item['detected_passcode'],
                    'cinema_qr_image_path' => $finalPermanentPath,
                    'cinema_ticket_notes' => $item['notes'] ?? null,
                    'fulfilled_at' => $transaction->fulfilled_at ?? now(),
                    'fulfilled_by_admin_id' => $adminUserId,
                ]);

                app(TicketPdfService::class)->purgeCache($transaction->order_id);

                if ($sendNotification && ! $wasAlreadyFulfilled) {
                    SendCinemaTicketReadyEmailJob::dispatchAfterResponse($transaction->id);
                    $dispatchedCount++;
                }

                $fulfilledCount++;
            }

            // Bersihkan folder sesi temporary yang telah selesai diproses agar tidak menjadi sampah
            foreach (array_unique($sessionDirectoriesToClean) as $sessionDir) {
                try {
                    Storage::disk('public')->deleteDirectory($sessionDir);
                    if (CinemaTicketStorageManager::isR2Configured() || app()->runningUnitTests()) {
                        Storage::disk('r2')->deleteDirectory($sessionDir);
                    }
                } catch (\Throwable) {
                    // Abaikan jika folder sudah kosong atau terhapus
                }
            }

            return [
                'fulfilled_count' => $fulfilledCount,
                'dispatched_notifications_count' => $dispatchedCount,
            ];
        });
    }
}
