<?php

namespace App\Services\Admin\Presale\Support;

use DomainException;
use Exception;
use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Page;
use Smalot\PdfParser\Parser as SmalotPdfParser;

class PdfTicketExtractorService
{
    public function __construct(
        protected CinemaTicketTextExtractor $textExtractor,
        protected CinemaQrImageExtractor $qrExtractor
    ) {}

    /**
     * Parse konten berkas PDF dari path lokal dan ekstrak tiket per halaman.
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
    public function extractFromPath(string $pdfPath, string $sessionId): array
    {
        $parser = new SmalotPdfParser;

        try {
            $document = $parser->parseFile($pdfPath);
        } catch (Exception $e) {
            Log::error('PdfTicketExtractorService: Gagal membaca berkas PDF', [
                'path' => $pdfPath,
                'error' => $e->getMessage(),
            ]);

            throw new DomainException('Gagal mem-parsing berkas PDF. Format PDF mungkin rusak atau terenkripsi.');
        }

        /** @var Page[] $pages */
        $pages = $document->getPages();
        $totalPages = count($pages);
        $tickets = [];
        $skipPages = [];

        for ($pageIndex = 0; $pageIndex < $totalPages; $pageIndex++) {
            if (in_array($pageIndex, $skipPages, true)) {
                continue;
            }

            $page = $pages[$pageIndex];
            $pageText = $page->getText();
            $ticketMetadata = $this->textExtractor->extract($pageText);
            $detectedPhone = null;

            // Jika tiket kehilangan passcode namun ada halaman berikutnya, cek lookahead untuk menangani overflow halaman
            if (! empty($ticketMetadata['booking_code']) && empty($ticketMetadata['passcode']) && ($pageIndex + 1 < $totalPages)) {
                $nextPageText = $pages[$pageIndex + 1]->getText();
                $nextPageMetadata = $this->textExtractor->extract($nextPageText);

                // Jika halaman berikutnya adalah kelanjutan (tidak memiliki booking code baru tersendiri)
                if (empty($nextPageMetadata['booking_code'])) {
                    $combinedText = $pageText."\n".$nextPageText;
                    $combinedMetadata = $this->textExtractor->extract($combinedText);

                    if (! empty($combinedMetadata['passcode']) || count($combinedMetadata['seat_codes']) > count($ticketMetadata['seat_codes'])) {
                        $ticketMetadata = $combinedMetadata;
                        $skipPages[] = $pageIndex + 1;
                    }
                }
            }

            // Ekstraksi QR Code dengan Hybrid Strategy (Mendukung Direct XObject, Flat High-Res Crop, dan Vector Fallback)
            $qrPathAndUrl = $this->qrExtractor->extractHybrid(
                document: $document,
                page: $page,
                pdfPath: $pdfPath,
                pageIndex: $pageIndex,
                sessionId: $sessionId,
                metadata: [
                    'seat_codes' => $ticketMetadata['seat_codes'],
                    'booking_code' => $ticketMetadata['booking_code'],
                    'passcode' => (string) ($ticketMetadata['passcode'] ?? ''),
                ]
            );

            // Jika QR berhasil didekode, ekstrak metadata muatan QR (misal format Cinema XXI m.tix: #6289658301529;67240)
            if (! empty($qrPathAndUrl['decoded_payload'])) {
                $qrInfo = $this->textExtractor->extractFromQrPayload((string) $qrPathAndUrl['decoded_payload']);
                if (empty($ticketMetadata['booking_code']) && ! empty($qrInfo['booking_code'])) {
                    $ticketMetadata['booking_code'] = $qrInfo['booking_code'];
                }
                if (empty($ticketMetadata['passcode']) && ! empty($qrInfo['passcode'])) {
                    $ticketMetadata['passcode'] = $qrInfo['passcode'];
                }
                if (! empty($qrInfo['detected_phone'])) {
                    $detectedPhone = $qrInfo['detected_phone'];
                }
            }

            // Jika setelah evaluasi teks & QR, tiket sama sekali tidak memiliki booking code, nomor kursi, dan tidak ada QR valid, lewati
            if (empty($ticketMetadata['booking_code']) && empty($ticketMetadata['seat_codes']) && empty($qrPathAndUrl['decoded_payload'])) {
                continue;
            }

            $tickets[] = [
                'seat_codes' => $ticketMetadata['seat_codes'],
                'booking_code' => $ticketMetadata['booking_code'] !== '' ? $ticketMetadata['booking_code'] : (string) ($qrPathAndUrl['decoded_payload'] ?? 'SINEMUS-PRESALE'),
                'passcode' => (string) ($ticketMetadata['passcode'] ?? ''),
                'detected_phone' => $detectedPhone,
                'detected_movie_title' => $ticketMetadata['detected_movie_title'] ?? null,
                'detected_studio' => $ticketMetadata['detected_studio'] ?? null,
                'detected_time' => $ticketMetadata['detected_time'] ?? null,
                'raw_text' => $ticketMetadata['raw_text'] ?? '',
                'r2_qr_path' => $qrPathAndUrl['r2_qr_path'],
                'r2_preview_url' => $qrPathAndUrl['r2_preview_url'],
                'qr_source' => $qrPathAndUrl['qr_source'] ?? 'original_pdf',
            ];
        }

        if (empty($tickets)) {
            throw new DomainException('Tidak ditemukan data tiket bioskop yang valid di dalam berkas PDF.');
        }

        return $tickets;
    }
}
