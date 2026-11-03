<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('event_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('order_id', 50)->unique()->comment('Format: SNM-TKT-YYYY-XXXX');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('schedule_id')->constrained('schedules')->restrictOnDelete();
            $table->foreignId('voucher_id')->nullable()->constrained('vouchers')->nullOnDelete();
            $table->unsignedInteger('ticket_quantity')->default(1)->comment('Jumlah tiket');
            $table->decimal('gross_amount', 12, 2);
            $table->decimal('discount_amount', 12, 2)->default(0.00);
            $table->decimal('net_amount', 12, 2);
            $table->string('snap_token', 255)->nullable();
            $table->enum('payment_status', ['pending', 'paid', 'expired', 'failed', 'cancelled'])->default('pending');
            $table->string('payment_type', 50)->nullable()->comment('qris, gopay, bank_transfer, credit_card');
            $table->dateTime('paid_at')->nullable();
            $table->string('ticket_code', 50)->nullable()->unique()->comment('Format: TKT-YYYY-XXXX');
            $table->string('qr_hash', 64)->nullable()->unique()->comment('String hash enkripsi QR Sinemus');
            $table->enum('checkin_status', ['pending', 'checked_in'])->default('pending');
            $table->dateTime('checkin_at')->nullable();
            $table->enum('fulfillment_status', ['unfulfilled', 'awaiting_cinema_ticket', 'fulfilled', 'cancelled'])->default('unfulfilled');
            $table->string('cinema_booking_code', 100)->nullable()->comment('Kode booking M-Tix/TIX ID');
            $table->string('cinema_passcode', 50)->nullable()->comment('Passcode / PIN cetak kiosk XXI');
            $table->string('cinema_qr_image_path', 255)->nullable()->comment('URL path QR M-Tix di R2');
            $table->text('cinema_ticket_notes')->nullable();
            $table->dateTime('fulfilled_at')->nullable();
            $table->foreignId('fulfilled_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('snapshot_event_data')->comment('Snapshot title, venue, showtime, price');
            $table->json('snapshot_seats')->nullable()->comment('Snapshot array kursi');
            $table->timestamps();

            $table->index(['user_id', 'payment_status'], 'idx_event_trx_user_status');
            $table->index('schedule_id', 'idx_event_trx_schedule');
            $table->index('checkin_status', 'idx_event_trx_checkin');
            $table->index('fulfillment_status', 'idx_event_trx_fulfillment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_transactions');
    }
};
