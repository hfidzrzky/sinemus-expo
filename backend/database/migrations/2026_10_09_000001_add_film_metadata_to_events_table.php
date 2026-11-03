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
            $table->json('genre')->nullable()->after('director')->comment('Array genre karya film');
            $table->unsignedInteger('duration_minutes')->default(0)->after('genre')->comment('Durasi film dalam satuan menit');
            $table->unsignedSmallInteger('release_year')->nullable()->after('duration_minutes')->comment('Tahun rilis film (1900-2099)');
            $table->enum('age_rating', ['SU', '13+', '17+', '21+'])->default('SU')->after('release_year')->comment('Rating sensor usia LSF');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['genre', 'duration_minutes', 'release_year', 'age_rating']);
        });
    }
};
