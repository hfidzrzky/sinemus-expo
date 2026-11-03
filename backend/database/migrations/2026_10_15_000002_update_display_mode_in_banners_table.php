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
        // Ubah display_mode menjadi VARCHAR(50) agar fleksibel mendukung mode 'spotlight', 'rich_content', dan 'image_only'
        Schema::table('banners', function (Blueprint $table) {
            $table->string('display_mode', 50)->default('spotlight')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            $table->string('display_mode', 50)->default('rich_content')->change();
        });
    }
};
