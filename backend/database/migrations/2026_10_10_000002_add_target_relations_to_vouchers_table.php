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
            $table->foreignId('event_id')->nullable()->after('item_type')->constrained('events')->nullOnDelete()->comment('Spesifik event bioskop tertentu');
            $table->foreignId('movie_id')->nullable()->after('event_id')->constrained('movies')->nullOnDelete()->comment('Spesifik film VoD tertentu');

            $table->index('event_id', 'idx_vouchers_event_id');
            $table->index('movie_id', 'idx_vouchers_movie_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropForeign(['event_id']);
            $table->dropForeign(['movie_id']);
            $table->dropIndex('idx_vouchers_event_id');
            $table->dropIndex('idx_vouchers_movie_id');
            $table->dropColumn(['event_id', 'movie_id']);
        });
    }
};
