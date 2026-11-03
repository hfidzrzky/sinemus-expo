<?php

namespace App\Services\Admin\Presale\Actions;

use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Schedule;

class SmartIngestMatcherAction
{
    /**
     * Mencocokkan daftar karcis hasil ekstraksi dengan transaksi aktif menggunakan 5-Point Strict Match Matrix:
     * 1. Anti-Salah Film (Film Title Guard)
     * 2. Anti-Salah Studio (Studio Identifier Guard)
     * 3. Anti-Salah Jam Tayang (Show Time Guard)
     * 4. Strict Seat Equivalence (Nomor Kursi 100% Identik)
     * 5. Double Claim Guard (1 Transaksi hanya diklaim 1x dalam 1 batch)
     *
     * @param  array<int, array{
     *     seat_codes: string[],
     *     booking_code: string,
     *     passcode: string,
     *     r2_qr_path: string,
     *     r2_preview_url: string,
     *     detected_studio?: string|null,
     *     detected_time?: string|null,
     *     raw_text?: string
     * }>  $extractedTickets
     * @return array{
     *     total_detected: int,
     *     matched_count: int,
     *     unmatched_count: int,
     *     matched_items: array<int, array<string, mixed>>,
     *     unmatched_items: array<int, array<string, mixed>>
     * }
     */
    public function match(Schedule $schedule, array $extractedTickets): array
    {
        $schedule->loadMissing(['event', 'venue']);

        // Ambil judul film event lain yang aktif untuk mencegah kontaminasi salah unggah berkas film lain
        $otherActiveEventTitles = Event::where('id', '!=', $schedule->event_id)
            ->where('event_type', 'presale_cinema')
            ->pluck('title')
            ->filter()
            ->all();

        // Judul film event aktif sebagai SSOT Positive Whitelist
        $targetEventTitle = (string) ($schedule->event?->title ?? '');
        $cleanTarget = trim(explode('(', $targetEventTitle)[0]);
        $targetWords = array_values(array_filter(
            explode(' ', preg_replace('/[^a-zA-Z0-9\s]/', '', $cleanTarget)),
            fn ($w) => strlen($w) >= 3
        ));
        $stopWords = ['dan', 'di', 'ke', 'dari', 'yang', 'the', 'of', 'and', 'in', 'on', 'at', 'special', 'screening', 'xxi', 'cgv', 'premiere', 'cinema'];
        $significantTargetWords = array_values(array_filter(
            $targetWords,
            fn ($w) => ! in_array(strtolower($w), $stopWords, true)
        ));

        // Ambil seluruh pesanan presale terbayar yang menunggu injeksi tiket pada sesi ini
        $pendingTransactions = EventTransaction::where('schedule_id', $schedule->id)
            ->where('fulfillment_status', 'awaiting_cinema_ticket')
            ->where('payment_status', 'paid')
            ->with(['user:id,name,email,phone_number'])
            ->get();

        // Ambil transaksi yang sudah pernah diinjeksi/fulfilled pada sesi ini untuk mendeteksi tiket duplikat
        $fulfilledTransactions = EventTransaction::where('schedule_id', $schedule->id)
            ->where('fulfillment_status', 'fulfilled')
            ->with(['user:id,name,email,phone_number'])
            ->get();

        $matchedList = [];
        $unmatchedList = [];
        $claimedTransactionIds = [];

        // Ekstrak identitas target sesi
        $targetStudioRaw = (string) ($schedule->studio_name ?? 'Studio 1');
        $targetStudioNumber = preg_match('/\b([0-9]+)\b/', $targetStudioRaw, $sm) ? $sm[1] : null;
        $targetTime = $schedule->show_time ? $schedule->show_time->format('H:i') : null;

        foreach ($extractedTickets as $ticket) {
            $ticketSeatCodes = $ticket['seat_codes'];
            sort($ticketSeatCodes, SORT_NATURAL);
            $rawText = (string) ($ticket['raw_text'] ?? '');

            // -------------------------------------------------------------
            // LAYER 1: Anti-Salah Film (Positive Whitelist & Foreign Movie Guard)
            // -------------------------------------------------------------
            $detectedMovieTitle = isset($ticket['detected_movie_title']) && is_string($ticket['detected_movie_title'])
                ? trim($ticket['detected_movie_title'])
                : null;

            // Jika detected_movie_title belum terisi, coba ekstrak dari rawText jika memuat pola judul film
            if ($detectedMovieTitle === null && $rawText !== '') {
                if (preg_match('/(?:film|movie|judul|title)\s*[:\-]?\s*([^\n\r]+)/i', $rawText, $mm)) {
                    $detectedMovieTitle = trim(preg_replace('/\s*\((?:XXI|2D|3D|IMAX|PREMIERE)[^\)]*\)/i', '', $mm[1]));
                }
            }

            $detectedForeignFilm = null;

            // 1.1 Jika judul film terdeteksi pada karcis, bandingkan dengan target event aktif
            if ($detectedMovieTitle !== null && $detectedMovieTitle !== '') {
                $matchesTargetWord = false;
                foreach ($significantTargetWords as $tw) {
                    if (stripos($detectedMovieTitle, $tw) !== false) {
                        $matchesTargetWord = true;
                        break;
                    }
                }

                if (! $matchesTargetWord && stripos($cleanTarget, $detectedMovieTitle) === false) {
                    foreach ($otherActiveEventTitles as $foreignTitle) {
                        $cleanForeign = trim(explode('(', $foreignTitle)[0]);
                        if (stripos($foreignTitle, $detectedMovieTitle) !== false || stripos($detectedMovieTitle, $cleanForeign) !== false) {
                            $detectedForeignFilm = $cleanForeign;
                            break;
                        }
                    }
                    if ($detectedForeignFilm === null) {
                        $detectedForeignFilm = $detectedMovieTitle;
                    }
                }
            }

            // 1.2 Periksa apakah teks memuat judul event presale lain yang aktif di DB
            if ($detectedForeignFilm === null && $rawText !== '') {
                foreach ($otherActiveEventTitles as $foreignTitle) {
                    $cleanForeign = trim(explode('(', $foreignTitle)[0]);
                    $words = array_values(array_filter(explode(' ', preg_replace('/[^a-zA-Z0-9\s]/', '', $cleanForeign)), fn ($w) => strlen($w) >= 3));
                    $corePhrase = count($words) >= 2 ? $words[0].' '.$words[1] : ($words[0] ?? '');

                    if ($corePhrase !== '' && strlen($corePhrase) >= 4 && stripos($rawText, $corePhrase) !== false) {
                        $detectedForeignFilm = $corePhrase;
                        break;
                    } elseif (strlen($cleanForeign) >= 4 && stripos($rawText, $cleanForeign) !== false) {
                        $detectedForeignFilm = $cleanForeign;
                        break;
                    }
                }
            }

            if ($detectedForeignFilm !== null) {
                $unmatchedList[] = [
                    'detected_seats' => $ticketSeatCodes,
                    'detected_booking_code' => (string) $ticket['booking_code'],
                    'r2_qr_path' => (string) $ticket['r2_qr_path'],
                    'r2_preview_url' => (string) $ticket['r2_preview_url'],
                    'qr_source' => (string) ($ticket['qr_source'] ?? 'original_pdf'),
                    'match_status' => 'rejected_foreign_movie',
                    'unmatched_reason' => "Karcis terdeteksi milik film lain ({$detectedForeignFilm}), bukan {$targetEventTitle}.",
                ];

                continue;
            }

            // -------------------------------------------------------------
            // LAYER 2: Anti-Salah Studio (Studio Guard)
            // -------------------------------------------------------------
            $detectedStudio = $ticket['detected_studio'] ?? null;
            $detectedStudioNumber = null;
            if ($detectedStudio !== null && preg_match('/\b([0-9]+)\b/', $detectedStudio, $dsm)) {
                $detectedStudioNumber = $dsm[1];
            }

            if (
                $targetStudioNumber !== null &&
                $detectedStudioNumber !== null &&
                $targetStudioNumber !== $detectedStudioNumber
            ) {
                $unmatchedList[] = [
                    'detected_seats' => $ticketSeatCodes,
                    'detected_booking_code' => (string) $ticket['booking_code'],
                    'r2_qr_path' => (string) $ticket['r2_qr_path'],
                    'r2_preview_url' => (string) $ticket['r2_preview_url'],
                    'qr_source' => (string) ($ticket['qr_source'] ?? 'original_pdf'),
                    'match_status' => 'rejected_mismatched_studio',
                    'unmatched_reason' => "Karcis terdeteksi untuk Studio {$detectedStudioNumber}, sedangkan sesi aktif adalah {$targetStudioRaw}.",
                ];

                continue;
            }

            // -------------------------------------------------------------
            // LAYER 3: Anti-Salah Jam Tayang (Show Time Guard)
            // -------------------------------------------------------------
            $detectedTime = $ticket['detected_time'] ?? null;
            if ($targetTime !== null && $detectedTime !== null) {
                // Konversi ke menit untuk toleransi maksimal 30 menit
                [$tH, $tM] = array_map('intval', explode(':', $targetTime));
                [$dH, $dM] = array_map('intval', explode(':', $detectedTime));
                $targetMinutes = ($tH * 60) + $tM;
                $detectedMinutes = ($dH * 60) + $dM;

                if (abs($targetMinutes - $detectedMinutes) > 30) {
                    $unmatchedList[] = [
                        'detected_seats' => $ticketSeatCodes,
                        'detected_booking_code' => (string) $ticket['booking_code'],
                        'r2_qr_path' => (string) $ticket['r2_qr_path'],
                        'r2_preview_url' => (string) $ticket['r2_preview_url'],
                        'qr_source' => (string) ($ticket['qr_source'] ?? 'original_pdf'),
                        'match_status' => 'rejected_mismatched_time',
                        'unmatched_reason' => "Jam tayang karcis ({$detectedTime}) tidak sesuai dengan jadwal sesi ({$targetTime} WIB).",
                    ];

                    continue;
                }
            }

            // -------------------------------------------------------------
            // LAYER 4 & 5: Strict Seat Equivalence & PIN Integrity Guard
            // -------------------------------------------------------------
            $targetTrx = null;

            // 4.1 Pencocokan Utama: Kesetaraan Kursi 100% Identik
            if (! empty($ticketSeatCodes)) {
                $targetTrx = $pendingTransactions->first(function (EventTransaction $trx) use ($ticketSeatCodes, $claimedTransactionIds) {
                    if (in_array($trx->id, $claimedTransactionIds, true)) {
                        return false;
                    }

                    $trxSeats = (array) ($trx->snapshot_seats ?? []);
                    sort($trxSeats, SORT_NATURAL);

                    return ! empty($trxSeats) &&
                        ! array_diff($ticketSeatCodes, $trxSeats) &&
                        ! array_diff($trxSeats, $ticketSeatCodes);
                });
            }

            // 4.2 Pencocokan Cadangan: Nomor Telepon Pemesan dari Payload QR (Format Khas Cinema XXI m.tix: #6289658301529;67240)
            if ($targetTrx === null && ! empty($ticket['detected_phone'])) {
                $cleanTargetPhone = preg_replace('/^(\+?62|0)/', '', (string) $ticket['detected_phone']);

                $targetTrx = $pendingTransactions->first(function (EventTransaction $trx) use ($cleanTargetPhone, $claimedTransactionIds) {
                    if (in_array($trx->id, $claimedTransactionIds, true)) {
                        return false;
                    }
                    $rawUserPhone = (string) ($trx->user?->phone_number ?? '');
                    $cleanUserPhone = preg_replace('/^(\+?62|0)/', '', $rawUserPhone);

                    return $cleanUserPhone !== '' && $cleanUserPhone === $cleanTargetPhone;
                });

                if ($targetTrx !== null && empty($ticketSeatCodes)) {
                    $ticketSeatCodes = (array) ($targetTrx->snapshot_seats ?? []);
                }
            }

            // 4.3 Pencocokan Cadangan: Kode Booking Presale Jika Sudah Pernah Tercatat
            if ($targetTrx === null && ! empty($ticket['booking_code'])) {
                $targetTrx = $pendingTransactions->first(function (EventTransaction $trx) use ($ticket, $claimedTransactionIds) {
                    if (in_array($trx->id, $claimedTransactionIds, true)) {
                        return false;
                    }

                    return ! empty($trx->cinema_booking_code) && $trx->cinema_booking_code === $ticket['booking_code'];
                });

                if ($targetTrx !== null && empty($ticketSeatCodes)) {
                    $ticketSeatCodes = (array) ($targetTrx->snapshot_seats ?? []);
                }
            }

            $ticketPasscode = trim((string) ($ticket['passcode'] ?? ''));

            if ($targetTrx !== null) {
                // Jika kursi cocok namun PIN kosong atau default palsu, tolak ke Perlu Tinjauan
                if ($ticketPasscode === '' || $ticketPasscode === '000000') {
                    $unmatchedList[] = [
                        'transaction_id' => (int) $targetTrx->id,
                        'order_id' => (string) $targetTrx->order_id,
                        'user_name' => (string) ($targetTrx->user?->name ?? 'Penonton Sinemus'),
                        'detected_seats' => $ticketSeatCodes,
                        'detected_booking_code' => (string) $ticket['booking_code'],
                        'detected_passcode' => '',
                        'r2_qr_path' => (string) $ticket['r2_qr_path'],
                        'r2_preview_url' => (string) $ticket['r2_preview_url'],
                        'qr_source' => (string) ($ticket['qr_source'] ?? 'original_pdf'),
                        'match_status' => 'rejected_missing_passcode',
                        'unmatched_reason' => 'Passcode PIN kiosk tidak terdeteksi pada karcis. Harap tinjau atau lengkapi PIN secara manual.',
                        'can_manual_fulfill' => true,
                    ];
                } else {
                    $claimedTransactionIds[] = $targetTrx->id;

                    $matchedList[] = [
                        'transaction_id' => (int) $targetTrx->id,
                        'order_id' => (string) $targetTrx->order_id,
                        'user_name' => (string) ($targetTrx->user?->name ?? 'Penonton Sinemus'),
                        'seats' => (array) ($targetTrx->snapshot_seats ?? []),
                        'detected_booking_code' => (string) $ticket['booking_code'],
                        'detected_passcode' => $ticketPasscode,
                        'r2_qr_path' => (string) $ticket['r2_qr_path'],
                        'r2_preview_url' => (string) $ticket['r2_preview_url'],
                        'qr_source' => (string) ($ticket['qr_source'] ?? 'original_pdf'),
                        'match_status' => 'exact_match',
                    ];
                }
            } else {
                // Periksa apakah kursi ini sebenarnya milik pesanan yang SUDAH PERNAH diinjeksi sebelumnya
                $alreadyFulfilledTrx = null;
                if (! empty($ticketSeatCodes)) {
                    $alreadyFulfilledTrx = $fulfilledTransactions->first(function (EventTransaction $trx) use ($ticketSeatCodes) {
                        $trxSeats = (array) ($trx->snapshot_seats ?? []);
                        sort($trxSeats, SORT_NATURAL);

                        return ! empty($trxSeats) &&
                            ! array_diff($ticketSeatCodes, $trxSeats) &&
                            ! array_diff($trxSeats, $ticketSeatCodes);
                    });
                }

                if ($alreadyFulfilledTrx !== null) {
                    $unmatchedList[] = [
                        'transaction_id' => (int) $alreadyFulfilledTrx->id,
                        'order_id' => (string) $alreadyFulfilledTrx->order_id,
                        'user_name' => (string) ($alreadyFulfilledTrx->user?->name ?? 'Penonton Sinemus'),
                        'detected_seats' => $ticketSeatCodes,
                        'detected_booking_code' => (string) $ticket['booking_code'],
                        'r2_qr_path' => (string) $ticket['r2_qr_path'],
                        'r2_preview_url' => (string) $ticket['r2_preview_url'],
                        'qr_source' => (string) ($ticket['qr_source'] ?? 'original_pdf'),
                        'match_status' => 'already_fulfilled',
                        'unmatched_reason' => 'Karcis untuk kursi ('.implode(', ', $ticketSeatCodes).') sudah pernah diinjeksi sebelumnya pada pesanan '.$alreadyFulfilledTrx->order_id.' ('.($alreadyFulfilledTrx->user?->name ?? 'Penonton').').',
                        'can_manual_fulfill' => false,
                    ];
                } else {
                    $seatDesc = ! empty($ticketSeatCodes) ? ' ('.implode(', ', $ticketSeatCodes).')' : '';
                    $unmatchedList[] = [
                        'detected_seats' => $ticketSeatCodes,
                        'detected_booking_code' => (string) $ticket['booking_code'],
                        'r2_qr_path' => (string) $ticket['r2_qr_path'],
                        'r2_preview_url' => (string) $ticket['r2_preview_url'],
                        'qr_source' => (string) ($ticket['qr_source'] ?? 'original_pdf'),
                        'match_status' => 'unmatched_seat',
                        'unmatched_reason' => "Karcis{$seatDesc} tidak ditemukan pada pesanan yang menunggu injeksi di sesi ini.",
                        'can_manual_fulfill' => true,
                    ];
                }
            }
        }

        return [
            'total_detected' => count($extractedTickets),
            'matched_count' => count($matchedList),
            'unmatched_count' => count($unmatchedList),
            'matched_items' => $matchedList,
            'unmatched_items' => $unmatchedList,
        ];
    }
}
