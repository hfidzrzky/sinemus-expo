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

        $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');
        $apiUrl = rtrim((string) config('app.url', 'http://localhost:8000'), '/');

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
            'qrDataUri' => $qrInfo['dataUri'],
            'qrLocalPath' => $qrInfo['localPath'],
            'qrBinary' => $qrInfo['binary'],
            'qrMime' => $qrInfo['mime'],
            'logoLocalPath' => file_exists($logoLocalPath) ? $logoLocalPath : null,
            'logoDataUri' => $logoDataUri,
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
        // Generate Lossless PNG Vector QR Code (Strict PNG untuk kompatibilitas Gmail & Apple Mail)
        $qrPayload = $transaction->qr_hash ?? $transaction->ticket_code ?? $transaction->order_id;

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
