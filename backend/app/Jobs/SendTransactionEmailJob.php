<?php

namespace App\Jobs;

use App\Mail\Tickets\TicketConfirmationMail;
use App\Models\EventTransaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendTransactionEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Jumlah percobaan eksekusi jika terjadi gangguan jaringan/SMTP.
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

        if (! $transaction || ! $transaction->user || empty($transaction->user->email)) {
            Log::warning("SendTransactionEmailJob: Transaksi ID {$this->transactionId} atau email pengguna tidak valid.");

            return;
        }

        $recipientEmail = $transaction->user->email;
        $orderId = $transaction->order_id;

        try {
            Mail::to($recipientEmail)->send(new TicketConfirmationMail($transaction));

            Log::info("SendTransactionEmailJob: Email konfirmasi tiket berhasil dikirim ke {$recipientEmail} untuk pesanan {$orderId}");
        } catch (\Throwable $e) {
            Log::error("SendTransactionEmailJob: Gagal mengirim email tiket ke {$recipientEmail} untuk pesanan {$orderId}", [
                'error' => $e->getMessage(),
                'transaction_id' => $this->transactionId,
            ]);

            throw $e; // Supaya di-retry sesuai kebijakan $tries dan $backoff antrian queue
        }
    }
}
