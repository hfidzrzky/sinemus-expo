<?php

namespace App\Services\Admin\Presale\Support;

class CinemaTicketTextExtractor
{
    /**
     * Mengekstrak metadata teks karcis dari teks halaman PDF atau teks mentah.
     *
     * @return array{
     *     seat_codes: string[],
     *     booking_code: string,
     *     passcode: string|null,
     *     detected_movie_title: string|null,
     *     detected_studio: string|null,
     *     detected_time: string|null,
     *     raw_text: string
     * }
     */
    public function extract(string $text): array
    {
        $bookingCode = '';
        $passcode = null;
        $seatCodes = [];

        // 1. Ekstrak Booking Code:
        // Mendukung: booking code, kode booking, kode pesanan, nomor pesanan, no. pesanan, order id, order no, id pesanan
        if (preg_match('/(?:booking\s*(?:code|id|no)|kode\s*(?:booking|pesanan)|nomor\s*pesanan|no\.?\s*pesanan|order\s*(?:id|no|code)|id\s*pesanan)\s*[:\-]?\s*([A-Z0-9\-]{4,20})/i', $text, $matches)) {
            $bookingCode = strtoupper(trim((string) ($matches[1] ?? '')));
        } elseif (preg_match('/\b(MTX[\-]?\d{4,10}|TIX[\-]?\d{4,10}|CGV[\-]?\d{4,10})\b/i', $text, $matches)) {
            $bookingCode = strtoupper(trim((string) ($matches[1] ?? '')));
        }

        // 2. Ekstrak Passcode / PIN Kiosk: 4-8 digit angka (mendukung multi-baris seperti 'Passcode / PIN \n 572911' atau 'Passcode / PIN Kiosk \n 449210')
        if (preg_match('/(?:passcode|pin|pass\s*code|kiosk\s*code)\s*(?:\/\s*(?:pin|passcode))?\s*(?:kiosk)?\s*[:\-]?\s*(\d{4,8})/i', $text, $matches)) {
            $rawPass = trim((string) ($matches[1] ?? ''));
            if ($rawPass !== '') {
                $passcode = $rawPass;
            }
        }

        // 3. Ekstrak Judul Film (misal: 'Film: Cinta dan Sejarah', 'Film \n SPIDERMAN', 'TITLE: BUMI MANUSIA')
        $detectedMovieTitle = null;
        if (preg_match('/(?:film|movie|judul|title)\s*[:\-]?\s*([^\n\r]+)/i', $text, $movieMatches)) {
            $rawMovieTitle = trim((string) ($movieMatches[1] ?? ''));
            // Bersihkan format trailing bioskop seperti (XXI), (2D), (3D), (IMAX)
            $cleanMovieTitle = preg_replace('/\s*\((?:XXI|2D|3D|IMAX|PREMIERE)[^\)]*\)/i', '', $rawMovieTitle);
            $cleanMovieTitle = trim((string) $cleanMovieTitle);
            if ($cleanMovieTitle !== '') {
                $detectedMovieTitle = $cleanMovieTitle;
            }
        }

        // 4. Ekstrak Nomor Kursi: contoh C5, C6, C7 atau Baris C Kursi 05
        if (preg_match_all('/(?:kursi|seat|tempat\s*duduk)?\s*\b([A-Z]\d{1,2})\b/i', $text, $matches)) {
            /** @var array<int, string> $matchedSeats */
            $matchedSeats = isset($matches[1]) && is_array($matches[1]) ? $matches[1] : [];
            $candidates = array_unique($matchedSeats);

            foreach ($candidates as $candidate) {
                $code = strtoupper(trim((string) $candidate));
                if (preg_match('/^[A-Z]\d{1,2}$/', $code)) {
                    $seatCodes[] = $code;
                }
            }
        }

        // 4.1 Tambahan pola 'Baris C Kursi 7' atau 'Row C Seat 7'
        if (preg_match_all('/\b(?:baris|row)\s*([A-Z])\s*(?:kursi|seat|no|nomor)?\s*(\d{1,2})\b/i', $text, $rowMatches, PREG_SET_ORDER)) {
            foreach ($rowMatches as $rm) {
                $rowLetter = strtoupper(trim((string) ($rm[1] ?? '')));
                $seatNum = (int) ($rm[2] ?? 0);
                if ($rowLetter !== '' && $seatNum > 0) {
                    $seatCodes[] = $rowLetter.$seatNum;
                }
            }
        }

        // Urutkan kursi secara alfabetis dan natural (contoh: C5, C6, C7)
        $seatCodes = array_values(array_unique($seatCodes));
        sort($seatCodes, SORT_NATURAL);

        // 5. Ekstrak Nama / Nomor Studio (misal: Studio 1, Studio 2, Audi 1, Auditorium \n Studio 1)
        $detectedStudio = null;
        if (preg_match('/\b(?:studio|theater|theatre|audi(?:torium)?)\s*[:\-]?\s*(?:studio\s*)?([0-9A-Za-z]+)\b/i', $text, $studioMatches)) {
            $studioIdentifier = trim((string) ($studioMatches[1] ?? ''));
            if ($studioIdentifier !== '') {
                $detectedStudio = 'Studio '.strtoupper($studioIdentifier);
            }
        }

        // 6. Ekstrak Jam Tayang (misal: 19:00, 21.30)
        $detectedTime = null;
        if (preg_match('/\b([01]?[0-9]|2[0-3])[:.]([0-5][0-9])(?:\s*(?:wib|wita|wit|pm|am))?\b/i', $text, $timeMatches)) {
            $hours = str_pad(trim((string) ($timeMatches[1] ?? '')), 2, '0', STR_PAD_LEFT);
            $minutes = str_pad(trim((string) ($timeMatches[2] ?? '')), 2, '0', STR_PAD_LEFT);
            $detectedTime = "{$hours}:{$minutes}";
        }

        return [
            'seat_codes' => $seatCodes,
            'booking_code' => $bookingCode,
            'passcode' => $passcode,
            'detected_movie_title' => $detectedMovieTitle,
            'detected_studio' => $detectedStudio,
            'detected_time' => $detectedTime,
            'raw_text' => $text,
        ];
    }

    /**
     * Mengekstrak metadata dari muatan string QR Code (misal payload M-Tix Cinema XXI: #6289658301529;67240).
     *
     * @return array{
     *     booking_code: string|null,
     *     detected_phone: string|null,
     *     passcode: string|null
     * }
     */
    public function extractFromQrPayload(string $qrPayload): array
    {
        $qrPayload = trim($qrPayload);
        $result = [
            'booking_code' => null,
            'detected_phone' => null,
            'passcode' => null,
        ];

        if ($qrPayload === '') {
            return $result;
        }

        // Format Cinema XXI m.tix: '#6289658301529;67240'
        if (preg_match('/^#?(\d{9,16});([A-Z0-9\-]{4,20})$/i', $qrPayload, $m)) {
            $result['detected_phone'] = $m[1];
            $result['booking_code'] = strtoupper($m[2]);

            return $result;
        }

        // Format Gabungan BookingCode-Passcode: 'MTX-12345-6789'
        if (preg_match('/^([A-Z0-9\-]{5,20})-([0-9]{4,8})$/i', $qrPayload, $m)) {
            $result['booking_code'] = strtoupper($m[1]);
            $result['passcode'] = $m[2];

            return $result;
        }

        // Format Booking Code murni
        if (preg_match('/^[A-Z0-9\-]{5,20}$/i', $qrPayload)) {
            $result['booking_code'] = strtoupper($qrPayload);

            return $result;
        }

        return $result;
    }
}
