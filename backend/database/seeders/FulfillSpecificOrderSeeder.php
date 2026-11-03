<?php

namespace Database\Seeders;

use App\Models\EventTransaction;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class FulfillSpecificOrderSeeder extends Seeder
{
    /**
     * Menginjeksi kredensial M-Tix bioskop resmi untuk order presale penonton.
     * Mengubah status dari 'awaiting_cinema_ticket' menjadi 'fulfilled' (Tiket Siap).
     */
    public function run(): void
    {
        $targetOrderId = 'SNM-TKT-20260924-RW3CVD';

        $transaction = EventTransaction::where('order_id', $targetOrderId)->first();

        if (! $transaction) {
            $this->command?->warn("Pesanan {$targetOrderId} tidak ditemukan di database.");

            // Cari transaksi presale apa pun yang masih pending injeksi
            $transaction = EventTransaction::where('fulfillment_status', 'awaiting_cinema_ticket')->first();
        }

        if ($transaction) {
            $transaction->update([
                'fulfillment_status' => 'fulfilled',
                'cinema_booking_code' => 'MTX-849201',
                'cinema_passcode' => '382910',
                'cinema_qr_image_path' => 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=MTX-849201-382910&format=png',
                'cinema_ticket_notes' => 'Pencetakan karcis fisik di Self-Service Ticketing Kiosk XXI.',
                'fulfilled_at' => Carbon::now(),
            ]);

            $this->command?->info("BERHASIL! Pesanan {$transaction->order_id} telah diinjeksi kredensial M-Tix resmi dan statusnya kini 'fulfilled' (Tiket Siap Digunakan).");
        } else {
            $this->command?->error('Tidak ditemukan transaksi untuk diinjeksi.');
        }
    }
}
