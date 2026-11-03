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
        Schema::create('seats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->constrained('schedules')->cascadeOnDelete();
            $table->string('row_label', 5)->comment('Label baris (A, B, C...)');
            $table->unsignedInteger('seat_number')->comment('Nomor kursi (1, 2, 3...)');
            $table->string('seat_code', 10)->comment('Kode gabungan (A1, B8, G4)');
            $table->enum('seat_type', ['standard', 'vip', 'aisle'])->default('standard');
            $table->enum('status', ['available', 'booked', 'disabled'])->default('available');
            $table->timestamps();

            $table->unique(['schedule_id', 'seat_code'], 'uk_schedule_seat_code');
            $table->index(['schedule_id', 'status'], 'idx_seats_schedule_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seats');
    }
};
