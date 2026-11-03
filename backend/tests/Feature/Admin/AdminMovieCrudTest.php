<?php

namespace Tests\Feature\Admin;

use App\Models\Banner;
use App\Models\Movie;
use App\Models\MovieTransaction;
use App\Models\User;
use App\Models\UserMovieAccess;
use App\Services\Cloudflare\CloudflareStreamService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class AdminMovieCrudTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'email' => 'admin@sinemus.id',
        ]);

        $this->customer = User::factory()->create([
            'role' => 'customer',
            'email' => 'customer@gmail.com',
        ]);

        // Mock CloudflareStreamService agar verifikasi UID selalu berhasil di environment pengujian
        $streamMock = Mockery::mock(CloudflareStreamService::class);
        $streamMock->shouldReceive('verifyVideo')->andReturnNull();
        $this->app->instance(CloudflareStreamService::class, $streamMock);
    }

    public function test_unauthenticated_user_cannot_access_admin_movie_routes(): void
    {
        $this->getJson('/api/v1/admin/movies')->assertStatus(401);
        $this->postJson('/api/v1/admin/movies', [])->assertStatus(401);
        $this->getJson('/api/v1/admin/movie-access')->assertStatus(401);
        $this->postJson('/api/v1/admin/movie-access/grant', [])->assertStatus(401);
    }

    public function test_customer_role_is_forbidden_from_admin_movie_routes(): void
    {
        Sanctum::actingAs($this->customer);

        $this->getJson('/api/v1/admin/movies')->assertStatus(403);
        $this->postJson('/api/v1/admin/movies', [])->assertStatus(403);
        $this->getJson('/api/v1/admin/movie-access')->assertStatus(403);
        $this->postJson('/api/v1/admin/movie-access/grant', [])->assertStatus(403);
    }

    public function test_super_admin_can_list_movies_with_filter_and_pagination(): void
    {
        Sanctum::actingAs($this->superAdmin);

        Movie::create([
            'title' => 'Film Dokumenter Aceh',
            'slug' => 'film-dokumenter-aceh',
            'synopsis' => 'Sinopsis dokumenter budaya aceh yang sangat mendalam.',
            'director' => 'Sutradara Aceh',
            'cast' => ['Tokoh Budaya'],
            'genre' => 'Dokumenter',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 75,
            'poster_path' => 'p1.jpg',
            'backdrop_path' => 'b1.jpg',
            'cloudflare_video_uid' => '11111111111111111111111111111111',
            'access_model' => 'free',
            'price' => 0,
            'is_published' => true,
        ]);

        Movie::create([
            'title' => 'Misteri Alas Roban',
            'slug' => 'misteri-alas-roban',
            'synopsis' => 'Sinopsis horor misteri alas roban karya sinemus.',
            'director' => 'Sutradara Horor',
            'cast' => ['Aktor Horor'],
            'genre' => 'Horor',
            'age_rating' => '17+',
            'release_year' => 2026,
            'duration_minutes' => 95,
            'poster_path' => 'p2.jpg',
            'backdrop_path' => 'b2.jpg',
            'cloudflare_video_uid' => '22222222222222222222222222222222',
            'access_model' => 'rental',
            'price' => 25000,
            'is_published' => true,
        ]);

        $response = $this->getJson('/api/v1/admin/movies?search=Dokumenter&per_page=10');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Daftar film berhasil diambil.',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'slug',
                        'title',
                        'synopsis_short',
                        'director',
                        'cast',
                        'genre',
                        'release_year',
                        'duration_minutes',
                        'age_rating',
                        'poster_url',
                        'backdrop_url',
                        'cloudflare_video_uid',
                        'stream_status',
                        'access_model',
                        'rental_price',
                        'is_published',
                    ],
                ],
                'meta' => ['current_page', 'per_page', 'total'],
                'server_time',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Film Dokumenter Aceh', $data[0]['title']);
    }

    public function test_super_admin_can_create_movie_with_4_tab_payload(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $payload = [
            'title' => 'Laut Bercerita (VoD Edition)',
            'synopsis_full' => 'Sebuah adaptasi novel karya Leila S. Chudori yang mengangkat kisah para aktivis masa pergerakan.',
            'director' => 'Yosep Anggi Noen',
            'cast' => [
                ['actor' => 'Reza Rahadian'],
                ['actor' => 'Dian Sastrowardoyo'],
            ],
            'genre' => ['Drama', 'Sejarah'],
            'age_rating' => '17+',
            'release_year' => 2026,
            'duration_minutes' => 110,
            'poster_url' => 'https://imagedelivery.net/hash/poster-uid/public',
            'backdrop_url' => 'https://imagedelivery.net/hash/backdrop-uid/public',
            'cloudflare_video_uid' => '33333333333333333333333333333333',
            'cloudflare_trailer_uid' => '44444444444444444444444444444444',
            'access_model' => 'rental',
            'rental_price' => 35000,
            'active_rental_duration_hours' => 72,
            'is_published' => true,
            'is_featured' => true,
        ];

        $response = $this->postJson('/api/v1/admin/movies', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Film berhasil ditambahkan ke katalog VoD.',
                'data' => [
                    'title' => 'Laut Bercerita (VoD Edition)',
                    'slug' => 'laut-bercerita-vod-edition',
                    'director' => 'Yosep Anggi Noen',
                    'genre' => ['Drama', 'Sejarah'],
                    'age_rating' => '17+',
                    'duration_minutes' => 110,
                    'rental_price' => 35000,
                    'active_rental_duration_hours' => 72,
                    'is_published' => true,
                    'is_featured' => true,
                ],
            ]);

        $this->assertDatabaseHas('movies', [
            'title' => 'Laut Bercerita (VoD Edition)',
            'slug' => 'laut-bercerita-vod-edition',
            'price' => 35000,
        ]);
    }

    public function test_super_admin_can_get_movie_detail(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $movie = Movie::create([
            'title' => 'Nanti Kita Cerita Tentang Hari Ini',
            'slug' => 'nkcthi',
            'synopsis' => 'Kisah keluarga yang menyimpan rahasia besar dan trauma mendalam.',
            'director' => 'Angga Dwimas Sasongko',
            'cast' => ['Rachel Amanda', 'Rio Dewanto'],
            'genre' => 'Drama, Keluarga',
            'age_rating' => '13+',
            'release_year' => 2020,
            'duration_minutes' => 121,
            'poster_path' => 'nkcthi-poster.jpg',
            'backdrop_path' => 'nkcthi-backdrop.jpg',
            'cloudflare_video_uid' => '55555555555555555555555555555555',
            'access_model' => 'rental',
            'price' => 25000,
            'rental_duration_hours' => 48,
            'is_published' => true,
        ]);

        $response = $this->getJson("/api/v1/admin/movies/{$movie->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Detail film berhasil diambil.',
                'data' => [
                    'id' => $movie->id,
                    'slug' => 'nkcthi',
                    'title' => 'Nanti Kita Cerita Tentang Hari Ini',
                    'director' => 'Angga Dwimas Sasongko',
                    'rental_price' => 25000,
                    'active_rental_duration_hours' => 48,
                ],
            ]);
    }

    public function test_super_admin_can_update_movie(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $movie = Movie::create([
            'title' => 'Film Awal',
            'slug' => 'film-awal',
            'synopsis' => 'Sinopsis film awal yang memadai sebelum diperbarui melalui PUT endpoint.',
            'director' => 'Sutradara Awal',
            'cast' => ['Aktor 1'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 90,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '66666666666666666666666666666666',
            'access_model' => 'rental',
            'price' => 20000,
            'is_published' => true,
        ]);

        $payload = [
            'title' => 'Film Awal Direvisi',
            'slug' => 'film-awal', // Slug sama tidak boleh gagal (ignore rule)
            'synopsis_full' => 'Sinopsis film yang telah diperbarui dengan narasi baru yang lebih memikat penonton.',
            'director' => 'Sutradara Revisi',
            'cast' => ['Aktor 1', 'Aktor Baru'],
            'genre' => ['Drama', 'Komedi'],
            'age_rating' => '13+',
            'release_year' => 2026,
            'duration_minutes' => 95,
            'poster_url' => 'https://imagedelivery.net/hash/p-rev/public',
            'backdrop_url' => 'https://imagedelivery.net/hash/b-rev/public',
            'cloudflare_video_uid' => '66666666666666666666666666666666',
            'access_model' => 'rental',
            'rental_price' => 28000,
            'active_rental_duration_hours' => 48,
            'is_published' => true,
        ];

        $response = $this->putJson("/api/v1/admin/movies/{$movie->id}", $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Data film berhasil diperbarui.',
                'data' => [
                    'id' => $movie->id,
                    'title' => 'Film Awal Direvisi',
                    'director' => 'Sutradara Revisi',
                    'rental_price' => 28000,
                ],
            ]);

        $this->assertDatabaseHas('movies', [
            'id' => $movie->id,
            'title' => 'Film Awal Direvisi',
            'price' => 28000,
        ]);
    }

    public function test_super_admin_can_delete_movie_without_transactions(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $movie = Movie::create([
            'title' => 'Film Tanpa Transaksi',
            'slug' => 'film-tanpa-transaksi',
            'synopsis' => 'Sinopsis film tanpa transaksi yang siap untuk dihapus oleh super admin.',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 80,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '77777777777777777777777777777777',
            'access_model' => 'free',
            'price' => 0,
        ]);

        $response = $this->deleteJson("/api/v1/admin/movies/{$movie->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Film berhasil dihapus dari katalog.',
            ]);

        $this->assertDatabaseMissing('movies', ['id' => $movie->id]);
    }

    public function test_super_admin_cannot_delete_movie_with_transactions(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $movie = Movie::create([
            'title' => 'Film Terkunci Transaksi',
            'slug' => 'film-terkunci-transaksi',
            'synopsis' => 'Sinopsis film yang sudah pernah dibeli penonton.',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 80,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '88888888888888888888888888888888',
            'access_model' => 'rental',
            'price' => 25000,
        ]);

        MovieTransaction::create([
            'order_id' => 'SNM-VOD-2026-LOCK01',
            'user_id' => $this->customer->id,
            'movie_id' => $movie->id,
            'gross_amount' => 25000,
            'discount_amount' => 0,
            'net_amount' => 25000,
            'payment_status' => 'paid',
            'snap_token' => 'mock_token',
            'snapshot_movie_data' => ['title' => $movie->title],
        ]);

        $response = $this->deleteJson("/api/v1/admin/movies/{$movie->id}");

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
            ]);

        $this->assertDatabaseHas('movies', ['id' => $movie->id]);
    }

    public function test_super_admin_can_list_movie_access_records(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $movie = Movie::create([
            'title' => 'Film Akses Record',
            'slug' => 'film-akses-record',
            'synopsis' => 'Sinopsis film untuk pengujian listing hak akses admin.',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 90,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '99999999999999999999999999999999',
            'access_model' => 'rental',
            'price' => 25000,
        ]);

        UserMovieAccess::create([
            'user_id' => $this->customer->id,
            'movie_id' => $movie->id,
            'access_status' => 'active',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(48),
            'admin_notes' => 'Hak akses reviewer pers',
        ]);

        $response = $this->getJson("/api/v1/admin/movie-access?user_id={$this->customer->id}&movie_id={$movie->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Daftar hak akses film berhasil diambil.',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'user_id',
                        'user_name',
                        'user_email',
                        'movie_id',
                        'movie_title',
                        'access_status',
                        'rental_start_at',
                        'rental_expires_at',
                        'admin_notes',
                    ],
                ],
                'meta',
                'server_time',
            ]);
    }

    public function test_super_admin_can_grant_movie_access(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $movie = Movie::create([
            'title' => 'Film Hiburan Komunal',
            'slug' => 'film-hiburan-komunal',
            'synopsis' => 'Sinopsis film untuk pengujian pemberian hak akses giveaway.',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'genre' => 'Komedi',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 85,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            'access_model' => 'rental',
            'price' => 20000,
        ]);

        $payload = [
            'user_id' => $this->customer->id,
            'movie_id' => $movie->id,
            'duration_hours' => 72,
            'admin_notes' => 'Pemenang Giveaway Sinemus Vol 3',
        ];

        $response = $this->postJson('/api/v1/admin/movie-access/grant', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Hak akses sewa film berhasil diberikan kepada pengguna.',
                'data' => [
                    'user_email' => $this->customer->email,
                    'movie_title' => 'Film Hiburan Komunal',
                    'access_status' => 'active',
                ],
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'access_id',
                    'user_email',
                    'movie_title',
                    'rental_expires_at',
                    'access_status',
                ],
                'server_time',
            ]);

        $this->assertDatabaseHas('user_movie_access', [
            'user_id' => $this->customer->id,
            'movie_id' => $movie->id,
            'access_status' => 'active',
            'admin_notes' => 'Pemenang Giveaway Sinemus Vol 3',
        ]);
    }

    public function test_super_admin_can_revoke_movie_access(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $movie = Movie::create([
            'title' => 'Film Pelanggaran',
            'slug' => 'film-pelanggaran',
            'synopsis' => 'Sinopsis film untuk pengujian pencabutan akses hak sewa.',
            'director' => 'Sutradara',
            'cast' => ['Aktor'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 90,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            'access_model' => 'rental',
            'price' => 20000,
        ]);

        $access = UserMovieAccess::create([
            'user_id' => $this->customer->id,
            'movie_id' => $movie->id,
            'access_status' => 'active',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(48),
        ]);

        $payload = [
            'revoke_reason' => 'violation',
            'admin_notes' => 'Terindikasi melakukan screen recording ilegal',
        ];

        $response = $this->postJson("/api/v1/admin/movie-access/{$access->id}/revoke", $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Hak akses sewa film berhasil dicabut.',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'server_time',
            ]);

        $this->assertDatabaseHas('user_movie_access', [
            'id' => $access->id,
            'access_status' => 'revoked',
            'revoke_reason' => 'violation',
            'admin_notes' => 'Terindikasi melakukan screen recording ilegal',
        ]);
    }

    public function test_updating_movie_synchronizes_linked_banner_title_synopsis_and_metadata(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $movie = Movie::create([
            'title' => 'Judul Film Lama',
            'slug' => 'judul-film-lama',
            'synopsis' => 'Sinopsis lama film ini sangat panjang dan mendalam.',
            'synopsis_short' => 'Sinopsis singkat lama.',
            'director' => 'Sutradara Lama',
            'cast' => ['Aktor Lama'],
            'genre' => 'Drama',
            'age_rating' => '13+',
            'release_year' => 2023,
            'duration_minutes' => 100,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '11111111111111111111111111111111',
            'access_model' => 'rental',
            'price' => 25000,
            'is_published' => true,
        ]);

        $banner = Banner::create([
            'title' => 'Judul Film Lama',
            'subtitle' => 'Sinopsis singkat lama.',
            'badge_text' => null,
            'age_rating' => '13+',
            'genre' => 'Drama',
            'release_year' => 2023,
            'duration_minutes' => 100,
            'image_path' => 'banners/dummy.jpg',
            'display_mode' => 'spotlight',
            'link_type' => 'movie',
            'movie_id' => $movie->id,
            'button_text' => 'Sewa Film Sekarang',
            'order_priority' => 1,
            'is_active' => true,
        ]);

        $updatePayload = [
            'title' => 'Judul Film Baru Terupdate',
            'slug' => 'judul-film-baru-terupdate',
            'synopsis' => 'Sinopsis baru film yang telah diperbarui secara menyeluruh.',
            'director' => 'Sutradara Baru',
            'cast' => ['Aktor Baru'],
            'genre' => ['Aksi', 'Thriller'],
            'age_rating' => '17+',
            'release_year' => 2025,
            'duration_minutes' => 125,
            'access_model' => 'rental',
            'price' => 30000,
            'poster_path' => 'p.jpg',
            'backdrop_path' => 'b.jpg',
            'cloudflare_video_uid' => '11111111111111111111111111111111',
            'is_published' => true,
        ];

        $response = $this->putJson("/api/v1/admin/movies/{$movie->id}", $updatePayload);
        $response->assertStatus(200);

        // Verifikasi database banner
        $banner->refresh();
        $this->assertEquals('Judul Film Baru Terupdate', $banner->title);
        $this->assertEquals('Sinopsis baru film yang telah diperbarui secara menyeluruh.', $banner->subtitle);
        $this->assertEquals('17+', $banner->age_rating);
        $this->assertEquals('Aksi, Thriller', $banner->genre);
        $this->assertEquals(2025, $banner->release_year);
        $this->assertEquals(125, $banner->duration_minutes);

        // Verifikasi endpoint publik
        $publicBannerRes = $this->getJson('/api/v1/banners');
        $publicBannerRes->assertStatus(200);
        $bannerData = collect($publicBannerRes->json('data'))->firstWhere('id', $banner->id);
        $this->assertNotNull($bannerData);
        $this->assertEquals('Judul Film Baru Terupdate', $bannerData['title']);
        $this->assertEquals('Sinopsis baru film yang telah diperbarui secara menyeluruh.', $bannerData['subtitle']);
    }

    public function test_admin_movie_list_and_detail_accurately_reflects_active_rentals_count(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $movieA = Movie::create([
            'title' => 'Film Populer A',
            'slug' => 'film-populer-a',
            'synopsis' => 'Sinopsis film populer A dengan berbagai tipe penyewa.',
            'director' => 'Sutradara A',
            'cast' => ['Aktor A'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 90,
            'poster_path' => 'p_a.jpg',
            'backdrop_path' => 'b_a.jpg',
            'cloudflare_video_uid' => '11111111111111111111111111111111',
            'access_model' => 'rental',
            'price' => 25000,
            'is_published' => true,
        ]);

        $movieB = Movie::create([
            'title' => 'Film Sunyi B',
            'slug' => 'film-sunyi-b',
            'synopsis' => 'Sinopsis film B yang belum memiliki penyewa.',
            'director' => 'Sutradara B',
            'cast' => ['Aktor B'],
            'genre' => 'Drama',
            'age_rating' => 'SU',
            'release_year' => 2026,
            'duration_minutes' => 85,
            'poster_path' => 'p_b.jpg',
            'backdrop_path' => 'b_b.jpg',
            'cloudflare_video_uid' => '22222222222222222222222222222222',
            'access_model' => 'rental',
            'price' => 25000,
            'is_published' => true,
        ]);

        $u1 = User::factory()->create();
        $u2 = User::factory()->create();
        $u3 = User::factory()->create();
        $u4 = User::factory()->create();

        // 1. User 1: Active rental (berbayar)
        UserMovieAccess::create([
            'user_id' => $u1->id,
            'movie_id' => $movieA->id,
            'access_status' => 'active',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(48),
            'revoke_reason' => 'none',
        ]);

        // 2. User 2: Active rental (free access dari admin)
        UserMovieAccess::create([
            'user_id' => $u2->id,
            'movie_id' => $movieA->id,
            'access_status' => 'active',
            'rental_start_at' => now(),
            'rental_expires_at' => now()->addHours(24),
            'revoke_reason' => 'none',
        ]);

        // 3. User 3: Expired rental (sudah kadaluarsa kemarin)
        UserMovieAccess::create([
            'user_id' => $u3->id,
            'movie_id' => $movieA->id,
            'access_status' => 'active',
            'rental_start_at' => now()->subHours(50),
            'rental_expires_at' => now()->subHours(2),
            'revoke_reason' => 'none',
        ]);

        // 4. User 4: Revoked access
        UserMovieAccess::create([
            'user_id' => $u4->id,
            'movie_id' => $movieA->id,
            'access_status' => 'revoked',
            'rental_start_at' => now()->subHours(10),
            'rental_expires_at' => now()->addHours(38),
            'revoked_at' => now(),
            'revoke_reason' => 'manual_admin',
        ]);

        // Periksa List Admin Movies (GET /api/v1/admin/movies)
        $listRes = $this->getJson('/api/v1/admin/movies');
        $listRes->assertStatus(200);

        $dataA = collect($listRes->json('data'))->firstWhere('id', $movieA->id);
        $dataB = collect($listRes->json('data'))->firstWhere('id', $movieB->id);

        $this->assertNotNull($dataA);
        $this->assertEquals(2, $dataA['active_rentals_count'], 'Film A harus memiliki tepat 2 penyewa aktif');

        $this->assertNotNull($dataB);
        $this->assertEquals(0, $dataB['active_rentals_count'], 'Film B harus memiliki 0 penyewa aktif');

        // Periksa Detail Admin Movie (GET /api/v1/admin/movies/{id})
        $detailRes = $this->getJson("/api/v1/admin/movies/{$movieA->id}");
        $detailRes->assertStatus(200);
        $this->assertEquals(2, $detailRes->json('data.active_rentals_count'));

        // 5. Film C: Film Akses Gratis (access_model = 'free', price = 0)
        $movieC = Movie::create([
            'title' => 'Film Edukasi Gratis',
            'slug' => 'film-edukasi-gratis',
            'synopsis' => 'Sinopsis film edukasi gratis tanpa biaya.',
            'director' => 'Sutradara Dermawan',
            'cast' => ['Aktor Sosial'],
            'genre' => 'Dokumenter',
            'release_year' => 2026,
            'duration_minutes' => 45,
            'age_rating' => 'SU',
            'access_model' => 'free',
            'price' => 0,
            'poster_path' => 'p_c.jpg',
            'backdrop_path' => 'b_c.jpg',
            'cloudflare_video_uid' => '33333333333333333333333333333333',
            'is_published' => true,
        ]);

        $detailFreeRes = $this->getJson("/api/v1/admin/movies/{$movieC->id}");
        $detailFreeRes->assertStatus(200);
        $this->assertEquals(0, $detailFreeRes->json('data.active_rentals_count'), 'Film gratis wajib bernilai 0 penyewa aktif');
    }
}
