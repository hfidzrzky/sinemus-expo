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
        Schema::table('event_transactions', function (Blueprint $table) {
            $table->string('payment_status', 32)->default('pending')->change();
        });

        Schema::table('movie_transactions', function (Blueprint $table) {
            $table->string('payment_status', 32)->default('pending')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_transactions', function (Blueprint $table) {
            $table->enum('payment_status', ['pending', 'paid', 'expired', 'failed'])->default('pending')->change();
        });

        Schema::table('movie_transactions', function (Blueprint $table) {
            $table->enum('payment_status', ['pending', 'paid', 'expired', 'failed'])->default('pending')->change();
        });
    }
};
