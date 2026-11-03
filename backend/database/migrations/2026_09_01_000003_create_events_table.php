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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 191)->unique();
            $table->enum('event_type', ['regular', 'presale_cinema'])->default('regular')->comment('regular: screening fisik mandiri, presale_cinema: presale bioskop komersial');
            $table->enum('seating_type', ['assigned_seating', 'general_admission'])->default('assigned_seating')->comment('assigned_seating: denah kursi, general_admission: kuota bebas');
            $table->string('title', 255);
            $table->text('description')->comment('Deskripsi lengkap event & format screening');
            $table->string('synopsis_short', 255)->comment('Sinopsis ringkas untuk card');
            $table->string('poster_path', 255)->comment('Poster portrait 2:3 di Cloudflare Images');
            $table->string('backdrop_path', 255)->comment('Banner landscape 16:9 di Cloudflare Images');
            $table->string('director', 150);
            $table->json('cast');
            $table->json('rules')->comment('Array aturan venue');
            $table->char('cloudflare_teaser_uid', 32)->nullable()->comment('UID Teaser Cloudflare Stream');
            $table->string('venue_name', 255);
            $table->string('cinema_partner', 100)->nullable()->comment('Cinema XXI, CGV, Cinepolis');
            $table->text('venue_address');
            $table->string('city', 100);
            $table->string('target_screening_month', 50)->nullable()->comment('Contoh: November 2026');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();

            $table->index(['is_active', 'city'], 'idx_events_active_city');
            $table->index(['is_featured', 'is_active'], 'idx_events_featured');
            $table->index(['event_type', 'seating_type'], 'idx_events_seating_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
