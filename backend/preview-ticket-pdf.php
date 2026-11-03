<?php

/**
 * Script preview PDF tiket — HANYA untuk development/testing.
 *
 * Jalankan: php preview-ticket-pdf.php (dari folder backend)
 *
 * File PDF akan tersimpan di: storage/app/private/preview/
 */

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use BaconQrCode\Common\ErrorCorrectionLevel;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Barryvdh\DomPDF\PDF;
use Illuminate\Contracts\Console\Kernel;

// ─── Data Base Dummy untuk Preview ───
$baseData = [
    'order_id' => 'SNM-TKT-20261101-0001-U4',
    'ticket_code' => 'TKT-IMT-003',
    'customer_name' => 'Muhammad Hafidz',
    'event_title' => 'CINTA DAN SEJARAH (Special Cinema Premiere)',
    'venue_name' => 'Cinema XXI Plaza Senayan',
    'city' => 'Jakarta Pusat',
    'auditorium_name' => 'Studio Utama',
    'show_time_formatted' => 'Sabtu, 28 November 2026 - 19:00 WIB',
    'paid_at_formatted' => '23 September 2026, 13:32 WIB',
    'seats' => ['C5', 'C6', 'C7'],
    'has_assigned_seats' => true,
    'ticket_quantity' => 3,
    'cinema_booking_code' => 'MTX-918234',
    'cinema_passcode' => '572911',
    'qr_data_uri' => '',
    'logo_data_uri' => '',
];

// Generate Standard ISO QR SVG with Error Correction Level H
$renderer = new ImageRenderer(
    new RendererStyle(200, 1),
    new SvgImageBackEnd
);
$writer = new Writer($renderer);
$svg = $writer->writeString('MTX-918234-572911', 'UTF-8', ErrorCorrectionLevel::H());
$baseData['qr_data_uri'] = 'data:image/svg+xml;base64,'.base64_encode($svg);

// Load logo jika ada
$logoPath = public_path('sinemus-logo.png');
if (! file_exists($logoPath)) {
    $logoPath = base_path('../frontend/public/sinemus-logo.png');
}
if (file_exists($logoPath)) {
    $logoBinary = file_get_contents($logoPath);
    if ($logoBinary !== false) {
        $baseData['logo_data_uri'] = 'data:image/png;base64,'.base64_encode($logoBinary);
    }
}

// ─── Render varian ───
$variants = [
    'preview-regular-ticket.pdf' => [
        'view' => 'pdf.regular-ticket',
        'data' => $baseData,
    ],
    'preview-regular-ticket-general-admission.pdf' => [
        'view' => 'pdf.regular-ticket',
        'data' => array_merge($baseData, [
            'event_title' => 'SUARA DARI HILIR (Dokumenter Spesial)',
            'venue_name' => 'Institut Français Indonesia',
            'ticket_code' => 'TKT-20260925-AGEWBX',
            'seats' => [],
            'has_assigned_seats' => false,
            'ticket_quantity' => 2,
        ]),
    ],
    'preview-presale-receipt.pdf' => [
        'view' => 'pdf.presale-receipt',
        'data' => $baseData,
    ],
    'preview-presale-fulfilled.pdf' => [
        'view' => 'pdf.presale-fulfilled',
        'data' => $baseData,
    ],
];

$outputDir = storage_path('app/private/preview');
if (! is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

foreach ($variants as $filename => $config) {
    /** @var PDF $dompdf */
    $dompdf = app('dompdf.wrapper');
    $dompdf->setPaper([0, 0, 708.66, 425.20], 'landscape');
    $dompdf->loadView($config['view'], $config['data']);

    $path = $outputDir.DIRECTORY_SEPARATOR.$filename;
    file_put_contents($path, $dompdf->output());

    echo "✅ {$filename} → {$path}\n";
}

echo "\n🎬 Semua preview PDF berhasil digenerate!\n";
echo "📂 Buka folder: {$outputDir}\n";
