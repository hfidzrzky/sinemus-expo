<?php

namespace App\Services\Admin\Presale;

use App\Services\Admin\Presale\Support\CinemaQrImageExtractor;
use App\Services\Admin\Presale\Support\CinemaTicketTextExtractor;
use App\Services\Admin\Presale\Support\PdfTicketExtractorService;
use App\Services\Admin\Presale\Support\ZipArchiveExtractorService;
use DomainException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class CinemaPdfParserService
{
    public function __construct(
        protected ZipArchiveExtractorService $zipExtractor,
        protected PdfTicketExtractorService $pdfExtractor,
        protected CinemaTicketTextExtractor $textExtractor,
        protected CinemaQrImageExtractor $qrExtractor
    ) {}

    /**
     * Memproses berkas karcis bioskop (Master PDF atau arsip ZIP) dan mengekstrak data tiket.
     *
     * @return array<int, array{
     *     seat_codes: string[],
     *     booking_code: string,
     *     passcode: string,
     *     r2_qr_path: string,
     *     r2_preview_url: string
     * }>
     *
     * @throws DomainException
     */
    public function parse(UploadedFile $file): array
    {
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $sessionId = Str::uuid()->toString();

        if ($extension === 'zip') {
            return $this->parseZipArchive($file, $sessionId);
        }

        if ($extension === 'pdf') {
            return $this->parseMasterPdf($file, $sessionId);
        }

        throw new DomainException('Format berkas tidak didukung. Harap unggah berkas berekstensi PDF atau ZIP.');
    }

    /**
     * Memproses Master PDF multi-halaman.
     *
     * @return array<int, array{
     *     seat_codes: string[],
     *     booking_code: string,
     *     passcode: string,
     *     r2_qr_path: string,
     *     r2_preview_url: string
     * }>
     */
    public function parseMasterPdf(UploadedFile $pdfFile, string $sessionId): array
    {
        $realPath = (string) $pdfFile->getRealPath();

        return $this->pdfExtractor->extractFromPath($realPath, $sessionId);
    }

    /**
     * Mengekstrak seluruh karcis dari arsip ZIP dengan pengamanan ketat Anti-Zip Slip.
     *
     * @return array<int, array{
     *     seat_codes: string[],
     *     booking_code: string,
     *     passcode: string,
     *     r2_qr_path: string,
     *     r2_preview_url: string
     * }>
     */
    public function parseZipArchive(UploadedFile $zipFile, string $sessionId): array
    {
        $tempExtractDir = storage_path('app/temp/presale-zip/'.$sessionId);
        $extractedFiles = $this->zipExtractor->extractSafely((string) $zipFile->getRealPath(), $tempExtractDir);

        $tickets = [];

        foreach ($extractedFiles as $filePath) {
            $fileExtension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

            if ($fileExtension === 'pdf') {
                $pdfTickets = $this->pdfExtractor->extractFromPath($filePath, $sessionId);
                $tickets = array_merge($tickets, $pdfTickets);
            } elseif (in_array($fileExtension, ['png', 'jpg', 'jpeg'], true)) {
                $imageTicket = $this->parseTicketImageFile($filePath, $sessionId);
                if ($imageTicket !== null) {
                    $tickets[] = $imageTicket;
                }
            }
        }

        $this->zipExtractor->cleanUpDirectory($tempExtractDir);

        if (empty($tickets)) {
            throw new DomainException('Tidak ada tiket yang valid atau terbaca di dalam arsip ZIP.');
        }

        return $tickets;
    }

    /**
     * Memproses berkas karcis berupa gambar langsung (PNG, JPG).
     *
     * @return array{
     *     seat_codes: string[],
     *     booking_code: string,
     *     passcode: string,
     *     r2_qr_path: string,
     *     r2_preview_url: string
     * }|null
     */
    protected function parseTicketImageFile(string $imagePath, string $sessionId): ?array
    {
        $imageContent = file_get_contents($imagePath);
        if ($imageContent === false) {
            return null;
        }

        $decodedQr = $this->qrExtractor->decodeQrStringFromBinary($imageContent);
        if ($decodedQr === null) {
            return null;
        }

        $filename = pathinfo($imagePath, PATHINFO_FILENAME);
        $metadata = $this->textExtractor->extract($filename.' '.$decodedQr);

        if (empty($metadata['seat_codes'])) {
            return null;
        }

        $r2Result = $this->qrExtractor->storeTempQrImage($imageContent, $sessionId);

        return [
            'seat_codes' => $metadata['seat_codes'],
            'booking_code' => $metadata['booking_code'] !== '' ? $metadata['booking_code'] : $decodedQr,
            'passcode' => $metadata['passcode'],
            'r2_qr_path' => $r2Result['path'],
            'r2_preview_url' => $r2Result['url'],
        ];
    }

    /**
     * Backward-compatible delegation untuk teks extraction.
     *
     * @return array{seat_codes: string[], booking_code: string, passcode: string}
     */
    public function extractTicketMetadataFromText(string $text): array
    {
        return $this->textExtractor->extract($text);
    }

    /**
     * Backward-compatible delegation untuk Anti-Zip Slip Guard.
     *
     * @throws DomainException
     */
    public function guardAntiZipSlip(string $entryName, string $realTargetDir): void
    {
        $this->zipExtractor->guardAntiZipSlip($entryName, $realTargetDir);
    }
}
