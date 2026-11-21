<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Membersihkan sisa teks copywriting legacy presale pada tabel banners.
     */
    public function up(): void
    {
        if (! Schema::hasTable('banners')) {
            return;
        }

        DB::transaction(function (): void {
            DB::table('banners')
                ->where('button_text', 'Beli Tiket Presale')
                ->update([
                    'button_text' => 'Pesan Tiket Sekarang',
                    'updated_at' => now(),
                ]);

            DB::table('banners')
                ->where('badge_text', 'PRESALE CINEMA')
                ->update([
                    'badge_text' => 'EVENT SCREENING',
                    'updated_at' => now(),
                ]);

            DB::table('banners')
                ->where('subtitle', 'Tiket Presale Terbatas')
                ->update([
                    'subtitle' => 'Tiket Screening Terbatas',
                    'updated_at' => now(),
                ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Data copywriting cleanup bersifat idempoten dan tidak perlu dikembalikan ke teks legacy presale.
    }
};
