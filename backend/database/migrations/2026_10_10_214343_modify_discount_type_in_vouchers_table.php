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
        Schema::table('vouchers', function (Blueprint $table) {
            $table->string('discount_type', 32)
                ->default('percentage')
                ->comment('Tipe diskon: percentage, fixed, atau slashed_price (coret harga)')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->enum('discount_type', ['percentage', 'fixed'])
                ->default('percentage')
                ->change();
        });
    }
};
