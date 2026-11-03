<?php

namespace App\Console\Commands;

use App\Services\Movies\MovieRentalOrderService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class PruneExpiredMovieRentalsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'movies:prune-expired-orders {--minutes=15 : Batas waktu toleransi pesanan pending dalam menit}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Membersihkan transaksi sewa film (movie_transactions) pending yang kedaluwarsa melampaui batas toleransi.';

    /**
     * Execute the console command.
     */
    public function handle(MovieRentalOrderService $rentalOrderService): int
    {
        $minutes = (int) $this->option('minutes');
        if ($minutes <= 0) {
            $minutes = MovieRentalOrderService::PENDING_EXPIRY_MINUTES;
        }

        $expiredCount = $rentalOrderService->pruneExpiredOrders(toleranceMinutes: $minutes);

        $message = "Berhasil memperbarui {$expiredCount} transaksi sewa film pending kedaluwarsa (>{$minutes}m) menjadi expired.";
        $this->info($message);

        if ($expiredCount > 0) {
            Log::info('[MovieRentalPruner] '.$message);
        }

        return self::SUCCESS;
    }
}
