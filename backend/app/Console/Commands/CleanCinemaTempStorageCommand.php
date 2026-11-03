<?php

namespace App\Console\Commands;

use App\Services\Admin\Presale\Support\CinemaTicketStorageManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CleanCinemaTempStorageCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cinema:clean-temp-storage {--hours=6 : Batas usia file sementara dalam jam (default: 6 jam)} {--all : Hapus seluruh file di folder temp tanpa melihat usia}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Bersihkan berkas dan folder sementara Smart Ingest di penyimpanan lokal dan Cloudflare R2';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        $deleteAll = (bool) $this->option('all');
        $expiryTimestamp = now()->subHours($hours)->getTimestamp();

        $this->info('=== Pembersihan Sampah Temporary Storage Tiket Bioskop ===');
        if ($deleteAll) {
            $this->warn('Mode: Menghapus SELURUH berkas temp.');
        } else {
            $this->line("Mode: Menghapus berkas temp berusia lebih dari {$hours} jam.");
        }

        $totalDeletedDirs = 0;
        $totalDeletedFiles = 0;

        // Disks yang akan dibersihkan: public lokal dan Cloudflare R2 (jika terkonfigurasi)
        $disksToClean = ['public'];
        if (CinemaTicketStorageManager::isR2Configured() || app()->runningUnitTests()) {
            $disksToClean[] = 'r2';
        }

        foreach ($disksToClean as $diskName) {
            $this->line("\nMemeriksa disk: [{$diskName}]...");

            try {
                $tempBaseDir = 'cinema-tickets/temp';

                if (! Storage::disk($diskName)->exists($tempBaseDir)) {
                    $this->line("  - Direktori {$tempBaseDir} tidak ditemukan atau sudah bersih.");

                    continue;
                }

                $sessionDirectories = Storage::disk($diskName)->directories($tempBaseDir);

                foreach ($sessionDirectories as $sessionDir) {
                    $files = Storage::disk($diskName)->files($sessionDir);
                    $shouldDeleteDir = $deleteAll;

                    if (! $deleteAll) {
                        // Jika direktori kosong, hapus langsung
                        if (empty($files)) {
                            $shouldDeleteDir = true;
                        } else {
                            // Cek usia file terakhir di dalam sesi
                            $allFilesExpired = true;
                            foreach ($files as $file) {
                                try {
                                    $lastModified = Storage::disk($diskName)->lastModified($file);
                                    if ($lastModified > $expiryTimestamp) {
                                        $allFilesExpired = false;
                                        break;
                                    }
                                } catch (\Throwable) {
                                    // Jika tidak bisa membaca lastModified, anggap expired jika nama direktori/file lama
                                }
                            }

                            if ($allFilesExpired) {
                                $shouldDeleteDir = true;
                            }
                        }
                    }

                    if ($shouldDeleteDir) {
                        $fileCount = count($files);
                        Storage::disk($diskName)->deleteDirectory($sessionDir);
                        $totalDeletedDirs++;
                        $totalDeletedFiles += $fileCount;
                        $this->line("  ✓ Dihapus direktori sesi: {$sessionDir} ({$fileCount} file)");
                    }
                }
            } catch (\Throwable $e) {
                $this->error("  ! Gagal membersihkan disk [{$diskName}]: ".$e->getMessage());
                Log::error("CleanCinemaTempStorageCommand: Error pada disk {$diskName}", ['exception' => $e]);
            }
        }

        $this->newLine();
        $this->info('=== Hasil Pembersihan ===');
        $this->line("✓ Total direktori sesi terhapus: {$totalDeletedDirs}");
        $this->line("✓ Total file sampah terhapus: {$totalDeletedFiles}");

        return Command::SUCCESS;
    }
}
