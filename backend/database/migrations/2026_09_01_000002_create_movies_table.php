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
        Schema::create('movies', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 191)->unique();
            $table->string('title', 255);
            $table->text('synopsis');
            $table->string('poster_path', 255)->comment('Poster portrait 2:3 di Cloudflare Images');
            $table->string('backdrop_path', 255)->comment('Banner landscape 16:9 di Cloudflare Images');
            $table->string('director', 150);
            $table->json('cast')->comment('Array nama pemeran');
            $table->string('genre', 100);
            $table->enum('age_rating', ['SU', '13+', '17+', '21+'])->default('SU');
            $table->enum('access_model', ['rental', 'free', 'pass_only'])->default('rental');
            $table->unsignedInteger('duration_minutes')->default(0);
            $table->decimal('price', 12, 2)->default(0.00);
            $table->unsignedInteger('rental_duration_hours')->default(48);
            $table->char('cloudflare_trailer_uid', 32)->nullable();
            $table->char('cloudflare_video_uid', 32);
            $table->boolean('is_featured')->default(false);
            $table->year('release_year');
            $table->boolean('is_published')->default(false);
            $table->dateTime('scheduled_publish_at')->nullable();
            $table->dateTime('scheduled_unpublish_at')->nullable();
            $table->timestamps();

            $table->index(['is_published', 'genre'], 'idx_movies_browse');
            $table->index(['is_published', 'scheduled_publish_at', 'scheduled_unpublish_at'], 'idx_movies_publishing_schedule');
            $table->index(['is_featured', 'is_published'], 'idx_movies_featured');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movies');
    }
};
