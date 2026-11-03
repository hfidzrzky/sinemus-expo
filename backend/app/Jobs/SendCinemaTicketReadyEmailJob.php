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

class SendCinemaTicketReadyEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Jumlah percobaan eksekusi jika terjadi kegagalan koneksi SMTP/mailer.
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
        /** @var EventTransaction|null $transaction */
        $transaction = EventTransaction::with(['user', 'schedule.event'])->find($this->transactionId);

        if (! $transaction || ! $transaction->user || empty($transaction->user->email)) {
            Log::warning("SendCinemaTicketReadyEmailJob: Transaksi ID {$this->transactionId} atau email pengguna tidak ditemukan.");

            return;
        }

        $recipientEmail = $transaction->user->email;
        $orderId = $transaction->order_id;

        try {
            // Menggunakan TicketConfirmationMail yang secara otomatis me-render
            // template emails.tickets.presale-fulfilled.blade.php via TicketEmailPayloadBuilder
            Mail::to($recipientEmail)->send(new TicketConfirmationMail($transaction));

            Log::info("SendCinemaTicketReadyEmailJob: Email e-pass karcis bioskop berhasil dikirim ke {$recipientEmail} untuk pesanan {$orderId}");
        } catch (\Throwable $e) {
            Log::error("SendCinemaTicketReadyEmailJob: Gagal mengirim email tiket bioskop ke {$recipientEmail} untuk pesanan {$orderId}", [
                'error' => $e->getMessage(),
                'transaction_id' => $this->transactionId,
            ]);

            throw $e;
        }
    }
}
