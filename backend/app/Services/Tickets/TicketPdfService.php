<?php

namespace App\Services\Tickets;

use App\Exceptions\Tickets\PdfGenerationException;
use App\Exceptions\Tickets\TicketNotFoundException;
use App\Models\EventTransaction;
use BaconQrCode\Common\ErrorCorrectionLevel;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Barryvdh\DomPDF\PDF;
use Carbon\Carbon;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TicketPdfService
{
    /**
     * Cache TTL untuk file PDF sementara (48 jam).
     * Melindungi CPU server dari lonjakan request saat peak hours tanpa membebani disk lokal selamanya.
     */
    public const CACHE_TTL_HOURS = 48;

    /**
     * Menghasilkan konten file PDF untuk transaksi tiket yang valid via Controller HTTP (Anti-IDOR).
     *
     * @return array{content: string, filename: string}
     *
     * @throws TicketNotFoundException
     * @throws PdfGenerationException
     */
    public function generateTicketPdf(int $userId, string $orderId): array
    {
        // 1. Anti-IDOR Strict Query: Wajib milik user yang terotentikasi & status pembayaran lunas
        $transaction = $this->findAuthorizedTransaction($userId, $orderId);

        return $this->generatePdfForTransaction($transaction);
    }

    /**
     * Menghasilkan konten file PDF langsung dari instance EventTransaction (dipakai oleh Mailable attachment & Queue).
     *
     * @return array{content: string, filename: string}
     *
     * @throws PdfGenerationException
     */
    public function generatePdfForTransaction(EventTransaction $transaction): array
    {
        $orderId = $transaction->order_id;
        $filename = "Sinemus-Tiket-{$orderId}.pdf";

        // 3. Entity Cache Hash untuk mendeteksi perubahan state (misal checkin atau update)
        $cachedFilePath = $this->buildCacheFilePath($transaction, $orderId);

        // 4. Fast Cache Hit (<10ms) dengan verifikasi TTL 48 Jam
        $cachedContent = $this->readFromCache($cachedFilePath);
        if ($cachedContent !== null) {
            return ['content' => $cachedContent, 'filename' => $filename];
        }

        // 5. Atomic Lock (Mencegah Race Condition / Concurrency Stomp pada pembuatan PDF)
        return $this->renderWithLock($orderId, $filename, function () use (
            $transaction, $cachedFilePath
        ): string {
            // Double-check cache setelah mendapatkan lock
            $cachedContent = $this->readFromCache($cachedFilePath);
            if ($cachedContent !== null) {
                return $cachedContent;
            }

            // 6. Generate Data URI QR Code lokal tanpa HTTP outbound (SSRF-proof & Fast)
            $qrDataUri = $this->generateQrDataUri($transaction);

            // 7. Siapkan Payload View
            $viewData = $this->buildViewData($transaction, $qrDataUri);

            // 8. Template View Reguler E-Tiket
            $viewName = 'pdf.regular-ticket';

            // 9. Render PDF via DomPDF wrapper
            $pdfContent = $this->renderPdfContent($viewName, $viewData);

            // 10. Simpan ke Cache Ephemeral (Storage Local)
            Storage::disk('local')->put($cachedFilePath, $pdfContent);

            return $pdfContent;
        });
    }

    /**
     * Membersihkan file cache PDF yang telah melebihi masa aktif (48 jam).
     * Dapat dijalankan berkala oleh cron / task scheduler Laravel untuk menjaga kapasitas storage.
     */
    public function pruneExpiredPdfCache(): int
    {
        $files = Storage::disk('local')->files('tickets/cache');
        $deletedCount = 0;
        $expirationThreshold = now()->subHours(self::CACHE_TTL_HOURS)->timestamp;

        foreach ($files as $file) {
            if (Storage::disk('local')->lastModified($file) < $expirationThreshold) {
                Storage::disk('local')->delete($file);
                $deletedCount++;
            }
        }

        return $deletedCount;
    }

    // ─────────────────────────────────────────────────────────────
    //  Transaction & Authorization
    // ─────────────────────────────────────────────────────────────

    /**
     * Anti-IDOR Strict Query: Wajib milik user yang terotentikasi & status pembayaran lunas.
     *
     * @throws TicketNotFoundException
     */
    private function findAuthorizedTransaction(int $userId, string $orderId): EventTransaction
    {
        $transaction = EventTransaction::with(['schedule.event', 'user'])
            ->where('user_id', $userId)
            ->where('order_id', $orderId)
            ->where('payment_status', 'paid')
            ->first();

        if (! $transaction) {
            throw new TicketNotFoundException(
                "Transaksi tiket dengan ID '{$orderId}' tidak ditemukan atau Anda tidak memiliki akses."
            );
        }

        return $transaction;
    }

    // ─────────────────────────────────────────────────────────────
    //  Filename & Cache Key Resolution
    // ─────────────────────────────────────────────────────────────

    /**
     * Membangun path cache file dengan Entity Hash untuk deteksi perubahan state.
     * Menggunakan separator yang aman untuk semua OS (tanpa karakter ':' yang ilegal di Windows NTFS).
     */
    private function buildCacheFilePath(EventTransaction $transaction, string $orderId): string
    {
        $stateHash = md5(
            ($transaction->checkin_status ?? 'pending').
            ($transaction->qr_hash ?? '').
            ($transaction->ticket_code ?? '').
            ((string) ($transaction->updated_at?->timestamp ?? ''))
        );

        $safeOrderId = Str::slug($orderId);

        return "tickets/cache/ticket_pdf_{$safeOrderId}_{$stateHash}.pdf";
    }

    /**
     * Menghapus seluruh cache PDF yang tersimpan untuk order ID tertentu.
     */
    public function purgeCache(string $orderId): void
    {
        $safeOrderId = Str::slug($orderId);
        $disk = Storage::disk('local');

        if ($disk->exists('tickets/cache')) {
            $files = $disk->files('tickets/cache');
            foreach ($files as $file) {
                if (Str::startsWith(basename($file), "ticket_pdf_{$safeOrderId}_")) {
                    $disk->delete($file);
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  Cache Operations
    // ─────────────────────────────────────────────────────────────

    /**
     * Membaca PDF dari cache jika masih valid (belum expired TTL 48 jam).
     * Mengembalikan null jika cache miss, expired, atau corrupt.
     */
    private function readFromCache(string $cachedFilePath): ?string
    {
        if (! Storage::disk('local')->exists($cachedFilePath)) {
            return null;
        }

        $lastModified = Storage::disk('local')->lastModified($cachedFilePath);

        if (Carbon::createFromTimestamp($lastModified)->lte(now()->subHours(self::CACHE_TTL_HOURS))) {
            Log::info('TicketPdfService: Cache expired, will re-render.', ['path' => $cachedFilePath]);

            return null;
        }

        $content = Storage::disk('local')->get($cachedFilePath);

        if ($content === null || $content === '') {
            Log::warning('TicketPdfService: Cache file exists but is empty or unreadable.', [
                'path' => $cachedFilePath,
            ]);

            return null;
        }

        return $content;
    }

    /**
     * Render PDF dalam Atomic Lock untuk mencegah race condition.
     *
     * @param  callable(): string  $renderCallback  Callback yang mengembalikan PDF content string
     * @return array{content: string, filename: string}
     *
     * @throws PdfGenerationException
     */
    private function renderWithLock(string $orderId, string $filename, callable $renderCallback): array
    {
        $lockKey = "lock:pdf_render:{$orderId}";
        $lock = Cache::lock($lockKey, 15);

        try {
            /** @var string $content */
            $content = $lock->block(10, function () use ($renderCallback): string {
                return $renderCallback();
            });

            return ['content' => $content, 'filename' => $filename];
        } catch (LockTimeoutException $e) {
            Log::error('TicketPdfService: Failed to acquire render lock within timeout.', [
                'order_id' => $orderId,
                'lock_key' => $lockKey,
            ]);

            throw new PdfGenerationException(
                'Server sedang sibuk memproses tiket lain. Silakan coba lagi dalam beberapa detik.',
                503,
                $e
            );
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  QR Code Generation (Native Offline Vector SVG)
    // ─────────────────────────────────────────────────────────────

    /**
     * Generate Native Vector QR Code (SVG) menjadi Base64 Data URI untuk di-embed ke PDF.
     * 100% Offline, ISO/IEC 18004, Error Correction Level H, Quiet Zone Margin.
     */
    private function generateQrDataUri(EventTransaction $transaction): string
    {
        $qrString = $this->resolveQrPayload($transaction);
        $svg = $this->generateVectorQrSvg($qrString);

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }

    /**
     * Menentukan string payload yang akan di-encode ke QR code.
     * Prioritas:
     * 1. Regular Event (Assigned Seating / General Admission): qr_hash (32 hex string terenkripsi) untuk panitia venue scanner.
     * 2. Fallback: ticket_code → order_id.
     */
    private function resolveQrPayload(EventTransaction $transaction): string
    {
        if (! empty($transaction->qr_hash)) {
            return $transaction->qr_hash;
        }

        return $transaction->ticket_code ?? $transaction->order_id;
    }

    /**
     * Menghasilkan kode QR SVG standar ISO/IEC 18004 dengan Error Correction Level H dan Quiet Zone Margin.
     */
    private function generateVectorQrSvg(string $payload): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle(200, 1),
            new SvgImageBackEnd
        );

        $writer = new Writer($renderer);

        return $writer->writeString($payload, 'UTF-8', ErrorCorrectionLevel::H());
    }

    // ─────────────────────────────────────────────────────────────
    //  View Data & PDF Rendering
    // ─────────────────────────────────────────────────────────────

    /**
     * Render PDF content via DomPDF wrapper (250mm x 150mm Landscape Ticket).
     *
     * @param  array<string, mixed>  $viewData
     */
    private function renderPdfContent(string $viewName, array $viewData): string
    {
        /** @var PDF $dompdf */
        $dompdf = app('dompdf.wrapper');
        $dompdf->setPaper([0, 0, 708.66, 425.20], 'landscape');
        $dompdf->loadView($viewName, $viewData);

        return $dompdf->output();
    }

    /**
     * Menyiapkan variabel view yang konsisten dan anti-null.
     * Menggunakan SSOT dari Schedule/Event dan fallback snapshot_event_data.
     *
     * @return array<string, mixed>
     */
    private function buildViewData(EventTransaction $transaction, string $qrDataUri): array
    {
        $showTime = $transaction->schedule?->show_time
            ?? ($transaction->snapshot_event_data['show_time'] ?? null);
        $showTimeFormatted = $showTime
            ? Carbon::parse($showTime)->locale('id')->isoFormat('dddd, D MMMM Y - HH:mm').' WIB'
            : '-';
        $paidAtFormatted = $transaction->paid_at
            ? Carbon::parse($transaction->paid_at)->locale('id')->isoFormat('D MMMM Y, HH:mm').' WIB'
            : '-';

        $rawSeats = is_array($transaction->snapshot_seats) ? $transaction->snapshot_seats : [];
        $seats = array_values(array_filter($rawSeats, fn ($s) => ! empty($s) && $s !== '-'));
        $hasAssignedSeats = count($seats) > 0;
        $ticketQuantity = (int) ($transaction->ticket_quantity ?? ($hasAssignedSeats ? count($seats) : 1));

        $eventTitle = $transaction->schedule?->event?->title
            ?? ($transaction->snapshot_event_data['event_title'] ?? 'Cinema Screening');
        $venueName = $transaction->schedule?->event?->venue_name
            ?? ($transaction->snapshot_event_data['venue_name'] ?? 'Bioskop Mitra');
        $city = $transaction->schedule?->event?->city
            ?? ($transaction->snapshot_event_data['city'] ?? 'Indonesia');

        // Studio name SSOT: kolom database tabel schedules adalah studio_name (bukan auditorium_name)
        $studioName = $transaction->schedule?->studio_name
            ?? ($transaction->snapshot_event_data['studio_name'] ?? 'Studio Utama');

        $logoDataUri = $this->resolveLogoDataUri();

        return [
            'order_id' => $transaction->order_id,
            'ticket_code' => $transaction->ticket_code ?? $transaction->order_id,
            'customer_name' => $transaction->user?->name ?? 'Penonton Sinemus',
            'event_title' => $eventTitle,
            'venue_name' => $venueName,
            'city' => $city,
            'auditorium_name' => $studioName,
            'show_time_formatted' => $showTimeFormatted,
            'paid_at_formatted' => $paidAtFormatted,
            'seats' => $seats,
            'has_assigned_seats' => $hasAssignedSeats,
            'ticket_quantity' => $ticketQuantity,
            'qr_data_uri' => $qrDataUri,
            'logo_data_uri' => $logoDataUri,
        ];
    }

    /**
     * Resolve logo dari public_path() saja (tanpa cross-boundary fallback ke frontend).
     * Logo WAJIB ada di backend/public/sinemus-logo.png.
     */
    private function resolveLogoDataUri(): string
    {
        $logoPath = public_path('sinemus-logo.png');

        if (! file_exists($logoPath)) {
            Log::warning('TicketPdfService: Logo file not found at public_path. PDF will render without logo.', [
                'expected_path' => $logoPath,
            ]);

            return '';
        }

        $logoBinary = file_get_contents($logoPath);
        if ($logoBinary === false) {
            Log::warning('TicketPdfService: Failed to read logo file.', ['path' => $logoPath]);

            return '';
        }

        return 'data:image/png;base64,'.base64_encode($logoBinary);
    }
}
