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
        Schema::create('movie_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('order_id', 50)->unique()->comment('Format: SNM-VOD-YYYY-XXXX');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('movie_id')->constrained('movies')->restrictOnDelete();
            $table->foreignId('voucher_id')->nullable()->constrained('vouchers')->nullOnDelete();
            $table->decimal('gross_amount', 12, 2);
            $table->decimal('discount_amount', 12, 2)->default(0.00);
            $table->decimal('net_amount', 12, 2);
            $table->string('snap_token', 255)->nullable();
            $table->enum('payment_status', ['pending', 'paid', 'expired', 'failed', 'cancelled'])->default('pending');
            $table->string('payment_type', 50)->nullable()->comment('qris, gopay, bank_transfer, credit_card');
            $table->dateTime('paid_at')->nullable();
            $table->json('snapshot_movie_data')->comment('Snapshot title, duration, price, poster');
            $table->timestamps();

            $table->index(['user_id', 'payment_status'], 'idx_movie_trx_user_status');
            $table->index('movie_id', 'idx_movie_trx_movie_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movie_transactions');
    }
};
