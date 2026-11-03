<?php

namespace App\Console\Commands;

use App\Models\Event;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CloseExpiredEventsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'events:close-expired-sales';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Memindai event yang masa penayangannya telah selesai dan mengubah statusnya menjadi Draft (is_active = false)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = now();
        $this->info("Memulai pemindaian event kedaluwarsa pada: {$now->toDateTimeString()}");

        // 1. Ambil seluruh event aktif beserta jadwal penayangan
        $activeEvents = Event::query()
            ->active()
            ->with(['schedules'])
            ->get();

        $closedCount = 0;

        foreach ($activeEvents as $event) {
            $effectiveConcludesAt = $event->getEffectiveConcludesAt();

            // Jika batas penayangan selesai telah terlewati
            if ($effectiveConcludesAt && $now->gte($effectiveConcludesAt)) {
                DB::transaction(function () use ($event, $effectiveConcludesAt, &$closedCount) {
                    $event->update([
                        'is_active' => false,
                        'is_featured' => false,
                    ]);

                    Log::info("Event auto-drafted to inactive: ID {$event->id} ({$event->title})", [
                        'concluded_at' => $effectiveConcludesAt->toDateTimeString(),
                        'sales_end_at' => $event->sales_end_at?->toDateTimeString(),
                    ]);

                    $closedCount++;
                });

                $this->line(" - Event ID {$event->id} ('{$event->title}') berhasil diubah menjadi Draft.");
            }
        }

        $this->info("Selesai. Total event yang dialihkan ke Draft: {$closedCount}");

        return Command::SUCCESS;
    }
}
