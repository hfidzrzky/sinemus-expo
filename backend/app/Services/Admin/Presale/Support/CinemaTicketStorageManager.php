<?php

namespace App\Services\Admin\Presale\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CinemaTicketStorageManager
{
    /**
     * Memeriksa apakah disk Cloudflare R2 telah dikonfigurasi dengan kredensial lengkap.
     */
    public static function isR2Configured(): bool
    {
        return ! empty(config('filesystems.disks.r2.key'))
            && ! empty(config('filesystems.disks.r2.secret'))
            && ! empty(config('filesystems.disks.r2.bucket'));
    }

    /**
     * Mendapatkan nama disk penyimpanan tiket bioskop default.
     * Mengutamakan R2 jika sedang unit testing atau kredensial R2 telah diisi di .env.
     */
    public static function getDefaultDisk(): string
    {
        if (app()->runningUnitTests()) {
            return 'r2';
        }

        $explicitDisk = config('filesystems.tickets_disk');
        if (! empty($explicitDisk) && in_array($explicitDisk, ['r2', 'public', 'local', 's3'], true)) {
            return $explicitDisk;
        }

        if (config('filesystems.default') === 'r2' || self::isR2Configured()) {
            return 'r2';
        }

        return 'public';
    }

    /**
     * Menyimpan file/binary gambar QR ke disk target utama dengan resilient failover ke public.
     *
     * @param  UploadedFile|string  $file  UploadedFile instance atau raw image binary string
     * @param  string  $directory  Direktori penyimpanan relatif (misal: 'cinema-tickets/permanent/2026/10')
     * @param  string  $filename  Nama berkas (misal: 'hash.png')
     * @return array{disk: string, path: string, url: string}
     */
    public static function storeTicketQrImage(UploadedFile|string $file, string $directory, string $filename): array
    {
        $primaryDisk = self::getDefaultDisk();
        $relativeFilePath = rtrim($directory, '/').'/'.$filename;
        $savedDisk = null;

        // 1. Coba simpan ke disk utama (R2 jika terkonfigurasi)
        try {
            if ($file instanceof UploadedFile) {
                $result = Storage::disk($primaryDisk)->putFileAs($directory, $file, $filename, 'public');
            } else {
                $result = Storage::disk($primaryDisk)->put($relativeFilePath, $file, 'public');
            }

            if ($result !== false && $result !== null) {
                $savedDisk = $primaryDisk;
            }
        } catch (\Throwable $e) {
            Log::warning('CinemaTicketStorageManager: Gagal mengunggah QR ke disk utama ['.$primaryDisk.'], melakukan failover ke disk public lokal.', [
                'path' => $relativeFilePath,
                'error' => $e->getMessage(),
            ]);
        }

        // 2. Failover ke disk 'public' lokal jika upload ke primary disk gagal dan primary bukan public
        if ($savedDisk === null && $primaryDisk !== 'public') {
            try {
                if ($file instanceof UploadedFile) {
                    $result = Storage::disk('public')->putFileAs($directory, $file, $filename, 'public');
                } else {
                    $result = Storage::disk('public')->put($relativeFilePath, $file, 'public');
                }

                if ($result !== false && $result !== null) {
                    $savedDisk = 'public';
                }
            } catch (\Throwable $fallbackError) {
                Log::error('CinemaTicketStorageManager: Failover ke disk public juga gagal.', [
                    'path' => $relativeFilePath,
                    'error' => $fallbackError->getMessage(),
                ]);
            }
        }

        $finalDisk = $savedDisk ?? $primaryDisk;
        $url = self::resolveFileUrl($relativeFilePath, $finalDisk);

        return [
            'disk' => $finalDisk,
            'path' => $relativeFilePath,
            'url' => $url,
        ];
    }

    /**
     * Mempromosikan file QR dari folder temp ke permanent dengan cross-disk awareness.
     *
     * @return array{disk: string, path: string, url: string}
     */
    public static function promoteTempToPermanent(string $tempPath, string $permanentPath): array
    {
        $primaryDisk = self::getDefaultDisk();

        // 0. Idempotency Check: Jika file permanent tujuan sudah ada di primary disk atau public disk, gunakan langsung
        if (Storage::disk($primaryDisk)->exists($permanentPath)) {
            return [
                'disk' => $primaryDisk,
                'path' => $permanentPath,
                'url' => self::resolveFileUrl($permanentPath, $primaryDisk),
            ];
        }

        if ($primaryDisk !== 'public' && Storage::disk('public')->exists($permanentPath)) {
            return [
                'disk' => 'public',
                'path' => $permanentPath,
                'url' => self::resolveFileUrl($permanentPath, 'public'),
            ];
        }

        $sourceDisk = null;

        // Cari di disk mana tempPath berada
        if (Storage::disk($primaryDisk)->exists($tempPath)) {
            $sourceDisk = $primaryDisk;
        } elseif ($primaryDisk !== 'public' && Storage::disk('public')->exists($tempPath)) {
            $sourceDisk = 'public';
        }

        // Jika tidak ditemukan di manapun, kembalikan tempPath as-is
        if ($sourceDisk === null) {
            return [
                'disk' => $primaryDisk,
                'path' => $tempPath,
                'url' => self::resolveFileUrl($tempPath, $primaryDisk),
            ];
        }

        // Jika sourceDisk sama dengan primaryDisk, gunakan native copy/move
        if ($sourceDisk === $primaryDisk) {
            try {
                Storage::disk($primaryDisk)->copy($tempPath, $permanentPath);
                Storage::disk($primaryDisk)->delete($tempPath);

                return [
                    'disk' => $primaryDisk,
                    'path' => $permanentPath,
                    'url' => self::resolveFileUrl($permanentPath, $primaryDisk),
                ];
            } catch (\Throwable $e) {
                Log::warning('CinemaTicketStorageManager: Native copy pada disk '.$primaryDisk.' gagal: '.$e->getMessage());
            }
        }

        // Cross-disk transfer: Baca dari sourceDisk lalu tulis ke primaryDisk
        try {
            $content = Storage::disk($sourceDisk)->get($tempPath);
            if ($content !== null && $content !== '') {
                $put = Storage::disk($primaryDisk)->put($permanentPath, $content, 'public');
                if ($put !== false) {
                    Storage::disk($sourceDisk)->delete($tempPath);

                    return [
                        'disk' => $primaryDisk,
                        'path' => $permanentPath,
                        'url' => self::resolveFileUrl($permanentPath, $primaryDisk),
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::warning('CinemaTicketStorageManager: Cross-disk transfer ke '.$primaryDisk.' gagal: '.$e->getMessage());
        }

        // Fallback: simpan di sourceDisk secara permanen jika transfer gagal
        try {
            Storage::disk($sourceDisk)->copy($tempPath, $permanentPath);
            Storage::disk($sourceDisk)->delete($tempPath);

            return [
                'disk' => $sourceDisk,
                'path' => $permanentPath,
                'url' => self::resolveFileUrl($permanentPath, $sourceDisk),
            ];
        } catch (\Throwable) {
            return [
                'disk' => $sourceDisk,
                'path' => $tempPath,
                'url' => self::resolveFileUrl($tempPath, $sourceDisk),
            ];
        }
    }

    /**
     * Menyelesaikan URL publik dari suatu path storage.
     */
    public static function resolveFileUrl(string $path, ?string $diskName = null): string
    {
        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        $r2Url = config('filesystems.disks.r2.url');

        // Jika disk spesifik diberikan
        if ($diskName === 'r2') {
            if (! empty($r2Url)) {
                return rtrim((string) $r2Url, '/').'/'.ltrim($path, '/');
            }

            return Storage::disk('r2')->url($path);
        }

        if ($diskName === 'public') {
            return Storage::disk('public')->url($path);
        }

        // Auto-detect disk jika diskName null
        if (self::isR2Configured() && Storage::disk('r2')->exists($path)) {
            if (! empty($r2Url)) {
                return rtrim((string) $r2Url, '/').'/'.ltrim($path, '/');
            }

            return Storage::disk('r2')->url($path);
        }

        if (Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->url($path);
        }

        // Fallback default
        if (! empty($r2Url)) {
            return rtrim((string) $r2Url, '/').'/'.ltrim($path, '/');
        }

        return Storage::url($path);
    }

    /**
     * Menghapus file gambar QR dari Cloudflare R2 dan storage publik lokal.
     */
    public static function deleteFile(?string $path): bool
    {
        if (empty($path) || Str::startsWith($path, ['http://', 'https://'])) {
            return false;
        }

        $deleted = false;
        $filename = basename($path);
        $yearMonth = date('Y/m');
        $altPermanent = "cinema-tickets/permanent/{$yearMonth}/{$filename}";

        // 1. Hapus dari Cloudflare R2 jika terkonfigurasi atau unit test
        if (self::isR2Configured() || app()->runningUnitTests()) {
            try {
                if (Storage::disk('r2')->exists($path)) {
                    Storage::disk('r2')->delete($path);
                    $deleted = true;
                }

                // Self-Healing: bersihkan juga path permanent pasangannya jika berbeda
                if ($altPermanent !== $path && Storage::disk('r2')->exists($altPermanent)) {
                    Storage::disk('r2')->delete($altPermanent);
                    $deleted = true;
                }
            } catch (\Throwable $e) {
                Log::warning("CinemaTicketStorageManager: Gagal menghapus file dari R2 [{$path}]: ".$e->getMessage());
            }
        }

        // 2. Hapus dari disk public lokal
        try {
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
                $deleted = true;
            }

            if ($altPermanent !== $path && Storage::disk('public')->exists($altPermanent)) {
                Storage::disk('public')->delete($altPermanent);
                $deleted = true;
            }
        } catch (\Throwable $e) {
            Log::warning("CinemaTicketStorageManager: Gagal menghapus file dari disk public [{$path}]: ".$e->getMessage());
        }

        return $deleted;
    }
}
