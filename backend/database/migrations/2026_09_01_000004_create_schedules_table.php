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
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->dateTime('show_time')->comment('Waktu pemutaran film');
            $table->decimal('ticket_price', 12, 2)->comment('Harga tiket per kursi');
            $table->unsignedInteger('total_seats')->default(0)->comment('Kapasitas kursi studio');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['event_id', 'show_time', 'is_active'], 'idx_schedules_event_showtime');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
