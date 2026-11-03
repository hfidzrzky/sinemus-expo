<?php

namespace App\Services\Tickets;

use App\Models\EventTransaction;
use BaconQrCode\Common\ErrorCorrectionLevel;
use BaconQrCode\Encoder\Encoder;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TicketEmailPayloadBuilder
{
    /**
     * Membangun payload data terstandarisasi untuk template email konfirmasi tiket.
     * Mengikuti prinsip SSOT (Single Source of Truth) sinkron dengan TicketPdfService.
     *
     * @return array<string, mixed>
     */
    public function build(EventTransaction $transaction): array
    {
        $user = $transaction->user;
        $eventTitle = $transaction->schedule?->event?->title
            ?? ($transaction->snapshot_event_data['event_title'] ?? 'Sinemus Cinema Screening');
        $venueName = $transaction->schedule?->event?->venue_name
            ?? ($transaction->snapshot_event_data['venue_name'] ?? 'Bioskop Mitra Sinemus');
        $orderId = $transaction->order_id;
        $ticketCode = $transaction->ticket_code ?? $orderId;

        $showTime = $transaction->schedule?->show_time
            ?? ($transaction->snapshot_event_data['show_time'] ?? null);
        $showTimeFormatted = $showTime
            ? Carbon::parse($showTime)->locale('id')->isoFormat('dddd, D MMMM Y - HH:mm').' WIB'
            : '-';

        $studioName = $transaction->schedule?->studio_name
            ?? ($transaction->snapshot_event_data['studio_name'] ?? 'Studio Utama');

        // Deteksi apakah pemesanan ini memiliki nomor kursi spesifik atau General Admission (Free Seating)
        $rawSeats = is_array($transaction->snapshot_seats) ? $transaction->snapshot_seats : [];
        $seats = array_values(array_filter($rawSeats, fn ($s) => ! empty($s) && $s !== '-'));
        $hasAssignedSeats = count($seats) > 0;
        $seatsText = $hasAssignedSeats ? implode(', ', $seats) : 'Bebas Pilih Kursi (Free Seating)';
        $ticketQuantity = (int) ($transaction->ticket_quantity ?? ($hasAssignedSeats ? count($seats) : 1));

        $totalFormatted = number_format((float) $transaction->net_amount, 0, ',', '.');

        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
        $apiUrl = rtrim(config('app.url', env('APP_URL', 'http://localhost:8000')), '/');

        $ticketWebUrl = "{$frontendUrl}/tickets";
        $ticketPdfUrl = "{$apiUrl}/api/v1/user/tickets/{$orderId}/pdf";

        // Template view reguler & subjek email semantik
        $viewTemplate = 'emails.tickets.regular-event';
        $subject = "Konfirmasi E-Tiket: {$eventTitle} ({$orderId})";

        // QR Info untuk email tiket regular lunas
        $qrInfo = [
            'dataUri' => '',
            'localPath' => null,
            'binary' => null,
            'mime' => 'image/png',
        ];
        if ($transaction->payment_status === 'paid') {
            $qrInfo = $this->resolveQrInfo($transaction);
        }

        // Siapkan Logo Resmi Sinemus Screen sebagai Data URI & Local Path
        $logoLocalPath = public_path('sinemus-logo.png');
        $logoDataUri = $this->resolveLogoDataUri();

        return [
            'viewTemplate' => $viewTemplate,
            'subject' => $subject,
            'userName' => $user?->name ?? 'Penonton Sinemus',
            'userEmail' => $user?->email ?? '',
            'orderId' => $orderId,
            'ticketCode' => $ticketCode,
            'eventTitle' => $eventTitle,
            'venueName' => $venueName,
            'studioName' => $studioName,
            'showTimeFormatted' => $showTimeFormatted,
            'hasAssignedSeats' => $hasAssignedSeats,
            'seatsText' => $seatsText,
            'ticketQuantity' => $ticketQuantity,
            'totalFormatted' => $totalFormatted,
            'ticketWebUrl' => $ticketWebUrl,
            'ticketPdfUrl' => $ticketPdfUrl,
            'cinemaBookingCode' => $transaction->cinema_booking_code ?? '-',
            'cinemaPasscode' => $transaction->cinema_passcode ?? '-',
            'qrDataUri' => $qrInfo['dataUri'],
            'qrLocalPath' => $qrInfo['localPath'],
            'qrBinary' => $qrInfo['binary'],
            'qrMime' => $qrInfo['mime'],
            'logoLocalPath' => file_exists($logoLocalPath) ? $logoLocalPath : null,
            'logoDataUri' => $logoDataUri,
            'isCinemaPresale' => false,
            'isFulfilled' => false,
        ];
    }

    /**
     * Membaca logo resmi dari public/sinemus-logo.png dan meng-encode menjadi base64 data URI.
     */
    private function resolveLogoDataUri(): string
    {
        $logoPath = public_path('sinemus-logo.png');

        if (! file_exists($logoPath)) {
            return '';
        }

        $logoBinary = file_get_contents($logoPath);
        if ($logoBinary === false) {
            return '';
        }

        return 'data:image/png;base64,'.base64_encode($logoBinary);
    }

    /**
     * Ekstrak QR Code sebagai binary, local path, dan data URI untuk CID embedding maupun fallback.
     *
     * @return array{dataUri: string, localPath: ?string, binary: ?string, mime: string}
     */
    public function resolveQrInfo(EventTransaction $transaction): array
    {
        // 1. Cek cinema_qr_image_path tersimpan
        if (! empty($transaction->cinema_qr_image_path)) {
            $path = $transaction->cinema_qr_image_path;

            if (! Str::startsWith($path, ['http://', 'https://'])) {
                $primaryDisk = config('filesystems.default') === 'r2' ? 'r2' : 'public';
                $secondaryDisk = $primaryDisk === 'r2' ? 'public' : 'r2';

                foreach ([$primaryDisk, $secondaryDisk] as $disk) {
                    try {
                        if (Storage::disk($disk)->exists($path)) {
                            $binary = Storage::disk($disk)->get($path);
                            if ($binary !== null && $binary !== '') {
                                $finfo = new \finfo(FILEINFO_MIME_TYPE);
                                $mime = $finfo->buffer($binary) ?: 'image/png';
                                $localPath = null;
                                if ($disk === 'public') {
                                    $diskPath = Storage::disk('public')->path($path);
                                    if (file_exists($diskPath)) {
                                        $localPath = $diskPath;
                                    }
                                }

                                return [
                                    'dataUri' => 'data:'.$mime.';base64,'.base64_encode($binary),
                                    'localPath' => $localPath,
                                    'binary' => $binary,
                                    'mime' => $mime,
                                ];
                            }
                        }
                    } catch (\Throwable) {
                        // Lanjutkan ke disk berikutnya jika terjadi error
                    }
                }

                // Local file check dengan Path Traversal Guard
                $realPath = realpath($path);
                if ($realPath !== false && $this->isSafePath($realPath)) {
                    $binary = file_get_contents($realPath);
                    if ($binary !== false && $binary !== '') {
                        $mime = mime_content_type($realPath) ?: 'image/png';

                        return [
                            'dataUri' => 'data:'.$mime.';base64,'.base64_encode($binary),
                            'localPath' => $realPath,
                            'binary' => $binary,
                            'mime' => $mime,
                        ];
                    }
                }

                // Self-Healing: Jika path mencatat temp tapi berkas sudah dipromosikan ke permanent
                $filename = basename($path);
                $yearMonth = date('Y/m');
                $altPermanent = "cinema-tickets/permanent/{$yearMonth}/{$filename}";
                foreach ([$primaryDisk, $secondaryDisk] as $disk) {
                    try {
                        if (Storage::disk($disk)->exists($altPermanent)) {
                            $binary = Storage::disk($disk)->get($altPermanent);
                            if (! empty($binary)) {
                                $finfo = new \finfo(FILEINFO_MIME_TYPE);
                                $mime = $finfo->buffer($binary) ?: 'image/png';
                                $localPath = null;
                                if ($disk === 'public') {
                                    $diskPath = Storage::disk('public')->path($altPermanent);
                                    if (file_exists($diskPath)) {
                                        $localPath = $diskPath;
                                    }
                                }

                                return [
                                    'dataUri' => 'data:'.$mime.';base64,'.base64_encode($binary),
                                    'localPath' => $localPath,
                                    'binary' => $binary,
                                    'mime' => $mime,
                                ];
                            }
                        }
                    } catch (\Throwable) {
                        // Coba disk lain
                    }
                }
            }
        }

        // 2. Fallback: Generate Lossless PNG Vector QR Code (Strict PNG untuk kompatibilitas Gmail & Apple Mail)
        $eventType = (string) ($transaction->schedule?->event?->event_type
            ?? ($transaction->snapshot_event_data['event_type'] ?? 'regular'));
        $isCinemaPresale = ($eventType === 'presale_cinema');
        $isFulfilled = ($transaction->fulfillment_status === 'fulfilled');

        if ($isCinemaPresale && $isFulfilled) {
            $bookingCode = $transaction->cinema_booking_code ?? '';
            $passcode = $transaction->cinema_passcode ?? '';
            $qrPayload = ($bookingCode !== '' && $passcode !== '' && $bookingCode !== '-' && $passcode !== '-')
                ? "{$bookingCode}-{$passcode}"
                : ($transaction->qr_hash ?? $transaction->ticket_code ?? $transaction->order_id);
        } else {
            $qrPayload = $transaction->qr_hash ?? $transaction->ticket_code ?? $transaction->order_id;
        }

        try {
            $pngBinary = $this->generateVectorQrPngBinary($qrPayload);

            if (! empty($pngBinary)) {
                return [
                    'dataUri' => 'data:image/png;base64,'.base64_encode($pngBinary),
                    'localPath' => null,
                    'binary' => $pngBinary,
                    'mime' => 'image/png',
                ];
            }

            // Secondary fallback via SVG jika GD tidak tersedia
            $renderer = new ImageRenderer(
                new RendererStyle(200, 1),
                new SvgImageBackEnd
            );
            $writer = new Writer($renderer);
            $svg = $writer->writeString($qrPayload, 'UTF-8', ErrorCorrectionLevel::H());

            return [
                'dataUri' => 'data:image/svg+xml;base64,'.base64_encode($svg),
                'localPath' => null,
                'binary' => $svg,
                'mime' => 'image/svg+xml',
            ];
        } catch (\Throwable $e) {
            Log::warning('TicketEmailPayloadBuilder: Gagal membuat fallback QR code.', [
                'order_id' => $transaction->order_id,
                'error' => $e->getMessage(),
            ]);

            return [
                'dataUri' => '',
                'localPath' => null,
                'binary' => null,
                'mime' => 'image/png',
            ];
        }
    }

    /**
     * Backward-compatible helper untuk mendapatkan QR Data URI.
     */
    public function generateQrDataUri(EventTransaction $transaction): string
    {
        return $this->resolveQrInfo($transaction)['dataUri'];
    }

    /**
     * Mencegah Local File Inclusion (LFI).
     */
    private function isSafePath(string $resolvedPath): bool
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
     * Menghasilkan binary PNG kode QR murni (lossless) menggunakan PHP GD & BaconQrCode Encoder.
     * Tidak membutuhkan ekstensi Imagick atau Ghostscript, 100% kompatibel di semua email client.
     */
    public function generateVectorQrPngBinary(string $payload): string
    {
        if (! extension_loaded('gd')) {
            return '';
        }

        try {
            $qrCode = Encoder::encode($payload, ErrorCorrectionLevel::H(), 'UTF-8');
            $matrix = $qrCode->getMatrix();

            $matrixWidth = $matrix->getWidth();
            $matrixHeight = $matrix->getHeight();

            $scale = 8;
            $margin = 4;
            $imgWidth = ($matrixWidth + ($margin * 2)) * $scale;
            $imgHeight = ($matrixHeight + ($margin * 2)) * $scale;

            $img = imagecreatetruecolor($imgWidth, $imgHeight);
            if ($img === false) {
                return '';
            }

            $white = (int) imagecolorallocate($img, 255, 255, 255);
            $black = (int) imagecolorallocate($img, 0, 0, 0);

            imagefill($img, 0, 0, $white);

            for ($y = 0; $y < $matrixHeight; $y++) {
                for ($x = 0; $x < $matrixWidth; $x++) {
                    if ($matrix->get($x, $y) === 1) {
                        $x1 = ($x + $margin) * $scale;
                        $y1 = ($y + $margin) * $scale;
                        $x2 = $x1 + $scale - 1;
                        $y2 = $y1 + $scale - 1;
                        imagefilledrectangle($img, $x1, $y1, $x2, $y2, $black);
                    }
                }
            }

            ob_start();
            imagepng($img, null, 9);

            return (string) ob_get_clean();
        } catch (\Throwable) {
            return '';
        }
    }
}
