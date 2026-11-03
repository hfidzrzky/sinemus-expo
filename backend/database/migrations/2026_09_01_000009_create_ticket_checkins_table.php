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
        Schema::create('ticket_checkins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('event_transactions')->cascadeOnDelete();
            $table->foreignId('scanned_by_user_id')->constrained('users')->cascadeOnDelete()->comment('Super Admin / Staff Scanner');
            $table->string('device_info', 255)->nullable()->comment('Browser User Agent / Nama Perangkat');
            $table->string('ip_address', 45)->nullable();
            $table->dateTime('scanned_at')->comment('Waktu pemindaian di pintu venue');
            $table->timestamps();

            $table->index('transaction_id', 'idx_checkins_trx');
            $table->index('scanned_by_user_id', 'idx_checkins_staff');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_checkins');
    }
};
