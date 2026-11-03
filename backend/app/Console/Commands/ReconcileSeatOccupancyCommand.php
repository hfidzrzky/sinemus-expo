<?php

namespace App\Console\Commands;

use App\Models\Schedule;
use App\Services\Admin\Events\AdminScheduleSeatService;
use Illuminate\Console\Command;

class ReconcileSeatOccupancyCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sinemus:reconcile-seats {--schedule= : ID Schedule sesi spesifik}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Rekonsiliasi status denah kursi fisik dengan transaksi tiket lunas, mengeliminasi phantom seats dan sinkronisasi kapasitas.';

    public function __construct(
        protected AdminScheduleSeatService $scheduleSeatService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Memulai rekonsiliasi okupansi kursi Sinemus Screen...');

        $scheduleId = $this->option('schedule');

        if ($scheduleId) {
            $schedule = Schedule::find($scheduleId);
            if (! $schedule) {
                $this->error("Jadwal sesi ID {$scheduleId} tidak ditemukan.");

                return self::FAILURE;
            }
            $results = [$this->scheduleSeatService->reconcileScheduleSeats($schedule)];
        } else {
            $results = $this->scheduleSeatService->reconcileAllSchedules();
        }

        $headers = ['Schedule ID', 'Booked Disinkronkan', 'Phantom Dibebaskan', 'Kapasitas Riil'];
        $rows = [];
        $totalBookedSynced = 0;
        $totalPhantomReleased = 0;

        foreach ($results as $res) {
            $rows[] = [
                $res['schedule_id'],
                $res['booked_synced'],
                $res['phantom_released'],
                $res['sellable_capacity'],
            ];
            $totalBookedSynced += $res['booked_synced'];
            $totalPhantomReleased += $res['phantom_released'];
        }

        $this->table($headers, $rows);
        $this->info("Rekonsiliasi selesai: {$totalBookedSynced} kursi sah diamankan (booked), {$totalPhantomReleased} kursi hantu dibebaskan (available).");

        return self::SUCCESS;
    }
}
