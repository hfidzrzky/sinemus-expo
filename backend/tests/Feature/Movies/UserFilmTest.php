<?php

namespace Tests\Feature\Movies;

use App\Models\Movie;
use App\Models\User;
use App\Models\UserMovieAccess;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserFilmTest extends TestCase
{
    use RefreshDatabase;

    protected User $userA;

    protected User $userB;

    protected Movie $movie;

    protected function setUp(): void
    {
        parent::setUp();

        $this->userA = User::factory()->create([
            'name' => 'User Penonton A',
            'email' => 'user.a@example.com',
            'role' => 'customer',
            'phone_number' => '081234567891',
            'is_phone_locked' => true,
        ]);

        $this->userB = User::factory()->create([
            'name' => 'User Penonton B',
            'email' => 'user.b@example.com',
            'role' => 'customer',
            'phone_number' => '081234567892',
            'is_phone_locked' => true,
        ]);

        $this->movie = Movie::create([
            'slug' => 'film-rental-active-01',
            'title' => 'Cinta dan Sejarah (Digital VoD)',
            'synopsis' => 'Kisah romansa masa revolusi kemerdekaan.',
            'poster_path' => 'movies/posters/cds-digital.jpg',
            'backdrop_path' => 'movies/backdrops/cds-digital.jpg',
            'director' => 'Sutradara Nasional',
            'cast' => ['Aktor A', 'Aktris B'],
            'genre' => 'Drama, History',
            'age_rating' => '13+',
            'access_model' => 'rental',
            'duration_minutes' => 110,
            'price' => 25000.00,
            'rental_duration_hours' => 48,
            'cloudflare_video_uid' => 'cf_vod_test_uid_9988',
            'release_year' => 2026,
            'is_published' => true,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_my_films(): void
    {
        $response = $this->getJson('/api/v1/user/films');

        $response->assertStatus(401);
    }

    public function test_user_can_retrieve_empty_active_films_when_none_rented(): void
    {
        $response = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/films');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(0, 'data');
    }

    public function test_user_can_retrieve_active_movie_rentals_with_contract_conformance(): void
    {
        UserMovieAccess::create([
            'user_id' => $this->userA->id,
            'movie_id' => $this->movie->id,
            'access_status' => 'active',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(48),
        ]);

        $response = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/films');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.movie_id', $this->movie->id)
            ->assertJsonPath('data.0.slug', 'film-rental-active-01')
            ->assertJsonPath('data.0.title', 'Cinta dan Sejarah (Digital VoD)')
            ->assertJsonPath('data.0.duration_minutes', 110)
            ->assertJsonPath('data.0.is_expired', false)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'movie_id',
                        'slug',
                        'title',
                        'poster_url',
                        'genre',
                        'duration_minutes',
                        'rental_expires_at',
                        'remaining_seconds',
                        'is_expired',
                    ],
                ],
                'server_time',
            ]);
    }

    public function test_expired_or_revoked_rentals_are_not_included_in_active_films(): void
    {
        // 1. Sewa kedaluwarsa (berakhir 2 jam lalu)
        UserMovieAccess::create([
            'user_id' => $this->userA->id,
            'movie_id' => $this->movie->id,
            'access_status' => 'active',
            'rental_start_at' => now()->subHours(50),
            'rental_expires_at' => now()->subHours(2),
        ]);

        // 2. Sewa dicabut (revoked)
        $secondMovie = Movie::create([
            'slug' => 'film-second-revoked',
            'title' => 'Film Revoked',
            'synopsis' => 'Sinopsis',
            'poster_path' => 'movies/posters/revoked.jpg',
            'backdrop_path' => 'movies/backdrops/revoked.jpg',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'genre' => 'Action',
            'age_rating' => '17+',
            'access_model' => 'rental',
            'duration_minutes' => 90,
            'price' => 20000.00,
            'rental_duration_hours' => 48,
            'cloudflare_video_uid' => 'cf_revoked_123',
            'release_year' => 2026,
            'is_published' => true,
        ]);

        UserMovieAccess::create([
            'user_id' => $this->userA->id,
            'movie_id' => $secondMovie->id,
            'access_status' => 'revoked',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(48),
            'revoked_at' => now(),
        ]);

        $response = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/v1/user/films');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(0, 'data');
    }

    public function test_anti_idor_user_cannot_see_other_users_rentals(): void
    {
        // User A memiliki akses sewa aktif
        UserMovieAccess::create([
            'user_id' => $this->userA->id,
            'movie_id' => $this->movie->id,
            'access_status' => 'active',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(48),
        ]);

        // User B mengakses daftar filmnya (harus kosong, Anti-IDOR)
        $response = $this->actingAs($this->userB, 'sanctum')
            ->getJson('/api/v1/user/films');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(0, 'data');
    }
}
