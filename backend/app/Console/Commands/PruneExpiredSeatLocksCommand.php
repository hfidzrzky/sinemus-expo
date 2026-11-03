<?php

namespace App\Console\Commands;

use App\Models\EventTransaction;
use App\Models\SeatLock;
use App\Services\Admin\Settings\SystemSettingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PruneExpiredSeatLocksCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bookings:prune-expired-locks';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Membersihkan kunci kursi (seat_locks) yang sudah kedaluwarsa dan memperbarui status draft transaksi.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = now();

        $expiredLocks = SeatLock::where('expires_at', '<=', $now)->get();
        $expiredLocksCount = $expiredLocks->count();
        $orderIds = $expiredLocks->pluck('order_id')->unique()->filter()->values()->toArray();

        $expiredTransactionsCount = 0;

        DB::transaction(function () use ($now, $orderIds, &$expiredTransactionsCount) {
            // 1. Hapus semua lock kursi yang telah melewati masa berlaku
            if (! empty($orderIds)) {
                SeatLock::where('expires_at', '<=', $now)->delete();
            }

            // 2. Periksa transaksi terkait dari lock yang kedaluwarsa
            if (! empty($orderIds)) {
                $pendingFromLocks = EventTransaction::whereIn('order_id', $orderIds)
                    ->where('payment_status', 'pending')
                    ->get();

                foreach ($pendingFromLocks as $transaction) {
                    $hasRemainingLock = SeatLock::where('order_id', $transaction->order_id)
                        ->where('expires_at', '>', $now)
                        ->exists();

                    if (! $hasRemainingLock) {
                        $transaction->update(['payment_status' => 'expired']);
                        $expiredTransactionsCount++;
                    }
                }
            }

            // 3. SAPU BERSIH: Update SEMUA EventTransaction berstatus pending yang dibuat melampaui durasi lock menjadi 'expired'
            $settingService = app(SystemSettingService::class);
            $lockDuration = $settingService->getSeatLockDurationMinutes();

            $stalePendingTransactions = EventTransaction::where('payment_status', 'pending')
                ->where('created_at', '<=', $now->copy()->subMinutes($lockDuration))
                ->get();

            foreach ($stalePendingTransactions as $staleTx) {
                // Pastikan tidak ada lock aktif yang tersisa untuk order ini
                $hasActiveLock = SeatLock::where('order_id', $staleTx->order_id)
                    ->where('expires_at', '>', $now)
                    ->exists();

                if (! $hasActiveLock) {
                    $staleTx->update(['payment_status' => 'expired']);
                    SeatLock::where('order_id', $staleTx->order_id)->delete();
                    $expiredTransactionsCount++;
                }
            }
        });

        $message = "Berhasil membersihkan {$expiredLocksCount} kunci kursi kedaluwarsa dan memperbarui {$expiredTransactionsCount} transaksi menjadi expired.";
        $this->info($message);
        Log::info('[SeatLockPruner] '.$message);

        return self::SUCCESS;
    }
}
