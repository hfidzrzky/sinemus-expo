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
        Schema::create('user_movie_access', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('movie_id')->constrained('movies')->restrictOnDelete();
            $table->foreignId('transaction_id')->nullable()->constrained('movie_transactions')->nullOnDelete();
            $table->enum('access_status', ['active', 'expired', 'revoked'])->default('active');
            $table->dateTime('rental_start_at')->comment('Waktu mulai akses aktif');
            $table->dateTime('rental_expires_at')->comment('Waktu akhir sewa (start + 48 jam)');
            $table->dateTime('revoked_at')->nullable();
            $table->enum('revoke_reason', ['none', 'refund', 'violation', 'system_error', 'manual_admin'])->default('none');
            $table->string('admin_notes', 255)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'movie_id', 'access_status', 'rental_expires_at'], 'idx_access_fast_check');
            $table->index('rental_expires_at', 'idx_access_expiry');
            $table->index('transaction_id', 'idx_access_trx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_movie_access');
    }
};
