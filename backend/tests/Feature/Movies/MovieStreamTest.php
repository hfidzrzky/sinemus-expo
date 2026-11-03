<?php

namespace Tests\Feature\Movies;

use App\Models\Movie;
use App\Models\User;
use App\Models\UserMovieAccess;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class MovieStreamTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;

    protected User $superAdmin;

    protected Movie $movie;

    protected string $testKeyId = 'mock_key_id_12345';

    protected string $testPemKey;

    protected function setUp(): void
    {
        parent::setUp();

        $fixturePath = base_path('tests/Fixtures/rsa_test_key.pem');
        $this->testPemKey = file_get_contents($fixturePath);

        Config::set('services.cloudflare.account_id', 'mock_account_123');
        Config::set('services.cloudflare.stream_key_id', $this->testKeyId);
        Config::set('services.cloudflare.stream_pem_key', $this->testPemKey);

        $this->customer = User::factory()->create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'role' => 'customer',
            'phone_number' => '081234567890',
            'is_phone_locked' => true,
        ]);

        $this->superAdmin = User::factory()->create([
            'name' => 'Admin Sinemus',
            'email' => 'admin@sinemus.id',
            'role' => 'super_admin',
            'phone_number' => '081100000002',
            'is_phone_locked' => true,
        ]);

        $this->movie = Movie::create([
            'slug' => 'laskar-pelangi',
            'title' => 'Laskar Pelangi',
            'synopsis' => 'Kisah inspiratif tentang perjuangan anak-anak Belitung.',
            'poster_path' => 'https://example.com/poster.jpg',
            'backdrop_path' => 'https://example.com/backdrop.jpg',
            'director' => 'Riri Riza',
            'cast' => ['Ikranagara', 'Slamet Rahardjo'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'access_model' => 'rental',
            'duration_minutes' => 125,
            'price' => 25000,
            'rental_duration_hours' => 48,
            'cloudflare_trailer_uid' => '5d5b376379fc387d9c9e32305193433d',
            'cloudflare_video_uid' => 'e39b7a1f8c424df39c14ad539281a1bb',
            'is_featured' => true,
            'release_year' => 2008,
            'is_published' => true,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_movie_stream(): void
    {
        $response = $this->getJson("/api/v1/movies/{$this->movie->id}/stream");

        $response->assertStatus(401);
    }

    public function test_customer_without_rental_cannot_access_movie_stream(): void
    {
        $this->actingAs($this->customer);

        $response = $this->getJson("/api/v1/movies/{$this->movie->id}/stream");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_customer_with_expired_rental_cannot_access_movie_stream(): void
    {
        $this->actingAs($this->customer);

        UserMovieAccess::create([
            'user_id' => $this->customer->id,
            'movie_id' => $this->movie->id,
            'access_status' => 'active',
            'rental_start_at' => now()->subHours(50),
            'rental_expires_at' => now()->subHours(2), // Expired
        ]);

        $response = $this->getJson("/api/v1/movies/{$this->movie->id}/stream");

        $response->assertStatus(403);
    }

    public function test_customer_with_active_rental_receives_valid_signed_stream_session(): void
    {
        $this->actingAs($this->customer);

        $rentalExpiresAt = now()->addHours(40);

        UserMovieAccess::create([
            'user_id' => $this->customer->id,
            'movie_id' => $this->movie->id,
            'access_status' => 'active',
            'rental_start_at' => now()->subHours(8),
            'rental_expires_at' => $rentalExpiresAt,
        ]);

        $response = $this->getJson("/api/v1/movies/{$this->movie->id}/stream");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'playback_url',
                    'preview_iframe_url',
                    'signed_token',
                    'rental_expires_at',
                    'remaining_seconds',
                ],
                'server_time',
            ]);

        $data = $response->json('data');
        $this->assertNotEmpty($data['signed_token']);
        $this->assertStringContainsString($data['signed_token'], $data['playback_url']);
        $this->assertStringContainsString($data['signed_token'], $data['preview_iframe_url']);
        $this->assertGreaterThan(0, $data['remaining_seconds']);

        // Verifikasi durasi token dinamis: durasi film (125m = 7500s) + buffer 2 jam (7200s) = 14700s
        $tokenParts = explode('.', $data['signed_token']);
        $this->assertCount(3, $tokenParts);
        $payload = json_decode(base64_decode(strtr($tokenParts[1], '-_', '+/')), true);
        $this->assertIsArray($payload);
        $this->assertArrayHasKey('exp', $payload);
        $expectedDuration = (125 * 60) + 7200; // 14700 detik
        $tokenLifespan = $payload['exp'] - time();
        $this->assertEqualsWithDelta($expectedDuration, $tokenLifespan, 5);
    }

    public function test_token_duration_is_capped_by_remaining_rental_time(): void
    {
        $this->actingAs($this->customer);

        // Sewa tersisa hanya 20 menit (1200 detik)
        $rentalExpiresAt = now()->addMinutes(20);

        UserMovieAccess::create([
            'user_id' => $this->customer->id,
            'movie_id' => $this->movie->id,
            'access_status' => 'active',
            'rental_start_at' => now()->subHours(47)->subMinutes(40),
            'rental_expires_at' => $rentalExpiresAt,
        ]);

        $response = $this->getJson("/api/v1/movies/{$this->movie->id}/stream");

        $response->assertStatus(200);

        $token = $response->json('data.signed_token');
        $tokenParts = explode('.', $token);
        $payload = json_decode(base64_decode(strtr($tokenParts[1], '-_', '+/')), true);

        // Token wajib dibatasi oleh sisa waktu sewa (1200 detik), bukan durasi film penuh (14700 detik)
        $tokenLifespan = $payload['exp'] - time();
        $this->assertEqualsWithDelta(1200, $tokenLifespan, 5);
    }

    public function test_customer_cannot_stream_unpublished_movie_even_with_rental(): void
    {
        $this->movie->update(['is_published' => false]);
        $this->actingAs($this->customer);

        UserMovieAccess::create([
            'user_id' => $this->customer->id,
            'movie_id' => $this->movie->id,
            'access_status' => 'active',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(48),
        ]);

        $response = $this->getJson("/api/v1/movies/{$this->movie->id}/stream");

        $response->assertStatus(404)
            ->assertJsonPath('error_code', 'MOVIE_NOT_FOUND');
    }

    public function test_admin_can_stream_unpublished_movie(): void
    {
        $this->movie->update(['is_published' => false]);
        $this->actingAs($this->superAdmin);

        $response = $this->getJson("/api/v1/movies/{$this->movie->id}/stream");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_super_admin_without_rental_cannot_stream_published_movie(): void
    {
        $this->actingAs($this->superAdmin);

        $response = $this->getJson("/api/v1/movies/{$this->movie->id}/stream");

        $response->assertStatus(403);
    }

    public function test_super_admin_with_revoked_access_cannot_stream_movie(): void
    {
        $this->actingAs($this->superAdmin);

        UserMovieAccess::create([
            'user_id' => $this->superAdmin->id,
            'movie_id' => $this->movie->id,
            'access_status' => 'revoked',
            'rental_start_at' => now()->subHours(10),
            'rental_expires_at' => now()->addHours(38),
            'revoked_at' => now(),
            'revoke_reason' => 'manual_admin',
        ]);

        $response = $this->getJson("/api/v1/movies/{$this->movie->id}/stream");

        $response->assertStatus(403);
    }

    public function test_super_admin_with_active_entitlement_can_stream_published_movie(): void
    {
        $this->actingAs($this->superAdmin);

        UserMovieAccess::create([
            'user_id' => $this->superAdmin->id,
            'movie_id' => $this->movie->id,
            'access_status' => 'active',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(48),
        ]);

        $response = $this->getJson("/api/v1/movies/{$this->movie->id}/stream");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertNotEmpty($response->json('data.signed_token'));
    }

    public function test_free_access_movie_can_be_streamed_by_customer_without_rental(): void
    {
        $freeMovie = Movie::create([
            'slug' => 'short-movie-free',
            'title' => 'Short Movie Free',
            'synopsis' => 'Film pendek gratis.',
            'poster_path' => 'https://example.com/free.jpg',
            'backdrop_path' => 'https://example.com/free-bg.jpg',
            'director' => 'Sutradara Muda',
            'cast' => ['Aktor 1'],
            'genre' => 'Dokumenter',
            'age_rating' => 'SU',
            'access_model' => 'free',
            'duration_minutes' => 15,
            'price' => 0,
            'rental_duration_hours' => 24,
            'cloudflare_video_uid' => 'e39b7a1f8c424df39c14ad539281a1bb',
            'release_year' => 2024,
            'is_published' => true,
        ]);

        $this->actingAs($this->customer);

        $response = $this->getJson("/api/v1/movies/{$freeMovie->id}/stream");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_admin_can_generate_preview_token_for_any_uid(): void
    {
        $this->actingAs($this->superAdmin);

        $uid = 'e39b7a1f8c424df39c14ad539281a1bb';

        $response = $this->postJson("/api/v1/admin/cloudflare/stream/{$uid}/token");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'uid',
                    'signed_token',
                    'preview_iframe_url',
                    'playback_hls_url',
                    'expires_in',
                ],
                'server_time',
            ]);
    }
}
