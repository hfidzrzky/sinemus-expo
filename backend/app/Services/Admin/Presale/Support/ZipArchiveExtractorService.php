<?php

namespace App\Services\Admin\Presale\Support;

use DomainException;

class ZipArchiveExtractorService
{
    /**
     * Mengekstrak seluruh entri arsip ZIP ke direktori tujuan dengan proteksi Anti-Zip Slip.
     *
     * @return array<int, string> Daftar path file yang berhasil diekstrak
     *
     * @throws DomainException
     */
    public function extractSafely(string $zipPath, string $targetDir): array
    {
        if (! is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $zip = new \ZipArchive;
        $openResult = $zip->open($zipPath);

        if ($openResult !== true) {
            $this->cleanUpDirectory($targetDir);
            throw new DomainException('Gagal membuka arsip ZIP. Pastikan berkas tidak rusak atau terenkripsi password.');
        }

        $extractedFiles = [];

        try {
            $realTargetDir = realpath($targetDir);
            if ($realTargetDir === false) {
                throw new DomainException('Direktori ekstraksi sementara tidak valid.');
            }

            for ($i = 0; $i < $zip->numFiles; $i++) {
                $entryName = $zip->getNameIndex($i);
                if ($entryName === false) {
                    continue;
                }

                // 1. Anti-Zip Slip & Path Traversal Guard
                $this->guardAntiZipSlip($entryName, $realTargetDir);

                // Abaikan direktori dan file metadata macOS (__MACOSX, .DS_Store)
                if (str_ends_with($entryName, '/') || str_contains($entryName, '__MACOSX') || str_starts_with(basename($entryName), '.')) {
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

                $extractedFiles[] = $destination;
            }
        } finally {
            $zip->close();
        }

        return $extractedFiles;
    }

    /**
     * Memvalidasi bahwa nama entri ZIP bebas dari serangan Path Traversal.
     *
     * @throws DomainException
     */
    public function guardAntiZipSlip(string $entryName, string $realTargetDir): void
    {
        if (str_contains($entryName, '..') || str_starts_with($entryName, '/') || str_starts_with($entryName, '\\')) {
            throw new DomainException("Upaya eksploitasi Zip Slip / Path Traversal terdeteksi pada entry: {$entryName}");
        }

        $safeName = basename($entryName);
        $fullPath = $realTargetDir.DIRECTORY_SEPARATOR.$safeName;
        $resolvedDir = realpath(dirname($fullPath)) ?: dirname($fullPath);

        if (! str_starts_with($resolvedDir, $realTargetDir)) {
            throw new DomainException('Upaya Path Traversal terdeteksi: entry menargetkan di luar direktori aman.');
        }
    }

    /**
     * Membersihkan direktori sementara dan seluruh berkas di dalamnya.
     */
    public function cleanUpDirectory(string $dir): void
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
