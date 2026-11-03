<?php

namespace App\Services\Admin\Events;

use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Schedule;
use App\Models\Seat;
use App\Models\SeatLock;
use DomainException;
use Illuminate\Support\Facades\DB;

class AdminScheduleSeatService
{
    /**
     * Membuat sesi penayangan (schedule) baru untuk sebuah event.
     *
     * @param  array<string, mixed>  $scheduleData
     */
    public function createSchedule(Event $event, array $scheduleData): Schedule
    {
        return DB::transaction(function () use ($event, $scheduleData) {
            if (empty($scheduleData['studio_name'])) {
                $scheduleData['studio_name'] = 'Studio 1';
            }

            if (empty($scheduleData['event_venue_id'])) {
                $scheduleData['event_venue_id'] = $event->venues()->first()?->id;
            }

            return $event->schedules()->create($scheduleData);
        });
    }

    /**
     * Menghasilkan denah kursi interaktif (grid matriks) untuk sesi jadwal penayangan.
     * Menerapkan safety lock pasca-transaksi untuk mencegah inkonsistensi nomor kursi penonton.
     *
     * @param  array<string, mixed>  $seatConfig
     *
     * @throws DomainException
     */
    public function generateSeatsGrid(Schedule $schedule, array $seatConfig): int
    {
        return DB::transaction(function () use ($schedule, $seatConfig) {
            // Pessimistic Concurrency Guard
            /** @var Schedule $lockedSchedule */
            $lockedSchedule = Schedule::where('id', $schedule->id)
                ->lockForUpdate()
                ->firstOrFail();

            // Safety Lock: Cek apakah sesi ini sudah memiliki denah kursi dan transaksi tiket lunas
            // Jika denah kursi belum pernah dibuat (0 kursi), Super Admin diizinkan mengisi inisial denah kursi.
            $hasExistingSeats = Seat::where('schedule_id', $lockedSchedule->id)->exists();
            $hasPaidTickets = EventTransaction::where('schedule_id', $lockedSchedule->id)
                ->where('payment_status', 'paid')
                ->exists();

            if ($hasExistingSeats && $hasPaidTickets) {
                throw new DomainException('Denah kursi terkunci dan tidak dapat di-generate ulang karena sesi ini telah memiliki tiket terjual.');
            }

            // Hapus denah kursi lama jika belum ada transaksi atau belum pernah di-generate
            Seat::where('schedule_id', $lockedSchedule->id)->delete();

            $rows = (int) $seatConfig['rows'];
            $columns = (int) $seatConfig['columns'];
            $vipSeats = (array) ($seatConfig['vip_seats'] ?? []);
            $aisleSeats = (array) ($seatConfig['aisle_seats'] ?? []);
            $disabledSeats = (array) ($seatConfig['disabled_seats'] ?? []);

            $batchSeats = [];
            $sellableSeatsCount = 0;
            $now = now();

            for ($r = 0; $r < $rows; $r++) {
                $rowLabel = chr(65 + $r); // 0 -> A, 1 -> B, dst.
                $chairNumber = 0;

                for ($c = 1; $c <= $columns; $c++) {
                    $gridKey = "{$rowLabel}{$c}";

                    // Tentukan tipe dan status kursi (VIP, Gang/Aisle, atau Reguler/Standard)
                    if (in_array($gridKey, $aisleSeats, true)) {
                        $seatType = 'aisle';
                        $status = 'disabled';
                        $seatNumber = 0;
                        $seatCode = "{$rowLabel}-G{$c}";
                    } elseif (in_array($gridKey, $disabledSeats, true)) {
                        $chairNumber++;
                        $seatType = 'standard';
                        $status = 'disabled';
                        $seatNumber = $chairNumber;
                        $seatCode = "{$rowLabel}{$seatNumber}";
                    } elseif (in_array($gridKey, $vipSeats, true)) {
                        $chairNumber++;
                        $seatType = 'vip';
                        $status = 'available';
                        $seatNumber = $chairNumber;
                        $seatCode = "{$rowLabel}{$seatNumber}";
                        $sellableSeatsCount++;
                    } else {
                        $chairNumber++;
                        $seatType = 'standard';
                        $status = 'available';
                        $seatNumber = $chairNumber;
                        $seatCode = "{$rowLabel}{$seatNumber}";
                        $sellableSeatsCount++;
                    }

                    $batchSeats[] = [
                        'schedule_id' => $lockedSchedule->id,
                        'row_label' => $rowLabel,
                        'grid_column' => $c,
                        'seat_number' => $seatNumber,
                        'seat_code' => $seatCode,
                        'seat_type' => $seatType,
                        'status' => $status,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            // Batch insert bertahap per 250 record untuk efisiensi query
            foreach (array_chunk($batchSeats, 250) as $chunk) {
                Seat::insert($chunk);
            }

            // Perbarui kapasitas kursi yang dapat dijual pada sesi jadwal
            $lockedSchedule->update([
                'total_seats' => $sellableSeatsCount,
            ]);

            return count($batchSeats);
        });
    }

    /**
     * Rekonsiliasi atomik antara status fisik kursi dan transaksi tiket lunas.
     * Mengeliminasi phantom booked seats dan mengamankan kursi yang sudah dibayar penonton.
     *
     * @return array{schedule_id: int, booked_synced: int, phantom_released: int, sellable_capacity: int}
     */
    public function reconcileScheduleSeats(Schedule $schedule): array
    {
        return DB::transaction(function () use ($schedule) {
            /** @var Schedule $lockedSchedule */
            $lockedSchedule = Schedule::where('id', $schedule->id)
                ->lockForUpdate()
                ->firstOrFail();

            // 1. Bersihkan lock sementara yang sudah kedaluwarsa pada sesi ini
            SeatLock::where('schedule_id', $lockedSchedule->id)
                ->where('expires_at', '<=', now())
                ->delete();

            $hasPhysicalSeats = Seat::where('schedule_id', $lockedSchedule->id)->exists();

            if (! $hasPhysicalSeats) {
                // Untuk General Admission / Sesi tanpa grid fisik, pastikan total_seats valid
                return [
                    'schedule_id' => $lockedSchedule->id,
                    'booked_synced' => 0,
                    'phantom_released' => 0,
                    'sellable_capacity' => (int) $lockedSchedule->total_seats,
                ];
            }

            // 2. Kumpulkan seluruh kode kursi yang sah dari transaksi lunas (paid)
            $paidTransactions = EventTransaction::where('schedule_id', $lockedSchedule->id)
                ->where('payment_status', 'paid')
                ->get(['id', 'snapshot_seats']);

            $validBookedCodes = [];
            foreach ($paidTransactions as $tx) {
                if (is_array($tx->snapshot_seats)) {
                    $validBookedCodes = array_merge($validBookedCodes, $tx->snapshot_seats);
                }
            }
            $validBookedCodes = array_values(array_unique(array_filter($validBookedCodes)));

            // 3. Update kursi yang sah ke status 'booked'
            $bookedSynced = 0;
            if (! empty($validBookedCodes)) {
                $bookedSynced = Seat::where('schedule_id', $lockedSchedule->id)
                    ->whereIn('seat_code', $validBookedCodes)
                    ->where('status', '!=', 'booked')
                    ->update(['status' => 'booked']);
            }

            // 4. Bebaskan kursi phantom yang berstatus 'booked' tetapi tidak memiliki transaksi lunas
            $phantomReleased = Seat::where('schedule_id', $lockedSchedule->id)
                ->whereNotIn('seat_code', $validBookedCodes)
                ->where('status', 'booked')
                ->where('seat_type', '!=', 'aisle')
                ->update(['status' => 'available']);

            // 5. Pastikan total_seats mencerminkan kapasitas fisik yang dapat dijual (non-aisle, non-disabled)
            $sellableSeatsCount = Seat::where('schedule_id', $lockedSchedule->id)
                ->where('seat_type', '!=', 'aisle')
                ->where('status', '!=', 'disabled')
                ->count();

            if ($sellableSeatsCount > 0 && (int) $lockedSchedule->total_seats !== $sellableSeatsCount) {
                $lockedSchedule->update(['total_seats' => $sellableSeatsCount]);
            }

            return [
                'schedule_id' => $lockedSchedule->id,
                'booked_synced' => $bookedSynced,
                'phantom_released' => $phantomReleased,
                'sellable_capacity' => $sellableSeatsCount,
            ];
        });
    }

    /**
     * Rekonsiliasi seluruh jadwal penayangan di sistem.
     *
     * @return array<int, array{schedule_id: int, booked_synced: int, phantom_released: int, sellable_capacity: int}>
     */
    public function reconcileAllSchedules(): array
    {
        $schedules = Schedule::all();
        $results = [];

        foreach ($schedules as $schedule) {
            $results[] = $this->reconcileScheduleSeats($schedule);
        }

        return $results;
    }

    /**
     * Memeriksa apakah konfigurasi denah kursi yang dikirimkan identik 100% dengan kursi fisik yang sudah ada di database.
     * Mencegah pembersihan/regenerasi sia-sia (idempotency) dan mendeteksi perubahan ilegal pada jadwal yang terkunci.
     *
     * @param  array<string, mixed>  $seatConfig
     */
    public function isSeatMapConfigIdentical(Schedule $schedule, array $seatConfig): bool
    {
        $existingSeats = $schedule->relationLoaded('seats')
            ? $schedule->seats
            : Seat::where('schedule_id', $schedule->id)->get();

        if ($existingSeats->isEmpty()) {
            return false;
        }

        $expectedRows = (int) ($seatConfig['rows'] ?? 0);
        $expectedCols = (int) ($seatConfig['columns'] ?? 0);

        if ($expectedRows <= 0 || $expectedCols <= 0) {
            return true;
        }

        $actualRows = $existingSeats->pluck('row_label')->unique()->count();
        $actualCols = (int) ($existingSeats->max('grid_column') ?? $existingSeats->max('seat_number') ?? 0);

        if ($actualRows !== $expectedRows || $actualCols !== $expectedCols) {
            return false;
        }

        $expectedVip = collect($seatConfig['vip_seats'] ?? [])->map(fn ($s) => (string) $s)->sort()->values()->all();
        $actualVip = $existingSeats->where('seat_type', 'vip')->map(function ($s) {
            $col = $s->grid_column ?? $s->seat_number;

            return "{$s->row_label}{$col}";
        })->sort()->values()->all();

        if ($expectedVip !== $actualVip) {
            return false;
        }

        $expectedAisles = collect($seatConfig['aisle_seats'] ?? [])->map(fn ($s) => (string) $s)->sort()->values()->all();
        $actualAisles = $existingSeats->filter(function ($s) {
            return $s->seat_type === 'aisle'
                || str_contains((string) $s->seat_code, '-G')
                || ((int) $s->seat_number === 0 && (int) ($s->grid_column ?? 0) > 0);
        })->map(function ($s) {
            $col = $s->grid_column ?? $s->seat_number;

            return "{$s->row_label}{$col}";
        })->sort()->values()->all();

        if ($expectedAisles !== $actualAisles) {
            return false;
        }

        $expectedDisabled = collect($seatConfig['disabled_seats'] ?? [])->map(fn ($s) => (string) $s)->sort()->values()->all();
        $actualDisabled = $existingSeats->where('status', 'disabled')->filter(function ($s) {
            return $s->seat_type !== 'aisle'
                && ! str_contains((string) $s->seat_code, '-G')
                && (int) $s->seat_number > 0;
        })->map(function ($s) {
            $col = $s->grid_column ?? $s->seat_number;

            return "{$s->row_label}{$col}";
        })->sort()->values()->all();

        if ($expectedDisabled !== $actualDisabled) {
            return false;
        }

        return true;
    }
}
