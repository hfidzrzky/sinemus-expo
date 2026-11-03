<?php

namespace App\Services\Admin\Presale\Support;

use BaconQrCode\Common\ErrorCorrectionLevel;
use BaconQrCode\Encoder\Encoder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Smalot\PdfParser\Document;
use Smalot\PdfParser\Page;
use Spatie\PdfToImage\Pdf;
use Zxing\QrReader;

class CinemaQrImageExtractor
{
    /**
     * Padding zona tenang (Quiet Zone) di sekeliling QR Code hasil crop (24 pixel).
     */
    public const QUIET_ZONE_PADDING = 24;

    /**
     * Hybrid QR Extraction Strategy:
     * 1. Metode A (Primary): Direct Stream XObject Extraction (Mencari dan mendekode objek gambar dari halaman & dokumen).
     * 2. Metode B (Fallback): Bounding Box Crop dengan Quiet Zone Padding 18px (Jika driver image renderer tersedia).
     * 3. Metode C (Safety Gate): Native GD Vector QR Generation dari booking_code & passcode yang valid (100% Lossless PNG).
     *
     * @param  array{seat_codes: string[], booking_code: string, passcode: string}  $metadata
     * @return array{r2_qr_path: string, r2_preview_url: string}
     */
    public function extractHybrid(
        Document $document,
        Page $page,
        string $pdfPath,
        int $pageIndex,
        string $sessionId,
        array $metadata
    ): array {
        // -------------------------------------------------------------
        // METODE A: Direct Stream XObject Extraction (Primary)
        // -------------------------------------------------------------
        try {
            $candidateObjects = [];
            $seenObjectIds = [];

            // 1. Ambil XObjects spesifik halaman
            try {
                $pageObjects = $page->getXObjects();
                foreach ($pageObjects as $pObj) {
                    $objId = spl_object_hash($pObj);
                    if (! isset($seenObjectIds[$objId])) {
                        $seenObjectIds[$objId] = true;
                        $candidateObjects[] = $pObj;
                    }
                }
            } catch (\Throwable) {
                // Lanjutkan jika parsing XObject halaman tidak tersedia
            }

            // 2. Ambil XObjects dari resource level dokumen (hanya jika belum diambil di halaman)
            try {
                $docObjects = $document->getObjects();
                foreach ($docObjects as $dObj) {
                    if (is_object($dObj) && method_exists($dObj, 'getDetails')) {
                        $details = $dObj->getDetails();
                        $subtype = $details['Subtype'] ?? '';
                        $type = $details['Type'] ?? '';
                        if ($subtype === 'Image' || ($type === 'XObject' && $subtype === 'Image')) {
                            $objId = spl_object_hash($dObj);
                            if (! isset($seenObjectIds[$objId])) {
                                $seenObjectIds[$objId] = true;
                                $candidateObjects[] = $dObj;
                            }
                        }
                    }
                }
            } catch (\Throwable) {
                // Lanjutkan jika parsing objek dokumen tidak tersedia
            }

            foreach ($candidateObjects as $xobject) {
                $details = method_exists($xobject, 'getDetails') ? $xobject->getDetails() : [];
                $w = (int) ($details['Width'] ?? 0);
                $h = (int) ($details['Height'] ?? 0);

                // Optimasi Kecepatan: Abaikan objek yang jelas bukan QR (terlalu kecil < 40px atau rasio ekstrim seperti banner/garis)
                if ($w > 0 && $h > 0) {
                    if ($w < 40 || $h < 40) {
                        continue;
                    }
                    $ratio = $w / max(1, $h);
                    if ($ratio > 4.0 || $ratio < 0.25) {
                        continue; // Garis pembatas atau banner horizontal tipis
                    }
                }

                $imageBinary = $this->normalizePdfImageToBinary($xobject);
                if (! empty($imageBinary)) {
                    // Coba deteksi dan crop cerdas multi-skala (mendukung screenshot e-tiket & flat canvas)
                    $smart = $this->smartDetectAndCropQr($imageBinary);
                    $binaryToUse = $smart !== null ? $smart['cropped_binary'] : null;
                    $decodedText = $smart !== null ? $smart['decoded_text'] : null;

                    if ($binaryToUse === null) {
                        $croppedBinary = $this->cropQrFromBinaryWithPadding($imageBinary);
                        $binaryToUse = $croppedBinary ?? $imageBinary;
                        $decodedText = $this->decodeQrStringFromBinary($binaryToUse);
                    }

                    // Validasi apakah gambar ini memang QR Code yang valid
                    if ($decodedText !== null) {
                        // Periksa apakah isi payload adalah QRIS Pembayaran (misal 00020101 atau ID.CO.QRIS)
                        $isPaymentQr = $this->isPaymentQrisPayload($decodedText);

                        // Jika terdeteksi QRIS dan kita memiliki booking_code yang valid,
                        // buatkan QR vektor kredensial resmi agar tidak menggunakan QRIS
                        if ($isPaymentQr && ! empty($metadata['booking_code'])) {
                            $cleanPayload = ! empty($metadata['passcode'])
                                ? $metadata['booking_code'].'-'.$metadata['passcode']
                                : $metadata['booking_code'];
                            $generatedBinary = $this->generateVectorQrPngBinary($cleanPayload);
                            $stored = $this->storeTempQrImage($generatedBinary, $sessionId);

                            return [
                                'r2_qr_path' => $stored['path'],
                                'r2_preview_url' => $stored['url'],
                                'qr_source' => 'generated_fallback',
                                'decoded_payload' => $decodedText,
                            ];
                        }

                        $stored = $this->storeTempQrImage($binaryToUse, $sessionId);

                        return [
                            'r2_qr_path' => $stored['path'],
                            'r2_preview_url' => $stored['url'],
                            'qr_source' => 'original_pdf',
                            'decoded_payload' => $decodedText,
                        ];
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::debug('CinemaQrImageExtractor: Metode A (Direct XObject) lewati/tidak menemukan image.', [
                'error' => $e->getMessage(),
            ]);
        }

        // -------------------------------------------------------------
        // METODE B: Bounding Box Detection & Precise Crop (Fallback)
        // -------------------------------------------------------------
        $renderedImagePath = $this->renderPdfPageToImage($pdfPath, $pageIndex);
        if ($renderedImagePath !== null && file_exists($renderedImagePath)) {
            try {
                $croppedBinary = $this->cropQrFromImageWithPadding($renderedImagePath);
                if ($croppedBinary !== null) {
                    $decodedText = $this->decodeQrStringFromBinary($croppedBinary);
                    $stored = $this->storeTempQrImage($croppedBinary, $sessionId);

                    return [
                        'r2_qr_path' => $stored['path'],
                        'r2_preview_url' => $stored['url'],
                        'qr_source' => 'original_pdf',
                        'decoded_payload' => $decodedText,
                    ];
                }
            } finally {
                // Bersihkan file render sementara agar hemat disk
                @unlink($renderedImagePath);
            }
        }

        // -------------------------------------------------------------
        // METODE C: Native GD Lossless QR Generation (Safety Fallback)
        // -------------------------------------------------------------
        // Standar format kiosk M-Tix XXI: string Booking Code atau gabungan Booking Code & Passcode
        $qrPayload = ! empty($metadata['booking_code'])
            ? (empty($metadata['passcode']) ? $metadata['booking_code'] : $metadata['booking_code'].'-'.$metadata['passcode'])
            : ($metadata['passcode'] ?? 'SINEMUS-PRESALE');

        $generatedBinary = $this->generateVectorQrPngBinary($qrPayload);
        $stored = $this->storeTempQrImage($generatedBinary, $sessionId);

        return [
            'r2_qr_path' => $stored['path'],
            'r2_preview_url' => $stored['url'],
            'qr_source' => 'generated_fallback',
            'decoded_payload' => $qrPayload,
        ];

    }

    /**
     * Memotong QR code dari binary gambar mentah dengan Quiet Zone Padding 18px.
     */
    public function cropQrFromBinaryWithPadding(string $imageBinary): ?string
    {
        $tempPath = tempnam(sys_get_temp_dir(), 'snm_crop_');
        if ($tempPath === false) {
            return null;
        }

        try {
            file_put_contents($tempPath, $imageBinary);

            return $this->cropQrFromImageWithPadding($tempPath);
        } finally {
            @unlink($tempPath);
        }
    }

    /**
     * Deteksi dan pemotongan cerdas QR Code multi-skala dan multi-area untuk gambar beresolusi tinggi / tangkapan layar.
     *
     * @return array{decoded_text: string, cropped_binary: string}|null
     */
    public function smartDetectAndCropQr(string $imageBinary): ?array
    {
        @ini_set('memory_limit', '512M');

        $gdImage = @imagecreatefromstring($imageBinary);
        if ($gdImage === false) {
            return null;
        }

        $origWidth = imagesx($gdImage);
        $origHeight = imagesy($gdImage);

        // Jika ukuran gambar sudah berukuran wajar (< 600px), coba decode langsung tanpa crop kompleks
        if ($origWidth <= 600 && $origHeight <= 600) {
            $directReader = new QrReader($imageBinary, QrReader::SOURCE_TYPE_BLOB);
            $directReader->decode();
            $directText = $directReader->text();
            if (! empty($directText)) {
                imagedestroy($gdImage);

                return [
                    'decoded_text' => trim($directText),
                    'cropped_binary' => $imageBinary,
                ];
            }
        }

        // Multi-region & multi-scale scanning untuk gambar besar / layout e-tiket
        $regions = [
            ['x' => (int) ($origWidth * 0.10), 'y' => (int) ($origHeight * 0.05), 'w' => (int) ($origWidth * 0.80), 'h' => (int) ($origHeight * 0.50)], // Top half (khas karcis XXI / TIX)
            ['x' => 0, 'y' => 0, 'w' => $origWidth, 'h' => $origHeight], // Full image
            ['x' => (int) ($origWidth * 0.05), 'y' => (int) ($origHeight * 0.05), 'w' => (int) ($origWidth * 0.90), 'h' => (int) ($origHeight * 0.90)], // Center area
        ];

        // Skala terurut dari yang paling sering berhasil
        $scales = [0.4, 0.5, 0.25];

        foreach ($regions as $reg) {
            $regGd = imagecrop($gdImage, [
                'x' => max(0, $reg['x']),
                'y' => max(0, $reg['y']),
                'width' => min($origWidth - $reg['x'], $reg['w']),
                'height' => min($origHeight - $reg['y'], $reg['h']),
            ]);

            if ($regGd === false) {
                continue;
            }

            $rw = imagesx($regGd);
            $rh = imagesy($regGd);

            foreach ($scales as $scale) {
                $sw = max(50, (int) ($rw * $scale));
                $sh = max(50, (int) ($rh * $scale));
                $scaledGd = imagecreatetruecolor($sw, $sh);
                if ($scaledGd === false) {
                    continue;
                }

                imagecopyresampled($scaledGd, $regGd, 0, 0, 0, 0, $sw, $sh, $rw, $rh);

                ob_start();
                imagepng($scaledGd, null, 9);
                $scalePng = (string) ob_get_clean();
                imagedestroy($scaledGd);

                $scaleReader = new QrReader($scalePng, QrReader::SOURCE_TYPE_BLOB);
                $scaleReader->decode();
                $scaleText = $scaleReader->text();

                if (! empty($scaleText)) {
                    $res = $scaleReader->getResult();
                    $points = $res ? $res->getResultPoints() : [];

                    if (! empty($points)) {
                        $xs = [];
                        $ys = [];
                        foreach ($points as $pt) {
                            if (is_object($pt) && method_exists($pt, 'getX') && method_exists($pt, 'getY')) {
                                $xs[] = $reg['x'] + ($pt->getX() / $scale);
                                $ys[] = $reg['y'] + ($pt->getY() / $scale);
                            }
                        }

                        if (! empty($xs) && ! empty($ys)) {
                            $minX = min($xs);
                            $maxX = max($xs);
                            $minY = min($ys);
                            $maxY = max($ys);
                            $patternDist = max($maxX - $minX, $maxY - $minY);
                            $finderMargin = $patternDist / 4.0;

                            $cropX = max(0, (int) floor($minX - $finderMargin));
                            $cropY = max(0, (int) floor($minY - $finderMargin));
                            $cropSize = (int) ceil($patternDist + ($finderMargin * 2));
                            $cropSize = min($cropSize, min($origWidth - $cropX, $origHeight - $cropY));

                            $croppedOrig = imagecrop($gdImage, [
                                'x' => $cropX,
                                'y' => $cropY,
                                'width' => $cropSize,
                                'height' => $cropSize,
                            ]);

                            if ($croppedOrig !== false) {
                                $paddedWidth = $cropSize + (self::QUIET_ZONE_PADDING * 2);
                                $paddedHeight = $cropSize + (self::QUIET_ZONE_PADDING * 2);
                                $finalGd = imagecreatetruecolor($paddedWidth, $paddedHeight);
                                if ($finalGd !== false) {
                                    $white = (int) imagecolorallocate($finalGd, 255, 255, 255);
                                    imagefill($finalGd, 0, 0, $white);
                                    imagecopy($finalGd, $croppedOrig, self::QUIET_ZONE_PADDING, self::QUIET_ZONE_PADDING, 0, 0, $cropSize, $cropSize);

                                    ob_start();
                                    imagepng($finalGd, null, 9);
                                    $finalBinary = (string) ob_get_clean();

                                    imagedestroy($finalGd);
                                    imagedestroy($croppedOrig);
                                    imagedestroy($regGd);
                                    imagedestroy($gdImage);

                                    return [
                                        'decoded_text' => trim($scaleText),
                                        'cropped_binary' => $finalBinary,
                                    ];
                                }
                                imagedestroy($croppedOrig);
                            }
                        }
                    }

                    imagedestroy($regGd);
                    imagedestroy($gdImage);

                    return [
                        'decoded_text' => trim($scaleText),
                        'cropped_binary' => $imageBinary,
                    ];
                }
            }

            imagedestroy($regGd);
        }

        imagedestroy($gdImage);

        return null;
    }

    /**
     * Memotong QR code dari gambar tiket utuh dengan Quiet Zone Padding 18px.
     */
    public function cropQrFromImageWithPadding(string $imagePath): ?string
    {
        $qrReader = new QrReader($imagePath);
        $qrReader->decode();
        $decodedText = $qrReader->text();

        if (empty($decodedText)) {
            $imageContent = @file_get_contents($imagePath);
            if ($imageContent !== false && ! empty($imageContent)) {
                $smart = $this->smartDetectAndCropQr($imageContent);
                if ($smart !== null) {
                    return $smart['cropped_binary'];
                }
            }

            return null;
        }

        $imageContent = file_get_contents($imagePath);
        if ($imageContent === false) {
            return null;
        }

        $gdImage = @imagecreatefromstring($imageContent);
        if ($gdImage === false) {
            return null;
        }

        $origWidth = imagesx($gdImage);
        $origHeight = imagesy($gdImage);

        // Strategi 1: Crop presisi berbasis titik Finder Patterns QR (Zxing)
        $res = $qrReader->getResult();
        $points = $res ? $res->getResultPoints() : [];

        $cropX = 0;
        $cropY = 0;
        $squareSize = min($origWidth, $origHeight);

        if (! empty($points)) {
            $xs = [];
            $ys = [];
            foreach ($points as $pt) {
                if (is_object($pt) && method_exists($pt, 'getX') && method_exists($pt, 'getY')) {
                    $xs[] = $pt->getX();
                    $ys[] = $pt->getY();
                }
            }

            if (! empty($xs) && ! empty($ys)) {
                $minX = min($xs);
                $maxX = max($xs);
                $minY = min($ys);
                $maxY = max($ys);

                $distX = $maxX - $minX;
                $distY = $maxY - $minY;
                $patternDist = max($distX, $distY);

                // Di seluruh versi QR (V1 s.d V40), jarak antar-pusat finder pattern adalah (size - 7) modul.
                // Jari-jari finder pattern adalah 3.5 modul. Maka rasio 3.5 / (size - 7) maksimal adalah 3.5 / 14 = 0.25 (1/4).
                // Formula finderMargin = patternDist / 4.0 menjamin seluruh matriks QR tercakup tanpa terpotong 1 pixel pun.
                $finderMargin = $patternDist / 4.0;

                $qrMinX = max(0, (int) floor($minX - $finderMargin));
                $qrMaxX = min($origWidth, (int) ceil($maxX + $finderMargin));
                $qrMinY = max(0, (int) floor($minY - $finderMargin));
                $qrMaxY = min($origHeight, (int) ceil($maxY + $finderMargin));

                $w = $qrMaxX - $qrMinX;
                $h = $qrMaxY - $qrMinY;
                $squareSize = max($w, $h);

                $cropX = min($qrMinX, max(0, $origWidth - $squareSize));
                $cropY = min($qrMinY, max(0, $origHeight - $squareSize));
                $cropX = max(0, $cropX);
                $cropY = max(0, $cropY);
            }
        } else {
            // Strategi 2: Center crop jika koordinat finder pattern tidak tersedia
            $cropX = (int) max(0, ($origWidth - $squareSize) / 2);
            $cropY = (int) max(0, ($origHeight - $squareSize) / 2);
        }

        $croppedGd = imagecrop($gdImage, [
            'x' => $cropX,
            'y' => $cropY,
            'width' => $squareSize,
            'height' => $squareSize,
        ]);

        if ($croppedGd === false) {
            $croppedGd = $gdImage;
        }

        // Tambahkan Quiet Zone Padding (Margin putih di sekeliling QR)
        $paddedWidth = $squareSize + (self::QUIET_ZONE_PADDING * 2);
        $paddedHeight = $squareSize + (self::QUIET_ZONE_PADDING * 2);

        $finalGd = imagecreatetruecolor($paddedWidth, $paddedHeight);
        if ($finalGd === false) {
            return null;
        }

        $white = (int) imagecolorallocate($finalGd, 255, 255, 255);
        imagefill($finalGd, 0, 0, $white);

        imagecopy(
            $finalGd,
            $croppedGd,
            self::QUIET_ZONE_PADDING,
            self::QUIET_ZONE_PADDING,
            0,
            0,
            $squareSize,
            $squareSize
        );

        ob_start();
        imagepng($finalGd, null, 9);
        $finalBinary = (string) ob_get_clean();

        // Di PHP 8.0+, objek GdImage otomatis dibebaskan memorinya oleh GC saat variabel out-of-scope.
        return $finalBinary;
    }

    /**
     * Mendekode teks string dari binary gambar QR menggunakan khanamiryan/qrcode-detector-decoder.
     */
    public function decodeQrStringFromBinary(string $imageBinary): ?string
    {
        $tempPath = tempnam(sys_get_temp_dir(), 'snm_qr_');
        if ($tempPath === false) {
            return null;
        }

        try {
            file_put_contents($tempPath, $imageBinary);
            $qrcode = new QrReader($tempPath);
            $text = $qrcode->text();

            if (! empty($text)) {
                return trim($text);
            }
        } catch (\Throwable) {
            // Lanjutkan ke fallback smart detection
        } finally {
            @unlink($tempPath);
        }

        $smart = $this->smartDetectAndCropQr($imageBinary);

        return $smart !== null ? $smart['decoded_text'] : null;
    }

    /**
     * Render halaman PDF ke file gambar sementara.
     */
    public function renderPdfPageToImage(string $pdfPath, int $pageIndex): ?string
    {
        if (! class_exists(Pdf::class)) {
            return null;
        }

        $tempImagePath = storage_path('app/temp/presale-render/'.Str::random(24).'.png');
        $dir = dirname($tempImagePath);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        try {
            $pdf = new Pdf($pdfPath);
            $pdf->setPage($pageIndex + 1);
            $pdf->saveImage($tempImagePath);

            return file_exists($tempImagePath) ? $tempImagePath : null;
        } catch (\Throwable $e) {
            Log::debug('CinemaQrImageExtractor: spatie/pdf-to-image tidak dapat merender halaman.', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Menghasilkan binary PNG kode QR murni (lossless) menggunakan PHP GD & BaconQrCode Encoder.
     * Tidak membutuhkan ekstensi Imagick atau Ghostscript, 100% kompatibel di semua environment.
     */
    public function generateVectorQrPngBinary(string $payload): string
    {
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
    }

    /**
     * Menormalisasi objek gambar PDF (JPEG, PNG, atau FlateDecode raw stream) ke binary gambar yang valid.
     */
    public function normalizePdfImageToBinary(mixed $xobject): ?string
    {
        if (! is_object($xobject) || ! method_exists($xobject, 'getContent')) {
            return null;
        }

        try {
            $content = $xobject->getContent();
            if (empty($content)) {
                return null;
            }

            // 1. Jika sudah berheader JPEG (\xFF\xD8\xFF)
            if (str_starts_with($content, "\xFF\xD8\xFF")) {
                return $content;
            }

            // 2. Jika sudah berheader PNG (\x89PNG\r\n\x1a\n)
            if (str_starts_with($content, "\x89PNG\r\n\x1a\n")) {
                return $content;
            }

            // 3. Jika image stream mentah (misal FlateDecode)
            $details = method_exists($xobject, 'getDetails') ? $xobject->getDetails() : [];
            $width = (int) ($details['Width'] ?? 0);
            $height = (int) ($details['Height'] ?? 0);

            if ($width > 0 && $height > 0) {
                $converted = $this->convertFlateDecodeToPng($content, $details);
                if ($converted !== null) {
                    return $converted;
                }
            }

            // 4. Cek fallback via imagecreatefromstring jika GD mengenali
            $gd = @imagecreatefromstring($content);
            if ($gd !== false) {
                ob_start();
                imagepng($gd, null, 9);

                return (string) ob_get_clean();
            }

            return null;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Mengonversi raw raster stream dari PDF FlateDecode ke format PNG yang valid via GD.
     *
     * @param  array<string, mixed>  $details
     */
    protected function convertFlateDecodeToPng(string $content, array $details): ?string
    {
        $width = (int) ($details['Width'] ?? 0);
        $height = (int) ($details['Height'] ?? 0);
        $colorSpace = (string) ($details['ColorSpace'] ?? 'DeviceRGB');

        if ($width <= 0 || $height <= 0) {
            return null;
        }

        $decodeParms = $details['DecodeParms'] ?? [];
        $predictor = (int) ($decodeParms['Predictor'] ?? 1);

        // Jika Predictor >= 10 (standar PNG Predictor pada FlateDecode), rekonstruksi struktur PNG asli
        // agar libpng mendekode filter scanline predictor secara native tanpa cacat raster.
        if ($predictor >= 10) {
            $ihdrColorType = in_array($colorSpace, ['DeviceGray', 'Device1', 'Indexed'], true) ? 0 : 2;
            $idatData = @gzcompress($content);
            if ($idatData !== false) {
                $png = "\x89PNG\r\n\x1a\n";
                $ihdrData = pack('NNCCCCC', $width, $height, 8, $ihdrColorType, 0, 0, 0);
                $png .= pack('N', strlen($ihdrData)).'IHDR'.$ihdrData.pack('N', crc32('IHDR'.$ihdrData));
                $png .= pack('N', strlen($idatData)).'IDAT'.$idatData.pack('N', crc32('IDAT'.$idatData));
                $png .= pack('N', 0).'IEND'.pack('N', crc32('IEND'));

                $testGd = @imagecreatefromstring($png);
                if ($testGd !== false) {
                    return $png;
                }
            }
        }

        $gdImg = imagecreatetruecolor($width, $height);
        if ($gdImg === false) {
            return null;
        }

        $bytesPerPixel = in_array($colorSpace, ['DeviceGray', 'Device1', 'Indexed'], true) ? 1 : 3;
        $rowStride = 1 + ($width * $bytesPerPixel); // Predictor 15: 1 byte tag per scanline

        if (strlen($content) >= $height * $rowStride) {
            for ($y = 0; $y < $height; $y++) {
                $rowOffset = $y * $rowStride + 1;
                for ($x = 0; $x < $width; $x++) {
                    $pOffset = $rowOffset + ($x * $bytesPerPixel);
                    if ($bytesPerPixel === 3) {
                        $r = ord($content[$pOffset] ?? "\x00");
                        $g = ord($content[$pOffset + 1] ?? "\x00");
                        $b = ord($content[$pOffset + 2] ?? "\x00");
                    } else {
                        $r = $g = $b = ord($content[$pOffset] ?? "\x00");
                    }
                    $color = (int) imagecolorallocate($gdImg, $r, $g, $b);
                    imagesetpixel($gdImg, $x, $y, $color);
                }
            }
        } elseif (strlen($content) >= $width * $height * $bytesPerPixel) {
            $offset = 0;
            for ($y = 0; $y < $height; $y++) {
                for ($x = 0; $x < $width; $x++) {
                    if ($bytesPerPixel === 3) {
                        $r = ord($content[$offset++] ?? "\x00");
                        $g = ord($content[$offset++] ?? "\x00");
                        $b = ord($content[$offset++] ?? "\x00");
                    } else {
                        $r = $g = $b = ord($content[$offset++] ?? "\x00");
                    }
                    $color = (int) imagecolorallocate($gdImg, $r, $g, $b);
                    imagesetpixel($gdImg, $x, $y, $color);
                }
            }
        } else {
            return null;
        }

        ob_start();
        imagepng($gdImg, null, 9);

        return (string) ob_get_clean();
    }

    /**
     * Simpan gambar QR sementara ke disk R2 (atau disk publik jika R2 belum siap).
     *
     * @return array{path: string, url: string}
     */
    public function storeTempQrImage(string $imageBinary, string $sessionId): array
    {
        $filename = Str::random(32).'.png';
        $directory = "cinema-tickets/temp/{$sessionId}";

        $stored = CinemaTicketStorageManager::storeTicketQrImage($imageBinary, $directory, $filename);

        return [
            'path' => $stored['path'],
            'url' => $stored['url'],
        ];
    }

    /**
     * Menyelesaikan URL publik dari suatu path storage.
     */
    public function resolveFileUrl(string $path, ?string $diskName = null): string
    {
        return CinemaTicketStorageManager::resolveFileUrl($path, $diskName);
    }

    /**
     * Memeriksa apakah teks payload QR merupakan QRIS Pembayaran nasional.
     */
    public function isPaymentQrisPayload(?string $text): bool
    {
        if (empty($text)) {
            return false;
        }

        return str_starts_with($text, '00020101')
            || stripos($text, 'ID.CO.QRIS') !== false
            || stripos($text, 'QRIS') !== false;
    }
}
