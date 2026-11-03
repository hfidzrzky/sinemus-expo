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
            $table->dateTime('sales_start_at')->nullable()->after('seating_type')->comment('Batas awal pembukaan penjualan tiket');
            $table->dateTime('sales_end_at')->nullable()->after('sales_start_at')->comment('Batas penutupan penjualan tiket');
        });

        // Migrasikan data yang sudah ada dari kolom lama ke kolom SSOT baru
        if (Schema::hasColumn('events', 'presale_start_at') && Schema::hasColumn('events', 'presale_end_at')) {
            DB::table('events')->update([
                'sales_start_at' => DB::raw('presale_start_at'),
                'sales_end_at' => DB::raw('presale_end_at'),
            ]);

            Schema::table('events', function (Blueprint $table) {
                // Drop index lama jika ada
                try {
                    $table->dropIndex('idx_events_presale_window');
                } catch (Throwable $e) {
                    // Abaikan jika indeks tidak ditemukan
                }

                $table->dropColumn(['presale_start_at', 'presale_end_at']);
            });
        }

        Schema::table('events', function (Blueprint $table) {
            $table->index(['sales_start_at', 'sales_end_at'], 'idx_events_sales_window');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('idx_events_sales_window');
            $table->dateTime('presale_start_at')->nullable()->after('seating_type');
            $table->dateTime('presale_end_at')->nullable()->after('presale_start_at');
        });

        DB::table('events')->update([
            'presale_start_at' => DB::raw('sales_start_at'),
            'presale_end_at' => DB::raw('sales_end_at'),
        ]);

        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['sales_start_at', 'sales_end_at']);
            $table->index(['presale_start_at', 'presale_end_at'], 'idx_events_presale_window');
        });
    }
};
