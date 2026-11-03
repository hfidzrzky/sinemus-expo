<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dateTime('presale_start_at')->nullable()->after('seating_type')->comment('Batas awal pembukaan penjualan tiket presale');
            $table->dateTime('presale_end_at')->nullable()->after('presale_start_at')->comment('Batas penutupan penjualan tiket presale');
            $table->string('venue_name', 255)->nullable()->change();
            $table->text('venue_address')->nullable()->change();
            $table->string('city', 100)->nullable()->change();

            $table->index(['presale_start_at', 'presale_end_at'], 'idx_events_presale_window');
        });

        Schema::table('schedules', function (Blueprint $table) {
            $table->foreignId('event_venue_id')->nullable()->after('event_id')->constrained('event_venues')->nullOnDelete();

            $table->index(['event_venue_id', 'show_time', 'is_active'], 'idx_schedules_venue_showtime');
        });

        // Safe auto-backfill: migrate existing venue info from events to event_venues and link to schedules
        $events = DB::table('events')->get();
        foreach ($events as $event) {
            if (! empty($event->venue_name)) {
                $venueId = DB::table('event_venues')->insertGetId([
                    'event_id' => $event->id,
                    'venue_name' => $event->venue_name,
                    'cinema_partner' => $event->cinema_partner ?? null,
                    'venue_address' => $event->venue_address ?? '-',
                    'city' => $event->city ?? 'Jakarta',
                    'google_maps_url' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('schedules')
                    ->where('event_id', $event->id)
                    ->whereNull('event_venue_id')
                    ->update(['event_venue_id' => $venueId]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropForeign(['event_venue_id']);
            $table->dropIndex('idx_schedules_venue_showtime');
            $table->dropColumn('event_venue_id');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('idx_events_presale_window');
            $table->dropColumn(['presale_start_at', 'presale_end_at']);
        });
    }
};
