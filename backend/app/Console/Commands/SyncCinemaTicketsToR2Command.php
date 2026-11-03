<?php

namespace App\Console\Commands;

use App\Models\EventTransaction;
use App\Services\Admin\Presale\Support\CinemaTicketStorageManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SyncCinemaTicketsToR2Command extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cinema:sync-tickets-to-r2 {--force : Paksa upload ulang meskipun file sudah ada di R2}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sinkronkan seluruh gambar QR tiket bioskop dari penyimpanan lokal ke Cloudflare R2';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('=== Sinkronisasi Gambar QR Tiket Bioskop ke Cloudflare R2 ===');

        if (! CinemaTicketStorageManager::isR2Configured()) {
            $this->error('Kredensial Cloudflare R2 belum lengkap di .env (CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET).');

            return Command::FAILURE;
        }

        // Uji konektivitas R2
        try {
            $this->line('Menguji konektivitas ke bucket R2: '.config('filesystems.disks.r2.bucket').'...');
            Storage::disk('r2')->files('cinema-tickets');
            $this->info('✓ Koneksi ke Cloudflare R2 berhasil!');
        } catch (\Throwable $e) {
            $this->error('Gagal terhubung ke Cloudflare R2: '.$e->getMessage());

            return Command::FAILURE;
        }

        $force = (bool) $this->option('force');

        // 1. Ambil seluruh transaksi presale fulfilled dengan cinema_qr_image_path
        $transactions = EventTransaction::where('fulfillment_status', 'fulfilled')
            ->whereNotNull('cinema_qr_image_path')
            ->get();

        $this->line("Ditemukan {$transactions->count()} transaksi terinjeksi di database.");

        $syncedCount = 0;
        $skippedCount = 0;
        $failedCount = 0;

        $bar = $this->output->createProgressBar($transactions->count());
        $bar->start();

        foreach ($transactions as $t) {
            $path = $t->cinema_qr_image_path;

            // Lewati jika path berupa external URL
            if (Str::startsWith($path, ['http://', 'https://'])) {
                $skippedCount++;
                $bar->advance();

                continue;
            }

            // Periksa apakah file ada di storage public lokal
            if (! Storage::disk('public')->exists($path)) {
                // Mungkin sudah ada di R2?
                if (Storage::disk('r2')->exists($path)) {
                    $skippedCount++;
                } else {
                    $this->warn("\nFile tidak ditemukan di lokal maupun R2: {$path} (Order: {$t->order_id})");
                    $failedCount++;
                }
                $bar->advance();

                continue;
            }

            // Cek apakah sudah ada di R2
            $existsOnR2 = false;
            try {
                $existsOnR2 = Storage::disk('r2')->exists($path);
            } catch (\Throwable) {
                $existsOnR2 = false;
            }

            if ($existsOnR2 && ! $force) {
                $skippedCount++;
                $bar->advance();

                continue;
            }

            // Ambil binary dari lokal dan upload ke R2
            try {
                $content = Storage::disk('public')->get($path);
                if ($content !== null && $content !== '') {
                    $uploaded = Storage::disk('r2')->put($path, $content, 'public');
                    if ($uploaded) {
                        $syncedCount++;
                        Log::info("SyncCinemaTicketsToR2: Berhasil mengunggah {$path} ke Cloudflare R2.");
                    } else {
                        $failedCount++;
                    }
                } else {
                    $failedCount++;
                }
            } catch (\Throwable $e) {
                $failedCount++;
                Log::error("SyncCinemaTicketsToR2: Gagal mengunggah {$path}: {$e->getMessage()}");
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // 2. Scan seluruh file direktori permanent di storage/app/public/cinema-tickets/permanent
        $this->line('Memindai direktori lokal cinema-tickets/permanent untuk file tambahan...');
        $allLocalFiles = Storage::disk('public')->allFiles('cinema-tickets/permanent');
        $additionalSynced = 0;

        foreach ($allLocalFiles as $localFilePath) {
            try {
                if (! Storage::disk('r2')->exists($localFilePath) || $force) {
                    $binary = Storage::disk('public')->get($localFilePath);
                    if ($binary !== null && $binary !== '') {
                        Storage::disk('r2')->put($localFilePath, $binary, 'public');
                        $additionalSynced++;
                    }
                }
            } catch (\Throwable) {
                // Abaikan jika gagal
            }
        }

        $this->info('=== Hasil Sinkronisasi ===');
        $this->line("✓ Berhasil disinkronkan ke R2: {$syncedCount} tiket transaksi");
        if ($additionalSynced > 0) {
            $this->line("✓ Berhasil disinkronkan dari storage direktori: {$additionalSynced} file");
        }
        $this->line("- Dilewati (Sudah ada di R2 / URL): {$skippedCount}");
        if ($failedCount > 0) {
            $this->warn("! Gagal: {$failedCount}");
        }

        return Command::SUCCESS;
    }
}
