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
        Schema::table('seats', function (Blueprint $table) {
            $table->unsignedInteger('grid_column')->nullable()->after('row_label')->comment('Posisi koordinat kolom pada denah visual canvas (1..N)');
            $table->index(['schedule_id', 'row_label', 'grid_column'], 'idx_seats_grid_pos');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seats', function (Blueprint $table) {
            $table->dropIndex('idx_seats_grid_pos');
            $table->dropColumn('grid_column');
        });
    }
};
