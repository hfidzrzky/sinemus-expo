<?php

namespace App\Jobs;

use App\Models\EventTransaction;
use App\Services\Admin\Presale\Support\CinemaTicketStorageManager;
use App\Services\Tickets\TicketPdfService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProcessBulkInjectCinemaTicketsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Jumlah percobaan eksekusi.
     */
    public int $tries = 1;

    /**
     * Timeout eksekusi (detik).
     */
    public int $timeout = 600;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $scheduleId,
        public string $csvPath,
        public ?string $assetsZipPath,
        public int $adminUserId,
        public bool $sendNotification = true
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $fullCsvPath = storage_path('app/'.$this->csvPath);
        if (! file_exists($fullCsvPath)) {
            Log::error("ProcessBulkInjectCinemaTicketsJob: Berkas CSV tidak ditemukan pada path {$fullCsvPath}");

            return;
        }

        $extractedZipDir = null;
        if ($this->assetsZipPath !== null) {
            $fullZipPath = storage_path('app/'.$this->assetsZipPath);
            if (file_exists($fullZipPath)) {
                $extractedZipDir = storage_path('app/temp/bulk-assets/'.Str::uuid());
                $this->extractZipSafely($fullZipPath, $extractedZipDir);
            }
        }

        $diskName = config('filesystems.default') === 'r2' ? 'r2' : 'public';
        $handle = fopen($fullCsvPath, 'r');
        if ($handle === false) {
            return;
        }

        $header = fgetcsv($handle);
        if ($header === false) {
            fclose($handle);

            return;
        }

        // Normalisasi header (trim & lowercase)
        $headerMap = [];
        foreach ($header as $index => $colName) {
            $normalized = strtolower(trim((string) $colName));
            $headerMap[$normalized] = $index;
        }

        $processedCount = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if (empty(array_filter($row))) {
                continue;
            }

            $orderId = isset($headerMap['order_id']) ? trim((string) ($row[$headerMap['order_id']] ?? '')) : '';
            $bookingCode = isset($headerMap['cinema_booking_code']) ? trim((string) ($row[$headerMap['cinema_booking_code']] ?? '')) : '';
            $passcode = isset($headerMap['cinema_passcode']) ? trim((string) ($row[$headerMap['cinema_passcode']] ?? '')) : '';
            $qrFilename = isset($headerMap['qr_filename']) ? trim((string) ($row[$headerMap['qr_filename']] ?? '')) : '';
            $notes = isset($headerMap['notes']) ? trim((string) ($row[$headerMap['notes']] ?? '')) : null;

            if (empty($orderId) || empty($bookingCode) || empty($passcode)) {
                continue;
            }

            try {
                DB::transaction(function () use (
                    $orderId,
                    $bookingCode,
                    $passcode,
                    $qrFilename,
                    $notes,
                    $extractedZipDir

                ) {
                    /** @var EventTransaction|null $transaction */
                    $transaction = EventTransaction::lockForUpdate()
                        ->where('order_id', $orderId)
                        ->where('schedule_id', $this->scheduleId)
                        ->first();

                    if (! $transaction || $transaction->fulfillment_status === 'fulfilled') {
                        return;
                    }

                    $permanentQrPath = $transaction->cinema_qr_image_path;

                    // Jika ada berkas QR pada arsip ZIP
                    if (! empty($qrFilename) && $extractedZipDir !== null) {
                        $assetFilePath = $extractedZipDir.DIRECTORY_SEPARATOR.basename($qrFilename);
                        if (file_exists($assetFilePath)) {
                            $ext = pathinfo($assetFilePath, PATHINFO_EXTENSION) ?: 'png';
                            $targetFilename = Str::random(32).'.'.strtolower($ext);
                            $permanentQrPath = 'cinema-tickets/permanent/'.date('Y/m').'/'.$targetFilename;

                            $binary = file_get_contents($assetFilePath);
                            if ($binary !== false) {
                                $directory = 'cinema-tickets/permanent/'.date('Y/m');
                                $stored = CinemaTicketStorageManager::storeTicketQrImage(
                                    $binary,
                                    $directory,
                                    $targetFilename
                                );
                                $permanentQrPath = $stored['path'];
                            }
                        }
                    }

                    $transaction->update([
                        'fulfillment_status' => 'fulfilled',
                        'cinema_booking_code' => $bookingCode,
                        'cinema_passcode' => $passcode,
                        'cinema_qr_image_path' => $permanentQrPath,
                        'cinema_ticket_notes' => $notes,
                        'fulfilled_at' => now(),
                        'fulfilled_by_admin_id' => $this->adminUserId,
                    ]);

                    app(TicketPdfService::class)->purgeCache($transaction->order_id);

                    if ($this->sendNotification) {
                        SendCinemaTicketReadyEmailJob::dispatch($transaction->id);
                    }
                });

                $processedCount++;
            } catch (\Throwable $e) {
                Log::error("ProcessBulkInjectCinemaTicketsJob: Gagal memproses order {$orderId}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        fclose($handle);

        // Bersihkan berkas sementara
        @unlink($fullCsvPath);
        if ($this->assetsZipPath !== null) {
            @unlink(storage_path('app/'.$this->assetsZipPath));
        }
        if ($extractedZipDir !== null) {
            $this->cleanUpDirectory($extractedZipDir);
        }

        Log::info("ProcessBulkInjectCinemaTicketsJob: Selesai memproses {$processedCount} tiket presale pada sesi #{$this->scheduleId}");
    }

    /**
     * Ekstraksi ZIP dengan perlindungan Anti-Zip Slip.
     */
    private function extractZipSafely(string $zipPath, string $targetDir): void
    {
        if (! is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $zip = new \ZipArchive;
        if ($zip->open($zipPath) !== true) {
            return;
        }

        $realTargetDir = realpath($targetDir);
        if ($realTargetDir === false) {
            $zip->close();

            return;
        }

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $entryName = $zip->getNameIndex($i);
            if ($entryName === false || str_contains($entryName, '..')) {
                continue;
            }

            $safeFilename = basename($entryName);
            $destination = $realTargetDir.DIRECTORY_SEPARATOR.$safeFilename;

            $stream = $zip->getStream($entryName);
            if ($stream === false) {
                continue;
            }

            file_put_contents($destination, stream_get_contents($stream));
            fclose($stream);
        }

        $zip->close();
    }

    /**
     * Membersihkan direktori sementara.
     */
    private function cleanUpDirectory(string $dir): void
    {
        if (! is_dir($dir)) {
            return;
        }

        $files = array_diff(scandir($dir) ?: [], ['.', '..']);
        foreach ($files as $file) {
            $filePath = $dir.DIRECTORY_SEPARATOR.$file;
            if (is_dir($filePath)) {
                $this->cleanUpDirectory($filePath);
            } else {
                @unlink($filePath);
            }
        }

        @rmdir($dir);
    }
}
