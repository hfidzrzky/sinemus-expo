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
        Schema::table('banners', function (Blueprint $table) {
            $table->string('age_rating', 20)->nullable()->after('badge_text')->comment('Klasifikasi usia penonton (SU, 13+, 17+, 21+)');
            $table->string('genre', 100)->nullable()->after('age_rating')->comment('Genre film/event (Drama, Romansa, Thriller)');
            $table->unsignedSmallInteger('release_year')->nullable()->after('genre')->comment('Tahun rilis film/event');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            $table->dropColumn(['age_rating', 'genre', 'release_year']);
        });
    }
};
