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
        Schema::create('seat_locks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->constrained('schedules')->cascadeOnDelete()->comment('Sesi jadwal yang dikunci');
            $table->foreignId('seat_id')->nullable()->constrained('seats')->cascadeOnDelete()->comment('ID kursi fisik (NULL jika general_admission)');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->comment('Pengguna yang memegang kunci');
            $table->unsignedInteger('quantity')->default(1)->comment('Jumlah kuota terkunci');
            $table->string('order_id', 50)->comment('Order ID transaksi (SNM-TKT-XXXX)');
            $table->dateTime('expires_at')->comment('Waktu kunci kedaluwarsa (created_at + 15 min)');
            $table->timestamps();

            $table->index(['schedule_id', 'expires_at'], 'idx_seat_locks_schedule_expiry');
            $table->index('seat_id', 'idx_seat_locks_seat_id');
            $table->index(['order_id', 'expires_at'], 'idx_seat_locks_order_expiry');
            $table->index('user_id', 'idx_seat_locks_user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seat_locks');
    }
};
