<?php

namespace App\Console\Commands;

use App\Mail\Tickets\TicketConfirmationMail;
use App\Models\Event;
use App\Models\EventTransaction;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Console\Command\Command as CommandResponse;

class TestMailCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test 
                            {email=sinemus.screen@gmail.com : Email tujuan pengetesan} 
                            {--type=regular : Tipe template kartu (regular, presale, fulfilled)}
                            {--free-seating : Uji coba penayangan tanpa nomor kursi (General Admission / Free Seating)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kirim email pengetesan template kartu Sinemus (driver log/smtp)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $targetEmail = (string) $this->argument('email');
        $cardType = (string) $this->option('type');
        $isFreeSeating = (bool) $this->option('free-seating');
        $mailer = config('mail.default', 'log');

        $this->info("Menyiapkan mock transaksi e-tiket [Tipe: {$cardType}, FreeSeating: ".($isFreeSeating ? 'YES' : 'NO')."] ke [{$targetEmail}]...");

        // Buat mock Model EventTransaction di memori tanpa commit DB
        $mockUser = new User([
            'name' => 'Penonton Sinemus VIP',
            'email' => $targetEmail,
        ]);

        $mockEvent = new Event([
            'title' => 'Festival Film Sinemus 2026: Mahakarya Sinema',
            'venue_name' => 'CGV Grand Indonesia - Starium Screen',
            'city' => 'Jakarta Pusat',
            'event_type' => 'regular',
        ]);

        $mockSchedule = new Schedule([
            'studio_name' => 'Starium 1',
            'show_time' => now()->addDays(2)->setTime(19, 30),
        ]);
        $mockSchedule->setRelation('event', $mockEvent);

        $mockTransaction = new EventTransaction([
            'order_id' => 'SNM-TKT-'.date('Ymd').'-TEST',
            'ticket_code' => 'TKT-'.strtoupper(substr(md5((string) microtime()), 0, 8)),
            'ticket_quantity' => 2,
            'net_amount' => 150000.00,
            'payment_status' => 'paid',
            'paid_at' => now(),
            'snapshot_seats' => $isFreeSeating ? [] : ['F12', 'F13'],
            'snapshot_event_data' => [
                'event_title' => $mockEvent->title,
                'venue_name' => $mockEvent->venue_name,
                'event_type' => $mockEvent->event_type,
            ],
            'fulfillment_status' => ($cardType === 'fulfilled') ? 'fulfilled' : 'unfulfilled',
            'cinema_booking_code' => ($cardType === 'fulfilled') ? 'CGV-BKG-88912' : null,
            'cinema_passcode' => ($cardType === 'fulfilled') ? '9281' : null,
        ]);

        $mockTransaction->setRelation('user', $mockUser);
        $mockTransaction->setRelation('schedule', $mockSchedule);

        try {
            $this->info("Mengirim via driver [{$mailer}]...");
            Mail::to($targetEmail)->send(new TicketConfirmationMail($mockTransaction));

            $this->newLine();
            $this->line('<fg=green;options=bold>✓ SUKSES:</> Email kartu berhasil diproses!');
            if ($mailer === 'log') {
                $this->line('<fg=yellow;options=bold>[CATATAN]:</> MAIL_MAILER saat ini bernilai "log".');
                $this->line('Hasil HTML card dicatat di: <fg=cyan>backend/storage/logs/laravel.log</>');
                $this->line('Untuk mengirimkan email asli ke inbox Gmail, ubah MAIL_MAILER=smtp di berkas .env.');
            } else {
                $this->line("<fg=green>Email terkirim langsung via SMTP ke {$targetEmail}. Silakan periksa Inbox / Spam folder Anda!</fg=green>");
            }

            return CommandResponse::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('GAGAL: '.$e->getMessage());

            return CommandResponse::FAILURE;
        }
    }
}
