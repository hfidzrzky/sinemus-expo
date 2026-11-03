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
        $eventType = (string) ($transaction->schedule?->event?->event_type
            ?? ($transaction->snapshot_event_data['event_type'] ?? 'regular'));
        $isCinemaPresale = ($eventType === 'presale_cinema');
        $isFulfilled = $transaction->fulfillment_status === 'fulfilled';

        // 2. Tentukan nama file yang bersih dan semantik
        $filename = $this->resolveFilename($orderId, $isCinemaPresale, $isFulfilled);

        // 3. Entity Cache Hash untuk mendeteksi perubahan state (misal checkin atau update fulfillment)
        $cachedFilePath = $this->buildCacheFilePath($transaction, $orderId);

        // 4. Fast Cache Hit (<10ms) dengan verifikasi TTL 48 Jam
        $cachedContent = $this->readFromCache($cachedFilePath);
        if ($cachedContent !== null) {
            return ['content' => $cachedContent, 'filename' => $filename];
        }

        // 5. Atomic Lock (Mencegah Race Condition / Concurrency Stomp pada pembuatan PDF)
        return $this->renderWithLock($orderId, $cachedFilePath, $filename, function () use (
            $transaction, $isCinemaPresale, $isFulfilled, $cachedFilePath
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

            // 8. Pilih Blade Template sesuai varian
            $viewName = $this->resolveViewTemplate($isCinemaPresale, $isFulfilled);

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
     * Menentukan nama file PDF yang bersih dan semantik.
     */
    private function resolveFilename(string $orderId, bool $isCinemaPresale, bool $isFulfilled): string
    {
        if (! $isCinemaPresale) {
            return "Sinemus-Tiket-{$orderId}.pdf";
        }

        return $isFulfilled
            ? "Sinemus-Tiket-Bioskop-{$orderId}.pdf"
            : "Sinemus-Bukti-Presale-{$orderId}.pdf";
    }

    /**
     * Membangun path cache file dengan Entity Hash untuk deteksi perubahan state.
     * Menggunakan separator yang aman untuk semua OS (tanpa karakter ':' yang ilegal di Windows NTFS).
     */
    private function buildCacheFilePath(EventTransaction $transaction, string $orderId): string
    {
        $stateHash = md5(
            ($transaction->checkin_status ?? 'pending').
            ($transaction->fulfillment_status ?? 'unfulfilled').
            ($transaction->cinema_booking_code ?? '').
            ($transaction->cinema_passcode ?? '').
            ($transaction->cinema_qr_image_path ?? '').
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
    private function renderWithLock(string $orderId, string $cachedFilePath, string $filename, callable $renderCallback): array
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
    //  QR Code Generation (3 Strategy Methods)
    // ─────────────────────────────────────────────────────────────

    /**
     * Ekstrak atau generate QR Code menjadi Base64 Data URI untuk di-embed ke PDF.
     * Menggunakan strategi bertingkat: Local File → Storage Disk → SVG Generation.
     */
    private function generateQrDataUri(EventTransaction $transaction): string
    {
        // Strategi 1: Presale Fulfilled dengan QR image tersimpan
        if ($transaction->fulfillment_status === 'fulfilled' && ! empty($transaction->cinema_qr_image_path)) {
            $path = $transaction->cinema_qr_image_path;

            // Skip URL paths — hanya proses file lokal/storage
            if (! Str::startsWith($path, ['http://', 'https://'])) {
                $primaryDisk = config('filesystems.default') === 'r2' ? 'r2' : 'public';
                $secondaryDisk = $primaryDisk === 'r2' ? 'public' : 'r2';

                foreach ([$primaryDisk, $secondaryDisk] as $disk) {
                    try {
                        if (Storage::disk($disk)->exists($path)) {
                            $data = Storage::disk($disk)->get($path);
                            if ($data !== null && $data !== '') {
                                $finfo = new \finfo(FILEINFO_MIME_TYPE);
                                $mime = $finfo->buffer($data) ?: 'image/png';

                                return 'data:'.$mime.';base64,'.base64_encode($data);
                            }
                        }
                    } catch (\Throwable) {
                        // Lanjutkan ke disk berikutnya jika terjadi error
                    }
                }

                $dataUri = $this->resolveQrFromLocalFile($path);
                if ($dataUri !== null) {
                    return $dataUri;
                }

                $dataUri = $this->resolveQrFromStorageDisk($path);
                if ($dataUri !== null) {
                    return $dataUri;
                }

                // Self-Healing: Jika path mencatat temp tapi berkas sudah dipromosikan ke permanent
                $filename = basename($path);
                $yearMonth = date('Y/m');
                $altPermanent = "cinema-tickets/permanent/{$yearMonth}/{$filename}";
                foreach ([$primaryDisk, $secondaryDisk] as $disk) {
                    try {
                        if (Storage::disk($disk)->exists($altPermanent)) {
                            $data = Storage::disk($disk)->get($altPermanent);
                            if ($data !== null && $data !== '') {
                                $finfo = new \finfo(FILEINFO_MIME_TYPE);
                                $mime = $finfo->buffer($data) ?: 'image/png';

                                return 'data:'.$mime.';base64,'.base64_encode($data);
                            }
                        }
                    } catch (\Throwable) {
                        // Lanjutkan ke disk berikutnya
                    }
                }

                Log::warning('TicketPdfService: QR image path exists in DB but file not found anywhere, falling back to SVG generation.', [
                    'order_id' => $transaction->order_id,
                    'qr_image_path' => $path,
                ]);
            }
        }

        // Strategi 2: Native Vector QR Code (SVG) — 100% Offline, ISO-Standard
        return $this->generateFallbackQrSvg($transaction);
    }

    /**
     * Membaca QR image dari file lokal dengan Path Traversal Guard.
     * Hanya mengizinkan file di bawah storage_path() atau public_path() untuk mencegah LFI.
     */
    private function resolveQrFromLocalFile(string $path): ?string
    {
        $realPath = realpath($path);

        // Guard: realpath() returns false jika file tidak ada
        if ($realPath === false) {
            return null;
        }

        // Guard: Path Traversal Protection — hanya izinkan file di dalam direktori aman
        if (! $this->isPathWithinAllowedDirectories($realPath)) {
            Log::warning('TicketPdfService: Blocked path traversal attempt on QR image.', [
                'requested_path' => $path,
                'resolved_path' => $realPath,
            ]);

            return null;
        }

        $data = file_get_contents($realPath);
        if ($data === false || $data === '') {
            return null;
        }

        $mime = mime_content_type($realPath) ?: 'image/png';

        return 'data:'.$mime.';base64,'.base64_encode($data);
    }

    /**
     * Validasi bahwa path berada di dalam direktori yang diizinkan.
     * Mencegah Local File Inclusion (LFI) / Path Traversal.
     */
    private function isPathWithinAllowedDirectories(string $resolvedPath): bool
    {
        $allowedBasePaths = [
            realpath(storage_path()) ?: storage_path(),
            realpath(public_path()) ?: public_path(),
        ];

        foreach ($allowedBasePaths as $basePath) {
            if (str_starts_with($resolvedPath, $basePath.DIRECTORY_SEPARATOR)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Membaca QR image dari Laravel Storage disk 'public'.
     * Menentukan MIME type dari konten binary (bukan nama file) untuk keamanan.
     */
    private function resolveQrFromStorageDisk(string $path): ?string
    {
        if (! Storage::disk('public')->exists($path)) {
            return null;
        }

        $data = Storage::disk('public')->get($path);

        if ($data === null || $data === '') {
            return null;
        }

        // Deteksi MIME dari konten binary file, bukan dari ekstensi nama file
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->buffer($data) ?: 'image/png';

        return 'data:'.$mime.';base64,'.base64_encode($data);
    }

    /**
     * Generate QR Code SVG dari data transaksi sebagai fallback.
     * ISO/IEC 18004, Error Correction Level H, Quiet Zone Margin.
     */
    private function generateFallbackQrSvg(EventTransaction $transaction): string
    {
        $qrString = $this->resolveQrPayload($transaction);
        $svg = $this->generateVectorQrSvg($qrString);

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }

    /**
     * Menentukan string payload yang akan di-encode ke QR code.
     * Prioritas:
     * 1. Presale Cinema Fulfilled: booking_code-passcode (atau cinema_qr_image_path) untuk kiosk scanner.
     * 2. Regular Event: qr_hash (32 hex string terenkripsi) untuk panitia venue scanner.
     * 3. Fallback: ticket_code → order_id.
     */
    private function resolveQrPayload(EventTransaction $transaction): string
    {
        $eventType = (string) ($transaction->schedule?->event?->event_type
            ?? ($transaction->snapshot_event_data['event_type'] ?? 'regular'));
        $isCinemaPresale = ($eventType === 'presale_cinema');
        $isFulfilled = ($transaction->fulfillment_status === 'fulfilled');

        // Untuk tiket bioskop presale yang sudah fulfilled: QR Kiosk WAJIB berisi kredensial booking code & passcode
        if ($isCinemaPresale && $isFulfilled) {
            $bookingCode = $transaction->cinema_booking_code ?? '';
            $passcode = $transaction->cinema_passcode ?? '';

            if ($bookingCode !== '' && $passcode !== '' && $bookingCode !== '-' && $passcode !== '-') {
                return "{$bookingCode}-{$passcode}";
            }
        }

        // Untuk regular screening tiket: QR wajib berisi qr_hash untuk gate scanner panitia
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
     * Pilih Blade Template sesuai varian tiket.
     */
    private function resolveViewTemplate(bool $isCinemaPresale, bool $isFulfilled): string
    {
        if (! $isCinemaPresale) {
            return 'pdf.regular-ticket';
        }

        return $isFulfilled ? 'pdf.presale-fulfilled' : 'pdf.presale-receipt';
    }

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
            'cinema_booking_code' => $transaction->cinema_booking_code ?? '-',
            'cinema_passcode' => $transaction->cinema_passcode ?? '-',
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
