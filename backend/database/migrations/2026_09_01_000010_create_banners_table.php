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
        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255)->nullable()->comment('Judul banner');
            $table->text('subtitle')->nullable()->comment('Deskripsi ringkas banner');
            $table->string('badge_text', 50)->nullable()->comment('Contoh: PROMO SPESIAL, EXCLUSIVE');
            $table->string('image_path', 255)->comment('Aset landscape 16:9 di Cloudflare Images');
            $table->enum('display_mode', ['rich_content', 'image_only'])->default('rich_content');
            $table->enum('link_type', ['movie', 'event', 'voucher', 'url'])->default('movie');
            $table->foreignId('movie_id')->nullable()->constrained('movies')->cascadeOnDelete();
            $table->foreignId('event_id')->nullable()->constrained('events')->cascadeOnDelete();
            $table->string('target_url', 255)->nullable();
            $table->string('button_text', 50)->default('Lihat Detail');
            $table->unsignedInteger('order_priority')->default(1)->comment('Urutan slide carousel (1 = pertama)');
            $table->boolean('is_active')->default(true);
            $table->dateTime('start_at')->nullable();
            $table->dateTime('end_at')->nullable();
            $table->timestamps();

            $table->index(['is_active', 'order_priority'], 'idx_banners_active_order');
            $table->index(['is_active', 'start_at', 'end_at'], 'idx_banners_schedule');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banners');
    }
};
