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
        Schema::table('events', function (Blueprint $table) {
            $table->dateTime('event_concludes_at')
                ->nullable()
                ->after('presale_end_at')
                ->comment('Batas waktu penayangan selesai dan otomatis draf/hilang dari beranda publik');

            $table->index(['is_active', 'event_concludes_at'], 'idx_events_concludes_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('idx_events_concludes_active');
            $table->dropColumn('event_concludes_at');
        });
    }
};
