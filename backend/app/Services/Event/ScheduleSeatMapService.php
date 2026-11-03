<?php

namespace App\Services\Event;

use App\Exceptions\Events\ScheduleNotFoundException;
use App\Models\Schedule;
use App\Models\Seat;
use App\Models\SeatLock;
use Illuminate\Support\Facades\DB;

class ScheduleSeatMapService
{
    /**
     * Mengambil denah kursi interaktif dan menghitung status real-time setiap kursi:
     * - 'disabled' jika dinonaktifkan oleh pengelola
     * - 'booked' jika sudah lunas terpesan
     * - 'locked' jika sedang ditahan oleh transaksi aktif dalam batas 15 menit (expires_at > now())
     * - 'available' jika siap dipesan
     *
     * Format baris dan kolom beradaptasi secara dinamis mengikuti konfigurasi kursi yang diinputkan.
     *
     * @return array{
     *     schedule_id: int,
     *     rows: array<int, string>,
     *     cols: int,
     *     ticket_price: float,
     *     seats: array<int, array{
     *         id: int,
     *         row_label: string,
     *         seat_number: int,
     *         seat_code: string,
     *         status: string,
     *         seat_type: string
     *     }>
     * }
     */
    public function getSeatMap(int $scheduleId): array
    {
        $schedule = Schedule::query()
            ->active()
            ->with('event')
            ->find($scheduleId);

        if (! $schedule) {
            throw new ScheduleNotFoundException;
        }

        $seats = Seat::query()
            ->where('schedule_id', $scheduleId)
            ->orderBy('row_label', 'asc')
            ->orderBy(DB::raw('COALESCE(grid_column, seat_number)'), 'asc')
            ->get();

        $activeLockedSeatIds = SeatLock::query()
            ->where('schedule_id', $scheduleId)
            ->active()
            ->whereNotNull('seat_id')
            ->pluck('seat_id')
            ->flip()
            ->all();

        $transformedSeats = [];
        $rows = [];
        $maxCol = 0;

        foreach ($seats as $seat) {
            $rowLabel = (string) $seat->row_label;
            if (! in_array($rowLabel, $rows, true)) {
                $rows[] = $rowLabel;
            }

            $effectiveCol = (int) ($seat->grid_column ?? $seat->seat_number);
            if ($effectiveCol > $maxCol) {
                $maxCol = $effectiveCol;
            }

            // Real-time calculated status
            $status = $seat->status;
            if ($status === 'available' && isset($activeLockedSeatIds[$seat->id])) {
                $status = 'locked';
            }

            $transformedSeats[] = [
                'id' => (int) $seat->id,
                'row_label' => $rowLabel,
                'grid_column' => $seat->grid_column ? (int) $seat->grid_column : (int) $seat->seat_number,
                'seat_number' => (int) $seat->seat_number,
                'seat_code' => (string) $seat->seat_code,
                'status' => (string) $status,
                'seat_type' => (string) $seat->seat_type,
            ];
        }

        return [
            'schedule_id' => (int) $schedule->id,
            'rows' => $rows,
            'cols' => $maxCol,
            'ticket_price' => (float) $schedule->ticket_price,
            'vip_ticket_price' => $schedule->vip_ticket_price !== null ? (float) $schedule->vip_ticket_price : null,
            'seats' => $transformedSeats,
        ];
    }
}
