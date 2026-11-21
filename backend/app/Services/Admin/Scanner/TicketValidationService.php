<?php

namespace App\Services\Admin\Scanner;

use App\Exceptions\Tickets\TicketAlreadyCheckedInException;
use App\Exceptions\Tickets\TicketNotFoundException;
use App\Exceptions\Tickets\TicketValidationDomainException;
use App\Models\EventTransaction;
use App\Models\Schedule;
use App\Models\TicketCheckin;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class TicketValidationService
{
    /**
     * Mengambil daftar sesi operasional aktif untuk Mobile QR Scanner Gerbang Venue.
     * Hanya mencakup event regular yang aktif dan jadwal yang aktif.
     *
     * @return Collection<int, Schedule>
     */
    public function getOperationalSessions(string $scope = 'all', ?string $search = null): Collection
    {
        $now = now();
        $query = Schedule::query()
            ->where('is_active', true)
            ->whereHas('event', function ($q) {
                $q->where('is_active', true)
                    ->where('event_type', 'regular');
            })
            ->with([
                'event:id,title,slug,poster_path,venue_name,city,cinema_partner,is_active,event_type',
                'venue:id,venue_name,city,cinema_partner',
            ])
            ->withSum(['eventTransactions as tickets_sold' => function ($tq) {
                $tq->where('payment_status', 'paid');
            }], 'ticket_quantity')
            ->withSum(['eventTransactions as checked_in_count' => function ($tq) {
                $tq->where('payment_status', 'paid')
                    ->where('checkin_status', 'checked_in');
            }], 'ticket_quantity');

        // Filter Window Operasional Berbasis SSOT Server Time
        if ($scope === 'upcoming') {
            // Sesi setelah batas operasional hari ini (besok jam 06:00 WIB ke atas)
            $query->where('show_time', '>', $now->copy()->endOfDay()->addHours(6));
        } elseif ($scope === 'today') {
            // Sesi hari ini: dari 4 jam yang lalu hingga akhir jam operasional malam ini (besok jam 06:00 WIB)
            $query->where('show_time', '>=', $now->copy()->subHours(4))
                ->where('show_time', '<=', $now->copy()->endOfDay()->addHours(6));
        } else {
            // Scope 'all' (default): Seluruh sesi aktif reguler dari 12 jam yang lalu ke depan (menghilangkan sesi lampau kadaluarsa)
            $query->where('show_time', '>=', $now->copy()->subHours(12));
        }

        // Filter Pencarian Teks Bebas
        if (! empty($search)) {
            $trimmedSearch = trim($search);
            $query->where(function ($sq) use ($trimmedSearch) {
                $sq->where('studio_name', 'like', "%{$trimmedSearch}%")
                    ->orWhereHas('event', function ($eq) use ($trimmedSearch) {
                        $eq->where('title', 'like', "%{$trimmedSearch}%")
                            ->orWhere('venue_name', 'like', "%{$trimmedSearch}%")
                            ->orWhere('city', 'like', "%{$trimmedSearch}%");
                    })
                    ->orWhereHas('venue', function ($vq) use ($trimmedSearch) {
                        $vq->where('venue_name', 'like', "%{$trimmedSearch}%")
                            ->orWhere('city', 'like', "%{$trimmedSearch}%")
                            ->orWhere('cinema_partner', 'like', "%{$trimmedSearch}%");
                    });
            });
        }

        /** @var Collection<int, Schedule> $sessions */
        $sessions = $query->orderBy('show_time', 'asc')->get();

        return $sessions;
    }

    /**
     * Memvalidasi hash QR tiket dari kamera mobile scanner staf dan melakukan check-in instan.
     *
     * @param  array{qr_hash: string, schedule_id?: ?int, strict_schedule?: ?bool, device_info?: ?string}  $data
     *
     * @throws TicketNotFoundException
     * @throws TicketAlreadyCheckedInException
     * @throws TicketValidationDomainException
     */
    public function validateAndCheckin(array $data, User $staffUser, ?string $ipAddress = null): EventTransaction
    {
        return DB::transaction(function () use ($data, $staffUser, $ipAddress) {
            $queryHash = trim($data['qr_hash']);
            /** @var EventTransaction|null $transaction */
            $transaction = EventTransaction::where('qr_hash', $queryHash)
                ->orWhere('ticket_code', $queryHash)
                ->orWhere('order_id', $queryHash)
                ->lockForUpdate()
                ->first();

            if (! $transaction) {
                throw new TicketNotFoundException('QR Tiket tidak valid atau tidak terdaftar di sistem.');
            }

            // 1. Cek status pembayaran: pastikan status transaksi 'paid'
            if ($transaction->payment_status !== 'paid') {
                throw new TicketValidationDomainException(
                    'Tiket belum dibayar atau status transaksi tidak valid ('.strtoupper($transaction->payment_status).').',
                    'TICKET_UNPAID',
                    ['payment_status' => $transaction->payment_status],
                    422
                );
            }

            // 2. Cek apakah tiket sudah pernah di-checkin sebelumnya (Anti Double Check-in)
            if ($transaction->checkin_status === 'checked_in') {
                $lastCheckin = TicketCheckin::where('transaction_id', $transaction->id)
                    ->with('scannedBy:id,name')
                    ->latest('scanned_at')
                    ->first();

                $scannedAtStr = $lastCheckin?->scanned_at
                    ? $lastCheckin->scanned_at->toISOString()
                    : ($transaction->checkin_at ? $transaction->checkin_at->toISOString() : null);

                $scannedByName = $lastCheckin?->scannedBy?->name ?? 'Petugas Gerbang Venue';

                $waktuWib = $lastCheckin?->scanned_at
                    ? $lastCheckin->scanned_at->copy()->timezone('Asia/Jakarta')->format('H:i').' WIB'
                    : 'waktu sebelumnya';

                $msg = "PERINGATAN: Tiket ini SUDAH DIGUNAKAN pada pukul {$waktuWib} oleh Petugas {$scannedByName}!";

                // Seat codes extraction
                $seatCodes = null;
                if (! empty($transaction->snapshot_seats) && is_array($transaction->snapshot_seats)) {
                    $seatCodes = array_map(function ($seat) {
                        return is_array($seat) ? ($seat['seat_code'] ?? $seat['code'] ?? (string) json_encode($seat)) : (string) $seat;
                    }, $transaction->snapshot_seats);
                }

                throw new TicketAlreadyCheckedInException(
                    $msg,
                    $scannedAtStr,
                    $scannedByName,
                    $transaction->user?->name ?? $transaction->snapshot_event_data['buyer_name'] ?? null,
                    $seatCodes,
                    $transaction->ticket_code ?? $transaction->order_id,
                    (int) ($transaction->ticket_quantity ?? 1)
                );
            }

            // Eager load schedule and event for validation checks
            $schedule = $transaction->schedule;
            $event = $schedule?->event;

            // 3. Cek apakah event atau jadwal sesi berstatus aktif
            if (! $event || ! $event->is_active || ! $schedule || ! $schedule->is_active) {
                throw new TicketValidationDomainException(
                    'Sesi penayangan atau event untuk tiket ini sedang nonaktif atau telah dibatalkan.',
                    'EVENT_OR_SCHEDULE_INACTIVE',
                    [
                        'event_title' => $event?->title ?? 'Tidak diketahui',
                        'is_event_active' => (bool) ($event?->is_active ?? false),
                        'is_schedule_active' => (bool) ($schedule?->is_active ?? false),
                    ],
                    422
                );
            }

            // 4. Strict Gate Session Validation (jika schedule_id dikirim dan strict_schedule aktif)
            $targetScheduleId = ! empty($data['schedule_id']) ? (int) $data['schedule_id'] : null;
            $strictSchedule = $data['strict_schedule'] ?? true;

            if ($targetScheduleId !== null && $strictSchedule && (int) $transaction->schedule_id !== $targetScheduleId) {
                $actualTime = $schedule->show_time
                    ? $schedule->show_time->copy()->timezone('Asia/Jakarta')->format('d M Y H:i').' WIB'
                    : 'Waktu tidak ditentukan';

                throw new TicketValidationDomainException(
                    "Tiket penonton ini terdaftar untuk sesi yang BERBEDA ({$event->title} • {$schedule->studio_name} • {$actualTime}). Mohon arahkan penonton ke gerbang/sesi yang sesuai.",
                    'WRONG_SCHEDULE_SESSION',
                    [
                        'expected_schedule_id' => $targetScheduleId,
                        'actual_schedule_id' => (int) $transaction->schedule_id,
                        'actual_schedule' => [
                            'event_title' => (string) $event->title,
                            'venue_name' => (string) ($schedule->venue?->venue_name ?? $event->venue_name ?? ''),
                            'studio_name' => (string) ($schedule->studio_name ?? 'Studio Utama'),
                            'show_time' => $schedule->show_time?->toISOString(),
                            'formatted_show_time' => $actualTime,
                        ],
                    ],
                    422
                );
            }

            // 5. Cek jendela waktu operasional check-in:
            $showTime = $schedule->show_time;
            if ($showTime) {
                // A. Terlalu awal: gate scanner baru menerima tiket 4 jam sebelum jam tayang (kecuali jika flag bypass_early_window diaktifkan oleh admin)
                $bypassEarly = (bool) ($data['bypass_early_window'] ?? false);
                if (! $bypassEarly && $showTime->copy()->subHours(4)->isFuture()) {
                    $opensAtWib = $showTime->copy()->subHours(4)->timezone('Asia/Jakarta')->format('d M Y H:i').' WIB';
                    throw new TicketValidationDomainException(
                        "Gerbang masuk untuk sesi penayangan ini belum dibuka. Gate scanner baru dibuka 4 jam sebelum film dimulai (mulai {$opensAtWib}).",
                        'CHECKIN_NOT_OPEN_YET',
                        [
                            'show_time' => $showTime->toISOString(),
                            'checkin_opens_at' => $showTime->copy()->subHours(4)->toISOString(),
                        ],
                        422
                    );
                }

                // B. Sesi kadaluarsa jika show_time sudah lewat lebih dari 12 jam (toleransi wajar pemutaran film)
                if ($showTime->copy()->addHours(12)->isPast()) {
                    throw new TicketValidationDomainException(
                        'Sesi penayangan untuk tiket ini telah berakhir pada '.$showTime->copy()->timezone('Asia/Jakarta')->format('d M Y H:i').' WIB.',
                        'SESSION_EXPIRED',
                        ['show_time' => $showTime->toISOString()],
                        422
                    );
                }
            }

            // 6. Mutasi status check-in pada transaksi
            $now = now();
            $transaction->checkin_status = 'checked_in';
            $transaction->checkin_at = $now;
            $transaction->save();

            // 7. Rekam audit log ke tabel ticket_checkins
            TicketCheckin::create([
                'transaction_id' => $transaction->id,
                'scanned_by_user_id' => $staffUser->id,
                'device_info' => $data['device_info'] ?? null,
                'ip_address' => $ipAddress,
                'scanned_at' => $now,
            ]);

            // 8. Hitung update statistik real-time jadwal untuk UI counter tanpa polling terpisah
            if ($transaction->schedule_id) {
                $sched = Schedule::find($transaction->schedule_id);
                $sold = (int) EventTransaction::where('schedule_id', $transaction->schedule_id)
                    ->where('payment_status', 'paid')
                    ->sum('ticket_quantity');
                $checked = (int) EventTransaction::where('schedule_id', $transaction->schedule_id)
                    ->where('payment_status', 'paid')
                    ->where('checkin_status', 'checked_in')
                    ->sum('ticket_quantity');

                $transaction->schedule_stats = [
                    'total_seats' => (int) ($sched?->total_seats ?? 0),
                    'tickets_sold' => $sold,
                    'checked_in_count' => $checked,
                    'pending_checkin_count' => max(0, $sold - $checked),
                ];
            }

            // Eager load relations for resource output
            $transaction->loadMissing([
                'user:id,name,email',
                'schedule.event:id,title,seating_type,slug,venue_name,city',
                'schedule.venue:id,venue_name,city,cinema_partner',
            ]);

            return $transaction;
        });
    }
}
