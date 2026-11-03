<?php

namespace App\Jobs;

use App\Models\EventTransaction;
use App\Services\Tickets\TicketPdfService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateTicketPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Jumlah percobaan eksekusi jika gagal.
     */
    public int $tries = 3;

    /**
     * Waktu tunggu sebelum retry (detik).
     */
    public int $backoff = 10;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $transactionId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $transaction = EventTransaction::with(['user', 'schedule.event'])->find($this->transactionId);

        if (! $transaction) {
            Log::warning("GenerateTicketPdfJob: Transaksi ID {$this->transactionId} tidak ditemukan.");

            return;
        }

        try {
            /** @var TicketPdfService $pdfService */
            $pdfService = app(TicketPdfService::class);
            $result = $pdfService->generatePdfForTransaction($transaction);

            Log::info("GenerateTicketPdfJob: E-Tiket PDF berhasil digenerate dan di-cache untuk pesanan {$transaction->order_id}", [
                'filename' => $result['filename'],
                'ticket_code' => $transaction->ticket_code,
            ]);
        } catch (\Throwable $e) {
            Log::error("GenerateTicketPdfJob: Gagal membuat PDF untuk pesanan {$transaction->order_id}", [
                'error' => $e->getMessage(),
                'transaction_id' => $this->transactionId,
            ]);

            throw $e;
        }
    }
}
