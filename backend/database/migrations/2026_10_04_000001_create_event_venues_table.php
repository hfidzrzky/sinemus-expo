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
        Schema::create('event_venues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->string('venue_name', 255)->comment('Contoh: Cinema XXI Plaza Senayan');
            $table->string('cinema_partner', 100)->nullable()->comment('Cinema XXI, CGV, Cinepolis');
            $table->text('venue_address')->comment('Alamat lengkap bioskop/venue');
            $table->string('city', 100)->comment('Kota penayangan');
            $table->string('google_maps_url', 500)->nullable()->comment('Tautan Google Maps venue');
            $table->timestamps();

            $table->index(['event_id', 'city'], 'idx_event_venues_event_city');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_venues');
    }
};
