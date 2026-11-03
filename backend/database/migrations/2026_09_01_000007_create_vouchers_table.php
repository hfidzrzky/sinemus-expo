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
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique()->comment('Kode kupon unik (SINEMUSHEMAT)');
            $table->enum('discount_type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('discount_value', 12, 2)->comment('Nilai diskon (misal: 20.00 untuk 20% atau 10000.00)');
            $table->decimal('min_purchase', 12, 2)->default(0.00)->comment('Minimal total belanja');
            $table->decimal('max_discount', 12, 2)->nullable()->comment('Batas maksimal potongan persentase');
            $table->enum('item_type', ['all', 'ticket', 'movie_rental'])->default('all');
            $table->unsignedInteger('quota_total')->default(100);
            $table->unsignedInteger('quota_used')->default(0);
            $table->dateTime('valid_from');
            $table->dateTime('valid_until');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['code', 'is_active', 'valid_from', 'valid_until'], 'idx_vouchers_validation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
