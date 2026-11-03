<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Membersihkan seluruh data sisa presale di tabel events dan event_transactions
     * serta memperbarui skema kolom event_type menjadi murni ['regular'].
     */
    public function up(): void
    {
        // 1. Update data event_type presale_cinema menjadi regular
        DB::table('events')
            ->where('event_type', 'presale_cinema')
            ->update([
                'event_type' => 'regular',
                'updated_at' => now(),
            ]);

        // 2. Update status fulfillment transaksi presale lama menjadi fulfilled (tiket digital reguler aktif)
        DB::table('event_transactions')
            ->where('fulfillment_status', 'awaiting_cinema_ticket')
            ->update([
                'fulfillment_status' => 'fulfilled',
                'cinema_booking_code' => null,
                'cinema_passcode' => null,
                'cinema_qr_image_path' => null,
                'cinema_ticket_notes' => null,
                'updated_at' => now(),
            ]);

        // 3. Modifikasi kolom event_type pada tabel events agar hanya menerima 'regular'
        $connection = config('database.default');
        $driver = config("database.connections.{$connection}.driver");

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE events MODIFY COLUMN event_type ENUM('regular') NOT NULL DEFAULT 'regular' COMMENT 'Screening reguler Sinemus Space (assigned seating / GA)'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $connection = config('database.default');
        $driver = config("database.connections.{$connection}.driver");

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE events MODIFY COLUMN event_type ENUM('regular', 'presale_cinema') NOT NULL DEFAULT 'regular' COMMENT 'regular: screening fisik mandiri, presale_cinema: presale bioskop komersial'");
        }
    }
};
